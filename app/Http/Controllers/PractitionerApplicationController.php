<?php

namespace App\Http\Controllers;

use App\Models\Practitioner;
use App\Models\PractitionerDocument;
use App\Models\PractitionerVerification;
use App\Models\UserConsent;
use App\Models\UserProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerApplicationController extends Controller
{
    private const ACKNOWLEDGEMENTS = [
        [
            'code' => 'information_accurate',
            'version' => '1.0',
            'text' => 'I confirm that the information provided is accurate.',
        ],
        [
            'code' => 'manual_verification',
            'version' => '1.0',
            'text' => 'I understand that MHI must manually verify my practitioner credentials.',
        ],
        [
            'code' => 'deidentified_observations',
            'version' => '1.0',
            'text' => 'I will submit only de-identified client observations.',
        ],
        [
            'code' => 'not_medical_claims',
            'version' => '1.0',
            'text' => 'I understand that my observations are not medical claims, proof of efficacy or clinical evidence.',
        ],
        [
            'code' => 'review_before_publication',
            'version' => '1.0',
            'text' => 'I understand that my submissions must be reviewed before publication.',
        ],
        [
            'code' => 'changes_may_be_requested',
            'version' => '1.0',
            'text' => 'I understand that Moderators may request changes to a submission.',
        ],
    ];

    public function show(Request $request): Response
    {
        $user = $request->user();
        $profile = UserProfile::query()->where('user_id', $user->id)->first();
        $practitioner = Practitioner::query()->where('user_id', $user->id)->first();

        $verification = $practitioner
            ? PractitionerVerification::query()
                ->where('practitioner_id', $practitioner->id)
                ->with('documents')
                ->orderByDesc('attempt_number')
                ->first()
            : null;

        $acceptedCodes = $verification
            ? UserConsent::query()
                ->where('verification_id', $verification->id)
                ->pluck('statement_code')
                ->all()
            : [];

        $canEdit = ! $verification || in_array($verification->status, ['draft', 'changes_requested'], true);

        $documents = collect($verification?->documents ?? [])
            ->keyBy('document_type')
            ->map(
                fn (
                    PractitionerDocument $document,
                ): array => [
                    'id' => $document->id,
                    'original_filename' => $document->original_filename,
                    'mime_type' => $document->mime_type,
                    'size_bytes' => $document->size_bytes,
                    'expires_at' => $document->expires_at?->format('Y-m-d'),
                ],
            );

        $documentExpiryDate = collect($verification?->documents ?? [])
            ->first(
                fn (
                    PractitionerDocument $document,
                ): bool => $document->expires_at !== null,
            )
            ?->expires_at
            ?->format('Y-m-d');

        $status = $verification?->status ?? $practitioner?->verification_status ?? 'draft';

        return Inertia::render(
            'practitioner/application',
            [
                'account' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],

                'profile' => [
                    'phone' => $profile?->phone,
                    'country_code' => $profile?->country_code,
                    'city' => $profile?->city,

                    'profile_photo_url' => $profile?->profile_photo_path
                        ? Storage::disk('public')->url($profile->profile_photo_path)
                        : null,
                ],

                'practitioner' => $practitioner
                    ? [
                        'practitioner_type' => $practitioner->practitioner_type,
                        'professional_title' => $practitioner->professional_title,
                        'specialty' => $practitioner->specialty,
                        'professional_bio' => $practitioner->professional_bio,
                        'organization_name' => $practitioner->organization_name,
                        'years_of_experience' => $practitioner->years_of_experience,
                        'license_number' => $practitioner->license_number,
                        'issuing_authority' => $practitioner->issuing_authority,
                        'registration_jurisdiction' => $practitioner->registration_jurisdiction,
                        'professional_website' => $practitioner->professional_website,
                        'verification_notes' => $practitioner->verification_notes,
                        'show_identity_publicly' => $practitioner->show_identity_publicly,
                        'public_display_name' => $practitioner->public_display_name,
                        'public_professional_description' => $practitioner->public_professional_description,
                    ]
                    : null,

                'verification' => [
                    'status' => $status,
                    'status_label' => $this->statusLabel($status),
                    'attempt_number' => $verification?->attempt_number,
                    'submitted_at' => $verification?->submitted_at?->toIso8601String(),
                    'review_comment' => $verification?->review_comment,
                    'can_edit' => $canEdit,
                ],

                'documents' => $documents,
                'document_expiry_date' => $documentExpiryDate,
                'acknowledgements' => collect(self::ACKNOWLEDGEMENTS)
                    ->map(
                        fn (array $acknowledgement): array => [
                            'code' => $acknowledgement['code'],
                            'text' => $acknowledgement['text'],
                            'accepted' => in_array($acknowledgement['code'], $acceptedCodes, true),
                        ],
                    )
                    ->values(),
            ],
        );
    }

    public function saveDraft(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->draftRules());

        $this->ensureApplicationEditable($request);

        DB::transaction(
            function () use (
                $request,
                $validated,
            ): void {
                $this->saveProfile($request, $validated);
                $practitioner = $this->savePractitioner($request, $validated);
                $verification = $this->getOrCreateDraftVerification($practitioner);
                $this->saveDocuments($request, $verification, $request->user()->id, $validated['document_expiry_date'] ?? null,);
                $verification->update(['applicant_note' => $validated['verification_notes'] ?? null]);
                $practitioner->update(['verification_status' => 'draft']);
            },
        );

        return back()->with(
            'success',
            'Practitioner application draft saved successfully.',
        );
    }

    public function submit(Request $request,): RedirectResponse {
        $validated = $request->validate($this->submissionRules(),);
        $this->ensureApplicationEditable($request,);
        $this->validateRequiredDocuments($request,);

        DB::transaction(
            function () use (
                $request,
                $validated,
            ): void {
                $profile = $this->saveProfile($request, $validated,);
                $practitioner = $this->savePractitioner($request, $validated,);
                $verification = $this->getOrCreateDraftVerification($practitioner,);
                $this->saveDocuments($request, $verification, $request->user()->id, $validated['document_expiry_date'] ?? null,);
                $this->assertRequiredDocumentsExist($verification,);
                $now = now();
                $verification->update([
                    'status' => 'pending_verification',
                    'application_snapshot' => $this->applicationSnapshot($request, $profile, $practitioner,),
                    'applicant_note' => $validated['verification_notes'] ?? null,
                    'submitted_at' => $now,
                    'reviewed_by_user_id' => null,
                    'reviewed_at' => null,
                    'review_comment' => null,
                    'internal_note' => null,
                ]);

                $acknowledgementSetId = (string) Str::uuid();

                foreach (self::ACKNOWLEDGEMENTS as $acknowledgement) {
                    UserConsent::query()->create([
                        'user_id' => $request->user()->id,
                        'context' => 'practitioner_verification',
                        'verification_id' => $verification->id,
                        'acknowledgement_set_id' => $acknowledgementSetId,
                        'statement_code' => $acknowledgement['code'],
                        'statement_version' => $acknowledgement['version'],
                        'statement_text' => $acknowledgement['text'],
                        'accepted_at' => $now,
                    ]);
                }

                $practitioner->update(['verification_status' => 'pending_verification',]);
            },
        );

        return to_route('practitioner.application.show',)->with(
            'success',
            'Practitioner application submitted for verification.',
        );
    }

    private function draftRules(): array
    {
        return [
            'phone' => ['nullable', 'string', 'max:30',],
            'country_code' => ['nullable', 'string', 'size:2', 'alpha',],
            'city' => ['nullable', 'string', 'max:150',],
            'profile_photo' => ['nullable', File::image()->max('2mb'),],
            'practitioner_type' => ['nullable', 'string', 'max:50',],
            'professional_title' => ['nullable', 'string', 'max:150',],
            'specialty' => ['nullable', 'string', 'max:255',],
            'professional_bio' => ['nullable', 'string',],
            'organization_name' => ['nullable', 'string', 'max:255',],
            'years_of_experience' => ['nullable', 'numeric', 'min:0', 'max:99.9',],
            'license_number' => ['nullable', 'string', 'max:150',],
            'issuing_authority' => ['nullable', 'string', 'max:255',],
            'registration_jurisdiction' => ['nullable', 'string', 'max:150',],
            'professional_website' => ['nullable', 'url', 'max:2048',],
            'verification_notes' => ['nullable', 'string', 'max:2000',],
            'show_identity_publicly' => ['required', 'boolean',],
            'public_display_name' => ['nullable', 'string', 'max:150',],
            'public_professional_description' => ['nullable', 'string', 'max:1000',],
            'primary_credential' => ['nullable', File::types(['pdf', 'jpg', 'jpeg', 'png',])->max('10mb'),],
            'license_document' => ['nullable', File::types(['pdf', 'jpg', 'jpeg', 'png',])->max('10mb'),],
            'supporting_document' => ['nullable', File::types(['pdf', 'jpg', 'jpeg', 'png',])->max('10mb'),],
            'document_expiry_date' => ['nullable', 'date',],
            'acknowledgements' => ['nullable', 'array',],
        ];
    }

    private function submissionRules(): array
    {
        $rules = $this->draftRules();
        $rules['country_code'] = ['required', 'string', 'size:2', 'alpha',];
        $rules['practitioner_type'] = ['required', 'string', 'max:50',];
        $rules['professional_title'] = ['required', 'string', 'max:150',];
        $rules['specialty'] = ['required', 'string', 'max:255',];
        $rules['professional_bio'] = ['required', 'string',];
        $rules['license_number'] = ['required', 'string', 'max:150',];
        $rules['issuing_authority'] = ['required', 'string', 'max:255',];
        $rules['registration_jurisdiction'] = ['required', 'string', 'max:150',];
        $rules['acknowledgements'] = ['required', 'array',];

        foreach (self::ACKNOWLEDGEMENTS as $acknowledgement) {
            $rules["acknowledgements.{$acknowledgement['code']}"] = ['accepted',];
        }

        return $rules;
    }

    private function saveProfile(
        Request $request,
        array $validated,
    ): UserProfile {
        $profile =
            UserProfile::query()->firstOrNew([
                'user_id' => $request->user()->id,
            ]);

        $profile->fill([
            'phone' => $validated['phone']
                ?? null,

            'country_code' => filled(
                $validated['country_code']
                ?? null,
            )
                    ? strtoupper(
                        $validated['country_code'],
                    )
                    : null,

            'city' => $validated['city']
                ?? null,
        ]);

        if (
            $request->hasFile(
                'profile_photo',
            )
        ) {
            $newPath =
                $request
                    ->file('profile_photo')
                    ->store(
                        "profile-photos/{$request->user()->id}",
                        'public',
                    );

            if (
                $profile->profile_photo_path
            ) {
                Storage::disk('public')
                    ->delete(
                        $profile
                            ->profile_photo_path,
                    );
            }

            $profile->profile_photo_path =
                $newPath;
        }

        $profile->save();

        return $profile;
    }

    private function savePractitioner(
        Request $request,
        array $validated,
    ): Practitioner {
        return Practitioner::query()
            ->updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                ],
                [
                    'practitioner_type' => $validated['practitioner_type']
                        ?? null,

                    'professional_title' => $validated['professional_title']
                        ?? null,

                    'specialty' => $validated['specialty']
                        ?? null,

                    'professional_bio' => $validated['professional_bio']
                        ?? null,

                    'organization_name' => $validated['organization_name']
                        ?? null,

                    'years_of_experience' => $validated['years_of_experience']
                        ?? null,

                    'license_number' => $validated['license_number']
                        ?? null,

                    'issuing_authority' => $validated['issuing_authority']
                        ?? null,

                    'registration_jurisdiction' => $validated['registration_jurisdiction']
                        ?? null,

                    'professional_website' => $validated['professional_website']
                        ?? null,

                    'verification_notes' => $validated['verification_notes']
                        ?? null,

                    'show_identity_publicly' => $request->boolean(
                        'show_identity_publicly',
                    ),

                    'public_display_name' => $validated['public_display_name']
                        ?? null,

                    'public_professional_description' => $validated[
                        'public_professional_description'
                        ]
                        ?? null,
                ],
            );
    }

    private function getOrCreateDraftVerification(
        Practitioner $practitioner,
    ): PractitionerVerification {
        $latest =
            PractitionerVerification::query()
                ->where(
                    'practitioner_id',
                    $practitioner->id,
                )
                ->orderByDesc(
                    'attempt_number',
                )
                ->lockForUpdate()
                ->first();

        if (! $latest) {
            return PractitionerVerification::query()
                ->create([
                    'practitioner_id' => $practitioner->id,

                    'attempt_number' => 1,

                    'status' => 'draft',
                ]);
        }

        if (
            $latest->status === 'draft'
        ) {
            return $latest;
        }

        if (
            $latest->status
            === 'changes_requested'
        ) {
            return PractitionerVerification::query()
                ->create([
                    'practitioner_id' => $practitioner->id,

                    'attempt_number' => $latest->attempt_number
                        + 1,

                    'status' => 'draft',
                ]);
        }

        abort(
            409,
            'This practitioner application cannot be edited in its current status.',
        );
    }

    private function ensureApplicationEditable(
        Request $request,
    ): void {
        $practitioner =
            Practitioner::query()
                ->where(
                    'user_id',
                    $request->user()->id,
                )
                ->first();

        if (! $practitioner) {
            return;
        }

        $latest =
            PractitionerVerification::query()
                ->where(
                    'practitioner_id',
                    $practitioner->id,
                )
                ->orderByDesc(
                    'attempt_number',
                )
                ->first();

        if (! $latest) {
            return;
        }

        abort_unless(
            in_array(
                $latest->status,
                [
                    'draft',
                    'changes_requested',
                ],
                true,
            ),
            409,
            'This practitioner application cannot be edited in its current status.',
        );
    }

    private function saveDocuments(
        Request $request,
        PractitionerVerification $verification,
        int $userId,
        ?string $expiresAt,
    ): void {
        $documentFields = [
            'primary_credential' => 'primary_credential',

            'license_document' => 'license_registration',

            'supporting_document' => 'supporting_document',
        ];

        foreach (
            $documentFields as $field => $documentType
        ) {
            if (
                ! $request->hasFile(
                    $field,
                )
            ) {
                continue;
            }

            $this->replaceDraftDocument(
                $request->file($field),
                $verification,
                $userId,
                $documentType,
                $expiresAt,
            );
        }

        $verification
            ->documents()
            ->update([
                'expires_at' => $expiresAt,
            ]);
    }

    private function replaceDraftDocument(
        UploadedFile $file,
        PractitionerVerification $verification,
        int $userId,
        string $documentType,
        ?string $expiresAt,
    ): void {
        $path = $file->store(
            "practitioner-verifications/{$verification->id}",
            'local',
        );

        $hash = hash_file(
            'sha256',
            $file->getRealPath(),
        );

        $existingDocuments =
            PractitionerDocument::query()
                ->where(
                    'verification_id',
                    $verification->id,
                )
                ->where(
                    'document_type',
                    $documentType,
                )
                ->get();

        foreach (
            $existingDocuments as $existingDocument
        ) {
            Storage::disk(
                $existingDocument
                    ->storage_disk,
            )->delete(
                $existingDocument
                    ->file_path,
            );

            $existingDocument->delete();
        }

        PractitionerDocument::query()
            ->create([
                'verification_id' => $verification->id,

                'uploaded_by_user_id' => $userId,

                'document_type' => $documentType,

                'storage_disk' => 'local',

                'file_path' => $path,

                'original_filename' => $file->getClientOriginalName(),

                'mime_type' => $file->getMimeType()
                        ?: 'application/octet-stream',

                'size_bytes' => $file->getSize(),

                'sha256' => $hash,

                'expires_at' => $expiresAt,
            ]);
    }

    private function validateRequiredDocuments(
        Request $request,
    ): void {
        $verification =
            $this->currentDraftVerification(
                $request,
            );

        $errors = [];

        if (
            ! $request->hasFile(
                'primary_credential',
            )
            && ! $this->verificationHasDocument(
                $verification,
                'primary_credential',
            )
        ) {
            $errors[
            'primary_credential'
            ] =
                'The primary credential or certificate is required.';
        }

        if (
            ! $request->hasFile(
                'license_document',
            )
            && ! $this->verificationHasDocument(
                $verification,
                'license_registration',
            )
        ) {
            $errors[
            'license_document'
            ] =
                'The license or registration document is required.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(
                $errors,
            );
        }
    }

    private function currentDraftVerification(
        Request $request,
    ): ?PractitionerVerification {
        $practitioner =
            Practitioner::query()
                ->where(
                    'user_id',
                    $request->user()->id,
                )
                ->first();

        if (! $practitioner) {
            return null;
        }

        return PractitionerVerification::query()
            ->where(
                'practitioner_id',
                $practitioner->id,
            )
            ->where(
                'status',
                'draft',
            )
            ->orderByDesc(
                'attempt_number',
            )
            ->first();
    }

    private function verificationHasDocument(
        ?PractitionerVerification $verification,
        string $documentType,
    ): bool {
        return $verification !== null
            && $verification
                ->documents()
                ->where(
                    'document_type',
                    $documentType,
                )
                ->exists();
    }

    private function assertRequiredDocumentsExist(
        PractitionerVerification $verification,
    ): void {
        $documentTypes =
            $verification
                ->documents()
                ->pluck(
                    'document_type',
                )
                ->all();

        $errors = [];

        if (
            ! in_array(
                'primary_credential',
                $documentTypes,
                true,
            )
        ) {
            $errors[
            'primary_credential'
            ] =
                'The primary credential or certificate is required.';
        }

        if (
            ! in_array(
                'license_registration',
                $documentTypes,
                true,
            )
        ) {
            $errors[
            'license_document'
            ] =
                'The license or registration document is required.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(
                $errors,
            );
        }
    }

    private function applicationSnapshot(
        Request $request,
        UserProfile $profile,
        Practitioner $practitioner,
    ): array {
        return [
            'account' => [
                'name' => $request->user()->name,

                'email' => $request->user()->email,
            ],

            'profile' => [
                'phone' => $profile->phone,

                'country_code' => $profile->country_code,

                'city' => $profile->city,

                'profile_photo_path' => $profile
                    ->profile_photo_path,
            ],

            'practitioner' => [
                'practitioner_type' => $practitioner
                    ->practitioner_type,

                'professional_title' => $practitioner
                    ->professional_title,

                'specialty' => $practitioner
                    ->specialty,

                'professional_bio' => $practitioner
                    ->professional_bio,

                'organization_name' => $practitioner
                    ->organization_name,

                'years_of_experience' => $practitioner
                    ->years_of_experience,

                'license_number' => $practitioner
                    ->license_number,

                'issuing_authority' => $practitioner
                    ->issuing_authority,

                'registration_jurisdiction' => $practitioner
                    ->registration_jurisdiction,

                'professional_website' => $practitioner
                    ->professional_website,

                'verification_notes' => $practitioner
                    ->verification_notes,

                'show_identity_publicly' => $practitioner
                    ->show_identity_publicly,

                'public_display_name' => $practitioner
                    ->public_display_name,

                'public_professional_description' => $practitioner
                    ->public_professional_description,
            ],
        ];
    }

    private function statusLabel(
        string $status,
    ): string {
        return ucwords(
            str_replace(
                '_',
                ' ',
                $status,
            ),
        );
    }
}
