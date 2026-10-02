<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\ClientConsent;
use App\Models\Practitioner;
use App\Models\Testimonial;
use App\Models\TestimonialConsent;
use App\Models\TestimonialReview;
use App\Models\TestimonialVersion;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Schema;

class PractitionerObservationController extends Controller
{
    private const PERMISSION = 'practitioner_observations.manage';

    private const STATUSES = [
        'draft',
        'pending_review',
        'changes_requested',
        'approved',
        'rejected',
        'archived',
    ];

    private const ACKNOWLEDGEMENT_VERSION = '1.0';

    private const ACKNOWLEDGEMENTS = [
        'information_accurate' => 'I confirm that the information provided is accurate.',
        'deidentified_observations' => 'I will submit only de-identified client observations.',
        'not_medical_claims' => 'I understand that my observations are not medical claims, proof of efficacy or clinical evidence.',
        'review_before_publication' => 'I understand that my submissions must be reviewed before publication.',
        'changes_may_be_requested' => 'I understand that Moderators may request changes to a submission.',
    ];

    private const H2_MAPPING_FIELDS = [
        'disease_ids' => [
            'source' => 'disease',
            'table' => 'testimonial_diseases',
            'column' => 'disease_id',
            'label' => 'diseases',
        ],

        'organ_ids' => [
            'source' => 'organ',
            'table' => 'testimonial_organs',
            'column' => 'organ_id',
            'label' => 'organs',
        ],

        'administration_method_ids' => [
            'source' => 'administration_method',
            'table' => 'testimonial_administration_methods',
            'column' => 'administration_method_id',
            'label' => 'administration methods',
        ],

        'research_topic_ids' => [
            'source' => 'research_topic',
            'table' => 'testimonial_research_topics',
            'column' => 'research_topic_id',
            'label' => 'research topics',
        ],

        'biomarker_ids' => [
            'source' => 'biomarker',
            'table' => 'testimonial_biomarkers',
            'column' => 'biomarker_id',
            'label' => 'biomarkers',
        ],
    ];

