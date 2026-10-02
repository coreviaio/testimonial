<?php

namespace App\Services\Frontend;

use App\Models\Testimonial;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PublicContentService
{
    public function homeData(): array
    {
        $latestObservations = $this->latestObservations();

        return [
            'stats' => $this->stats(),
            'latestObservations' => $latestObservations,
            'heroObservation' => $latestObservations->first(),
            'topics' => $this->popularTopics(),
            'researchReferences' => $this->researchReferences(),
        ];
    }

    public function observationsData(array $filters): array
    {
        $query = $this->publicQuery();

        $search = trim(
            (string) ($filters['search'] ?? '')
        );

        $conditionId =
            $filters['condition'] ?? null;

        $methodId =
            $filters['method'] ?? null;

        $topicId =
            $filters['topic'] ?? null;

        $contributors = array_values(
            array_unique(
                $filters['contributors'] ?? []
            )
        );

        $sort =
            ($filters['sort'] ?? 'newest') === 'oldest'
                ? 'oldest'
                : 'newest';

        if ($search !== '') {
            $this->applySearch(
                $query,
                $search
            );
        }

        if ($conditionId) {
            $this->whereMappedTo(
                $query,
                'testimonial_diseases',
                'disease_id',
                (int) $conditionId
            );
        }

        if ($methodId) {
            $this->whereMappedTo(
                $query,
                'testimonial_administration_methods',
                'administration_method_id',
                (int) $methodId
            );
        }

        if ($topicId) {
            $this->whereMappedTo(
                $query,
                'testimonial_research_topics',
                'research_topic_id',
                (int) $topicId
            );
        }

        if (
            $contributors !== []
            && count($contributors) < 2
        ) {
            $databaseTypes = collect(
                $contributors
            )
                ->map(
                    fn (
                        string $type
                    ): string => $type === 'community'
                        ? 'contributor'
                        : 'practitioner'
                )
                ->all();

            $query->whereIn(
                'submission_type',
                $databaseTypes
            );
        }

        $sortExpression = '
            COALESCE(
                testimonials.published_at,

                (
                    SELECT testimonial_versions.approved_at
                    FROM testimonial_versions
                    WHERE testimonial_versions.id = testimonials.latest_version_id
                    LIMIT 1
                ),

                testimonials.updated_at,

                testimonials.created_at
            )
        ';

        $query->orderByRaw(
            $sort === 'oldest'
                ? "{$sortExpression} ASC"
                : "{$sortExpression} DESC"
        );

        $query->orderBy(
            'testimonials.id',
            $sort === 'oldest'
                ? 'asc'
                : 'desc'
        );

        $paginator = $query
            ->with([
                'latestVersion:id,testimonial_id,approved_snapshot,approved_at',
            ])
            ->paginate(6)
            ->withQueryString();

        $cards = $this->mapObservationCards(
            collect(
                $paginator->items()
            )
        );

        return [
            'observations' => [
                'data' => $cards
                    ->values()
                    ->all(),

                'currentPage' => $paginator
                    ->currentPage(),

                'lastPage' => $paginator
                    ->lastPage(),

                'perPage' => $paginator
                    ->perPage(),

                'total' => $paginator
                    ->total(),

                'from' => $paginator
                    ->firstItem(),

                'to' => $paginator
                    ->lastItem(),
            ],

            'filters' => [
                'search' => $search,

                'condition' => $conditionId
                        ? (string) $conditionId
                        : '',

                'method' => $methodId
                        ? (string) $methodId
                        : '',

                'topic' => $topicId
                        ? (string) $topicId
                        : '',

                'contributors' => $contributors,

                'sort' => $sort,
            ],

            'filterOptions' => [
                'conditions' => $this
                    ->filterOptions(
                        'testimonial_diseases',
                        'disease_id',
                        'disease'
                    )
                    ->all(),

                'methods' => $this
                    ->filterOptions(
                        'testimonial_administration_methods',
                        'administration_method_id',
                        'administration_method'
                    )
                    ->all(),

                'topics' => $this
                    ->filterOptions(
                        'testimonial_research_topics',
                        'research_topic_id',
                        'research_topic'
                    )
                    ->all(),
            ],
        ];
    }

    public function observationDetail(
        string $identifier
    ): array {
        $query = $this
            ->publicQuery()

            ->with([
                'latestVersion:id,testimonial_id,approved_snapshot,approved_at',

                'practitioner:id,verification_status,show_identity_publicly,public_display_name,public_professional_description',
            ]);

        if (
            ctype_digit(
                $identifier
            )
        ) {
            $query->whereKey(
                (int) $identifier
            );
        } else {
            $query->where(
                'slug',
                $identifier
            );
        }

        /** @var Testimonial $observation */
        $observation = $query
            ->firstOrFail([
                'id',
                'submission_type',
                'practitioner_id',
                'slug',
                'latest_version_id',
                'published_at',
                'public_display_note',
                'updated_at',
                'created_at',
            ]);

        $snapshot =
            $observation
                ->latestVersion
                ?->approved_snapshot
            ?? [];

        $title = trim(
            (string) (
                $snapshot['title']
                ?? ''
            )
        );

        $observationText = trim(
            (string) (
                $snapshot['observation']
                ?? ''
            )
        );

        $conditionText = trim(
            (string) (
                $snapshot[
                'condition_symptom_text'
                ]
                ?? ''
            )
        );

        $durationText = trim(
            (string) (
                $snapshot[
                'duration_text'
                ]
                ?? ''
            )
        );

        $frequencyText = trim(
            (string) (
                $snapshot[
                'frequency_text'
                ]
                ?? ''
            )
        );

        $timelineText = trim(
            (string) (
                $snapshot[
                'timeline_text'
                ]
                ?? ''
            )
        );

        $displayDate =
            $observation
                ->published_at
                ?->toIso8601String()

            ?? $observation
                ->latestVersion
                ?->approved_at
                ?->toIso8601String()

            ?? $observation
                ->updated_at
                ?->toIso8601String()

            ?? $observation
                ->created_at
                ?->toIso8601String();

        $isPractitioner =
            $observation
                ->submission_type
            === 'practitioner';

        $isVerifiedPractitioner =
            $isPractitioner
            && $observation
                ->practitioner
                ?->verification_status
            === 'approved';

        $showPractitionerIdentity =
            $isVerifiedPractitioner
            && $observation
                ->practitioner
                ?->show_identity_publicly
            && filled(
                $observation
                    ->practitioner
                    ?->public_display_name
            );

        $contributorLabel =
            $isPractitioner
                ? (
                    $showPractitionerIdentity
                        ? $observation
                            ->practitioner
                            ->public_display_name
                        : 'Verified practitioner'
                )
                : 'Community contributor';

        $researchTopics =
            $this->mappedReferenceItems(
                $observation->id,
                'testimonial_research_topics',
                'research_topic_id',
                'research_topic',
                'research-topic'
            );

        $conditions =
            $this->mappedReferenceItems(
                $observation->id,
                'testimonial_diseases',
                'disease_id',
                'disease',
                'condition'
            );

        $methods =
            $this->mappedReferenceItems(
                $observation->id,
                'testimonial_administration_methods',
                'administration_method_id',
                'administration_method',
                'method'
            );

        $organs =
            $this->mappedReferenceItems(
                $observation->id,
                'testimonial_organs',
                'organ_id',
                'organ',
                'organ'
            );

        $biomarkers =
            $this->mappedReferenceItems(
                $observation->id,
                'testimonial_biomarkers',
                'biomarker_id',
                'biomarker',
                'biomarker'
            );

        $topics = collect()
            ->concat(
                $researchTopics
            )
            ->concat(
                $conditions
            )
            ->concat(
                $methods
            )
            ->concat(
                $organs
            )
            ->concat(
                $biomarkers
            )
            ->unique(
                fn (
                    array $item
                ): string => $item['type']
                    .'-'
                    .$item['id']
            )
            ->take(6)
            ->values();

        $researchReferences =
            $this->observationResearchReferences(
                $observation->id
            );

        $relatedObservations =
            $this->relatedObservations(
                $observation->id
            );

        return [
            'id' => $observation->id,

            'slug' => $observation->slug,

            'title' => $title !== ''
                    ? $title
                    : 'Untitled observation',

            /*
             * There is no dedicated summary column
             * in your current schema, so use a short
             * excerpt from the approved observation.
             */
            'summary' => $observationText !== ''
                    ? Str::limit(
                        preg_replace(
                            '/\s+/',
                            ' ',
                            strip_tags(
                                $observationText
                            )
                        ),
                        180
                    )
                    : null,

            'observation' => $observationText !== ''
                    ? $observationText
                    : null,

            'conditionText' => $conditionText !== ''
                    ? $conditionText
                    : null,

            'durationText' => $durationText !== ''
                    ? $durationText
                    : null,

            'frequencyText' => $frequencyText !== ''
                    ? $frequencyText
                    : null,

            'timelineText' => $timelineText !== ''
                    ? $timelineText
                    : null,

            /*
             * Do NOT expose practitioner_note.
             *
             * public_display_note is the explicitly
             * public field available in the schema.
             */
            'publicDisplayNote' => filled(
                $observation
                    ->public_display_note
            )
                    ? $observation
                        ->public_display_note
                    : null,

            'contributorType' => $isPractitioner
                    ? 'practitioner'
                    : 'community',

            'contributorLabel' => $contributorLabel,

            'isVerifiedPractitioner' => $isVerifiedPractitioner,

            'publishedAt' => $displayDate,

            'topics' => $topics->all(),

            'methods' => $methods->all(),

            'researchReferences' => $researchReferences->all(),

            'relatedObservations' => $relatedObservations->all(),
        ];
    }

    public function topicsData(array $filters): array
    {
        $config = $this->topicDirectoryConfig();

        $category = (string) (
            $filters['category']
            ?? 'condition'
        );

        if (! isset($config[$category])) {
            $category = 'condition';
        }

        $search = trim(
            (string) (
                $filters['search']
                ?? ''
            )
        );

        $letter = strtoupper(
            trim(
                (string) (
                    $filters['letter']
                    ?? ''
                )
            )
        );

        if (
            $letter !== ''
            && ! preg_match(
                '/^[A-Z]$/',
                $letter
            )
        ) {
            $letter = '';
        }

        $requestedPage = max(
            1,
            (int) (
                $filters['page']
                ?? 1
            )
        );

        /*
         * Load every supported category once.
         *
         * These queries return only grouped public topic IDs/counts,
         * not full private observations.
         */
        $allCategories = collect();

        foreach (
            array_keys($config) as $categoryKey
        ) {
            $allCategories->put(
                $categoryKey,
                $this->topicDirectoryItems(
                    $categoryKey
                )
            );
        }

        /** @var Collection $items */
        $items = $allCategories->get(
            $category,
            collect()
        );

        /*
         * Search topic/reference names.
         */
        if ($search !== '') {
            $searchLower = mb_strtolower(
                $search
            );

            $items = $items
                ->filter(
                    fn (array $item): bool => str_contains(
                        mb_strtolower(
                            $item['name']
                        ),
                        $searchLower
                    )
                )
                ->values();
        }

        /*
         * Available letters are calculated after search,
         * but before applying the current letter filter.
         */
        $availableLetters = $items
            ->map(
                function (
                    array $item
                ): string {
                    return strtoupper(
                        mb_substr(
                            ltrim(
                                $item['name']
                            ),
                            0,
                            1
                        )
                    );
                }
            )
            ->filter(
                fn (string $value): bool => (bool) preg_match(
                    '/^[A-Z]$/',
                    $value
                )
            )
            ->unique()
            ->sort()
            ->values();

        if ($letter !== '') {
            $items = $items
                ->filter(
                    fn (array $item): bool => strtoupper(
                        mb_substr(
                            ltrim(
                                $item['name']
                            ),
                            0,
                            1
                        )
                    ) === $letter
                )
                ->values();
        }

        $items = $items
            ->sortBy(
                fn (array $item): string => mb_strtolower(
                    $item['name']
                )
            )
            ->values();

        $perPage = 18;

        $total = $items->count();

        $lastPage = max(
            1,
            (int) ceil(
                $total / $perPage
            )
        );

        $currentPage = min(
            $requestedPage,
            $lastPage
        );

        $offset =
            ($currentPage - 1)
            * $perPage;

        $pageItems = $items
            ->slice(
                $offset,
                $perPage
            )
            ->values();

        $from =
            $total > 0
                ? $offset + 1
                : null;

        $to =
            $total > 0
                ? min(
                    $offset + $perPage,
                    $total
                )
                : null;

        $categories = collect(
            $config
        )
            ->map(
                function (
                    array $categoryConfig,
                    string $key
                ) use (
                    $allCategories
                ): array {
                    return [
                        'value' => $key,

                        'label' => $categoryConfig[
                            'label'
                            ],

                        'count' => $allCategories
                            ->get(
                                $key,
                                collect()
                            )
                            ->count(),
                    ];
                }
            )
            ->values();

        return [
            'topics' => [
                'data' => $pageItems->all(),

                'currentPage' => $currentPage,

                'lastPage' => $lastPage,

                'perPage' => $perPage,

                'total' => $total,

                'from' => $from,

                'to' => $to,
            ],

            'filters' => [
                'category' => $category,

                'search' => $search,

                'letter' => $letter,
            ],

            'categories' => $categories->all(),

            'availableLetters' => $availableLetters->all(),

            'researchReferences' => $this
                ->topicDirectoryResearchReferences()
                ->all(),
        ];
    }

    public function topicDetailData(
        string $type,
        int $topicId,
        array $filters
    ): array {
        $config = $this->topicDirectoryConfig();

        abort_unless(
            isset($config[$type]),
            404
        );

        $topicConfig =
            $config[$type];

        $topicName =
            $this->referenceName(
                $topicConfig['source'],
                $topicId
            );

        abort_unless(
            $topicName,
            404
        );

        /*
         * The topic must contain at least one
         * publicly eligible observation.
         *
         * Do not expose empty/private reference IDs.
         */
        $baseCollectionCount =
            $this
                ->topicCollectionQuery(
                    $type,
                    $topicId
                )
                ->count();

        abort_if(
            $baseCollectionCount === 0,
            404
        );

        $methodId =
            isset(
                $filters['method']
            )
            && $filters['method']
                ? (int)
            $filters['method']
                : null;

        $contributor =
            $filters['contributor']
            ?? null;

        $sort =
            ($filters['sort'] ?? 'newest')
            === 'oldest'
                ? 'oldest'
                : 'newest';

        $view =
            ($filters['view'] ?? 'preview')
            === 'all'
                ? 'all'
                : 'preview';

        $page = max(
            1,
            (int) (
                $filters['page']
                ?? 1
            )
        );

        $observationQuery =
            $this->topicCollectionQuery(
                $type,
                $topicId
            );

        /*
         * Optional administration-method filter.
         *
         * Hide this control in the frontend when the
         * current collection itself is already a method.
         */
        if (
            $methodId
            && $type !== 'method'
        ) {
            $this->whereMappedTo(
                $observationQuery,
                'testimonial_administration_methods',
                'administration_method_id',
                $methodId
            );
        }

        /*
         * Contributor filter.
         */
        if (
            $contributor
            === 'community'
        ) {
            $observationQuery->where(
                'submission_type',
                'contributor'
            );
        }

        if (
            $contributor
            === 'practitioner'
        ) {
            $observationQuery->where(
                'submission_type',
                'practitioner'
            );
        }

        $sortExpression = '
        COALESCE(
            testimonials.published_at,

            (
                SELECT testimonial_versions.approved_at

                FROM testimonial_versions

                WHERE testimonial_versions.id = testimonials.latest_version_id

                LIMIT 1
            ),

            testimonials.updated_at,

            testimonials.created_at
        )
    ';

        $observationQuery
            ->orderByRaw(
                $sort === 'oldest'
                    ? "{$sortExpression} ASC"
                    : "{$sortExpression} DESC"
            )

            ->orderBy(
                'testimonials.id',
                $sort === 'oldest'
                    ? 'asc'
                    : 'desc'
            )

            ->with([
                'latestVersion:id,testimonial_id,approved_snapshot,approved_at',
            ]);

        /*
         * Preview:
         * exactly 4 cards like the design.
         *
         * View all:
         * 12 observations per page on this same page.
         */
        if ($view === 'all') {
            $paginator =
                $observationQuery

                    ->paginate(
                        12,
                        [
                            'id',
                            'submission_type',
                            'slug',
                            'latest_version_id',
                            'published_at',
                            'updated_at',
                            'created_at',
                        ],
                        'page',
                        $page
                    )

                    ->withQueryString();

            $observationCards =
                $this->mapObservationCards(
                    collect(
                        $paginator->items()
                    )
                );

            $observations = [
                'data' => $observationCards
                    ->values()
                    ->all(),

                'currentPage' => $paginator
                    ->currentPage(),

                'lastPage' => $paginator
                    ->lastPage(),

                'perPage' => $paginator
                    ->perPage(),

                'total' => $paginator
                    ->total(),

                'from' => $paginator
                    ->firstItem(),

                'to' => $paginator
                    ->lastItem(),
            ];
        } else {
            $total =
                (clone $observationQuery)
                    ->reorder()
                    ->count();

            $records =
                $observationQuery

                    ->limit(4)

                    ->get([
                        'id',
                        'submission_type',
                        'slug',
                        'latest_version_id',
                        'published_at',
                        'updated_at',
                        'created_at',
                    ]);

            $observationCards =
                $this->mapObservationCards(
                    $records
                );

            $observations = [
                'data' => $observationCards
                    ->values()
                    ->all(),

                'currentPage' => 1,

                'lastPage' => 1,

                'perPage' => 4,

                'total' => $total,

                'from' => $total > 0
                        ? 1
                        : null,

                'to' => $total > 0
                        ? min(
                            4,
                            $total
                        )
                        : null,
            ];
        }

        $practitionerContributors =
            $this
                ->topicCollectionQuery(
                    $type,
                    $topicId
                )

                ->where(
                    'submission_type',
                    'practitioner'
                )

                ->whereNotNull(
                    'practitioner_id'
                )

                ->distinct()

                ->count(
                    'practitioner_id'
                );

        $linkedResearchArticles =
            DB::table(
                'testimonial_articles'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->topicCollectionQuery(
                            $type,
                            $topicId
                        )

                        ->select(
                            'testimonials.id'
                        )
                )

                ->distinct()

                ->count(
                    'article_id'
                );

        $methodOptions =
            $type === 'method'
                ? collect()
                : $this->topicMethodOptions(
                    $type,
                    $topicId
                );

        $researchReferences =
            $this->topicResearchReferences(
                $type,
                $topicId
            );

        $relatedTopics =
            $this->relatedTopicsForCollection(
                $type,
                $topicId
            );

        $viewAllQuery = [
            'view' => 'all',

            'sort' => $sort,
        ];

        if ($methodId) {
            $viewAllQuery['method'] =
                $methodId;
        }

        if ($contributor) {
            $viewAllQuery[
            'contributor'
            ] = $contributor;
        }

        $viewAllUrl =
            route(
                'frontend.topics.show',
                [
                    'type' => $type,

                    'topic' => $topicId,

                    ...$viewAllQuery,
                ]
            )
            .'#topic-observations';

        return [
            'topic' => [
                'id' => $topicId,

                'type' => $type,

                'categoryLabel' => $topicConfig[
                    'singular_label'
                    ],

                'name' => $topicName,

                /*
                 * Your H2 reference cache currently gives
                 * us the reference name, not a verified
                 * editorial description.
                 *
                 * This is neutral template copy rather
                 * than a fabricated medical definition.
                 */
                'introduction' => $this->topicIntroduction(
                    $type,
                    $topicName
                ),

                'observationCount' => $baseCollectionCount,

                'practitionerContributors' => $practitionerContributors,

                'linkedResearchArticles' => $linkedResearchArticles,
            ],

            'observations' => $observations,

            'filters' => [
                'method' => $methodId
                    ? (string)
                $methodId
                    : '',

                'contributor' => $contributor
                ?? '',

                'sort' => $sort,

                'view' => $view,
            ],

            'filterOptions' => [
                'methods' => $methodOptions
                    ->all(),
            ],

            'researchReferences' => $researchReferences
                ->all(),

            'relatedTopics' => $relatedTopics
                ->all(),

            'viewAllUrl' => $viewAllUrl,
        ];
    }

    public function insightsData(
        string $range = 'all'
    ): array {
        $scope =
            $this->insightsRange(
                $range
            );

        $query =
            $this->insightsScopedQuery(
                $scope
            );

        $stats =
            $this->insightsStats(
                $query
            );

        $linkedResearchArticles =
            collect(
                $stats
            )
                ->firstWhere(
                    'key',
                    'linkedResearchArticles'
                )['value']
            ?? 0;

        return [
            'range' => $scope['value'],

            'scopeLabel' => $scope['label'],

            'rangeOptions' => [
                [
                    'value' => 'all',

                    'label' => 'All time',
                ],

                [
                    'value' => '6m',

                    'label' => 'Last 6 months',
                ],

                [
                    'value' => '12m',

                    'label' => 'Last 12 months',
                ],

                [
                    'value' => 'year',

                    'label' => 'This year',
                ],
            ],

            'stats' => $stats,

            'monthlyPublications' => $this
                ->insightsMonthlyPublications(
                    $query,
                    $scope
                )
                ->all(),

            'topics' => $this
                ->insightsTopTopics(
                    $query
                )
                ->all(),

            'contributionTypes' => $this
                ->insightsContributionTypes(
                    $query
                ),

            'administrationMethods' => $this
                ->insightsAdministrationMethods(
                    $query
                )
                ->all(),

            'researchConnections' => [
                'linkedResearchArticles' => (int)
                    $linkedResearchArticles,
            ],
        ];
    }

    public function referenceApprovedObservationsData(
        string $type,
        int $referenceId
    ): array {
        $config = $this->referenceObservationConfig();

        abort_unless(
            isset($config[$type]),
            404,
            'Unsupported reference type.'
        );

        $referenceConfig = $config[$type];

        /*
         * Make sure the requested H2Research item
         * actually exists in our SQLite cache.
         */
        $referenceName = $this->referenceName(
            $referenceConfig['source'],
            $referenceId
        );

        abort_if(
            $referenceName === null,
            404,
            'Reference item not found.'
        );

        /*
         * IMPORTANT:
         *
         * publicQuery() already makes sure:
         *
         * - observation is approved/published
         * - observation is not archived
         * - observation is not flagged
         * - approved_snapshot exists
         * - practitioner requirements are valid
         * - patient consent requirements are valid
         */
        $query = $this
            ->publicQuery()
            ->with([
                'latestVersion:id,testimonial_id,approved_snapshot,approved_at',
            ]);

        /*
         * Example:
         *
         * organ + 12
         *
         * becomes:
         *
         * testimonial_organs.organ_id = 12
         */
        $this->whereMappedTo(
            $query,
            $referenceConfig['table'],
            $referenceConfig['column'],
            $referenceId
        );

        /*
         * Keep the same date priority used by
         * your existing public frontend.
         */
        $sortExpression = '
        COALESCE(
            testimonials.published_at,

            (
                SELECT testimonial_versions.approved_at
                FROM testimonial_versions
                WHERE testimonial_versions.id = testimonials.latest_version_id
                LIMIT 1
            ),

            testimonials.updated_at,
            testimonials.created_at
        )
    ';

        $paginator = $query
            ->orderByRaw("{$sortExpression} DESC")
            ->orderByDesc('testimonials.id')
            ->paginate(12);

        $observations = collect(
            $paginator->items()
        );

        /*
         * Load all H2Research mappings for the
         * 12 observations in batches.
         *
         * This avoids doing 6 queries individually
         * for every observation.
         */
        $mappings = $this->referenceMappingsForTestimonials(
            $observations
                ->pluck('id')
                ->map(
                    fn ($id): int => (int) $id
                )
                ->all()
        );

        $data = $observations
            ->map(
                function (
                    Testimonial $observation
                ) use (
                    $mappings
                ): array {
                    /*
                     * ONLY approved data.
                     *
                     * Do not use:
                     *
                     * $observation->title
                     * $observation->observation
                     * etc.
                     *
                     * because those fields may later
                     * contain editable data.
                     */
                    $snapshot = (array) (
                        $observation
                            ->latestVersion
                            ?->approved_snapshot
                        ?? []
                    );

                    return [
                        'id' => $observation->id,

                        'slug' => $observation->slug,

                        'status' => $observation->status,

                        'submission_type' => $snapshot['submission_type']
                            ?? $observation->submission_type,

                        /*
                         * These are the actual approved
                         * Observation Details fields.
                         */
                        'title' => $snapshot['title']
                            ?? null,

                        'condition_symptom_text' => $snapshot['condition_symptom_text']
                            ?? null,

                        'duration_text' => $snapshot['duration_text']
                            ?? null,

                        'frequency_text' => $snapshot['frequency_text']
                            ?? null,

                        'timeline_text' => $snapshot['timeline_text']
                            ?? null,

                        'observation' => $snapshot['observation']
                            ?? null,

                        /*
                         * practitioner_note is intentionally
                         * NOT exposed here.
                         *
                         * Your existing project marks this
                         * as an internal practitioner note.
                         */

                        'approved_at' => $observation
                            ->latestVersion
                            ?->approved_at
                            ?->toIso8601String(),

                        'published_at' => $observation
                            ->published_at
                            ?->toIso8601String(),

                        /*
                         * Every H2Research relation attached
                         * to this observation.
                         */
                        'h2research_mappings' => $mappings[$observation->id]
                            ?? $this->emptyReferenceMappings(),
                    ];
                }
            )
            ->values()
            ->all();

        return [
            'reference' => [
                'id' => $referenceId,

                'type' => $type,

                'name' => $referenceName,
            ],

            'observations' => [
                'data' => $data,

                'current_page' => $paginator->currentPage(),

                'last_page' => $paginator->lastPage(),

                'per_page' => $paginator->perPage(),

                'total' => $paginator->total(),

                'from' => $paginator->firstItem(),

                'to' => $paginator->lastItem(),

                'next_page_url' => $paginator->nextPageUrl(),

                'previous_page_url' => $paginator->previousPageUrl(),
            ],
        ];
    }

    public function publicQuery(): Builder
    {
        return Testimonial::query()

            /*
             * Your current workflow makes approved
             * observations public.
             *
             * published is also accepted for future use.
             */
            ->whereIn(
                'status',
                [
                    'approved',
                    'published',
                ]
            )

            ->whereNull(
                'archived_at'
            )

            ->where(
                'flagged_for_admin',
                false
            )

            /*
             * Do not expose editable/raw content.
             * Only an approved snapshot is public.
             */
            ->whereHas(
                'latestVersion',

                function (
                    Builder $query
                ): void {
                    $query->whereNotNull(
                        'approved_snapshot'
                    );
                }
            )

            ->where(
                function (
                    Builder $query
                ): void {
                    /*
                     * Community contribution.
                     */
                    $query
                        ->where(
                            'submission_type',
                            'contributor'
                        )

                        /*
                         * Practitioner contribution.
                         */
                        ->orWhere(
                            function (
                                Builder $query
                            ): void {
                                $query
                                    ->where(
                                        'submission_type',
                                        'practitioner'
                                    )

                                    ->whereNotNull(
                                        'practitioner_id'
                                    )

                                    ->whereNotNull(
                                        'client_id'
                                    )

                                    /*
                                     * Practitioner must
                                     * remain approved.
                                     */
                                    ->whereHas(
                                        'practitioner',

                                        function (
                                            Builder $query
                                        ): void {
                                            $query->where(
                                                'verification_status',
                                                'approved'
                                            );
                                        }
                                    )

                                    /*
                                     * Latest patient consent
                                     * must be confirmed.
                                     */
                                    ->whereRaw(
                                        '
                                        (
                                            SELECT client_consents.action

                                            FROM client_consents

                                            WHERE client_consents.client_id = testimonials.client_id

                                            ORDER BY
                                                client_consents.occurred_at DESC,
                                                client_consents.id DESC

                                            LIMIT 1
                                        ) = ?
                                        ',
                                        [
                                            'confirmed',
                                        ]
                                    );
                            }
                        );
                }
            );
    }

    private function stats(): array
    {
        $publishedObservations =
            $this
                ->publicQuery()
                ->count();

        $practitionerContributors =
            $this
                ->publicQuery()

                ->where(
                    'submission_type',
                    'practitioner'
                )

                ->whereNotNull(
                    'practitioner_id'
                )

                ->distinct()

                ->count(
                    'practitioner_id'
                );

        $conditionsRepresented =
            DB::table(
                'testimonial_diseases'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->publicQuery()
                        ->select(
                            'testimonials.id'
                        )
                )

                ->distinct()

                ->count(
                    'disease_id'
                );

        $linkedResearchArticles =
            DB::table(
                'testimonial_articles'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->publicQuery()
                        ->select(
                            'testimonials.id'
                        )
                )

                ->distinct()

                ->count(
                    'article_id'
                );

        return [
            [
                'key' => 'publishedObservations',

                'value' => $publishedObservations,

                'label' => 'Published observations',
            ],

            [
                'key' => 'practitionerContributors',

                'value' => $practitionerContributors,

                'label' => 'Practitioner contributors',
            ],

            [
                'key' => 'conditionsRepresented',

                'value' => $conditionsRepresented,

                'label' => 'Conditions represented',
            ],

            [
                'key' => 'linkedResearchArticles',

                'value' => $linkedResearchArticles,

                'label' => 'Linked research articles',
            ],
        ];
    }

    private function latestObservations(): Collection
    {
        $observations =
            $this
                ->publicQuery()

                ->with([
                    'latestVersion:id,testimonial_id,approved_snapshot,approved_at',
                ])

                ->orderByRaw(
                    '
                    COALESCE(
                        testimonials.published_at,

                        (
                            SELECT testimonial_versions.approved_at

                            FROM testimonial_versions

                            WHERE testimonial_versions.id = testimonials.latest_version_id

                            LIMIT 1
                        ),

                        testimonials.updated_at,

                        testimonials.created_at
                    ) DESC
                    '
                )

                ->orderByDesc(
                    'testimonials.id'
                )

                ->limit(3)

                ->get([
                    'id',
                    'submission_type',
                    'slug',
                    'latest_version_id',
                    'published_at',
                    'updated_at',
                    'created_at',
                ]);

        return $this->mapObservationCards(
            $observations
        );
    }

    private function mapObservationCards(
        Collection $observations
    ): Collection {
        $testimonialIds =
            $observations

                ->pluck(
                    'id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $topicLabels =
            $this->topicLabelsFor(
                $testimonialIds
            );

        return $observations

            ->map(
                function (
                    Testimonial $observation
                ) use (
                    $topicLabels
                ): array {
                    $snapshot =
                        $observation
                            ->latestVersion
                            ?->approved_snapshot
                        ?? [];

                    $title =
                        trim(
                            (string) (
                                $snapshot['title']
                                ?? ''
                            )
                        );

                    $body =
                        trim(
                            (string) (
                                $snapshot['observation']
                                ?? ''
                            )
                        );

                    $displayDate =
                        $observation
                            ->published_at
                            ?->toIso8601String()

                        ?? $observation
                            ->latestVersion
                            ?->approved_at
                            ?->toIso8601String()

                        ?? $observation
                            ->updated_at
                            ?->toIso8601String()

                        ?? $observation
                            ->created_at
                            ?->toIso8601String();

                    return [
                        'id' => $observation->id,

                        'slug' => $observation->slug,

                        'title' => $title !== ''
                                ? $title
                                : 'Untitled observation',

                        'excerpt' => $body !== ''
                                ? Str::limit(
                                    preg_replace(
                                        '/\s+/',
                                        ' ',
                                        strip_tags(
                                            $body
                                        )
                                    ),
                                    165
                                )
                                : null,

                        'topic' => $topicLabels->get(
                            $observation->id
                        ),

                        'contributorType' => $observation
                            ->submission_type
                            === 'practitioner'
                                ? 'practitioner'
                                : 'community',

                        'publishedAt' => $displayDate,

                        /*
                         * Detail page is the next page.
                         * Do not create a dead link yet.
                         */
                        'url' => route(
                            'frontend.observations.show',
                            [
                                'observation' => $observation->slug
                                        ?: $observation->id,
                            ]
                        ),
                    ];
                }
            )

            ->values();
    }

    private function popularTopics(): Collection
    {
        if (
            ! Schema::hasTable(
                'testimonial_research_topics'
            )
        ) {
            return collect();
        }

        $rows =
            DB::table(
                'testimonial_research_topics'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->publicQuery()
                        ->select(
                            'testimonials.id'
                        )
                )

                ->select(
                    'research_topic_id'
                )

                ->selectRaw(
                    '
                    COUNT(
                        DISTINCT testimonial_id
                    ) AS observation_count
                    '
                )

                ->groupBy(
                    'research_topic_id'
                )

                ->orderByDesc(
                    'observation_count'
                )

                ->orderBy(
                    'research_topic_id'
                )

                ->limit(6)

                ->get();

        $ids =
            $rows

                ->pluck(
                    'research_topic_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $names =
            $this->referenceNames(
                'research_topic',
                $ids
            );

        return $rows

            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->research_topic_id;

                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'type' => 'research-topic',

                        'name' => $name,

                        'observationCount' => (int)
                            $row
                                ->observation_count,

                        'url' => route(
                            'frontend.topics.show',
                            [
                                'type' => 'research-topic',

                                'topic' => $id,
                            ]
                        ),
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function researchReferences(): Collection
    {
        if (
            ! Schema::hasTable(
                'testimonial_articles'
            )
        ) {
            return collect();
        }

        $rows =
            DB::table(
                'testimonial_articles'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->publicQuery()
                        ->select(
                            'testimonials.id'
                        )
                )

                ->select(
                    'article_id'
                )

                ->selectRaw(
                    '
                    COUNT(
                        DISTINCT testimonial_id
                    ) AS observation_count
                    '
                )

                ->groupBy(
                    'article_id'
                )

                ->orderByDesc(
                    'observation_count'
                )

                ->orderBy(
                    'article_id'
                )

                ->limit(2)

                ->get();

        $ids =
            $rows

                ->pluck(
                    'article_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $names =
            $this->referenceNames(
                'article',
                $ids
            );

        return $rows

            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->article_id;

                    $title =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $title) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'title' => $title,

                        'observationCount' => (int)
                            $row
                                ->observation_count,

                        'url' => null,
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function applySearch(
        Builder $query,
        string $search
    ): void {
        $needle =
            '%'
            .mb_strtolower(
                $search
            )
            .'%';

        $diseaseIds =
            $this->searchReferenceIds(
                'disease',
                $search
            );

        $methodIds =
            $this->searchReferenceIds(
                'administration_method',
                $search
            );

        $topicIds =
            $this->searchReferenceIds(
                'research_topic',
                $search
            );

        $query->where(
            function (
                Builder $query
            ) use (
                $needle,
                $diseaseIds,
                $methodIds,
                $topicIds
            ): void {
                /*
                 * Search approved content.
                 */
                $query->whereHas(
                    'latestVersion',

                    function (
                        Builder $versionQuery
                    ) use (
                        $needle
                    ): void {
                        $versionQuery->where(
                            function (
                                Builder $snapshotQuery
                            ) use (
                                $needle
                            ): void {
                                $snapshotQuery

                                    ->whereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.title'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    )

                                    ->orWhereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.observation'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    )

                                    ->orWhereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.condition_symptom_text'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    )

                                    ->orWhereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.duration_text'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    )

                                    ->orWhereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.frequency_text'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    )

                                    ->orWhereRaw(
                                        "
                                        LOWER(
                                            COALESCE(
                                                JSON_UNQUOTE(
                                                    JSON_EXTRACT(
                                                        approved_snapshot,
                                                        '$.timeline_text'
                                                    )
                                                ),
                                                ''
                                            )
                                        ) LIKE ?
                                        ",
                                        [
                                            $needle,
                                        ]
                                    );
                            }
                        );
                    }
                );

                /*
                 * Search condition names.
                 */
                if (
                    $diseaseIds !== []
                ) {
                    $query->orWhereExists(
                        function (
                            $mappingQuery
                        ) use (
                            $diseaseIds
                        ): void {
                            $mappingQuery

                                ->selectRaw(
                                    '1'
                                )

                                ->from(
                                    'testimonial_diseases'
                                )

                                ->whereColumn(
                                    'testimonial_diseases.testimonial_id',
                                    'testimonials.id'
                                )

                                ->whereIn(
                                    'testimonial_diseases.disease_id',
                                    $diseaseIds
                                );
                        }
                    );
                }

                /*
                 * Search method names.
                 */
                if (
                    $methodIds !== []
                ) {
                    $query->orWhereExists(
                        function (
                            $mappingQuery
                        ) use (
                            $methodIds
                        ): void {
                            $mappingQuery

                                ->selectRaw(
                                    '1'
                                )

                                ->from(
                                    'testimonial_administration_methods'
                                )

                                ->whereColumn(
                                    'testimonial_administration_methods.testimonial_id',
                                    'testimonials.id'
                                )

                                ->whereIn(
                                    'testimonial_administration_methods.administration_method_id',
                                    $methodIds
                                );
                        }
                    );
                }

                /*
                 * Search research topic names.
                 */
                if (
                    $topicIds !== []
                ) {
                    $query->orWhereExists(
                        function (
                            $mappingQuery
                        ) use (
                            $topicIds
                        ): void {
                            $mappingQuery

                                ->selectRaw(
                                    '1'
                                )

                                ->from(
                                    'testimonial_research_topics'
                                )

                                ->whereColumn(
                                    'testimonial_research_topics.testimonial_id',
                                    'testimonials.id'
                                )

                                ->whereIn(
                                    'testimonial_research_topics.research_topic_id',
                                    $topicIds
                                );
                        }
                    );
                }
            }
        );
    }

    private function whereMappedTo(
        Builder $query,
        string $table,
        string $foreignIdColumn,
        int $externalId
    ): void {
        $query->whereExists(
            function (
                $mappingQuery
            ) use (
                $table,
                $foreignIdColumn,
                $externalId
            ): void {
                $mappingQuery

                    ->selectRaw(
                        '1'
                    )

                    ->from(
                        $table
                    )

                    ->whereColumn(
                        "{$table}.testimonial_id",
                        'testimonials.id'
                    )

                    ->where(
                        "{$table}.{$foreignIdColumn}",
                        $externalId
                    );
            }
        );
    }

    private function filterOptions(
        string $table,
        string $foreignIdColumn,
        string $source
    ): Collection {
        if (
            ! Schema::hasTable(
                $table
            )
        ) {
            return collect();
        }

        $ids =
            DB::table(
                $table
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->publicQuery()
                        ->select(
                            'testimonials.id'
                        )
                )

                ->distinct()

                ->pluck(
                    $foreignIdColumn
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->values();

        if (
            $ids->isEmpty()
        ) {
            return collect();
        }

        $names =
            $this->referenceNames(
                $source,
                $ids->all()
            );

        return $ids

            ->map(
                function (
                    int $id
                ) use (
                    $names
                ): ?array {
                    $label =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $label) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'label' => $label,
                    ];
                }
            )

            ->filter()

            ->sortBy(
                fn (
                    array $item
                ): string => mb_strtolower(
                    $item['label']
                )
            )

            ->values();
    }

    private function searchReferenceIds(
        string $source,
        string $search
    ): array {
        if (
            ! $this->referenceCacheIsAvailable()
        ) {
            return [];
        }

        return DB::connection(
            'h2research_cache'
        )

            ->table(
                'h2_reference_items'
            )

            ->where(
                'source',
                $source
            )

            ->where(
                'name',
                'like',
                '%'.$search.'%'
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
                            [
                                'deleted',
                            ]
                        );
                }
            )

            ->pluck(
                'external_id'
            )

            ->map(
                fn ($id): int => (int) $id
            )

            ->unique()

            ->values()

            ->all();
    }

    private function topicLabelsFor(
        array $testimonialIds
    ): Collection {
        if (
            $testimonialIds === []
        ) {
            return collect();
        }

        $labels =
            collect();

        $sources = [
            [
                'table' => 'testimonial_research_topics',

                'column' => 'research_topic_id',

                'source' => 'research_topic',
            ],

            [
                'table' => 'testimonial_diseases',

                'column' => 'disease_id',

                'source' => 'disease',
            ],

            [
                'table' => 'testimonial_administration_methods',

                'column' => 'administration_method_id',

                'source' => 'administration_method',
            ],
        ];

        foreach (
            $sources as $source
        ) {
            if (
                ! Schema::hasTable(
                    $source['table']
                )
            ) {
                continue;
            }

            $unresolvedIds =
                collect(
                    $testimonialIds
                )

                    ->reject(
                        fn (
                            int $testimonialId
                        ): bool => $labels->has(
                            $testimonialId
                        )
                    )

                    ->values();

            if (
                $unresolvedIds
                    ->isEmpty()
            ) {
                break;
            }

            $mappings =
                DB::table(
                    $source['table']
                )

                    ->whereIn(
                        'testimonial_id',
                        $unresolvedIds
                            ->all()
                    )

                    ->orderBy(
                        'id'
                    )

                    ->get([
                        'testimonial_id',
                        $source['column'],
                    ])

                    ->groupBy(
                        'testimonial_id'
                    )

                    ->map(
                        fn (
                            Collection $items
                        ) => $items->first()
                    );

            $referenceIds =
                $mappings

                    ->map(
                        fn (
                            $item
                        ): int => (int)
                        $item
                            ->{
                            $source[
                            'column'
                            ]
                            }
                    )

                    ->unique()

                    ->values()

                    ->all();

            $names =
                $this->referenceNames(
                    $source['source'],
                    $referenceIds
                );

            foreach (
                $mappings as $testimonialId => $mapping
            ) {
                $referenceId =
                    (int)
                    $mapping
                        ->{
                        $source[
                        'column'
                        ]
                        };

                $name =
                    $names->get(
                        (string)
                        $referenceId
                    )
                    ?? $names->get(
                        $referenceId
                    );

                if ($name) {
                    $labels->put(
                        (int)
                        $testimonialId,
                        $name
                    );
                }
            }
        }

        return $labels;
    }

    private function mappedReferenceItems(
        int $testimonialId,
        string $table,
        string $foreignIdColumn,
        string $source,
        string $type
    ): Collection {
        if (
            ! Schema::hasTable(
                $table
            )
        ) {
            return collect();
        }

        $ids = DB::table(
            $table
        )
            ->where(
                'testimonial_id',
                $testimonialId
            )

            ->pluck(
                $foreignIdColumn
            )

            ->map(
                fn ($id): int => (int) $id
            )

            ->unique()

            ->values();

        if (
            $ids->isEmpty()
        ) {
            return collect();
        }

        $names =
            $this->referenceNames(
                $source,
                $ids->all()
            );

        return $ids

            ->map(
                function (
                    int $id
                ) use (
                    $names,
                    $type
                ): ?array {
                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'type' => $type,

                        'name' => $name,

                        /*
                         * Topic detail pages are not
                         * built yet.
                         */
                        'url' => null,
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function observationResearchReferences(
        int $testimonialId
    ): Collection {
        if (
            ! Schema::hasTable(
                'testimonial_articles'
            )
        ) {
            return collect();
        }

        $articleIds =
            DB::table(
                'testimonial_articles'
            )

                ->where(
                    'testimonial_id',
                    $testimonialId
                )

                ->pluck(
                    'article_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->unique()

                ->values();

        if (
            $articleIds->isEmpty()
        ) {
            return collect();
        }

        $names =
            $this->referenceNames(
                'article',
                $articleIds->all()
            );

        return $articleIds

            ->map(
                function (
                    int $id
                ) use (
                    $names
                ): ?array {
                    $title =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $title) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'title' => $title,

                        /*
                         * The current H2 Research cache
                         * contains article ID + title,
                         * but not a verified public URL.
                         */
                        'url' => null,
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function relatedObservations(
        int $testimonialId
    ): Collection {
        $researchTopicIds =
            $this->mappedIds(
                $testimonialId,
                'testimonial_research_topics',
                'research_topic_id'
            );

        $diseaseIds =
            $this->mappedIds(
                $testimonialId,
                'testimonial_diseases',
                'disease_id'
            );

        $methodIds =
            $this->mappedIds(
                $testimonialId,
                'testimonial_administration_methods',
                'administration_method_id'
            );

        if (
            $researchTopicIds === []
            && $diseaseIds === []
            && $methodIds === []
        ) {
            return collect();
        }

        $query =
            $this
                ->publicQuery()

                ->where(
                    'testimonials.id',
                    '<>',
                    $testimonialId
                )

                ->where(
                    function (
                        Builder $query
                    ) use (
                        $researchTopicIds,
                        $diseaseIds,
                        $methodIds
                    ): void {
                        $hasCondition =
                            false;

                        if (
                            $researchTopicIds
                            !== []
                        ) {
                            $query
                                ->whereExists(
                                    function (
                                        $mappingQuery
                                    ) use (
                                        $researchTopicIds
                                    ): void {
                                        $mappingQuery

                                            ->selectRaw(
                                                '1'
                                            )

                                            ->from(
                                                'testimonial_research_topics'
                                            )

                                            ->whereColumn(
                                                'testimonial_research_topics.testimonial_id',
                                                'testimonials.id'
                                            )

                                            ->whereIn(
                                                'testimonial_research_topics.research_topic_id',
                                                $researchTopicIds
                                            );
                                    }
                                );

                            $hasCondition =
                                true;
                        }

                        if (
                            $diseaseIds
                            !== []
                        ) {
                            $method =
                                $hasCondition
                                    ? 'orWhereExists'
                                    : 'whereExists';

                            $query->{$method}(
                                function (
                                    $mappingQuery
                                ) use (
                                    $diseaseIds
                                ): void {
                                    $mappingQuery

                                        ->selectRaw(
                                            '1'
                                        )

                                        ->from(
                                            'testimonial_diseases'
                                        )

                                        ->whereColumn(
                                            'testimonial_diseases.testimonial_id',
                                            'testimonials.id'
                                        )

                                        ->whereIn(
                                            'testimonial_diseases.disease_id',
                                            $diseaseIds
                                        );
                                }
                            );

                            $hasCondition =
                                true;
                        }

                        if (
                            $methodIds
                            !== []
                        ) {
                            $method =
                                $hasCondition
                                    ? 'orWhereExists'
                                    : 'whereExists';

                            $query->{$method}(
                                function (
                                    $mappingQuery
                                ) use (
                                    $methodIds
                                ): void {
                                    $mappingQuery

                                        ->selectRaw(
                                            '1'
                                        )

                                        ->from(
                                            'testimonial_administration_methods'
                                        )

                                        ->whereColumn(
                                            'testimonial_administration_methods.testimonial_id',
                                            'testimonials.id'
                                        )

                                        ->whereIn(
                                            'testimonial_administration_methods.administration_method_id',
                                            $methodIds
                                        );
                                }
                            );
                        }
                    }
                )

                ->with([
                    'latestVersion:id,testimonial_id,approved_snapshot,approved_at',
                ])

                ->orderByRaw(
                    '
                COALESCE(
                    testimonials.published_at,

                    (
                        SELECT testimonial_versions.approved_at

                        FROM testimonial_versions

                        WHERE testimonial_versions.id = testimonials.latest_version_id

                        LIMIT 1
                    ),

                    testimonials.updated_at,

                    testimonials.created_at
                ) DESC
                '
                )

                ->limit(3)

                ->get([
                    'id',
                    'submission_type',
                    'slug',
                    'latest_version_id',
                    'published_at',
                    'updated_at',
                    'created_at',
                ]);

        return $this
            ->mapObservationCards(
                $query
            );
    }

    private function mappedIds(
        int $testimonialId,
        string $table,
        string $foreignIdColumn
    ): array {
        if (
            ! Schema::hasTable(
                $table
            )
        ) {
            return [];
        }

        return DB::table(
            $table
        )
            ->where(
                'testimonial_id',
                $testimonialId
            )

            ->pluck(
                $foreignIdColumn
            )

            ->map(
                fn ($id): int => (int) $id
            )

            ->unique()

            ->values()

            ->all();
    }

    private function topicDirectoryConfig(): array
    {
        return [
            'condition' => [
                'label' => 'Conditions',

                'singular_label' => 'Condition',

                'table' => 'testimonial_diseases',

                'column' => 'disease_id',

                'source' => 'disease',

                'type' => 'condition',
            ],

            'organ' => [
                'label' => 'Organs',

                'singular_label' => 'Organ',

                'table' => 'testimonial_organs',

                'column' => 'organ_id',

                'source' => 'organ',

                'type' => 'organ',
            ],

            'method' => [
                'label' => 'Methods',

                'singular_label' => 'Administration method',

                'table' => 'testimonial_administration_methods',

                'column' => 'administration_method_id',

                'source' => 'administration_method',

                'type' => 'method',
            ],

            'research-topic' => [
                'label' => 'Research topics',

                'singular_label' => 'Research topic',

                'table' => 'testimonial_research_topics',

                'column' => 'research_topic_id',

                'source' => 'research_topic',

                'type' => 'research-topic',
            ],

            'biomarker' => [
                'label' => 'Biomarkers',

                'singular_label' => 'Biomarker',

                'table' => 'testimonial_biomarkers',

                'column' => 'biomarker_id',

                'source' => 'biomarker',

                'type' => 'biomarker',
            ],
        ];
    }

    private function topicDirectoryItems(
        string $category
    ): Collection {
        $config =
            $this->topicDirectoryConfig();

        if (! isset($config[$category])) {
            return collect();
        }

        $categoryConfig =
            $config[$category];

        $table =
            $categoryConfig['table'];

        $column =
            $categoryConfig['column'];

        $source =
            $categoryConfig['source'];

        $type =
            $categoryConfig['type'];

        if (
            ! Schema::hasTable(
                $table
            )
        ) {
            return collect();
        }

        /*
         * Count DISTINCT publicly eligible observations
         * attached to each topic/reference.
         */
        $rows = DB::table(
            $table
        )
            ->whereIn(
                'testimonial_id',

                $this
                    ->publicQuery()
                    ->select(
                        'testimonials.id'
                    )
            )

            ->select(
                $column
            )

            ->selectRaw(
                '
            COUNT(
                DISTINCT testimonial_id
            ) AS observation_count
            '
            )

            ->groupBy(
                $column
            )

            ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        $ids = $rows
            ->pluck(
                $column
            )
            ->map(
                fn ($id): int => (int) $id
            )
            ->unique()
            ->values()
            ->all();

        $names =
            $this->referenceNames(
                $source,
                $ids
            );

        return $rows
            ->map(
                function (
                    $row
                ) use (
                    $column,
                    $names,
                    $type
                ): ?array {
                    $id =
                        (int)
                        $row->{$column};

                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'type' => $type,

                        'name' => $name,

                        /*
                         * Current cache does not contain
                         * editorial topic descriptions.
                         */
                        'description' => null,

                        'observationCount' => (int)
                            $row
                                ->observation_count,

                        /*
                         * We will enable this when the
                         * next Topic Details page is built.
                         */
                        'url' => route(
                            'frontend.topics.show',
                            [
                                'type' => $type,

                                'topic' => $id,
                            ]
                        ),
                    ];
                }
            )
            ->filter()
            ->values();
    }

    private function topicDirectoryResearchReferences(): Collection
    {
        if (
            ! Schema::hasTable(
                'testimonial_articles'
            )
        ) {
            return collect();
        }

        $rows = DB::table(
            'testimonial_articles'
        )
            ->whereIn(
                'testimonial_id',

                $this
                    ->publicQuery()
                    ->select(
                        'testimonials.id'
                    )
            )

            ->select(
                'article_id'
            )

            ->selectRaw(
                '
            COUNT(
                DISTINCT testimonial_id
            ) AS observation_count
            '
            )

            ->groupBy(
                'article_id'
            )

            ->orderByDesc(
                'observation_count'
            )

            ->orderBy(
                'article_id'
            )

            ->limit(3)

            ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        $ids = $rows
            ->pluck(
                'article_id'
            )
            ->map(
                fn ($id): int => (int) $id
            )
            ->all();

        $names =
            $this->referenceNames(
                'article',
                $ids
            );

        return $rows
            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->article_id;

                    $title =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $title) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'title' => $title,

                        'observationCount' => (int)
                            $row
                                ->observation_count,

                        /*
                         * No verified H2 Research URL
                         * is stored in the current cache.
                         */
                        'url' => null,
                    ];
                }
            )
            ->filter()
            ->values();
    }

    private function topicCollectionQuery(
        string $type,
        int $topicId
    ): Builder {
        $config =
            $this->topicDirectoryConfig();

        abort_unless(
            isset($config[$type]),
            404
        );

        $topicConfig =
            $config[$type];

        $query =
            $this->publicQuery();

        $this->whereMappedTo(
            $query,
            $topicConfig['table'],
            $topicConfig['column'],
            $topicId
        );

        /*
         * Respect the placement controls already
         * available in your testimonials table.
         */
        if (
            $type === 'condition'
        ) {
            $query->where(
                'show_on_disease_pages',
                true
            );
        }

        if (
            $type === 'organ'
        ) {
            $query->where(
                'show_on_organ_pages',
                true
            );
        }

        return $query;
    }

    private function topicMethodOptions(
        string $type,
        int $topicId
    ): Collection {
        if (
            ! Schema::hasTable(
                'testimonial_administration_methods'
            )
        ) {
            return collect();
        }

        $ids =
            DB::table(
                'testimonial_administration_methods'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->topicCollectionQuery(
                            $type,
                            $topicId
                        )

                        ->select(
                            'testimonials.id'
                        )
                )

                ->distinct()

                ->pluck(
                    'administration_method_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $names =
            $this->referenceNames(
                'administration_method',
                $ids->all()
            );

        return $ids

            ->map(
                function (
                    int $id
                ) use (
                    $names
                ): ?array {
                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'label' => $name,
                    ];
                }
            )

            ->filter()

            ->sortBy(
                fn (
                    array $item
                ): string => mb_strtolower(
                    $item['label']
                )
            )

            ->values();
    }

    private function topicResearchReferences(
        string $type,
        int $topicId
    ): Collection {
        if (
            ! Schema::hasTable(
                'testimonial_articles'
            )
        ) {
            return collect();
        }

        $rows =
            DB::table(
                'testimonial_articles'
            )

                ->whereIn(
                    'testimonial_id',

                    $this
                        ->topicCollectionQuery(
                            $type,
                            $topicId
                        )

                        ->select(
                            'testimonials.id'
                        )
                )

                ->select(
                    'article_id'
                )

                ->selectRaw(
                    '
                COUNT(
                    DISTINCT testimonial_id
                ) AS observation_count
                '
                )

                ->groupBy(
                    'article_id'
                )

                ->orderByDesc(
                    'observation_count'
                )

                ->orderBy(
                    'article_id'
                )

                ->limit(3)

                ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        $ids =
            $rows

                ->pluck(
                    'article_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $names =
            $this->referenceNames(
                'article',
                $ids
            );

        return $rows

            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->article_id;

                    $title =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $title) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'title' => $title,

                        'observationCount' => (int)
                            $row
                                ->observation_count,

                        /*
                         * Your current cache has no verified
                         * public article URL.
                         */
                        'url' => null,
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function relatedTopicsForCollection(
        string $currentType,
        int $currentTopicId
    ): Collection {
        $config =
            $this->topicDirectoryConfig();

        $candidates =
            collect();

        foreach (
            $config as $type => $topicConfig
        ) {
            if (
                ! Schema::hasTable(
                    $topicConfig['table']
                )
            ) {
                continue;
            }

            $rows =
                DB::table(
                    $topicConfig['table']
                )

                    ->whereIn(
                        'testimonial_id',

                        $this
                            ->topicCollectionQuery(
                                $currentType,
                                $currentTopicId
                            )

                            ->select(
                                'testimonials.id'
                            )
                    )

                    ->when(
                        $type ===
                        $currentType,

                        function (
                            $query
                        ) use (
                            $topicConfig,
                            $currentTopicId
                        ): void {
                            $query->where(
                                $topicConfig[
                                'column'
                                ],
                                '<>',
                                $currentTopicId
                            );
                        }
                    )

                    ->select(
                        $topicConfig[
                        'column'
                        ]
                    )

                    ->selectRaw(
                        '
                    COUNT(
                        DISTINCT testimonial_id
                    ) AS overlap_count
                    '
                    )

                    ->groupBy(
                        $topicConfig[
                        'column'
                        ]
                    )

                    ->orderByDesc(
                        'overlap_count'
                    )

                    ->limit(5)

                    ->get();

            if ($rows->isEmpty()) {
                continue;
            }

            $ids =
                $rows

                    ->pluck(
                        $topicConfig[
                        'column'
                        ]
                    )

                    ->map(
                        fn ($id): int => (int) $id
                    )

                    ->unique()

                    ->values()

                    ->all();

            $names =
                $this->referenceNames(
                    $topicConfig[
                    'source'
                    ],
                    $ids
                );

            foreach (
                $rows as $row
            ) {
                $id =
                    (int)
                    $row
                        ->{
                        $topicConfig[
                        'column'
                        ]
                        };

                $name =
                    $names->get(
                        (string) $id
                    )
                    ?? $names->get(
                        $id
                    );

                if (! $name) {
                    continue;
                }

                $candidates->push([
                    'id' => $id,

                    'type' => $type,

                    'name' => $name,

                    'overlapCount' => (int)
                        $row
                            ->overlap_count,

                    'url' => route(
                        'frontend.topics.show',
                        [
                            'type' => $type,

                            'topic' => $id,
                        ]
                    ),
                ]);
            }
        }

        return $candidates

            ->sort(
                function (
                    array $first,
                    array $second
                ): int {
                    $overlapComparison =
                        $second[
                        'overlapCount'
                        ]
                        <=>
                        $first[
                        'overlapCount'
                        ];

                    if (
                        $overlapComparison
                        !== 0
                    ) {
                        return $overlapComparison;
                    }

                    return strcasecmp(
                        $first['name'],
                        $second['name']
                    );
                }
            )

            ->unique(
                fn (
                    array $item
                ): string => $item['type']
                    .'-'
                    .$item['id']
            )

            ->take(3)

            ->values();
    }

    private function referenceObservationConfig(): array
    {
        return [
            'disease' => [
                'source' => 'disease',

                'table' => 'testimonial_diseases',

                'column' => 'disease_id',

                'response_key' => 'diseases',
            ],

            'organ' => [
                'source' => 'organ',

                'table' => 'testimonial_organs',

                'column' => 'organ_id',

                'response_key' => 'organs',
            ],

            'administration-method' => [
                'source' => 'administration_method',

                'table' => 'testimonial_administration_methods',

                'column' => 'administration_method_id',

                'response_key' => 'administration_methods',
            ],

            'research-topic' => [
                'source' => 'research_topic',

                'table' => 'testimonial_research_topics',

                'column' => 'research_topic_id',

                'response_key' => 'research_topics',
            ],

            'biomarker' => [
                'source' => 'biomarker',

                'table' => 'testimonial_biomarkers',

                'column' => 'biomarker_id',

                'response_key' => 'biomarkers',
            ],

            'article' => [
                'source' => 'article',

                'table' => 'testimonial_articles',

                'column' => 'article_id',

                'response_key' => 'articles',
            ],
        ];
    }

    private function referenceName(
        string $source,
        int $externalId
    ): ?string {
        return $this
            ->referenceNames(
                $source,
                [
                    $externalId,
                ]
            )
            ->get(
                (string) $externalId
            );
    }

    private function topicIntroduction(
        string $type,
        string $name
    ): string {
        return match ($type) {
            'condition' => "Explore public observations connected to {$name}, alongside related research references.",

            'organ' => "Explore public observations mapped to {$name} and their related research connections.",

            'method' => "Explore public observations that include {$name} as an administration method.",

            'research-topic' => "Explore public observations connected to the research topic {$name}.",

            'biomarker' => "Explore public observations associated with {$name} and related research connections.",

            default => 'Explore public observations and related research connections.',
        };
    }

    private function emptyReferenceMappings(): array
    {
        return [
            'diseases' => [],
            'organs' => [],
            'administration_methods' => [],
            'research_topics' => [],
            'biomarkers' => [],
            'articles' => [],
        ];
    }

    private function referenceMappingsForTestimonials(
        array $testimonialIds
    ): array {
        if ($testimonialIds === []) {
            return [];
        }

        $result = [];

        foreach (
            $testimonialIds as $testimonialId
        ) {
            $result[
            (int) $testimonialId
            ] = $this->emptyReferenceMappings();
        }

        foreach (
            $this->referenceObservationConfig() as $config
        ) {
            if (
                ! Schema::hasTable(
                    $config['table']
                )
            ) {
                continue;
            }

            $rows = DB::table(
                $config['table']
            )
                ->whereIn(
                    'testimonial_id',
                    $testimonialIds
                )
                ->orderBy('id')
                ->get([
                    'testimonial_id',
                    $config['column'],
                ]);

            if ($rows->isEmpty()) {
                continue;
            }

            /*
             * Collect all external H2Research IDs
             * used by this page of observations.
             */
            $externalIds = $rows
                ->pluck(
                    $config['column']
                )
                ->map(
                    fn ($id): int => (int) $id
                )
                ->unique()
                ->values()
                ->all();

            /*
             * Resolve names from:
             *
             * storage/app/h2research.sqlite
             */
            $names = $this->referenceNames(
                $config['source'],
                $externalIds
            );

            foreach (
                $rows as $row
            ) {
                $testimonialId =
                    (int) $row->testimonial_id;

                $externalId =
                    (int) $row->{$config['column']};

                $result[
                $testimonialId
                ][
                $config['response_key']
                ][] = [
                    'id' => $externalId,

                    'name' => $names->get(
                        (string) $externalId
                    )
                        ?? $names->get(
                            $externalId
                        )
                            ?? "H2Research ID #{$externalId}",
                ];
            }
        }

        return $result;
    }

    private function insightsRange(
        string $range
    ): array {
        $now =
            now();

        return match ($range) {
            '6m' => [
                'value' => '6m',

                'label' => 'Last 6 months',

                'start' => $now
                    ->copy()
                    ->subMonths(5)
                    ->startOfMonth()
                    ->toDateTimeString(),

                'end' => $now
                    ->copy()
                    ->endOfDay()
                    ->toDateTimeString(),
            ],

            '12m' => [
                'value' => '12m',

                'label' => 'Last 12 months',

                'start' => $now
                    ->copy()
                    ->subMonths(11)
                    ->startOfMonth()
                    ->toDateTimeString(),

                'end' => $now
                    ->copy()
                    ->endOfDay()
                    ->toDateTimeString(),
            ],

            'year' => [
                'value' => 'year',

                'label' => 'This year',

                'start' => $now
                    ->copy()
                    ->startOfYear()
                    ->toDateTimeString(),

                'end' => $now
                    ->copy()
                    ->endOfDay()
                    ->toDateTimeString(),
            ],

            default => [
                'value' => 'all',

                'label' => 'All time',

                'start' => null,

                'end' => null,
            ],
        };
    }

    private function publicDateExpression(): string
    {
        return '
        COALESCE(
            testimonials.published_at,

            (
                SELECT insight_version.approved_at

                FROM testimonial_versions
                    AS insight_version

                WHERE insight_version.id =
                    testimonials.latest_version_id

                LIMIT 1
            ),

            testimonials.updated_at,

            testimonials.created_at
        )
    ';
    }

    private function insightsScopedQuery(
        array $scope
    ): Builder {
        $query =
            $this->publicQuery();

        $dateExpression =
            $this->publicDateExpression();

        if (
            $scope['start']
            !== null
        ) {
            $query->whereRaw(
                "{$dateExpression} >= ?",
                [
                    $scope['start'],
                ]
            );
        }

        if (
            $scope['end']
            !== null
        ) {
            $query->whereRaw(
                "{$dateExpression} <= ?",
                [
                    $scope['end'],
                ]
            );
        }

        return $query;
    }

    private function insightsStats(
        Builder $query
    ): array {
        $publishedObservations =
            (clone $query)
                ->distinct()
                ->count(
                    'testimonials.id'
                );

        $practitionerContributors =
            (clone $query)

                ->where(
                    'submission_type',
                    'practitioner'
                )

                ->whereNotNull(
                    'practitioner_id'
                )

                ->distinct()

                ->count(
                    'practitioner_id'
                );

        $conditionsRepresented =
            Schema::hasTable(
                'testimonial_diseases'
            )
                ? DB::table(
                    'testimonial_diseases'
                )
                    ->whereIn(
                        'testimonial_id',

                        (clone $query)
                            ->select(
                                'testimonials.id'
                            )
                    )
                    ->distinct()
                    ->count(
                        'disease_id'
                    )
                : 0;

        $linkedResearchArticles =
            Schema::hasTable(
                'testimonial_articles'
            )
                ? DB::table(
                    'testimonial_articles'
                )
                    ->whereIn(
                        'testimonial_id',

                        (clone $query)
                            ->select(
                                'testimonials.id'
                            )
                    )
                    ->distinct()
                    ->count(
                        'article_id'
                    )
                : 0;

        return [
            [
                'key' => 'publishedObservations',

                'value' => (int)
                    $publishedObservations,

                'label' => 'Published observations',
            ],

            [
                'key' => 'practitionerContributors',

                'value' => (int)
                    $practitionerContributors,

                'label' => 'Practitioner contributors',
            ],

            [
                'key' => 'conditionsRepresented',

                'value' => (int)
                    $conditionsRepresented,

                'label' => 'Conditions represented',
            ],

            [
                'key' => 'linkedResearchArticles',

                'value' => (int)
                    $linkedResearchArticles,

                'label' => 'Linked research articles',
            ],
        ];
    }

    private function insightsMonthlyPublications(
        Builder $query,
        array $scope
    ): Collection {
        $dateExpression =
            $this->publicDateExpression();

        /*
         * First create a derived table containing only:
         *
         * - observation id
         * - resolved public date
         *
         * We then group that simple derived result by month.
         *
         * This avoids MySQL ONLY_FULL_GROUP_BY problems caused
         * by grouping directly on the complex COALESCE/subquery.
         */
        $publicDatesQuery =
            (clone $query)

                ->reorder()

                ->select(
                    'testimonials.id'
                )

                ->selectRaw(
                    "{$dateExpression} AS public_date"
                );

        $rows =
            DB::query()

                ->fromSub(
                    $publicDatesQuery,
                    'public_observations'
                )

                ->whereNotNull(
                    'public_date'
                )

                ->selectRaw(
                    "
                DATE_FORMAT(
                    public_date,
                    '%Y-%m'
                ) AS month_key
                "
                )

                ->selectRaw(
                    '
                COUNT(
                    DISTINCT id
                ) AS total
                '
                )

                ->groupBy(
                    'month_key'
                )

                ->orderBy(
                    'month_key'
                )

                ->get();

        if (
            $rows->isEmpty()
        ) {
            return collect();
        }

        $counts =
            $rows->mapWithKeys(
                fn ($row): array => [
                    (string)
                    $row->month_key => (int)
                        $row->total,
                ]
            );

        if (
            $scope['start']
            !== null
        ) {
            $start =
                Carbon::parse(
                    $scope['start']
                )
                    ->startOfMonth();
        } else {
            $start =
                Carbon::createFromFormat(
                    'Y-m',
                    (string)
                    $rows
                        ->first()
                        ->month_key
                )
                    ->startOfMonth();
        }

        if (
            $scope['end']
            !== null
        ) {
            $end =
                Carbon::parse(
                    $scope['end']
                )
                    ->startOfMonth();
        } else {
            $end =
                Carbon::createFromFormat(
                    'Y-m',
                    (string)
                    $rows
                        ->last()
                        ->month_key
                )
                    ->startOfMonth();
        }

        $result =
            collect();

        $cursor =
            $start->copy();

        while (
            $cursor->lte(
                $end
            )
        ) {
            $monthKey =
                $cursor->format(
                    'Y-m'
                );

            $result->push([
                'month' => $monthKey,

                'label' => $cursor->format(
                    'M Y'
                ),

                'count' => (int) (
                    $counts->get(
                        $monthKey
                    )
                    ?? 0
                ),
            ]);

            $cursor->addMonth();
        }

        return $result;
    }

    private function insightsTopTopics(
        Builder $query
    ): Collection {
        if (
            ! Schema::hasTable(
                'testimonial_research_topics'
            )
        ) {
            return collect();
        }

        $rows =
            DB::table(
                'testimonial_research_topics'
            )

                ->whereIn(
                    'testimonial_id',

                    (clone $query)
                        ->select(
                            'testimonials.id'
                        )
                )

                ->select(
                    'research_topic_id'
                )

                ->selectRaw(
                    '
                COUNT(
                    DISTINCT testimonial_id
                ) AS observation_count
                '
                )

                ->groupBy(
                    'research_topic_id'
                )

                ->orderByDesc(
                    'observation_count'
                )

                ->orderBy(
                    'research_topic_id'
                )

                ->limit(5)

                ->get();

        if (
            $rows->isEmpty()
        ) {
            return collect();
        }

        $ids =
            $rows

                ->pluck(
                    'research_topic_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $names =
            $this->referenceNames(
                'research_topic',
                $ids
            );

        return $rows

            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->research_topic_id;

                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'name' => $name,

                        'count' => (int)
                            $row
                                ->observation_count,

                        'url' => route(
                            'frontend.topics.show',
                            [
                                'type' => 'research-topic',

                                'topic' => $id,
                            ]
                        ),
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function insightsContributionTypes(
        Builder $query
    ): array {
        $community =
            (clone $query)

                ->where(
                    'submission_type',
                    'contributor'
                )

                ->count();

        $practitioner =
            (clone $query)

                ->where(
                    'submission_type',
                    'practitioner'
                )

                ->count();

        return [
            'community' => (int)
                $community,

            'practitioner' => (int)
                $practitioner,

            'total' => (int) (
                $community
                + $practitioner
            ),
        ];
    }

    private function insightsAdministrationMethods(
        Builder $query
    ): Collection {
        if (
            ! Schema::hasTable(
                'testimonial_administration_methods'
            )
        ) {
            return collect();
        }

        $rows =
            DB::table(
                'testimonial_administration_methods'
            )

                ->whereIn(
                    'testimonial_id',

                    (clone $query)
                        ->select(
                            'testimonials.id'
                        )
                )

                ->select(
                    'administration_method_id'
                )

                ->selectRaw(
                    '
                COUNT(
                    DISTINCT testimonial_id
                ) AS observation_count
                '
                )

                ->groupBy(
                    'administration_method_id'
                )

                ->orderByDesc(
                    'observation_count'
                )

                ->orderBy(
                    'administration_method_id'
                )

                ->limit(6)

                ->get();

        if (
            $rows->isEmpty()
        ) {
            return collect();
        }

        $ids =
            $rows

                ->pluck(
                    'administration_method_id'
                )

                ->map(
                    fn ($id): int => (int) $id
                )

                ->all();

        $names =
            $this->referenceNames(
                'administration_method',
                $ids
            );

        return $rows

            ->map(
                function (
                    $row
                ) use (
                    $names
                ): ?array {
                    $id =
                        (int)
                        $row
                            ->administration_method_id;

                    $name =
                        $names->get(
                            (string) $id
                        )
                        ?? $names->get(
                            $id
                        );

                    if (! $name) {
                        return null;
                    }

                    return [
                        'id' => $id,

                        'name' => $name,

                        'count' => (int)
                            $row
                                ->observation_count,

                        'url' => route(
                            'frontend.topics.show',
                            [
                                'type' => 'method',

                                'topic' => $id,
                            ]
                        ),
                    ];
                }
            )

            ->filter()

            ->values();
    }

    private function referenceNames(
        string $source,
        array $externalIds
    ): Collection {
        if (
            $externalIds === []
            || ! $this->referenceCacheIsAvailable()
        ) {
            return collect();
        }

        return DB::connection(
            'h2research_cache'
        )

            ->table(
                'h2_reference_items'
            )

            ->where(
                'source',
                $source
            )

            ->whereIn(
                'external_id',

                collect(
                    $externalIds
                )

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
                            [
                                'deleted',
                            ]
                        );
                }
            )

            ->pluck(
                'name',
                'external_id'
            );
    }

    private function referenceCacheIsAvailable(): bool
    {
        try {
            return Schema::connection(
                'h2research_cache'
            )
                ->hasTable(
                    'h2_reference_items'
                );
        } catch (\Throwable) {
            return false;
        }
    }
}
