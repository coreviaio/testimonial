import {
    Head,
    router,
} from '@inertiajs/react';

import {
    ArrowRight,
    Info,
    MessageSquareText,
} from 'lucide-react';

import {
    ObservationCard,
} from '@/components/frontend/home/home-components';

import PublicPagination from '@/components/frontend/observations/public-pagination';

import {
    RelatedTopicCard,
    TopicHeroIcon,
    TopicResearchRow,
    TopicStats,
} from '@/components/frontend/topics/topic-detail-components';

import type {
    FrontendTopicShowProps,
    TopicDetailFilters,
} from '@/types/frontend';

export default function TopicShow({
                                      topic,
                                      observations,
                                      filters,
                                      filterOptions,
                                      researchReferences,
                                      relatedTopics,
                                      viewAllUrl,
                                  }: FrontendTopicShowProps) {
    const requestObservations = (
        nextFilters:
        TopicDetailFilters,
        page = 1,
    ) => {
        const params: Record<
            string,
            string | number
        > = {};

        if (
            nextFilters.method
        ) {
            params.method =
                nextFilters.method;
        }

        if (
            nextFilters.contributor
        ) {
            params.contributor =
                nextFilters.contributor;
        }

        if (
            nextFilters.sort
            !== 'newest'
        ) {
            params.sort =
                nextFilters.sort;
        }

        if (
            nextFilters.view
            === 'all'
        ) {
            params.view =
                'all';
        }

        if (
            page > 1
        ) {
            params.page =
                page;
        }

        router.get(
            `/topics/${topic.type}/${topic.id}`,
            params,
            {
                preserveState:
                    true,

                preserveScroll:
                    true,

                replace:
                    true,

                onSuccess:
                    () => {
                        const section =
                            document
                                .getElementById(
                                    'topic-observations',
                                );

                        if (
                            section
                            && page > 1
                        ) {
                            section
                                .scrollIntoView({
                                    behavior:
                                        'smooth',

                                    block:
                                        'start',
                                });
                        }
                    },
            },
        );
    };

    const changeMethod = (
        method: string,
    ) => {
        requestObservations({
            ...filters,
            method,
        });
    };

    const changeContributor = (
        contributor:
            | ''
            | 'community'
            | 'practitioner',
    ) => {
        requestObservations({
            ...filters,
            contributor,
        });
    };

    const changeSort = (
        sort:
            | 'newest'
            | 'oldest',
    ) => {
        requestObservations({
            ...filters,
            sort,
        });
    };

    return (
        <>
            <Head
                title={
                    topic.name
                }
            >
                <meta
                    name="description"
                    content={
                        topic.introduction
                    }
                />
            </Head>

            {/* Topic hero */}
            <section className="bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_50%,#E7F5F2_100%)]">
                <div className="mx-auto max-w-[1220px] px-5 py-8 lg:px-6 lg:py-10">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm text-[#617681]"
                    >
                        <a
                            href="/"
                            className="font-medium text-[#087A75] hover:underline"
                        >
                            Stories
                        </a>

                        <span>
                            /
                        </span>

                        <a
                            href="/topics"
                            className="font-medium text-[#087A75] hover:underline"
                        >
                            Topics
                        </a>

                        <span>
                            /
                        </span>

                        <span>
                            {
                                topic.name
                            }
                        </span>
                    </nav>

                    <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
                        <TopicHeroIcon
                            type={
                                topic.type
                            }
                        />

                        <div className="min-w-0">
                            <p className="text-xs font-bold tracking-[0.11em] text-[#667A84] uppercase">
                                Topic
                                collection
                            </p>

                            <h1 className="mt-1 text-[38px] leading-tight font-bold tracking-[-0.04em] text-[#112C40] md:text-[48px]">
                                {
                                    topic.name
                                }
                            </h1>

                            <p className="mt-2 max-w-[650px] text-[17px] leading-7 text-[#526A76]">
                                {
                                    topic.introduction
                                }
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="#topic-observations"
                                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                                >
                                    Browse
                                    observations
                                </a>

                                {researchReferences.length >
                                    0 && (
                                        <a
                                            href="#topic-research"
                                            className="inline-flex h-11 items-center justify-center rounded-md border border-[#087A75] bg-white/70 px-6 text-sm font-semibold text-[#087A75] transition hover:bg-white"
                                        >
                                            View
                                            related
                                            research
                                        </a>
                                    )}
                            </div>

                            <TopicStats
                                topic={
                                    topic
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Observations */}
            <section
                id="topic-observations"
                className="scroll-mt-5 bg-[#FBFCFC] py-10"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                                Observations
                                in this topic
                            </h2>

                            {filters.view ===
                                'all' && (
                                    <p className="mt-1 text-sm text-[#697D86]">
                                        Showing
                                        the full
                                        public
                                        collection
                                        for{' '}
                                        {
                                            topic.name
                                        }
                                        .
                                    </p>
                                )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Method filter is redundant on a method collection */}
                            {topic.type !==
                                'method'
                                && filterOptions
                                    .methods
                                    .length >
                                0 && (
                                    <select
                                        value={
                                            filters.method
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            changeMethod(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        aria-label="Filter by administration method"
                                        className="h-10 min-w-[180px] rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none focus:border-[#138A83]"
                                    >
                                        <option value="">
                                            All
                                            methods
                                        </option>

                                        {filterOptions.methods.map(
                                            (
                                                method,
                                            ) => (
                                                <option
                                                    key={
                                                        method.id
                                                    }
                                                    value={
                                                        method.id
                                                    }
                                                >
                                                    {
                                                        method.label
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                )}

                            <select
                                value={
                                    filters.contributor
                                }
                                onChange={(
                                    event,
                                ) =>
                                    changeContributor(
                                        event
                                            .target
                                            .value as
                                            | ''
                                            | 'community'
                                            | 'practitioner',
                                    )
                                }
                                aria-label="Filter by contributor type"
                                className="h-10 min-w-[180px] rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none focus:border-[#138A83]"
                            >
                                <option value="">
                                    All
                                    contributors
                                </option>

                                <option value="community">
                                    Community
                                    contributors
                                </option>

                                <option value="practitioner">
                                    Practitioner
                                    contributors
                                </option>
                            </select>

                            <label className="flex items-center gap-2 text-sm text-[#697D86]">
                                <span className="hidden sm:inline">
                                    Sort
                                    by:
                                </span>

                                <select
                                    value={
                                        filters.sort
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        changeSort(
                                            event
                                                .target
                                                .value as
                                                | 'newest'
                                                | 'oldest',
                                        )
                                    }
                                    className="h-10 rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none focus:border-[#138A83]"
                                >
                                    <option value="newest">
                                        Newest
                                        first
                                    </option>

                                    <option value="oldest">
                                        Oldest
                                        first
                                    </option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {observations.data
                        .length >
                    0 ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            {observations.data.map(
                                (
                                    observation,
                                ) => (
                                    <ObservationCard
                                        key={
                                            observation.id
                                        }
                                        observation={
                                            observation
                                        }
                                    />
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-[#C9DADA] bg-white px-6 py-14 text-center">
                            <h3 className="text-lg font-bold text-[#112C40]">
                                No
                                observations
                                match these
                                filters.
                            </h3>

                            <p className="mt-2 text-sm text-[#667A85]">
                                Try a
                                different
                                method or
                                contributor
                                type.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    requestObservations(
                                        {
                                            method:
                                                '',

                                            contributor:
                                                '',

                                            sort:
                                                'newest',

                                            view:
                                            filters.view,
                                        },
                                    )
                                }
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-[#087A75] px-5 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                            >
                                Clear
                                filters
                            </button>
                        </div>
                    )}

                    {filters.view ===
                    'preview' ? (
                        observations.total >
                        4 && (
                            <div className="mt-7 flex justify-center">
                                <a
                                    href={
                                        viewAllUrl
                                    }
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#087A75] bg-white px-8 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                                >
                                    View
                                    all{' '}
                                    {
                                        observations.total
                                    }{' '}
                                    observations
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <p className="text-sm text-[#667A85]">
                                {observations.total >
                                0 ? (
                                    <>
                                        Showing{' '}
                                        {
                                            observations.from
                                        }
                                        –
                                        {
                                            observations.to
                                        }{' '}
                                        of{' '}
                                        {
                                            observations.total
                                        }
                                    </>
                                ) : (
                                    'Showing 0 observations'
                                )}
                            </p>

                            <PublicPagination
                                currentPage={
                                    observations.currentPage
                                }
                                lastPage={
                                    observations.lastPage
                                }
                                onPageChange={(
                                    page,
                                ) =>
                                    requestObservations(
                                        filters,
                                        page,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Research */}
            {researchReferences.length >
                0 && (
                    <section
                        id="topic-research"
                        className="scroll-mt-5 py-12"
                    >
                        <div className="mx-auto grid max-w-[1220px] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-6">
                            <div>
                                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Related
                                    research
                                    in H
                                    <sub>
                                        2
                                    </sub>{' '}
                                    Research
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-[#596A75]">
                                    These
                                    research
                                    references
                                    are linked
                                    through
                                    public
                                    observations
                                    in this
                                    collection.
                                    They provide
                                    research
                                    context;
                                    they do not
                                    prove an
                                    individual
                                    observation.
                                </p>
                            </div>

                            <div>
                                {researchReferences.map(
                                    (
                                        reference,
                                    ) => (
                                        <TopicResearchRow
                                            key={
                                                reference.id
                                            }
                                            reference={
                                                reference
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </section>
                )}

            {/* Interpretation note */}
            <section className="border-y border-[#D7E8E4] bg-[#EDF7F4]">
                <div className="mx-auto flex max-w-[1220px] items-start gap-4 px-5 py-5 lg:px-6">
                    <Info
                        size={23}
                        className="mt-0.5 shrink-0 text-[#138A83]"
                    />

                    <p className="text-sm leading-6 text-[#536B76]">
                        Observations
                        describe
                        individual
                        experiences.
                        They do not
                        establish
                        treatment
                        effectiveness.
                    </p>
                </div>
            </section>

            {/* Related topics */}
            {relatedTopics.length >
                0 && (
                    <section className="py-11">
                        <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                            <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                                Explore
                                related topics
                            </h2>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {relatedTopics.map(
                                    (
                                        relatedTopic,
                                    ) => (
                                        <RelatedTopicCard
                                            key={`${relatedTopic.type}-${relatedTopic.id}`}
                                            topic={
                                                relatedTopic
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </section>
                )}

            {/* CTA */}
            <section className="pb-7">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="flex flex-col justify-between gap-5 rounded-lg bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] px-6 py-6 md:flex-row md:items-center">
                        <div className="flex items-start gap-4">
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#138A83]">
                                <MessageSquareText
                                    size={
                                        24
                                    }
                                />
                            </span>

                            <div>
                                <h2 className="text-xl font-bold text-[#112C40]">
                                    Have an
                                    observation
                                    to share?
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-[#596A75]">
                                    Your
                                    experience
                                    could add
                                    context to
                                    a growing
                                    collection
                                    of
                                    real-world
                                    observations.
                                </p>
                            </div>
                        </div>

                        <a
                            href="/#process"
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                        >
                            Learn how to
                            contribute

                            <ArrowRight
                                size={
                                    17
                                }
                            />
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
