<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Testimonial;
use App\Models\TestimonialConsent;
use App\Models\TestimonialReview;
use App\Models\TestimonialVersion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MyObservationController extends Controller
{
    private const ACKNOWLEDGEMENT_VERSION = '1.0';

    private const ACKNOWLEDGEMENTS = [
        'information_accurate' =>
            'I confirm that the information provided is accurate.',

        'deidentified_observations' =>
            'I confirm this observation describes my own experience and I will not include identifying information about other people.',

        'not_medical_claims' =>
            'I understand that my observation is not a medical claim, proof of efficacy or clinical evidence.',

        'review_before_publication' =>
            'I understand that my submission must be reviewed before publication.',

        'changes_may_be_requested' =>
            'I understand that Moderators may request changes to my submission.',
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
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $search = trim(
            (string) ($validated['search'] ?? '')
        );

        $observations = $this->ownedObservations($request)
            ->select([
                'id',
                'title',
                'status',
                'archived_by_user_id',
                'updated_at',
            ])
            ->when(
                $search !== '',
                function (Builder $query) use ($search): void {
                    $query->where(
                        function (Builder $query) use ($search): void {
                            $query
                                ->where(
                                    'title',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'observation',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(
                function (Testimonial $observation) use ($request): array {
                    $status = (string) $observation->status;

                    return [
                        'id' => $observation->id,

                        'title' =>
                            $observation->title,

                        'status_label' =>
                            $this->statusLabel(
                                $status
                            ),

                        'updated_at' =>
                            $observation
                                ->updated_at
                                ?->toIso8601String(),

                        'can_edit' =>
                            in_array(
                                $status,
                                [
                                    'draft',
                                    'changes_requested',
                                ],
                                true
                            ),

                        'can_archive' =>
                            $status === 'draft',

                        'can_restore' =>
                            $status === 'archived'
                            && (int) $observation
                                ->archived_by_user_id
                            === (int) $request
                                ->user()
                                ->id,
                    ];
                }
            );

        return Inertia::render(
            'observations/index',
            [
                'observations' =>
                    $observations,

                'filters' => [
                    'search' =>
                        $search,
                ],
            ]
        );
    }

    public function create(Request $request): Response
    {
        return Inertia::render(
            'observations/form',
            $this->formProps($request)
        );
    }

    public function store(
        Request $request
    ): RedirectResponse {
        $validated =
            $this->validateDraft($request);

        $observation = DB::transaction(
            function () use (
                $request,
                $validated
            ): Testimonial {
                $observation =
                    Testimonial::query()->create([
                        'author_user_id' =>
                            $request->user()->id,

                        'submission_type' =>
                            'contributor',

                        /*
                         * Contributor is the patient.
                         * Do not create/select a Client row.
                         */
                        'practitioner_id' => null,
                        'client_id' => null,

                        'title' =>
                            $validated['title']
                            ?? null,

                        'observation' =>
                            $validated['observation']
                            ?? null,

                        'condition_symptom_text' =>
                            $validated[
                            'condition_symptom_text'
                            ] ?? null,

                        'duration_text' =>
                            $validated['duration_text']
                            ?? null,

                        'frequency_text' =>
                            $validated['frequency_text']
                            ?? null,

                        'timeline_text' =>
                            $validated['timeline_text']
                            ?? null,

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

        return to_route(
            'my.observations.edit',
            $observation->id
        )->with(
            'success',
            'Draft saved successfully.'
        );
    }

    public function edit(
        Request $request,
        int $observation
    ): Response {
        $observationRecord =
            $this->findOwnedObservation(
                $request,
                $observation
            );

        return Inertia::render(
            'observations/form',
            $this->formProps(
                $request,
                $observationRecord
            )
        );
    }

    public function update(
        Request $request,
        int $observation
    ): RedirectResponse {
        $observationRecord =
            $this->findOwnedObservation(
                $request,
                $observation
            );

        $validated =
            $this->validateDraft($request);

        DB::transaction(
            function () use (
                $request,
                $observationRecord,
                $validated
            ): void {
                $lockedObservation =
                    Testimonial::query()
                        ->whereKey(
                            $observationRecord->id
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                $this->ensureOwnedObservation(
                    $request,
                    $lockedObservation
                );

                abort_unless(
                    in_array(
                        (string) $lockedObservation->status,
                        [
                            'draft',
                            'changes_requested',
                        ],
                        true
                    ),
                    409,
                    'This observation cannot be edited in its current status.'
                );

                $lockedObservation->update([
                    'title' =>
                        $validated['title']
                        ?? null,

                    'observation' =>
                        $validated['observation']
                        ?? null,

                    'condition_symptom_text' =>
                        $validated[
                        'condition_symptom_text'
                        ] ?? null,

                    'duration_text' =>
                        $validated['duration_text']
                        ?? null,

                    'frequency_text' =>
                        $validated['frequency_text']
                        ?? null,

                    'timeline_text' =>
                        $validated['timeline_text']
                        ?? null,
                ]);

                $this->syncH2ResearchMappings(
                    $lockedObservation->id,
                    $validated,
                    $request->user()->id
                );
            }
        );

        return back()->with(
            'success',
            'Draft updated successfully.'
        );
    }

    public function submit(
        Request $request,
        int $observation
    ): RedirectResponse {
        $observationRecord =
            $this->findOwnedObservation(
                $request,
                $observation
            );

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'observation' => [
                'required',
                'string',
            ],

            'condition_symptom_text' => [
                'nullable',
                'string',
                'max:500',
            ],

            'duration_text' => [
                'nullable',
                'string',
                'max:255',
            ],

            'frequency_text' => [
                'nullable',
                'string',
                'max:255',
            ],

            'timeline_text' => [
                'nullable',
                'string',
            ],

            ...$this->h2ResearchValidationRules(),

            'acknowledgements' => [
                'required',
                'array',
                'size:' . count(
                    self::ACKNOWLEDGEMENTS
                ),
            ],

            'acknowledgements.*' => [
                'required',
                'string',
                'distinct',
                Rule::in(
                    array_keys(
                        self::ACKNOWLEDGEMENTS
                    )
                ),
            ],
        ]);

        $this->validateH2ResearchMappings(
            $validated
        );

        $acceptedCodes =
            collect(
                $validated['acknowledgements']
            )
                ->sort()
                ->values()
                ->all();

        $requiredCodes =
            collect(
                array_keys(
                    self::ACKNOWLEDGEMENTS
                )
            )
                ->sort()
                ->values()
                ->all();

        if (
            $acceptedCodes
            !== $requiredCodes
        ) {
            throw ValidationException::withMessages([
                'acknowledgements' =>
                    'You must accept every acknowledgement before submitting.',
            ]);
        }

        $wasResubmission =
            $observationRecord->status
            === 'changes_requested';

        DB::transaction(
            function () use (
                $request,
                $observationRecord,
                $validated
            ): void {
                $lockedObservation =
                    Testimonial::query()
                        ->whereKey(
                            $observationRecord->id
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                $this->ensureOwnedObservation(
                    $request,
                    $lockedObservation
                );

                $fromStatus =
                    (string) $lockedObservation
                        ->status;

                abort_unless(
                    in_array(
                        $fromStatus,
                        [
                            'draft',
                            'changes_requested',
                        ],
                        true
                    ),
                    409,
                    'This observation cannot be submitted in its current status.'
                );

                $lockedObservation->update([
                    'title' =>
                        $validated['title'],

                    'observation' =>
                        $validated['observation'],

                    'condition_symptom_text' =>
                        $validated[
                        'condition_symptom_text'
                        ] ?? null,

                    'duration_text' =>
                        $validated[
                        'duration_text'
                        ] ?? null,

                    'frequency_text' =>
                        $validated[
                        'frequency_text'
                        ] ?? null,

                    'timeline_text' =>
                        $validated[
                        'timeline_text'
                        ] ?? null,
                ]);

                $this->syncH2ResearchMappings(
                    $lockedObservation->id,
                    $validated,
                    $request->user()->id
                );

                $versionNumber =
                    (int) TestimonialVersion::query()
                        ->where(
                            'testimonial_id',
                            $lockedObservation->id
                        )
                        ->max('version_number')
                    + 1;

                $now = now();

                $version =
                    TestimonialVersion::query()
                        ->create([
                            'testimonial_id' =>
                                $lockedObservation->id,

                            'version_number' =>
                                $versionNumber,

                            'submitted_snapshot' => [
                                'title' =>
                                    $lockedObservation
                                        ->title,

                                'observation' =>
                                    $lockedObservation
                                        ->observation,

                                'condition_symptom_text' =>
                                    $lockedObservation
                                        ->condition_symptom_text,

                                'duration_text' =>
                                    $lockedObservation
                                        ->duration_text,

                                'frequency_text' =>
                                    $lockedObservation
                                        ->frequency_text,

                                'timeline_text' =>
                                    $lockedObservation
                                        ->timeline_text,

                                'practitioner_note' =>
                                    null,

                                'submission_type' =>
                                    'contributor',

                                'practitioner_id' =>
                                    null,

                                'client_id' =>
                                    null,

                                'client_reference' =>
                                    null,
                            ],

                            'submitted_by_user_id' =>
                                $request->user()->id,

                            'submitted_at' =>
                                $now,

                            /*
                             * Contributor is submitting
                             * their own observation.
                             */
                            'client_consent_id' =>
                                null,
                        ]);

                foreach (
                    self::ACKNOWLEDGEMENTS
                    as $statementCode
                => $statementText
                ) {
                    TestimonialConsent::query()
                        ->create([
                            'version_id' =>
                                $version->id,

                            'accepted_by_user_id' =>
                                $request->user()->id,

                            'statement_code' =>
                                $statementCode,

                            'statement_version' =>
                                self::ACKNOWLEDGEMENT_VERSION,

                            'statement_text' =>
                                $statementText,

                            'accepted_at' =>
                                $now,
                        ]);
                }

                $lockedObservation->update([
                    'status' =>
                        'pending_review',

                    'latest_version_id' =>
                        $version->id,

                    'submitted_at' =>
                        $now,

                    'archived_by_user_id' =>
                        null,

                    'archived_at' =>
                        null,
                ]);

                $action =
                    $versionNumber === 1
                        ? 'submitted'
                        : 'resubmitted';

                TestimonialReview::query()
                    ->create([
                        'testimonial_id' =>
                            $lockedObservation->id,

                        'version_id' =>
                            $version->id,

                        'actor_user_id' =>
                            $request->user()->id,

                        'action' =>
                            $action,

                        'from_status' =>
                            $fromStatus,

                        'to_status' =>
                            'pending_review',

                        'acted_at' =>
                            $now,
                    ]);

                AuditLog::query()->create([
                    'actor_user_id' =>
                        $request->user()->id,

                    'action' =>
                        "contributor_observation.{$action}",

                    'subject_type' =>
                        Testimonial::class,

                    'subject_id' =>
                        $lockedObservation->id,

                    'old_values' => [
                        'status' =>
                            $fromStatus,
                    ],

                    'new_values' => [
                        'status' =>
                            'pending_review',

                        'latest_version_id' =>
                            $version->id,
                    ],

                    'metadata' => [
                        'version_id' =>
                            $version->id,

                        'version_number' =>
                            $versionNumber,

                        'submission_type' =>
                            'contributor',

                        'acknowledgement_codes' =>
                            array_keys(
                                self::ACKNOWLEDGEMENTS
                            ),
                    ],

                    'request_id' =>
                        (string) Str::uuid(),

                    'occurred_at' =>
                        $now,
                ]);
            }
        );

        return to_route(
            'my.observations.edit',
            $observationRecord->id
        )->with(
            'success',
            $wasResubmission
                ? 'Observation resubmitted for review successfully.'
                : 'Observation submitted for review successfully.'
        );
    }

    public function archive(
        Request $request,
        int $observation
    ): RedirectResponse {
        $observationRecord =
            $this->findOwnedObservation(
                $request,
                $observation
            );

        DB::transaction(
            function () use (
                $request,
                $observationRecord
            ): void {
                $lockedObservation =
                    Testimonial::query()
                        ->whereKey(
                            $observationRecord->id
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                $this->ensureOwnedObservation(
                    $request,
                    $lockedObservation
                );

                abort_unless(
                    $lockedObservation->status
                    === 'draft',
                    409,
                    'Only a draft observation can be archived.'
                );

                $now = now();

                $lockedObservation->update([
                    'status' =>
                        'archived',

                    'archived_by_user_id' =>
                        $request->user()->id,

                    'archived_at' =>
                        $now,
                ]);

                TestimonialReview::query()
                    ->create([
                        'testimonial_id' =>
                            $lockedObservation->id,

                        'version_id' =>
                            $lockedObservation
                                ->latest_version_id,

                        'actor_user_id' =>
                            $request->user()->id,

                        'action' =>
                            'archived',

                        'from_status' =>
                            'draft',

                        'to_status' =>
                            'archived',

                        'acted_at' =>
                            $now,
                    ]);

                AuditLog::query()->create([
                    'actor_user_id' =>
                        $request->user()->id,

                    'action' =>
                        'contributor_observation.archived',

                    'subject_type' =>
                        Testimonial::class,

                    'subject_id' =>
                        $lockedObservation->id,

                    'old_values' => [
                        'status' => 'draft',
                    ],

                    'new_values' => [
                        'status' => 'archived',
                    ],

                    'metadata' => [
                        'submission_type' =>
                            'contributor',
                    ],

                    'request_id' =>
                        (string) Str::uuid(),

                    'occurred_at' =>
                        $now,
                ]);
            }
        );

        return to_route(
            'my.observations.index'
        )->with(
            'success',
            'Observation archived successfully.'
        );
    }

    public function restore(
        Request $request,
        int $observation
    ): RedirectResponse {
        $observationRecord =
            $this->findOwnedObservation(
                $request,
                $observation
            );

        DB::transaction(
            function () use (
                $request,
                $observationRecord
            ): void {
                $lockedObservation =
                    Testimonial::query()
                        ->whereKey(
                            $observationRecord->id
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                $this->ensureOwnedObservation(
                    $request,
                    $lockedObservation
                );

                abort_unless(
                    $lockedObservation->status
                    === 'archived'
                    && (int) $lockedObservation
                        ->archived_by_user_id
                    === (int) $request
                        ->user()
                        ->id,
                    409,
                    'This archived observation cannot be restored by you.'
                );

                $now = now();

                $lockedObservation->update([
                    'status' => 'draft',

                    'archived_by_user_id' =>
                        null,

                    'archived_at' =>
                        null,
                ]);

                TestimonialReview::query()
                    ->create([
                        'testimonial_id' =>
                            $lockedObservation->id,

                        'version_id' =>
                            $lockedObservation
                                ->latest_version_id,

                        'actor_user_id' =>
                            $request->user()->id,

                        'action' =>
                            'restored',

                        'from_status' =>
                            'archived',

                        'to_status' =>
                            'draft',

                        'acted_at' =>
                            $now,
                    ]);

                AuditLog::query()->create([
                    'actor_user_id' =>
                        $request->user()->id,

                    'action' =>
                        'contributor_observation.restored',

                    'subject_type' =>
                        Testimonial::class,

                    'subject_id' =>
                        $lockedObservation->id,

                    'old_values' => [
                        'status' =>
                            'archived',
                    ],

                    'new_values' => [
                        'status' =>
                            'draft',
                    ],

                    'metadata' => [
                        'submission_type' =>
                            'contributor',
                    ],

                    'request_id' =>
                        (string) Str::uuid(),

                    'occurred_at' =>
                        $now,
                ]);
            }
        );

        return to_route(
            'my.observations.edit',
            $observationRecord->id
        )->with(
            'success',
            'Observation restored successfully.'
        );
    }

    private function formProps(
        Request $request,
        ?Testimonial $observation = null
    ): array {
        $latestFeedback = null;

        if (
            $observation
            && in_array(
                $observation->status,
                [
                    'changes_requested',
                    'rejected',
                ],
                true
            )
        ) {
            $feedback =
                TestimonialReview::query()
                    ->where(
                        'testimonial_id',
                        $observation->id
                    )
                    ->whereNotNull(
                        'review_comment'
                    )
                    ->latest('acted_at')
                    ->latest('id')
                    ->first();

            if ($feedback) {
                $latestFeedback = [
                    'review_comment' =>
                        $feedback->review_comment,

                    'acted_at' =>
                        $feedback
                            ->acted_at
                            ?->toIso8601String(),
                ];
            }
        }

        $h2ResearchOptions =
            $this->h2ResearchOptions();

        return [
            'observation' =>
                $observation
                    ? $this->formObservation(
                    $observation,
                    $request
                )
                    : null,

            'self_patient' => [
                'name' =>
                    $request->user()->name,

                'email' =>
                    $request->user()->email,
            ],

            'latestFeedback' =>
                $latestFeedback,

            'h2research_options' =>
                $h2ResearchOptions,

            'h2research_mappings' =>
                $this->currentH2ResearchMappings(
                    $observation,
                    $h2ResearchOptions
                ),

            'acknowledgements' =>
                collect(
                    self::ACKNOWLEDGEMENTS
                )
                    ->map(
                        fn (
                            string $text,
                            string $code
                        ): array => [
                            'code' =>
                                $code,

                            'version' =>
                                self::ACKNOWLEDGEMENT_VERSION,

                            'text' =>
                                $text,
                        ]
                    )
                    ->values(),
        ];
    }

    private function validateDraft(
        Request $request
    ): array {
        $validated =
            $request->validate([
                'title' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'observation' => [
                    'nullable',
                    'string',
                ],

                'condition_symptom_text' => [
                    'nullable',
                    'string',
                    'max:500',
                ],

                'duration_text' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'frequency_text' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'timeline_text' => [
                    'nullable',
                    'string',
                ],

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
            self::H2_MAPPING_FIELDS
            as $field => $config
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
            self::H2_MAPPING_FIELDS
            as $field => $config
        ) {
            $result[$field] = $items
                ->where(
                    'source',
                    $config['source']
                )
                ->map(
                    fn ($item): array => [
                        'id' =>
                            (int) $item
                                ->external_id,

                        'name' =>
                            (string) $item
                                ->name,
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
            self::H2_MAPPING_FIELDS
            as $field => $config
        ) {
            $result[$field] = [];
        }

        if (! $observation) {
            return $result;
        }

        foreach (
            self::H2_MAPPING_FIELDS
            as $field => $config
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
                    fn ($id): int =>
                    (int) $id
                )
                ->values();

            $availableOptions =
                collect(
                    $h2ResearchOptions[
                    $field
                    ] ?? []
                )->keyBy('id');

            $result[$field] =
                $ids
                    ->map(
                        function (
                            int $id
                        ) use (
                            $availableOptions
                        ): array {
                            $option =
                                $availableOptions
                                    ->get($id);

                            return [
                                'id' => $id,

                                'name' =>
                                    $option['name']
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
        $selectedFields =
            collect(
                array_keys(
                    self::H2_MAPPING_FIELDS
                )
            )->filter(
                fn (
                    string $field
                ): bool =>
                ! empty(
                    $validated[
                    $field
                    ] ?? []
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
            $firstField =
                (string) $selectedFields
                    ->first();

            throw ValidationException::withMessages([
                $firstField =>
                    'H2Research reference data is not available. Please ask an administrator to sync H2Research first.',
            ]);
        }

        $errors = [];

        foreach (
            self::H2_MAPPING_FIELDS
            as $field => $config
        ) {
            $ids = collect(
                $validated[$field] ?? []
            )
                ->map(
                    fn ($id): int =>
                    (int) $id
                )
                ->unique()
                ->values();

            if ($ids->isEmpty()) {
                continue;
            }

            $validIds =
                DB::connection(
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
                                ): string =>
                                (string) $id
                            )
                            ->all()
                    )
                    ->where(
                        function ($query): void {
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
                        fn ($id): int =>
                        (int) $id
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
            self::H2_MAPPING_FIELDS
            as $field => $config
        ) {
            if (
                ! array_key_exists(
                    $field,
                    $validated
                )
            ) {
                continue;
            }

            $selectedIds =
                collect(
                    $validated[$field]
                    ?? []
                )
                    ->map(
                        fn ($id): int =>
                        (int) $id
                    )
                    ->unique()
                    ->values();

            $existingIds =
                DB::table(
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
                        fn ($id): int =>
                        (int) $id
                    )
                    ->unique()
                    ->values();

            $idsToDelete =
                $existingIds
                    ->diff($selectedIds)
                    ->values();

            if (
                $idsToDelete->isNotEmpty()
            ) {
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

            $idsToInsert =
                $selectedIds
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
                            'testimonial_id' =>
                                $testimonialId,

                            $config['column'] =>
                                $id,

                            'created_by_user_id' =>
                                $userId,

                            'created_at' =>
                                $now,

                            'updated_at' =>
                                $now,
                        ]
                    )
                    ->all()
            );
        }
    }

    private function ownedObservations(
        Request $request
    ): Builder {
        return Testimonial::query()
            ->where(
                'author_user_id',
                $request->user()->id
            )
            ->where(
                'submission_type',
                'contributor'
            );
    }

    private function findOwnedObservation(
        Request $request,
        int $observation
    ): Testimonial {
        return $this
            ->ownedObservations($request)
            ->whereKey($observation)
            ->firstOrFail();
    }

    private function ensureOwnedObservation(
        Request $request,
        Testimonial $observation
    ): void {
        abort_unless(
            $observation->submission_type
            === 'contributor'
            && (int) $observation
                ->author_user_id
            === (int) $request
                ->user()
                ->id,
            404
        );
    }

    private function formObservation(
        Testimonial $observation,
        Request $request
    ): array {
        $status =
            (string) $observation->status;

        return [
            'id' =>
                $observation->id,

            'title' =>
                $observation->title,

            'observation' =>
                $observation->observation,

            'condition_symptom_text' =>
                $observation
                    ->condition_symptom_text,

            'duration_text' =>
                $observation->duration_text,

            'frequency_text' =>
                $observation->frequency_text,

            'timeline_text' =>
                $observation->timeline_text,

            'status' =>
                $status,

            'status_label' =>
                $this->statusLabel(
                    $status
                ),

            'updated_at' =>
                $observation
                    ->updated_at
                    ?->toIso8601String(),

            'can_edit' =>
                in_array(
                    $status,
                    [
                        'draft',
                        'changes_requested',
                    ],
                    true
                ),

            'can_submit' =>
                in_array(
                    $status,
                    [
                        'draft',
                        'changes_requested',
                    ],
                    true
                ),

            'can_archive' =>
                $status === 'draft',

            'can_restore' =>
                $status === 'archived'
                && (int) $observation
                    ->archived_by_user_id
                === (int) $request
                    ->user()
                    ->id,
        ];
    }

    private function statusLabel(
        string $status
    ): string {
        return ucwords(
            str_replace(
                '_',
                ' ',
                $status
            )
        );
    }
}