    public function index(Request $request): Response
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['all', ...self::STATUSES])],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? 'all';

        $observations = Testimonial::query()
            ->where('submission_type', 'practitioner')
            ->where('practitioner_id', $practitioner->id)
            ->where('author_user_id', $request->user()->id)
            ->with('client:id,practitioner_id,client_reference,name,status')
            ->select('testimonials.*')
            ->selectSub(
                ClientConsent::query()
                    ->select('action')
                    ->whereColumn('client_consents.client_id', 'testimonials.client_id')
                    ->orderByDesc('occurred_at')
                    ->orderByDesc('id')
                    ->limit(1),
                'current_consent_state'
            )
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('observation', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $query) use ($search): void {
                            $query->where('client_reference', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });

                    if (ctype_digit($search)) {
                        $query->orWhere('testimonials.id', (int) $search);
                    }
                });
            })
            ->when(
                $status !== 'all',
                fn (Builder $query) => $query->where('testimonials.status', $status)
            )
            ->latest('testimonials.updated_at')
            ->paginate(10)
            ->withQueryString();

        $observations->getCollection()->transform(function (Testimonial $observation) use ($request): array {
            $status = (string) $observation->status;

            return [
                'id' => $observation->id,
                'title' => $observation->title,
                'status' => $status,
                'status_label' => $this->statusLabel($status),
                'patient_reference' => $observation->client?->client_reference,
                'patient_name' => $observation->client?->name,
                'consent_state' => $observation->getAttribute('current_consent_state') ?: 'missing',
                'submitted_at' => $observation->submitted_at?->toIso8601String(),
                'updated_at' => $observation->updated_at?->toIso8601String(),
                'can_edit' => in_array($status, ['draft', 'changes_requested'], true),
                'can_submit' => in_array($status, ['draft', 'changes_requested'], true),
                'can_archive' => $status === 'draft',
                'can_restore' => $status === 'archived'
                    && (int) $observation->archived_by_user_id === (int) $request->user()->id,
            ];
        });

        return Inertia::render('practitioner/observations/index', [
            'observations' => $observations,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensurePermission($request);

        return Inertia::render(
            'practitioner/observations/form',
            $this->formProps($request)
        );
    }

    public function searchPatients(Request $request): JsonResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $patients = Client::query()
            ->where('practitioner_id', $practitioner->id)
            ->where('status', 'active')
            ->select([
                'clients.id',
                'clients.practitioner_id',
                'clients.client_reference',
                'clients.name',
                'clients.email',
                'clients.status',
            ])
            ->selectSub(
                ClientConsent::query()
                    ->select('action')
                    ->whereColumn('client_consents.client_id', 'clients.id')
                    ->orderByDesc('occurred_at')
                    ->orderByDesc('id')
                    ->limit(1),
                'current_consent_state'
            )
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('client_reference', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (Client $patient): array => [
                'id' => $patient->id,
                'client_reference' => $patient->client_reference,
                'name' => $patient->name,
                'email' => $patient->email,
                'status' => $patient->status,
                'consent_state' => $patient->getAttribute('current_consent_state') ?: 'missing',
                'consent_state_label' => $this->consentLabel(
                    $patient->getAttribute('current_consent_state') ?: 'missing'
                ),
            ])
            ->values();

        return response()->json([
            'data' => $patients,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $validated = $this->validateDraft($request);

        $patient = $this->ownedActivePatient(
            $practitioner,
            (int) $validated['client_id']
        );

        $observation = DB::transaction(
            function () use (
                $request,
                $practitioner,
                $patient,
                $validated
            ): Testimonial {
                $observation = Testimonial::query()->create([
                    'author_user_id' => $request->user()->id,
                    'submission_type' => 'practitioner',
                    'practitioner_id' => $practitioner->id,
                    'client_id' => $patient->id,
                    'title' => $validated['title'] ?? null,
                    'observation' => $validated['observation'] ?? null,
                    'condition_symptom_text' => $validated['condition_symptom_text'] ?? null,
                    'duration_text' => $validated['duration_text'] ?? null,
                    'frequency_text' => $validated['frequency_text'] ?? null,
                    'timeline_text' => $validated['timeline_text'] ?? null,
                    'practitioner_note' => $validated['practitioner_note'] ?? null,
                    'status' => 'draft',
                ]);

                $this->syncH2ResearchMappings(
                    $observation->id,
                    $validated,
                    $request->user()->id
                );

                return $observation;
            }
        );

        return redirect()
            ->route(
                'practitioner.observations.edit',
                $observation->id
            )
            ->with(
                'success',
                'Practitioner observation draft created successfully.'
            );
    }

    public function edit(Request $request, Testimonial $observation): Response
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $this->ensureOwnedObservation($request, $practitioner, $observation);

        return Inertia::render(
            'practitioner/observations/form',
            $this->formProps($request, $observation)
        );
    }

    public function update(Request $request, Testimonial $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $this->ensureOwnedObservation($request, $practitioner, $observation);

        $validated = $this->validateDraft($request);

        DB::transaction(function () use ($request, $practitioner, $observation, $validated): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwnedObservation($request, $practitioner, $lockedObservation);

            abort_unless(
                in_array($lockedObservation->status, ['draft', 'changes_requested'], true),
                409,
                'This observation cannot be edited in its current status.'
            );

            $patient = $this->ownedActivePatient(
                $practitioner,
                (int) $validated['client_id']
            );

            $hasVersions = TestimonialVersion::query()
                ->where('testimonial_id', $lockedObservation->id)
                ->exists();

            if (
                $hasVersions
                && (int) $lockedObservation->client_id !== (int) $patient->id
            ) {
                throw ValidationException::withMessages([
                    'client_id' => 'The patient cannot be changed after the observation has been submitted.',
                ]);
            }

            $lockedObservation->update([
                'client_id' => $patient->id,
                'title' => $validated['title'] ?? null,
                'observation' => $validated['observation'] ?? null,
                'condition_symptom_text' => $validated['condition_symptom_text'] ?? null,
                'duration_text' => $validated['duration_text'] ?? null,
                'frequency_text' => $validated['frequency_text'] ?? null,
                'timeline_text' => $validated['timeline_text'] ?? null,
                'practitioner_note' => $validated['practitioner_note'] ?? null,
            ]);
            $this->syncH2ResearchMappings(
                $lockedObservation->id,
                $validated,
                $request->user()->id
            );
        });

        return back()->with('success', 'Observation saved successfully.');
    }

    public function submit(Request $request, Testimonial $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $this->ensureOwnedObservation($request, $practitioner, $observation);

        $validated = $request->validate([
            'client_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'observation' => ['required', 'string'],
            'condition_symptom_text' => ['nullable', 'string', 'max:500'],
            'duration_text' => ['nullable', 'string', 'max:255'],
            'frequency_text' => ['nullable', 'string', 'max:255'],
            'timeline_text' => ['nullable', 'string'],
            'practitioner_note' => ['nullable', 'string'],

            ...$this->h2ResearchValidationRules(),

            'acknowledgements' => [
                'required',
                'array',
                'size:' . count(self::ACKNOWLEDGEMENTS),
            ],

            'acknowledgements.*' => [
                'required',
                'string',
                'distinct',
                Rule::in(array_keys(self::ACKNOWLEDGEMENTS)),
            ],
        ]);

        $this->validateH2ResearchMappings(
            $validated
        );

        $acceptedCodes = collect($validated['acknowledgements'])
            ->sort()
            ->values()
            ->all();

        $requiredCodes = collect(array_keys(self::ACKNOWLEDGEMENTS))
            ->sort()
            ->values()
            ->all();

        if ($acceptedCodes !== $requiredCodes) {
            throw ValidationException::withMessages([
                'acknowledgements' => 'You must accept every acknowledgement before submitting.',
            ]);
        }

        DB::transaction(function () use ($request, $practitioner, $observation, $validated): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwnedObservation($request, $practitioner, $lockedObservation);

            $fromStatus = (string) $lockedObservation->status;

            abort_unless(
                in_array($fromStatus, ['draft', 'changes_requested'], true),
                409,
                'This observation cannot be submitted in its current status.'
            );

            $lockedPractitioner = Practitioner::query()
                ->whereKey($practitioner->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $lockedPractitioner->verification_status === 'approved',
                409,
                'Your practitioner account must be approved before submitting an observation.'
            );

            $patient = Client::query()
                ->whereKey((int) $validated['client_id'])
                ->where('practitioner_id', $lockedPractitioner->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (! $patient) {
                throw ValidationException::withMessages([
                    'client_id' => 'Select an active patient that belongs to your practitioner account.',
                ]);
            }

            $hasVersions = TestimonialVersion::query()
                ->where('testimonial_id', $lockedObservation->id)
                ->exists();

            if (
                $hasVersions
                && (int) $lockedObservation->client_id !== (int) $patient->id
            ) {
                throw ValidationException::withMessages([
                    'client_id' => 'The patient cannot be changed after the first submission.',
                ]);
            }

            $currentConsent = $this->latestConsent($patient->id, true);

            if (! $currentConsent || $currentConsent->action !== 'confirmed') {
                throw ValidationException::withMessages([
                    'client_id' => 'Current patient consent must be confirmed before submitting.',
                ]);
            }

            /*
             * Save the current form values first, so the version snapshot
             * always matches exactly what the practitioner submitted.
             */
            $lockedObservation->update([
                'client_id' => $patient->id,
                'title' => $validated['title'],
                'observation' => $validated['observation'],
                'condition_symptom_text' => $validated['condition_symptom_text'] ?? null,
                'duration_text' => $validated['duration_text'] ?? null,
                'frequency_text' => $validated['frequency_text'] ?? null,
                'timeline_text' => $validated['timeline_text'] ?? null,
                'practitioner_note' => $validated['practitioner_note'] ?? null,
            ]);

            $this->syncH2ResearchMappings(
                $lockedObservation->id,
                $validated,
                $request->user()->id
            );

            $versionNumber = (int) TestimonialVersion::query()
                    ->where('testimonial_id', $lockedObservation->id)
                    ->max('version_number') + 1;

            $now = now();

            $version = TestimonialVersion::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_number' => $versionNumber,

                'submitted_snapshot' => [
                    'title' => $lockedObservation->title,
                    'observation' => $lockedObservation->observation,
                    'condition_symptom_text' => $lockedObservation->condition_symptom_text,
                    'duration_text' => $lockedObservation->duration_text,
                    'frequency_text' => $lockedObservation->frequency_text,
                    'timeline_text' => $lockedObservation->timeline_text,
                    'practitioner_note' => $lockedObservation->practitioner_note,
                    'submission_type' => 'practitioner',
                    'practitioner_id' => $lockedObservation->practitioner_id,
                    'client_id' => $patient->id,
                    'client_reference' => $patient->client_reference,
                ],

                'submitted_by_user_id' => $request->user()->id,
                'submitted_at' => $now,
                'client_consent_id' => $currentConsent->id,
            ]);

            /*
             * Every submitted version receives its own immutable
             * acknowledgement receipts.
             */
            foreach (self::ACKNOWLEDGEMENTS as $statementCode => $statementText) {
                TestimonialConsent::query()->create([
                    'version_id' => $version->id,
                    'accepted_by_user_id' => $request->user()->id,
                    'statement_code' => $statementCode,
                    'statement_version' => self::ACKNOWLEDGEMENT_VERSION,
                    'statement_text' => $statementText,
                    'accepted_at' => $now,
                ]);
            }

            $lockedObservation->update([
                'status' => 'pending_review',
                'latest_version_id' => $version->id,
                'submitted_at' => $now,
                'archived_by_user_id' => null,
                'archived_at' => null,
            ]);

            $action = $versionNumber === 1
                ? 'submitted'
                : 'resubmitted';

            TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $version->id,
                'actor_user_id' => $request->user()->id,
                'action' => $action,
                'from_status' => $fromStatus,
                'to_status' => 'pending_review',
                'acted_at' => $now,
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => "practitioner_observation.{$action}",
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,

                'old_values' => [
                    'status' => $fromStatus,
                ],

                'new_values' => [
                    'status' => 'pending_review',
                    'latest_version_id' => $version->id,
                ],

                'metadata' => [
                    'version_id' => $version->id,
                    'version_number' => $versionNumber,
                    'client_id' => $patient->id,
                    'client_consent_id' => $currentConsent->id,
                    'acknowledgement_codes' => array_keys(self::ACKNOWLEDGEMENTS),
                ],

                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return redirect()
            ->route('practitioner.observations.edit', $observation->id)
            ->with(
                'success',
                $observation->status === 'changes_requested'
                    ? 'Observation resubmitted for review successfully.'
                    : 'Observation submitted for review successfully.'
            );
    }

    public function archive(Request $request, Testimonial $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $this->ensureOwnedObservation($request, $practitioner, $observation);

        DB::transaction(function () use ($request, $practitioner, $observation): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwnedObservation($request, $practitioner, $lockedObservation);

            abort_unless(
                $lockedObservation->status === 'draft',
                409,
                'Only a draft observation can be archived by the practitioner.'
            );

            $now = now();

            $lockedObservation->update([
                'status' => 'archived',
                'archived_by_user_id' => $request->user()->id,
                'archived_at' => $now,
            ]);

            TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $lockedObservation->latest_version_id,
                'actor_user_id' => $request->user()->id,
                'action' => 'archived',
                'from_status' => 'draft',
                'to_status' => 'archived',
                'acted_at' => $now,
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => 'practitioner_observation.archived',
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,
                'old_values' => ['status' => 'draft'],
                'new_values' => ['status' => 'archived'],
                'metadata' => [
                    'practitioner_id' => $lockedObservation->practitioner_id,
                ],
                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return redirect()
            ->route('practitioner.observations.index')
            ->with('success', 'Observation archived successfully.');
    }

    public function restore(Request $request, Testimonial $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $this->ensureOwnedObservation($request, $practitioner, $observation);

        DB::transaction(function () use ($request, $practitioner, $observation): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwnedObservation($request, $practitioner, $lockedObservation);

            abort_unless(
                $lockedObservation->status === 'archived'
                && (int) $lockedObservation->archived_by_user_id === (int) $request->user()->id,
                409,
                'This archived observation cannot be restored by you.'
            );

            $now = now();

            $lockedObservation->update([
                'status' => 'draft',
                'archived_by_user_id' => null,
                'archived_at' => null,
            ]);

            TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $lockedObservation->latest_version_id,
                'actor_user_id' => $request->user()->id,
                'action' => 'restored',
                'from_status' => 'archived',
                'to_status' => 'draft',
                'acted_at' => $now,
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => 'practitioner_observation.restored',
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,
                'old_values' => ['status' => 'archived'],
                'new_values' => ['status' => 'draft'],
                'metadata' => [
                    'practitioner_id' => $lockedObservation->practitioner_id,
                ],
                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return redirect()
            ->route('practitioner.observations.edit', $observation->id)
            ->with('success', 'Observation restored as draft.');
    }

    private function formProps(
        Request $request,
        ?Testimonial $observation = null
    ): array {
        $patient = null;
        $latestFeedback = null;
        $patientLocked = false;

        if ($observation) {
            $observation->load(
                'client:id,practitioner_id,client_reference,name,email,status'
            );

            $patientLocked = TestimonialVersion::query()
                ->where('testimonial_id', $observation->id)
                ->exists();

            if ($observation->client) {
                $currentConsent = $this->latestConsent($observation->client->id);

                $patient = [
                    'id' => $observation->client->id,
                    'client_reference' => $observation->client->client_reference,
                    'name' => $observation->client->name,
                    'email' => $observation->client->email,
                    'status' => $observation->client->status,
                    'consent_state' => $currentConsent?->action ?: 'missing',
                    'consent_state_label' => $this->consentLabel(
                        $currentConsent?->action ?: 'missing'
                    ),
                ];
            }

            if (in_array($observation->status, ['changes_requested', 'rejected'], true)) {
                $feedback = TestimonialReview::query()
                    ->where('testimonial_id', $observation->id)
                    ->whereNotNull('review_comment')
                    ->latest('acted_at')
                    ->latest('id')
                    ->first();

                if ($feedback) {
                    $latestFeedback = [
                        'review_comment' => $feedback->review_comment,
                        'acted_at' => $feedback->acted_at?->toIso8601String(),
                    ];
                }
            }
        }

        $status = $observation?->status ?? 'draft';

        $h2ResearchOptions = $this->h2ResearchOptions();

        return [
            'observation' => $observation
                ? [
                    'id' => $observation->id,
                    'client_id' => $observation->client_id,
                    'title' => $observation->title,
                    'observation' => $observation->observation,
                    'condition_symptom_text' => $observation->condition_symptom_text,
                    'duration_text' => $observation->duration_text,
                    'frequency_text' => $observation->frequency_text,
                    'timeline_text' => $observation->timeline_text,
                    'practitioner_note' => $observation->practitioner_note,
                    'status' => $status,
                    'status_label' => $this->statusLabel($status),
                    'can_edit' => in_array($status, ['draft', 'changes_requested'], true),
                    'can_submit' => in_array($status, ['draft', 'changes_requested'], true),
                    'can_archive' => $status === 'draft',
                    'can_restore' => $status === 'archived'
                        && (int) $observation->archived_by_user_id === (int) $request->user()->id,
                    'patient_locked' => $patientLocked,
                ]
                : null,

            'patient' => $patient,
            'latestFeedback' => $latestFeedback,

            'h2research_options' => $h2ResearchOptions,

            'h2research_mappings' => $this->currentH2ResearchMappings(
                $observation,
                $h2ResearchOptions
            ),

            'acknowledgements' => collect(self::ACKNOWLEDGEMENTS)
                ->map(
                    fn (string $text, string $code): array => [
                        'code' => $code,
                        'version' => self::ACKNOWLEDGEMENT_VERSION,
                        'text' => $text,
                    ]
                )
                ->values(),

            /*
             * Every new submission/resubmission requires fresh acceptance.
             * Therefore we intentionally do not pre-check old acknowledgements.
             */
        ];
    }

    private function validateDraft(Request $request): array
    {
        $validated = $request->validate([
            'client_id' => ['required', 'integer'],
            'title' => ['nullable', 'string', 'max:255'],
            'observation' => ['nullable', 'string'],
            'condition_symptom_text' => ['nullable', 'string', 'max:500'],
            'duration_text' => ['nullable', 'string', 'max:255'],
            'frequency_text' => ['nullable', 'string', 'max:255'],
            'timeline_text' => ['nullable', 'string'],
            'practitioner_note' => ['nullable', 'string'],

            ...$this->h2ResearchValidationRules(),
        ]);

        $this->validateH2ResearchMappings(
            $validated
        );

        return $validated;
    }

    private function h2ResearchValidationRules(): array
    {
        return [
            'disease_ids' => [
                'nullable',
                'array',
            ],

            'disease_ids.*' => [
                'integer',
                'distinct',
            ],

            'organ_ids' => [
                'nullable',
                'array',
            ],

            'organ_ids.*' => [
                'integer',
                'distinct',
            ],

            'administration_method_ids' => [
                'nullable',
                'array',
            ],

            'administration_method_ids.*' => [
                'integer',
                'distinct',
            ],

            'research_topic_ids' => [
                'nullable',
                'array',
            ],

            'research_topic_ids.*' => [
                'integer',
                'distinct',
            ],

            'biomarker_ids' => [
                'nullable',
                'array',
            ],

            'biomarker_ids.*' => [
                'integer',
                'distinct',
            ],
        ];
    }

    private function h2ResearchOptions(): array
    {
        $result = [];

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $result[$field] = [];
        }

        if (
            ! Schema::connection(
                'h2research_cache'
            )->hasTable(
                'h2_reference_items'
            )
        ) {
            return $result;
        }

        $items = DB::connection(
            'h2research_cache'
        )
            ->table(
                'h2_reference_items'
            )
            ->whereIn(
                'source',
                array_column(
                    self::H2_MAPPING_FIELDS,
                    'source'
                )
            )
            ->where(function ($query): void {
                $query
                    ->whereNull(
                        'source_status'
                    )
                    ->orWhereRaw(
                        'LOWER(source_status) <> ?',
                        ['deleted']
                    );
            })
            ->orderBy('source')
            ->orderBy('name')
            ->get([
                'source',
                'external_id',
                'name',
            ]);

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $result[$field] = $items
                ->where(
                    'source',
                    $config['source']
                )
                ->map(
                    fn ($item): array => [
                        'id' => (int) $item->external_id,
                        'name' => (string) $item->name,
                    ]
                )
                ->values()
                ->all();
        }

        return $result;
    }

    private function currentH2ResearchMappings(
        ?Testimonial $observation,
        array $h2ResearchOptions
    ): array {
        $result = [];

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $result[$field] = [];
        }

        if (! $observation) {
            return $result;
        }

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $ids = DB::table(
                $config['table']
            )
                ->where(
                    'testimonial_id',
                    $observation->id
                )
                ->orderBy('id')
                ->pluck(
                    $config['column']
                )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->values();

            $availableOptions = collect(
                $h2ResearchOptions[$field] ?? []
            )->keyBy('id');

            $result[$field] = $ids
                ->map(
                    function (
                        int $id
                    ) use (
                        $availableOptions
                    ): array {
                        $option = $availableOptions
                            ->get($id);

                        return [
                            'id' => $id,
                            'name' => $option['name']
                                ?? "H2Research ID #{$id}",
                        ];
                    }
                )
                ->values()
                ->all();
        }

        return $result;
    }

    private function validateH2ResearchMappings(
        array $validated
    ): void {
        $selectedFields = collect(
            array_keys(
                self::H2_MAPPING_FIELDS
            )
        )->filter(
            fn (
                string $field
            ): bool => ! empty(
                $validated[$field] ?? []
            )
        );

        if ($selectedFields->isEmpty()) {
            return;
        }

        if (
            ! Schema::connection(
                'h2research_cache'
            )->hasTable(
                'h2_reference_items'
            )
        ) {
            $firstField = (string) $selectedFields
                ->first();

            throw ValidationException::withMessages([
                $firstField => 'H2Research reference data is not available. Please ask an administrator to sync H2Research first.',
            ]);
        }

        $errors = [];

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $ids = collect(
                $validated[$field] ?? []
            )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->unique()
                ->values();

            if ($ids->isEmpty()) {
                continue;
            }

            $validIds = DB::connection(
                'h2research_cache'
            )
                ->table(
                    'h2_reference_items'
                )
                ->where(
                    'source',
                    $config['source']
                )
                ->whereIn(
                    'external_id',
                    $ids
                        ->map(
                            fn (
                                int $id
                            ): string => (string) $id
                        )
                        ->all()
                )
                ->where(function ($query): void {
                    $query
                        ->whereNull(
                            'source_status'
                        )
                        ->orWhereRaw(
                            'LOWER(source_status) <> ?',
                            ['deleted']
                        );
                })
                ->pluck(
                    'external_id'
                )
                ->map(
                    fn ($id): int => (int) $id
                );

            if (
                $ids
                    ->diff($validIds)
                    ->isNotEmpty()
            ) {
                $errors[$field] =
                    'One or more selected '
                    . $config['label']
                    . ' are no longer available.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(
                $errors
            );
        }
    }

    private function syncH2ResearchMappings(
        int $testimonialId,
        array $validated,
        int $userId
    ): void {
        $now = now();

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            /*
             * If this field was not submitted,
             * do not touch its current mappings.
             */
            if (
                ! array_key_exists(
                    $field,
                    $validated
                )
            ) {
                continue;
            }

            $selectedIds = collect(
                $validated[$field] ?? []
            )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->unique()
                ->values();

            $existingIds = DB::table(
                $config['table']
            )
                ->where(
                    'testimonial_id',
                    $testimonialId
                )
                ->pluck(
                    $config['column']
                )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->unique()
                ->values();

            /*
             * Remove only mappings the practitioner removed.
             */
            $idsToDelete = $existingIds
                ->diff($selectedIds)
                ->values();

            if ($idsToDelete->isNotEmpty()) {
                DB::table(
                    $config['table']
                )
                    ->where(
                        'testimonial_id',
                        $testimonialId
                    )
                    ->whereIn(
                        $config['column'],
                        $idsToDelete->all()
                    )
                    ->delete();
            }

            /*
             * Insert only newly selected mappings.
             */
            $idsToInsert = $selectedIds
                ->diff($existingIds)
                ->values();

            if ($idsToInsert->isEmpty()) {
                continue;
            }

            DB::table(
                $config['table']
            )->insert(
                $idsToInsert
                    ->map(
                        fn (
                            int $id
                        ): array => [
                            'testimonial_id' => $testimonialId,
                            $config['column'] => $id,
                            'created_by_user_id' => $userId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    )
                    ->all()
            );
        }
    }

    private function ownedActivePatient(
        Practitioner $practitioner,
        int $patientId
    ): Client {
        $patient = Client::query()
            ->whereKey($patientId)
            ->where('practitioner_id', $practitioner->id)
            ->where('status', 'active')
            ->first();

        if (! $patient) {
            throw ValidationException::withMessages([
                'client_id' => 'Select an active patient that belongs to your practitioner account.',
            ]);
        }

        return $patient;
    }

    private function latestConsent(
        int $clientId,
        bool $lock = false
    ): ?ClientConsent {
        $query = ClientConsent::query()
            ->where('client_id', $clientId)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function practitioner(Request $request): Practitioner
    {
        $practitioner = $request->attributes->get('practitioner');

        abort_unless(
            $practitioner instanceof Practitioner,
            403
        );

        return $practitioner;
    }

    private function ensureOwnedObservation(
        Request $request,
        Practitioner $practitioner,
        Testimonial $observation
    ): void {
        abort_unless(
            $observation->submission_type === 'practitioner'
            && (int) $observation->practitioner_id === (int) $practitioner->id
            && (int) $observation->author_user_id === (int) $request->user()->id,
            404
        );
    }

    private function ensurePermission(Request $request): void
    {
        abort_unless(
            $request->user()
            && Rbac::hasPermission(
                $request->user()->id,
                self::PERMISSION
            ),
            403
        );
    }

    private function statusLabel(string $status): string
    {
        return ucwords(
            str_replace('_', ' ', $status)
        );
    }

    private function consentLabel(string $state): string
    {
        return match ($state) {
            'confirmed' => 'Confirmed',
            'withdrawn' => 'Withdrawn',
            default => 'Missing',
        };
    }
}
