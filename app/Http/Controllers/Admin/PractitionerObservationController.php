<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ClientConsent;
use App\Models\Testimonial;
use App\Models\TestimonialReview;
use App\Models\TestimonialVersion;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerObservationController extends Controller
{
    private const PERMISSION = 'practitioner_observations.review';

    private const STATUS_NOTES = [
        'draft' => 'Practitioner is still preparing the observation.',
        'pending_review' => 'Submitted and waiting for Admin review.',
        'changes_requested' => 'Changes were requested. Practitioner can edit and resubmit.',
        'approved' => 'Admin approved the observation.',
        'rejected' => 'Admin rejected the observation.',
        'archived' => 'Observation is archived and retained for history.',
    ];

    private const EDITABLE_STATUSES = [
        'draft',
        'pending_review',
        'changes_requested',
    ];

    private const ARCHIVABLE_STATUSES = [
        'draft',
        'pending_review',
        'changes_requested',
        'approved',
        'rejected',
    ];

    private const REQUIRED_ACKNOWLEDGEMENT_CODES = [
        'information_accurate',
        'deidentified_observations',
        'not_medical_claims',
        'review_before_publication',
        'changes_may_be_requested',
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

        'article_ids' => [
            'source' => 'article',
            'table' => 'testimonial_articles',
            'column' => 'article_id',
            'label' => 'articles',
        ],
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
                    ...array_keys(self::STATUS_NOTES),
                ]),
            ],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? 'all';

        $observations = Testimonial::query()
            ->whereIn(
                'submission_type',
                [
                    'practitioner',
                    'contributor',
                ]
            )
            ->with([
                'author:id,name,email',
                'practitioner:id,user_id,professional_title,verification_status',
                'practitioner.user:id,name,email',
                'client:id,practitioner_id,client_reference,status',
            ])
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
                    $query->where('testimonials.title', 'like', "%{$search}%");

                    if (ctype_digit($search)) {
                        $query->orWhere('testimonials.id', (int) $search);
                    }

                    $query->orWhereHas(
                        'author',
                        function (Builder $query) use ($search): void {
                            $query
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );

                    $query
                        ->orWhereHas('practitioner.user', function (Builder $query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('client', function (Builder $query) use ($search): void {
                            $query->where('client_reference', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $status !== 'all',
                fn (Builder $query) => $query->where('testimonials.status', $status)
            )
            ->orderByDesc('testimonials.updated_at')
            ->orderByDesc('testimonials.id')
            ->paginate(15)
            ->withQueryString();

        $observations->getCollection()->transform(
            function (
                Testimonial $observation
            ): array {
                $status =
                    (string) $observation->status;

                $isContributor =
                    $observation->submission_type
                    === 'contributor';

                $consentState =
                    $isContributor
                        ? 'confirmed'
                        : (string) (
                    $observation->getAttribute(
                        'current_consent_state'
                    )
                        ?: 'missing'
                    );

                return [
                    'id' =>
                        $observation->id,

                    'title' =>
                        $observation->title,

                    'status' =>
                        $status,

                    'status_label' =>
                        $this->statusLabel(
                            $status
                        ),

                    'status_note' =>
                        self::STATUS_NOTES[
                        $status
                        ] ?? 'Unknown status.',

                    'practitioner_name' =>
                        $isContributor
                            ? $observation
                            ->author
                            ?->name
                            : $observation
                            ->practitioner
                            ?->user
                            ?->name,

                    'professional_title' =>
                        $isContributor
                            ? 'Contributor'
                            : $observation
                            ->practitioner
                            ?->professional_title,

                    'patient_reference' =>
                        $isContributor
                            ? 'Self'
                            : $observation
                            ->client
                            ?->client_reference,

                    'patient_status' =>
                        $isContributor
                            ? 'self'
                            : $observation
                            ->client
                            ?->status,

                    'consent_state' =>
                        $consentState,

                    'consent_state_label' =>
                        $isContributor
                            ? 'Self-submitted'
                            : $this->consentLabel(
                            $consentState
                        ),

                    'flagged_for_admin' =>
                        (bool) $observation
                            ->flagged_for_admin,

                    'submitted_at' =>
                        $observation
                            ->submitted_at
                            ?->toIso8601String(),

                    'updated_at' =>
                        $observation
                            ->updated_at
                            ?->toIso8601String(),
                ];
            }
        );

        return Inertia::render('admin/review-practitioner-observations/index', [
            'observations' => $observations,

            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(Request $request, Testimonial $observation): Response
    {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        $observation->load([
            'practitioner:id,user_id,professional_title,specialty,verification_status',
            'practitioner.user:id,name,email',
            'client:id,practitioner_id,client_reference,status',
            'flagger:id,name,email',
        ]);

        $isContributor =
            $observation->submission_type
            === 'contributor';

        $currentConsent = $this->latestConsent($observation->client_id);
        $latestVersion = $this->latestVersion($observation);

        if ($latestVersion) {
            $latestVersion->load([
                'consents.acceptedBy:id,name,email',
            ]);
        }

        $linkedConsent = $latestVersion?->client_consent_id
            ? ClientConsent::query()->find($latestVersion->client_consent_id)
            : null;

        $acknowledgementStatus = $this->acknowledgementStatus($latestVersion);

        $acknowledgements = $latestVersion
            ? $latestVersion->consents
                ->sortBy('id')
                ->map(fn ($consent): array => [
                    'id' => $consent->id,
                    'statement_code' => $consent->statement_code,
                    'statement_version' => $consent->statement_version,
                    'statement_text' => $consent->statement_text,
                    'accepted_at' => $consent->accepted_at?->toIso8601String(),

                    'accepted_by' => $consent->acceptedBy
                        ? [
                            'id' => $consent->acceptedBy->id,
                            'name' => $consent->acceptedBy->name,
                            'email' => $consent->acceptedBy->email,
                        ]
                        : null,
                ])
                ->values()
            : collect();

        $status = (string) $observation->status;

        $approvalBlockers = $status === 'pending_review'
            ? $this->approvalBlockers(
                $observation,
                $latestVersion,
                $linkedConsent,
                $currentConsent
            )
            : [];

        $history = TestimonialReview::query()
            ->where('testimonial_id', $observation->id)
            ->with([
                'actor:id,name,email',
                'version:id,version_number',
            ])
            ->orderByDesc('acted_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (TestimonialReview $review): array => [
                'id' => $review->id,
                'action' => $review->action,
                'from_status' => $review->from_status,
                'to_status' => $review->to_status,
                'review_comment' => $review->review_comment,
                'internal_note' => $review->internal_note,
                'condition_check' => $review->condition_check,
                'observation_language_check' => $review->observation_language_check,
                'deidentification_check' => $review->deidentification_check,
                'consent_check' => $review->consent_check,
                'publication_check' => $review->publication_check,
                'acted_at' => $review->acted_at?->toIso8601String(),
                'actor_name' => $review->actor?->name,
                'version_number' => $review->version?->version_number,
            ])
            ->values();

        return Inertia::render('admin/review-practitioner-observations/show', [
            'observation' => [
                'id' => $observation->id,
                'title' => $observation->title,
                'observation' => $observation->observation,
                'condition_symptom_text' => $observation->condition_symptom_text,
                'duration_text' => $observation->duration_text,
                'frequency_text' => $observation->frequency_text,
                'timeline_text' => $observation->timeline_text,
                'practitioner_note' => $observation->practitioner_note,

                'status' => $status,
                'status_label' => $this->statusLabel($status),
                'status_note' => self::STATUS_NOTES[$status] ?? 'Unknown status.',

                'submitted_at' => $observation->submitted_at?->toIso8601String(),
                'updated_at' => $observation->updated_at?->toIso8601String(),

                'latest_version_number' => $latestVersion?->version_number,

                'can_edit' => in_array($status, self::EDITABLE_STATUSES, true),

                'can_approve' => $status === 'pending_review'
                    && $approvalBlockers === [],

                'can_request_changes' => $status === 'pending_review',
                'can_reject' => $status === 'pending_review',

                'can_archive' => in_array(
                    $status,
                    self::ARCHIVABLE_STATUSES,
                    true
                ),

                'approval_blockers' => $approvalBlockers,

                'flagged_for_admin' => (bool) $observation->flagged_for_admin,
                'flagged_at' => $observation->flagged_at?->toIso8601String(),

                'flagged_by' => $observation->flagger
                    ? [
                        'id' => $observation->flagger->id,
                        'name' => $observation->flagger->name,
                        'email' => $observation->flagger->email,
                    ]
                    : null,

                'can_flag' => ! $observation->flagged_for_admin
                    && $status !== 'archived',

                'can_resolve_flag' => (bool) $observation->flagged_for_admin
                    && Rbac::isAdmin($request->user()->id),
            ],

            'practitioner' => [
                'id' =>
                    $isContributor
                        ? null
                        : $observation
                        ->practitioner
                        ?->id,

                'name' =>
                    $isContributor
                        ? $observation
                        ->author
                        ?->name
                        : $observation
                        ->practitioner
                        ?->user
                        ?->name,

                'email' =>
                    $isContributor
                        ? $observation
                        ->author
                        ?->email
                        : $observation
                        ->practitioner
                        ?->user
                        ?->email,

                'professional_title' =>
                    $isContributor
                        ? 'Contributor'
                        : $observation
                        ->practitioner
                        ?->professional_title,

                'specialty' =>
                    $isContributor
                        ? null
                        : $observation
                        ->practitioner
                        ?->specialty,

                'verification_status' =>
                    $isContributor
                        ? 'self-submitted'
                        : $observation
                        ->practitioner
                        ?->verification_status,
            ],

            'patient' => [
                'id' =>
                    $isContributor
                        ? null
                        : $observation
                        ->client
                        ?->id,

                'client_reference' =>
                    $isContributor
                        ? 'Self'
                        : $observation
                        ->client
                        ?->client_reference,

                'status' =>
                    $isContributor
                        ? 'self'
                        : $observation
                        ->client
                        ?->status,

                'current_consent_state' =>
                    $isContributor
                        ? 'confirmed'
                        : (
                    $currentConsent
                        ?->action
                        ?: 'missing'
                    ),

                'current_consent_state_label' =>
                    $isContributor
                        ? 'Self-submitted'
                        : $this->consentLabel(
                        $currentConsent
                            ?->action
                            ?: 'missing'
                    ),

                'current_consent_id' =>
                    $isContributor
                        ? null
                        : $currentConsent
                        ?->id,

                'current_consent_occurred_at' =>
                    $isContributor
                        ? null
                        : $currentConsent
                        ?->occurred_at
                        ?->toIso8601String(),

                'submitted_consent_id' =>
                    $isContributor
                        ? null
                        : $linkedConsent
                        ?->id,

                'submitted_consent_state' =>
                    $isContributor
                        ? null
                        : $linkedConsent
                        ?->action,

                'submitted_consent_occurred_at' =>
                    $isContributor
                        ? null
                        : $linkedConsent
                        ?->occurred_at
                        ?->toIso8601String(),
            ],

            'acknowledgements' => $acknowledgements,

            'acknowledgementStatus' => [
                'complete' => $acknowledgementStatus['complete'],
                'accepted_count' => count($acknowledgementStatus['accepted']),
                'required_count' => count(self::REQUIRED_ACKNOWLEDGEMENT_CODES),
                'missing_codes' => $acknowledgementStatus['missing'],
            ],

            'h2research_mappings' => $this->currentH2ResearchMappings(
                $observation
            ),

            'history' => $history,

            'status_notes' => collect(self::STATUS_NOTES)
                ->map(fn (string $note, string $status): array => [
                    'value' => $status,
                    'label' => $this->statusLabel($status),
                    'note' => $note,
                ])
                ->values(),
        ]);
    }

    public function update(
        Request $request,
        Testimonial $observation
    ): RedirectResponse {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'observation' => ['nullable', 'string'],
            'condition_symptom_text' => ['nullable', 'string', 'max:500'],
            'duration_text' => ['nullable', 'string', 'max:255'],
            'frequency_text' => ['nullable', 'string', 'max:255'],
            'timeline_text' => ['nullable', 'string'],
            'practitioner_note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $observation, $validated): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePractitionerObservation($lockedObservation);

            abort_unless(
                in_array(
                    (string) $lockedObservation->status,
                    self::EDITABLE_STATUSES,
                    true
                ),
                409,
                'This practitioner observation cannot be edited in its current status.'
            );

            $lockedObservation->fill($validated);

            $changes = $lockedObservation->getDirty();

            if ($changes === []) {
                return;
            }

            $oldValues = Arr::only(
                $lockedObservation->getOriginal(),
                array_keys($changes)
            );

            $lockedObservation->save();

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => 'practitioner_observation.updated_by_admin',
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,
                'old_values' => $oldValues,
                'new_values' => $changes,

                'metadata' => [
                    'submission_type' =>
                        $lockedObservation
                            ->submission_type,

                    'status' =>
                        $lockedObservation
                            ->status,
                ],

                'request_id' => (string) Str::uuid(),
                'occurred_at' => now(),
            ]);
        });

        return back()->with(
            'success',
            'Practitioner observation updated successfully.'
        );
    }

    public function review(
        Request $request,
        Testimonial $observation
    ): RedirectResponse {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        $decision = (string) $request->input('decision');

        $validated = $request->validate([
            'decision' => [
                'required',
                Rule::in([
                    'approve',
                    'changes_requested',
                    'reject',
                    'archive',
                ]),
            ],

            'condition_check' => [
                Rule::requiredIf($decision === 'approve'),
                'nullable',
                Rule::in(['passed', 'needs_change']),
            ],

            'observation_language_check' => [
                Rule::requiredIf($decision === 'approve'),
                'nullable',
                Rule::in(['passed', 'needs_change']),
            ],

            'deidentification_check' => [
                Rule::requiredIf($decision === 'approve'),
                'nullable',
                Rule::in(['passed', 'needs_change']),
            ],

            'consent_check' => [
                Rule::requiredIf($decision === 'approve'),
                'nullable',
                Rule::in(['passed', 'missing']),
            ],

            'publication_check' => [
                Rule::requiredIf($decision === 'approve'),
                'nullable',
                Rule::in(['ready', 'not_ready']),
            ],

            'review_comment' => [
                Rule::requiredIf(
                    in_array(
                        $decision,
                        ['changes_requested', 'reject'],
                        true
                    )
                ),
                'nullable',
                'string',
                'max:5000',
            ],

            'internal_note' => [
                'nullable',
                'string',
                'max:5000',
            ],

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

            'article_ids' => [
                'nullable',
                'array',
            ],

            'article_ids.*' => [
                'integer',
                'distinct',
            ],
        ]);

        if ($decision === 'approve') {
            $this->validatePassingReviewChecks(
                $validated
            );

            $this->validateH2ResearchMappings(
                $validated
            );
        }

        DB::transaction(function () use (
            $request,
            $observation,
            $validated
        ): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePractitionerObservation($lockedObservation);

            $fromStatus = (string) $lockedObservation->status;
            $decision = (string) $validated['decision'];
            $now = now();

            $version = $this->lockedLatestVersion($lockedObservation);

            if ($version) {
                $version->load('consents');
            }

            $linkedConsent = $version?->client_consent_id
                ? ClientConsent::query()
                    ->whereKey($version->client_consent_id)
                    ->lockForUpdate()
                    ->first()
                : null;

            $currentConsent = $this->latestConsent(
                $lockedObservation->client_id,
                true
            );

            $action = '';
            $toStatus = '';

            if ($decision === 'approve') {
                abort_unless(
                    $fromStatus === 'pending_review',
                    409,
                    'Only a pending review observation can be approved.'
                );

                $lockedObservation->load([
                    'practitioner:id,user_id,verification_status',
                    'client:id,practitioner_id,client_reference,status',
                ]);

                $approvalBlockers = $this->approvalBlockers(
                    $lockedObservation,
                    $version,
                    $linkedConsent,
                    $currentConsent
                );

                if ($approvalBlockers !== []) {
                    throw ValidationException::withMessages([
                        'decision' => implode(' ', $approvalBlockers),
                    ]);
                }

                $this->syncH2ResearchMappings(
                    $lockedObservation->id,
                    $validated,
                    $request->user()->id
                );

                $version->update([
                    'approved_snapshot' => $this->approvedSnapshot(
                        $lockedObservation
                    ),
                    'approved_by_user_id' => $request->user()->id,
                    'approved_at' => $now,
                ]);

                $action = 'approved';
                $toStatus = 'published';
            }

            if ($decision === 'changes_requested') {
                abort_unless(
                    $fromStatus === 'pending_review',
                    409,
                    'Changes can only be requested from a pending review observation.'
                );

                $action = 'changes_requested';
                $toStatus = 'changes_requested';
            }

            if ($decision === 'reject') {
                abort_unless(
                    $fromStatus === 'pending_review',
                    409,
                    'Only a pending review observation can be rejected.'
                );

                $action = 'rejected';
                $toStatus = 'rejected';
            }

            if ($decision === 'archive') {
                abort_unless(
                    in_array(
                        $fromStatus,
                        self::ARCHIVABLE_STATUSES,
                        true
                    ),
                    409,
                    'This practitioner observation cannot be archived in its current status.'
                );

                $action = 'archived';
                $toStatus = 'archived';
            }

            abort_if(
                $action === '' || $toStatus === '',
                422,
                'Invalid review decision.'
            );

            $updateData = [
                'status' => $toStatus,
            ];

            if ($toStatus === 'published') {
                $updateData['published_at'] = $now;
                $updateData['published_by_user_id'] = $request->user()->id;

                if (! $lockedObservation->slug) {
                    $baseSlug = Str::slug(
                        $lockedObservation->title ?: 'observation'
                    );

                    $updateData['slug'] = $baseSlug . '-' . $lockedObservation->id;
                }
            }

            if ($toStatus === 'archived') {
                $updateData['archived_by_user_id'] = $request->user()->id;
                $updateData['archived_at'] = $now;
            }

            $lockedObservation->update($updateData);

            $review = TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $version?->id,
                'actor_user_id' => $request->user()->id,
                'action' => $action,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,

                'review_comment' => $validated['review_comment'] ?? null,
                'internal_note' => $validated['internal_note'] ?? null,

                'condition_check' => $validated['condition_check'] ?? null,
                'observation_language_check' => $validated['observation_language_check'] ?? null,
                'deidentification_check' => $validated['deidentification_check'] ?? null,
                'consent_check' => $validated['consent_check'] ?? null,
                'publication_check' => $validated['publication_check'] ?? null,

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
                    'status' => $toStatus,
                ],

                'metadata' => [
                    'review_id' => $review->id,
                    'version_id' => $version?->id,
                    'practitioner_id' => $lockedObservation->practitioner_id,
                    'client_id' => $lockedObservation->client_id,
                    'client_consent_id' => $version?->client_consent_id,

                    'review_checks' => [
                        'condition_check' => $validated['condition_check'] ?? null,
                        'observation_language_check' => $validated['observation_language_check'] ?? null,
                        'deidentification_check' => $validated['deidentification_check'] ?? null,
                        'consent_check' => $validated['consent_check'] ?? null,
                        'publication_check' => $validated['publication_check'] ?? null,
                    ],

                    'h2research_mappings' => $decision === 'approve'
                            ? Arr::only(
                                $validated,
                                array_keys(
                                    self::H2_MAPPING_FIELDS
                                )
                            )
                            : null,
                ],

                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return back()->with(
            'success',
            match ($validated['decision']) {
                'approve' => 'Practitioner observation approved successfully.',
                'changes_requested' => 'Changes requested from the practitioner successfully.',
                'reject' => 'Practitioner observation rejected successfully.',
                'archive' => 'Practitioner observation archived successfully.',
            }
        );
    }

    public function flag(
        Request $request,
        Testimonial $observation
    ): RedirectResponse {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use (
            $request,
            $observation,
            $validated
        ): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePractitionerObservation($lockedObservation);

            abort_if(
                $lockedObservation->flagged_for_admin,
                409,
                'This observation is already flagged.'
            );

            abort_if(
                $lockedObservation->status === 'archived',
                409,
                'An archived observation cannot be flagged.'
            );

            $now = now();
            $status = (string) $lockedObservation->status;

            $lockedObservation->update([
                'flagged_for_admin' => true,
                'flagged_by_user_id' => $request->user()->id,
                'flagged_at' => $now,
            ]);

            $review = TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $lockedObservation->latest_version_id,
                'actor_user_id' => $request->user()->id,
                'action' => 'flagged',
                'from_status' => $status,
                'to_status' => $status,
                'internal_note' => $validated['reason'],
                'acted_at' => $now,
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => 'practitioner_observation.flagged',
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,

                'old_values' => [
                    'flagged_for_admin' => false,
                ],

                'new_values' => [
                    'flagged_for_admin' => true,
                    'flagged_by_user_id' => $request->user()->id,
                    'flagged_at' => $now->toIso8601String(),
                ],

                'metadata' => [
                    'review_id' => $review->id,
                    'version_id' => $lockedObservation->latest_version_id,
                    'reason' => $validated['reason'],
                ],

                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return back()->with(
            'success',
            'Practitioner observation flagged for Admin review.'
        );
    }

    public function resolveFlag(
        Request $request,
        Testimonial $observation
    ): RedirectResponse {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        abort_unless(
            Rbac::isAdmin($request->user()->id),
            403
        );

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use (
            $request,
            $observation,
            $validated
        ): void {
            $lockedObservation = Testimonial::query()
                ->whereKey($observation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePractitionerObservation($lockedObservation);

            abort_unless(
                $lockedObservation->flagged_for_admin,
                409,
                'This observation is not currently flagged.'
            );

            $oldFlaggerId = $lockedObservation->flagged_by_user_id;
            $oldFlaggedAt = $lockedObservation->flagged_at;
            $status = (string) $lockedObservation->status;
            $now = now();

            $lockedObservation->update([
                'flagged_for_admin' => false,
                'flagged_by_user_id' => null,
                'flagged_at' => null,
            ]);

            $review = TestimonialReview::query()->create([
                'testimonial_id' => $lockedObservation->id,
                'version_id' => $lockedObservation->latest_version_id,
                'actor_user_id' => $request->user()->id,
                'action' => 'flag_resolved',
                'from_status' => $status,
                'to_status' => $status,
                'internal_note' => $validated['reason'],
                'acted_at' => $now,
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $request->user()->id,
                'action' => 'practitioner_observation.flag_resolved',
                'subject_type' => Testimonial::class,
                'subject_id' => $lockedObservation->id,

                'old_values' => [
                    'flagged_for_admin' => true,
                    'flagged_by_user_id' => $oldFlaggerId,
                    'flagged_at' => $oldFlaggedAt?->toIso8601String(),
                ],

                'new_values' => [
                    'flagged_for_admin' => false,
                    'flagged_by_user_id' => null,
                    'flagged_at' => null,
                ],

                'metadata' => [
                    'review_id' => $review->id,
                    'version_id' => $lockedObservation->latest_version_id,
                    'resolution_note' => $validated['reason'],
                ],

                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
            ]);
        });

        return back()->with(
            'success',
            'Observation flag resolved successfully.'
        );
    }

    private function currentH2ResearchMappings(
        Testimonial $observation
    ): array {
        $result = [];

        $hasCache = Schema::connection(
            'h2research_cache'
        )->hasTable(
            'h2_reference_items'
        );

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

            $names = collect();

            if (
                $hasCache
                && $ids->isNotEmpty()
            ) {
                $names = DB::connection(
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
                    ->pluck(
                        'name',
                        'external_id'
                    );
            }

            $result[$field] =
                $ids
                    ->map(
                        fn (
                            int $id
                        ): array => [
                            'id' => $id,

                            'name' => $names->get(
                                $id
                            )
                                ?? $names->get(
                                    (string) $id
                                )
                                    ?? "H2Research ID #{$id}",
                        ]
                    )
                    ->values()
                    ->all();
        }

        return $result;
    }

    private function validateH2ResearchMappings(
        array $validated
    ): void {
        $hasSelections = collect(
            array_keys(
                self::H2_MAPPING_FIELDS
            )
        )->contains(
            fn (
                string $field
            ): bool => ! empty(
                $validated[$field]
                ?? []
            )
        );

        if (! $hasSelections) {
            return;
        }

        if (! Schema::connection(
            'h2research_cache'
        )->hasTable(
            'h2_reference_items'
        )) {
            throw ValidationException::withMessages([
                'decision' => 'H2Research data has not been synced yet.',
            ]);
        }

        $errors = [];

        foreach (
            self::H2_MAPPING_FIELDS as $field => $config
        ) {
            $ids = collect(
                $validated[$field]
                ?? []
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
                ->where(
                    function (
                        $query
                    ): void {
                        $query
                            ->whereNull(
                                'source_status'
                            )
                            ->orWhereRaw(
                                'LOWER(source_status) <> ?',
                                ['deleted']
                            );
                    }
                )
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
                    .$config['label']
                    .' are no longer available. Sync H2Research and select them again.';
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
            $ids = collect(
                $validated[$field]
                ?? []
            )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->unique()
                ->values();

            DB::table(
                $config['table']
            )
                ->where(
                    'testimonial_id',
                    $testimonialId
                )
                ->delete();

            if ($ids->isEmpty()) {
                continue;
            }

            DB::table(
                $config['table']
            )->insert(
                $ids
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

    private function approvalBlockers(
        Testimonial $observation,
        ?TestimonialVersion $version,
        ?ClientConsent $linkedConsent,
        ?ClientConsent $currentConsent
    ): array {
        $blockers = [];

        if (
            ! $version
            || (int) $observation
                ->latest_version_id
            !== (int) $version->id
        ) {
            $blockers[] =
                'A valid latest submitted version is required before approval.';
        }

        $acknowledgementStatus =
            $this->acknowledgementStatus(
                $version
            );

        /*
         * Contributor observation:
         * the logged-in author is the patient.
         * No Practitioner, Client or ClientConsent
         * record is required.
         */
        if (
            $observation->submission_type
            === 'contributor'
        ) {
            if (
                ! $acknowledgementStatus[
                'complete'
                ]
            ) {
                $blockers[] =
                    'All required contributor acknowledgements must exist for the latest submitted version.';
            }

            return $blockers;
        }

        $observation->loadMissing([
            'practitioner:id,user_id,verification_status',
            'client:id,practitioner_id,client_reference,status',
        ]);

        if (
            ! $observation->practitioner
            || $observation
                ->practitioner
                ->verification_status
            !== 'approved'
        ) {
            $blockers[] =
                'The practitioner is not currently approved.';
        }

        if (
            ! $observation->client
        ) {
            $blockers[] =
                'The patient record is missing.';
        } elseif (
            $observation
                ->client
                ->status
            !== 'active'
        ) {
            $blockers[] =
                'The patient must be active before approval.';
        } elseif (
            (int) $observation
                ->client
                ->practitioner_id
            !== (int) $observation
                ->practitioner_id
        ) {
            $blockers[] =
                'The patient does not belong to this practitioner.';
        }

        if (
            ! $linkedConsent
            || $linkedConsent
                ->action
            !== 'confirmed'
        ) {
            $blockers[] =
                'The submitted version must have a linked confirmed patient consent receipt.';
        }

        if (
            ! $currentConsent
            || $currentConsent
                ->action
            !== 'confirmed'
        ) {
            $blockers[] =
                'Current patient consent must be confirmed before approval.';
        }

        if (
            ! $acknowledgementStatus[
            'complete'
            ]
        ) {
            $blockers[] =
                'All required practitioner acknowledgements must exist for the latest submitted version.';
        }

        return $blockers;
    }

    private function acknowledgementStatus(
        ?TestimonialVersion $version
    ): array {
        if (! $version) {
            return [
                'complete' => false,
                'accepted' => [],
                'missing' => self::REQUIRED_ACKNOWLEDGEMENT_CODES,
            ];
        }

        $version->loadMissing('consents');

        $acceptedCodes = $version->consents
            ->filter(
                fn ($consent) => (int) $consent->accepted_by_user_id
                    === (int) $version->submitted_by_user_id
            )
            ->pluck('statement_code')
            ->unique()
            ->values()
            ->all();

        $missingCodes = array_values(
            array_diff(
                self::REQUIRED_ACKNOWLEDGEMENT_CODES,
                $acceptedCodes
            )
        );

        return [
            'complete' => $missingCodes === [],
            'accepted' => $acceptedCodes,
            'missing' => $missingCodes,
        ];
    }

    private function validatePassingReviewChecks(array $validated): void
    {
        $errors = [];

        if (($validated['condition_check'] ?? null) !== 'passed') {
            $errors['condition_check'] =
                'Condition check must pass before approval.';
        }

        if (($validated['observation_language_check'] ?? null) !== 'passed') {
            $errors['observation_language_check'] =
                'Observation language check must pass before approval.';
        }

        if (($validated['deidentification_check'] ?? null) !== 'passed') {
            $errors['deidentification_check'] =
                'De-identification check must pass before approval.';
        }

        if (($validated['consent_check'] ?? null) !== 'passed') {
            $errors['consent_check'] =
                'Consent check must pass before approval.';
        }

        if (($validated['publication_check'] ?? null) !== 'ready') {
            $errors['publication_check'] =
                'Publication check must be ready before approval.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function approvedSnapshot(Testimonial $observation): array
    {
        return [
            'title' => $observation->title,
            'observation' => $observation->observation,
            'condition_symptom_text' => $observation->condition_symptom_text,
            'duration_text' => $observation->duration_text,
            'frequency_text' => $observation->frequency_text,
            'timeline_text' => $observation->timeline_text,
            'practitioner_note' => $observation->practitioner_note,
            'submission_type' => $observation->submission_type,
            'practitioner_id' => $observation->practitioner_id,
            'client_id' => $observation->client_id,
            'client_reference' => $observation->client?->client_reference,
        ];
    }

    private function latestVersion(
        Testimonial $observation
    ): ?TestimonialVersion {
        if (! $observation->latest_version_id) {
            return null;
        }

        return TestimonialVersion::query()
            ->where('testimonial_id', $observation->id)
            ->whereKey($observation->latest_version_id)
            ->first();
    }

    private function lockedLatestVersion(
        Testimonial $observation
    ): ?TestimonialVersion {
        if (! $observation->latest_version_id) {
            return null;
        }

        return TestimonialVersion::query()
            ->where('testimonial_id', $observation->id)
            ->whereKey($observation->latest_version_id)
            ->lockForUpdate()
            ->first();
    }

    private function latestConsent(
        ?int $clientId,
        bool $lock = false
    ): ?ClientConsent {
        if (! $clientId) {
            return null;
        }

        $query = ClientConsent::query()
            ->where('client_id', $clientId)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function ensurePractitionerObservation(
        Testimonial $observation
    ): void {
        abort_unless(
            in_array(
                $observation->submission_type,
                [
                    'practitioner',
                    'contributor',
                ],
                true
            ),
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
