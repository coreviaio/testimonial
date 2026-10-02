export type PublicStatKey =
    | 'publishedObservations'
    | 'practitionerContributors'
    | 'conditionsRepresented'
    | 'linkedResearchArticles';

export type PublicStat = {
    key: PublicStatKey;
    value: number;
    label: string;
};

export type PublicContributorType =
    | 'community'
    | 'practitioner';

export type PublicObservation = {
    id: number;
    slug: string | null;
    title: string;
    excerpt: string | null;
    topic: string | null;

    contributorType:
        PublicContributorType;

    publishedAt: string;

    url: string | null;
};

export type PublicTopic = {
    id: number;
    type: string;
    name: string;
    observationCount: number;
    url: string | null;
};

export type PublicResearchReference = {
    id: number;
    title: string;

    observationCount?: number;

    url: string | null;
};

export type FrontendHomeProps = {
    stats: PublicStat[];

    latestObservations:
        PublicObservation[];

    heroObservation:
        PublicObservation | null;

    topics:
        PublicTopic[];

    researchReferences:
        PublicResearchReference[];
};

export type PublicFilterOption = {
    id: number;
    label: string;
};

export type ObservationFilters = {
    search: string;

    condition: string;

    method: string;

    topic: string;

    contributors:
        PublicContributorType[];

    sort:
        | 'newest'
        | 'oldest';
};

export type ObservationFilterOptions = {
    conditions:
        PublicFilterOption[];

    methods:
        PublicFilterOption[];

    topics:
        PublicFilterOption[];
};

export type ObservationPagination = {
    data:
        PublicObservation[];

    currentPage: number;

    lastPage: number;

    perPage: number;

    total: number;

    from: number | null;

    to: number | null;
};

export type FrontendObservationsProps = {
    observations:
        ObservationPagination;

    filters:
        ObservationFilters;

    filterOptions:
        ObservationFilterOptions;
};

export type PublicReferenceItem = {
    id: number;

    type:
        | 'condition'
        | 'organ'
        | 'method'
        | 'research-topic'
        | 'biomarker';

    name: string;

    url: string | null;
};

export type PublicObservationDetail = {
    id: number;

    slug: string | null;

    title: string;

    summary: string | null;

    observation: string | null;

    conditionText:
        string | null;

    durationText:
        string | null;

    frequencyText:
        string | null;

    timelineText:
        string | null;

    publicDisplayNote:
        string | null;

    contributorType:
        PublicContributorType;

    contributorLabel:
        string;

    isVerifiedPractitioner:
        boolean;

    publishedAt:
        string;

    topics:
        PublicReferenceItem[];

    methods:
        PublicReferenceItem[];

    researchReferences:
        PublicResearchReference[];

    relatedObservations:
        PublicObservation[];
};

export type FrontendObservationShowProps = {
    observation:
        PublicObservationDetail;
};

export type TopicCategoryKey =
    | 'condition'
    | 'organ'
    | 'method'
    | 'research-topic'
    | 'biomarker';

export type TopicDirectoryFilters = {
    category:
        TopicCategoryKey;

    search: string;

    letter: string;
};

export type TopicDirectoryCategory = {
    value:
        TopicCategoryKey;

    label: string;

    count: number;
};

export type TopicDirectoryItem = {
    id: number;

    type:
        TopicCategoryKey;

    name: string;

    description:
        string | null;

    observationCount:
        number;

    url:
        string | null;
};

export type TopicDirectoryPagination = {
    data:
        TopicDirectoryItem[];

    currentPage: number;

    lastPage: number;

    perPage: number;

    total: number;

    from:
        number | null;

    to:
        number | null;
};

export type FrontendTopicsProps = {
    topics:
        TopicDirectoryPagination;

    filters:
        TopicDirectoryFilters;

    categories:
        TopicDirectoryCategory[];

    availableLetters:
        string[];

    researchReferences:
        PublicResearchReference[];
};

export type TopicDetail = {
    id: number;

    type:
        TopicCategoryKey;

    categoryLabel:
        string;

    name: string;

    introduction:
        string;

    observationCount:
        number;

    practitionerContributors:
        number;

    linkedResearchArticles:
        number;
};

export type TopicDetailFilters = {
    method: string;

    contributor:
        | ''
        | 'community'
        | 'practitioner';

    sort:
        | 'newest'
        | 'oldest';

    view:
        | 'preview'
        | 'all';
};

export type RelatedTopic = {
    id: number;

    type:
        TopicCategoryKey;

    name: string;

    overlapCount:
        number;

    url: string;
};

export type FrontendTopicShowProps = {
    topic:
        TopicDetail;

    observations:
        ObservationPagination;

    filters:
        TopicDetailFilters;

    filterOptions: {
        methods:
            PublicFilterOption[];
    };

    researchReferences:
        PublicResearchReference[];

    relatedTopics:
        RelatedTopic[];

    viewAllUrl:
        string;
};

export type InsightsRange =
    | 'all'
    | '6m'
    | '12m'
    | 'year';

export type InsightsRangeOption = {
    value:
        InsightsRange;

    label: string;
};

export type InsightsMonthlyPoint = {
    month: string;

    label: string;

    count: number;
};

export type InsightsCountItem = {
    id: number;

    name: string;

    count: number;

    url: string | null;
};

export type InsightsContributionTypes = {
    community: number;

    practitioner: number;

    total: number;
};

export type FrontendInsightsProps = {
    range:
        InsightsRange;

    scopeLabel: string;

    rangeOptions:
        InsightsRangeOption[];

    stats:
        PublicStat[];

    monthlyPublications:
        InsightsMonthlyPoint[];

    topics:
        InsightsCountItem[];

    contributionTypes:
        InsightsContributionTypes;

    administrationMethods:
        InsightsCountItem[];

    researchConnections: {
        linkedResearchArticles:
            number;
    };
};

export type PractitionerApplicationState = {
    url: string;

    label: string;

    status: string | null;

    statusLabel: string | null;

    isAuthenticated: boolean;
};

export type FrontendForPractitionersProps = {
    application:
        PractitionerApplicationState;
};
