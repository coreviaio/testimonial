<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Practitioner;
use App\Models\PractitionerDocument;
use App\Models\PractitionerVerification;
use App\Support\Rbac;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PractitionerVerificationController extends Controller
{
    private const PERMISSION = 'practitioner_verifications.manage';

    private const REQUIRED_DOCUMENTS = [
        'primary_credential',
        'license_registration',
    ];

    private const REQUIRED_ACKNOWLEDGEMENTS = [
        'information_accurate',
        'manual_verification',
        'deidentified_observations',
        'not_medical_claims',
        'review_before_publication',
        'changes_may_be_requested',
    ];

    public function index(Request $request): Response
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in([
                    'all',
                    'draft',
                    'pending_verification',
                    'changes_requested',
                    'approved',
                    'rejected',
                ]),
            ],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? 'pending_verification';

        $verifications = PractitionerVerification::query()
            ->join('practitioners', 'practitioners.id', '=', 'practitioner_verifications.practitioner_id')
            ->join('users', 'users.id', '=', 'practitioners.user_id')
            ->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
            ->leftJoin('users as reviewers', 'reviewers.id', '=', 'practitioner_verifications.reviewed_by_user_id')
            ->select([
                'practitioner_verifications.id',
                'practitioner_verifications.attempt_number',
                'practitioner_verifications.status',
                'practitioner_verifications.submitted_at',
                'practitioner_verifications.reviewed_at',
                'users.name as practitioner_name',
                'users.email as practitioner_email',
                'practitioners.practitioner_type',
                'practitioners.professional_title',
                'user_profiles.country_code',
                'reviewers.name as reviewer_name',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('users.name', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%")
                        ->orWhere('practitioners.license_number', 'like', "%{$search}%")
                        ->orWhere('practitioners.organization_name', 'like', "%{$search}%")
                        ->orWhere('practitioners.professional_title', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'all', function ($query) use ($status): void {
                $query->where('practitioner_verifications.status', $status);
            })
            ->orderByDesc('practitioner_verifications.submitted_at')
            ->orderByDesc('practitioner_verifications.id')
            ->paginate(15)
            ->withQueryString();

        $verifications->getCollection()->transform(function (PractitionerVerification $verification): array {
            return [
                'id' => $verification->id,
                'attempt_number' => $verification->attempt_number,
                'status' => $verification->status,
                'status_label' => $this->statusLabel($verification->status),
                'practitioner_name' => $verification->practitioner_name,
                'practitioner_email' => $verification->practitioner_email,
                'practitioner_type' => $verification->practitioner_type,
                'professional_title' => $verification->professional_title,
                'country_code' => $verification->country_code,
                'reviewer_name' => $verification->reviewer_name,
                'submitted_at' => $verification->submitted_at?->toIso8601String(),
                'reviewed_at' => $verification->reviewed_at?->toIso8601String(),
            ];
        });

        return Inertia::render('admin/practitioner-verifications/index', [
            'verifications' => $verifications,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(Request $request, PractitionerVerification $verification): Response
    {
        $this->ensurePermission($request);

        $verification->load([
            'practitioner.user:id,name,email,email_verified_at',
            'documents',
            'consents',
            'reviewedBy:id,name',
        ]);

        $snapshot = $verification->application_snapshot ?? [];

        $documents = $verification->documents
            ->map(fn (PractitionerDocument $document): array => [
                'id' => $document->id,
                'document_type' => $document->document_type,
                'document_type_label' => $this->statusLabel($document->document_type),
                'original_filename' => $document->original_filename,
                'mime_type' => $document->mime_type,
                'size_bytes' => $document->size_bytes,
                'expires_at' => $document->expires_at?->format('Y-m-d'),
                'created_at' => $document->created_at?->toIso8601String(),
                'download_url' => route('admin.practitioner-documents.download', $document),
            ])
            ->values();

        $acknowledgements = $verification->consents
            ->sortBy('accepted_at')
            ->values()
            ->map(fn ($consent): array => [
                'id' => $consent->id,
                'statement_code' => $consent->statement_code,
                'statement_version' => $consent->statement_version,
                'statement_text' => $consent->statement_text,
                'accepted_at' => $consent->accepted_at?->toIso8601String(),
            ]);

        $history = PractitionerVerification::query()
            ->where('practitioner_id', $verification->practitioner_id)
            ->with('reviewedBy:id,name')
            ->orderByDesc('attempt_number')
            ->get()
            ->map(fn (PractitionerVerification $attempt): array => [
                'id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'status' => $attempt->status,
                'status_label' => $this->statusLabel($attempt->status),
                'submitted_at' => $attempt->submitted_at?->toIso8601String(),
                'reviewed_at' => $attempt->reviewed_at?->toIso8601String(),
                'review_comment' => $attempt->review_comment,
                'reviewer_name' => $attempt->reviewedBy?->name,
            ]);

        return Inertia::render('admin/practitioner-verifications/show', [
            'verification' => [
                'id' => $verification->id,
                'attempt_number' => $verification->attempt_number,
                'status' => $verification->status,
                'status_label' => $this->statusLabel($verification->status),
                'submitted_at' => $verification->submitted_at?->toIso8601String(),
                'reviewed_at' => $verification->reviewed_at?->toIso8601String(),
                'review_comment' => $verification->review_comment,
                'reviewer_name' => $verification->reviewedBy?->name,
                'can_review' => $verification->status === 'pending_verification',
            ],
            'snapshot' => [
                'account' => data_get($snapshot, 'account', []),
                'profile' => data_get($snapshot, 'profile', []),
                'practitioner' => data_get($snapshot, 'practitioner', []),
            ],
            'documents' => $documents,
            'acknowledgements' => $acknowledgements,
            'history' => $history,
        ]);
    }

    public function review(Request $request, PractitionerVerification $verification): RedirectResponse
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'decision' => [
                'required',
                Rule::in(['approved', 'changes_requested', 'rejected']),
            ],
            'review_comment' => [
                'nullable',
                'string',
                'max:5000',
                Rule::requiredIf(fn (): bool => in_array(
                    $request->input('decision'),
                    ['changes_requested', 'rejected'],
                    true
                )),
            ],
            'internal_note' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($request, $verification, $validated): void {
            $verification = PractitionerVerification::query()
                ->whereKey($verification->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $verification->status === 'pending_verification',
                409,
                'This practitioner application has already been reviewed.'
            );

            $practitioner = Practitioner::query()
                ->whereKey($verification->practitioner_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($validated['decision'] === 'approved') {
                $this->validateApprovalRequirements($verification);
            }

            $oldVerificationStatus = $verification->status;
            $oldPractitionerStatus = $practitioner->verification_status;
            $now = now();

            $verification->update([
                'status' => $validated['decision'],
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => $now,
                'review_comment' => $validated['review_comment'] ?? null,
                'internal_note' => $validated['internal_note'] ?? null,
            ]);

            $practitioner->update([
                'verification_status' => $validated['decision'],
            ]);

            if ($validated['decision'] === 'approved') {
                $practitionerRoleId = DB::table('roles')
                    ->where('slug', 'practitioner')
                    ->value('id');

                if (! $practitionerRoleId) {
                    throw ValidationException::withMessages([
                        'decision' => 'The practitioner role does not exist.',
                    ]);
                }

                DB::table('user_roles')->updateOrInsert(
                    [
                        'user_id' => $practitioner->user_id,
                        'role_id' => $practitionerRoleId,
                    ],
                    [
                        'assigned_by_user_id' => $request->user()->id,
                        'updated_at' => now(),
                    ]
                );
            }

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => "practitioner_verification.{$validated['decision']}",
                'subject_type' => PractitionerVerification::class,
                'subject_id' => $verification->id,
                'old_values' => [
                    'verification_status' => $oldVerificationStatus,
                    'practitioner_status' => $oldPractitionerStatus,
                ],
                'new_values' => [
                    'verification_status' => $validated['decision'],
                    'practitioner_status' => $validated['decision'],
                ],
                'metadata' => [
                    'practitioner_id' => $practitioner->id,
                    'attempt_number' => $verification->attempt_number,
                ],
                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        $message = match ($validated['decision']) {
            'approved' => 'Practitioner verification approved.',
            'changes_requested' => 'Changes requested from practitioner.',
            'rejected' => 'Practitioner verification rejected.',
        };

        return back()->with('success', $message);
    }

    public function downloadDocument(Request $request, PractitionerDocument $document): StreamedResponse
    {
        $this->ensurePermission($request);

        abort_unless(
            Storage::disk($document->storage_disk)->exists($document->file_path),
            404
        );

        return Storage::disk($document->storage_disk)->download(
            $document->file_path,
            $document->original_filename
        );
    }

    private function validateApprovalRequirements(PractitionerVerification $verification): void
    {
        $snapshot = $verification->application_snapshot ?? [];
        $practitioner = data_get($snapshot, 'practitioner', []);

        $requiredFields = [
            'practitioner_type',
            'professional_title',
            'specialty',
            'professional_bio',
            'license_number',
            'issuing_authority',
            'registration_jurisdiction',
        ];

        foreach ($requiredFields as $field) {
            if (blank($practitioner[$field] ?? null)) {
                throw ValidationException::withMessages([
                    'decision' => 'The submitted practitioner application is missing required professional information.',
                ]);
            }
        }

        $documentTypes = $verification->documents()
            ->pluck('document_type')
            ->all();

        foreach (self::REQUIRED_DOCUMENTS as $documentType) {
            if (! in_array($documentType, $documentTypes, true)) {
                throw ValidationException::withMessages([
                    'decision' => 'Required practitioner documents are missing.',
                ]);
            }
        }

        $acceptedCodes = $verification->consents()
            ->where('context', 'practitioner_verification')
            ->pluck('statement_code')
            ->unique()
            ->all();

        foreach (self::REQUIRED_ACKNOWLEDGEMENTS as $statementCode) {
            if (! in_array($statementCode, $acceptedCodes, true)) {
                throw ValidationException::withMessages([
                    'decision' => 'Required practitioner acknowledgements are incomplete.',
                ]);
            }
        }
    }

    private function ensurePermission(Request $request): void
    {
        abort_unless(
            $request->user()
            && Rbac::hasPermission($request->user()->id, self::PERMISSION),
            403
        );
    }

    private function statusLabel(string $status): string
    {
        return ucwords(str_replace('_', ' ', $status));
    }
}
