<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Models\TestimonialReview;
use App\Models\TestimonialVersion;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerObservationHistoryController extends Controller
{
    private const PERMISSION = 'practitioner_observations.review';

    private const REQUIRED_ACKNOWLEDGEMENTS = [
        'information_accurate',
        'deidentified_observations',
        'not_medical_claims',
        'review_before_publication',
        'changes_may_be_requested',
    ];

    private const SNAPSHOT_FIELDS = [
        'title' => 'Title',
        'condition_symptom_text' => 'Condition / Symptom',
        'duration_text' => 'Duration',
        'frequency_text' => 'Frequency',
        'timeline_text' => 'Timeline',
        'observation' => 'Observation',
        'practitioner_note' => 'Practitioner Note',
        'client_reference' => 'Patient Reference',
    ];

    private const COMPARISON_FIELDS = [
        'title' => 'Title',
        'condition_symptom_text' => 'Condition / Symptom',
        'duration_text' => 'Duration',
        'frequency_text' => 'Frequency',
        'timeline_text' => 'Timeline',
        'observation' => 'Observation',
    ];

    public function show(Request $request, Testimonial $observation): Response
    {
        $this->ensurePermission($request);
        $this->ensurePractitionerObservation($observation);

        $observation->load([
            'practitioner:id,user_id,professional_title,verification_status',
            'practitioner.user:id,name,email',
            'client:id,practitioner_id,client_reference,status',
            'flagger:id,name,email',
        ]);

        $versionRecords = TestimonialVersion::query()
            ->where('testimonial_id', $observation->id)
            ->with([
                'submittedBy:id,name,email',
                'approvedBy:id,name,email',
                'clientConsent:id,client_id,recorded_by_user_id,action,statement_version,statement_text,occurred_at',
                'clientConsent.recordedBy:id,name,email',
                'consents',
                'consents.acceptedBy:id,name,email',
            ])
            ->orderBy('version_number')
            ->get();

        $previousSnapshot = null;

        $versions = $versionRecords->map(function (TestimonialVersion $version) use (
            &$previousSnapshot,
            $observation
        ): array {
            $submittedSnapshot = $this->snapshotValues($version->submitted_snapshot);

            $approvedSnapshot = $version->approved_snapshot
                ? $this->snapshotValues($version->approved_snapshot)
                : null;

            $changesFromPrevious = $previousSnapshot === null
                ? []
                : $this->compareSnapshots($previousSnapshot, $submittedSnapshot);

            $approvalChanges = $approvedSnapshot === null
                ? []
                : $this->compareSnapshots($submittedSnapshot, $approvedSnapshot);

            $previousSnapshot = $submittedSnapshot;

            $acceptedCodes = $version->consents
                ->pluck('statement_code')
                ->unique()
                ->values()
                ->all();

            $missingCodes = array_values(
                array_diff(
                    self::REQUIRED_ACKNOWLEDGEMENTS,
                    $acceptedCodes
                )
            );

            return [
                'id' => $version->id,
                'version_number' => $version->version_number,

                'is_latest' =>
                    (int) $observation->latest_version_id
                    === (int) $version->id,

                'submitted_by' => $version->submittedBy
                    ? [
                        'id' => $version->submittedBy->id,
                        'name' => $version->submittedBy->name,
                        'email' => $version->submittedBy->email,
                    ]
                    : null,

                'submitted_at' =>
                    $version->submitted_at?->toIso8601String(),

                'approved_by' => $version->approvedBy
                    ? [
                        'id' => $version->approvedBy->id,
                        'name' => $version->approvedBy->name,
                        'email' => $version->approvedBy->email,
                    ]
                    : null,

                'approved_at' =>
                    $version->approved_at?->toIso8601String(),

                'is_approved' =>
                    $version->approved_at !== null
                    && $version->approved_snapshot !== null,

                'submitted_snapshot' =>
                    $this->snapshotFields($submittedSnapshot),

                'approved_snapshot' =>
                    $approvedSnapshot
                        ? $this->snapshotFields($approvedSnapshot)
                        : [],

                'changes_from_previous' =>
                    $changesFromPrevious,

                'approval_changes' =>
                    $approvalChanges,

                'client_consent' => $version->clientConsent
                    ? [
                        'id' => $version->clientConsent->id,
                        'action' => $version->clientConsent->action,
                        'statement_version' =>
                            $version->clientConsent->statement_version,
                        'statement_text' =>
                            $version->clientConsent->statement_text,
                        'occurred_at' =>
                            $version->clientConsent
                                ->occurred_at
                                ?->toIso8601String(),

                        'recorded_by' =>
                            $version->clientConsent->recordedBy
                                ? [
                                'id' =>
                                    $version
                                        ->clientConsent
                                        ->recordedBy
                                        ->id,

                                'name' =>
                                    $version
                                        ->clientConsent
                                        ->recordedBy
                                        ->name,

                                'email' =>
                                    $version
                                        ->clientConsent
                                        ->recordedBy
                                        ->email,
                            ]
                                : null,
                    ]
                    : null,

                'acknowledgements' =>
                    $version->consents
                        ->sortBy('id')
                        ->map(fn ($consent): array => [
                            'id' => $consent->id,

                            'statement_code' =>
                                $consent->statement_code,

                            'statement_version' =>
                                $consent->statement_version,

                            'statement_text' =>
                                $consent->statement_text,

                            'accepted_at' =>
                                $consent
                                    ->accepted_at
                                    ?->toIso8601String(),

                            'accepted_by' =>
                                $consent->acceptedBy
                                    ? [
                                    'id' =>
                                        $consent
                                            ->acceptedBy
                                            ->id,

                                    'name' =>
                                        $consent
                                            ->acceptedBy
                                            ->name,

                                    'email' =>
                                        $consent
                                            ->acceptedBy
                                            ->email,
                                ]
                                    : null,
                        ])
                        ->values(),

                'acknowledgement_complete' =>
                    $missingCodes === [],

                'acknowledgement_count' =>
                    count($acceptedCodes),

                'required_acknowledgement_count' =>
                    count(self::REQUIRED_ACKNOWLEDGEMENTS),

                'missing_acknowledgement_codes' =>
                    $missingCodes,
            ];
        })
            ->sortByDesc('version_number')
            ->values();

        $reviews = TestimonialReview::query()
            ->where('testimonial_id', $observation->id)
            ->with([
                'actor:id,name,email',
                'version:id,version_number',
            ])
            ->orderByDesc('acted_at')
            ->orderByDesc('id')
            ->get();

        $reviewChecks = $reviews
            ->filter(function (TestimonialReview $review): bool {
                return in_array(
                    $review->action,
                    [
                        'changes_requested',
                        'approved',
                        'rejected',
                        'archived',
                    ],
                    true
                );
            })
            ->map(
                fn (TestimonialReview $review): array =>
                $this->reviewRow($review)
            )
            ->values();

        $flagHistory = $reviews
            ->filter(
                fn (TestimonialReview $review): bool =>
                in_array(
                    $review->action,
                    ['flagged', 'flag_resolved'],
                    true
                )
            )
            ->map(
                fn (TestimonialReview $review): array =>
                $this->reviewRow($review)
            )
            ->values();

        return Inertia::render(
            'admin/review-practitioner-observations/history',
            [
                'observation' => [
                    'id' => $observation->id,
                    'title' => $observation->title,
                    'status' => $observation->status,
                    'status_label' =>
                        $this->statusLabel(
                            (string) $observation->status
                        ),

                    'latest_version_id' =>
                        $observation->latest_version_id,

                    'submitted_at' =>
                        $observation
                            ->submitted_at
                            ?->toIso8601String(),

                    'updated_at' =>
                        $observation
                            ->updated_at
                            ?->toIso8601String(),

                    'flagged_for_admin' =>
                        (bool) $observation->flagged_for_admin,

                    'flagged_at' =>
                        $observation
                            ->flagged_at
                            ?->toIso8601String(),

                    'flagged_by' =>
                        $observation->flagger
                            ? [
                            'id' =>
                                $observation
                                    ->flagger
                                    ->id,

                            'name' =>
                                $observation
                                    ->flagger
                                    ->name,

                            'email' =>
                                $observation
                                    ->flagger
                                    ->email,
                        ]
                            : null,
                ],

                'practitioner' => [
                    'id' =>
                        $observation
                            ->practitioner
                            ?->id,

                    'name' =>
                        $observation
                            ->practitioner
                            ?->user
                            ?->name,

                    'email' =>
                        $observation
                            ->practitioner
                            ?->user
                            ?->email,

                    'professional_title' =>
                        $observation
                            ->practitioner
                            ?->professional_title,

                    'verification_status' =>
                        $observation
                            ->practitioner
                            ?->verification_status,
                ],

                'patient' => [
                    'id' =>
                        $observation
                            ->client
                            ?->id,

                    'client_reference' =>
                        $observation
                            ->client
                            ?->client_reference,

                    'status' =>
                        $observation
                            ->client
                            ?->status,
                ],

                'versions' => $versions,
                'reviewChecks' => $reviewChecks,
                'flagHistory' => $flagHistory,
            ]
        );
    }

    private function reviewRow(
        TestimonialReview $review
    ): array {
        return [
            'id' => $review->id,
            'action' => $review->action,
            'from_status' => $review->from_status,
            'to_status' => $review->to_status,

            'review_comment' =>
                $review->review_comment,

            'internal_note' =>
                $review->internal_note,

            'condition_check' =>
                $review->condition_check,

            'observation_language_check' =>
                $review->observation_language_check,

            'deidentification_check' =>
                $review->deidentification_check,

            'consent_check' =>
                $review->consent_check,

            'publication_check' =>
                $review->publication_check,

            'acted_at' =>
                $review
                    ->acted_at
                    ?->toIso8601String(),

            'actor' =>
                $review->actor
                    ? [
                    'id' =>
                        $review->actor->id,

                    'name' =>
                        $review->actor->name,

                    'email' =>
                        $review->actor->email,
                ]
                    : null,

            'version_number' =>
                $review
                    ->version
                    ?->version_number,
        ];
    }

    private function snapshotValues(
        ?array $snapshot
    ): array {
        $values = [];

        foreach (
            self::SNAPSHOT_FIELDS
            as $key => $label
        ) {
            $values[$key] =
                $this->normalizeValue(
                    $snapshot[$key] ?? null
                );
        }

        return $values;
    }

    private function snapshotFields(
        array $snapshot
    ): array {
        $fields = [];

        foreach (
            self::SNAPSHOT_FIELDS
            as $key => $label
        ) {
            $fields[] = [
                'key' => $key,
                'label' => $label,
                'value' =>
                    $snapshot[$key] ?? null,
            ];
        }

        return $fields;
    }

    private function compareSnapshots(
        array $before,
        array $after
    ): array {
        $changes = [];

        foreach (
            self::COMPARISON_FIELDS
            as $key => $label
        ) {
            $beforeValue =
                $before[$key] ?? null;

            $afterValue =
                $after[$key] ?? null;

            if (
                $beforeValue === $afterValue
            ) {
                continue;
            }

            $changes[] = [
                'key' => $key,
                'label' => $label,
                'before' => $beforeValue,
                'after' => $afterValue,
            ];
        }

        return $changes;
    }

    private function normalizeValue(
        mixed $value
    ): ?string {
        if (
            $value === null
            || $value === ''
        ) {
            return null;
        }

        if (is_bool($value)) {
            return $value
                ? 'Yes'
                : 'No';
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        return json_encode(
            $value,
            JSON_UNESCAPED_UNICODE
            | JSON_UNESCAPED_SLASHES
        ) ?: null;
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

    private function ensurePermission(
        Request $request
    ): void {
        abort_unless(
            $request->user()
            && Rbac::hasPermission(
                $request->user()->id,
                self::PERMISSION
            ),
            403
        );
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
