import {
    Head,
    router,
} from '@inertiajs/react';

import {
    ArrowRight,
    Search,
    X,
} from 'lucide-react';

import {
    type FormEvent,
    useEffect,
    useState,
} from 'react';

import PublicPagination from '@/components/frontend/observations/public-pagination';

import {
    TopicDirectoryCard,
    TopicResearchCard,
} from '@/components/frontend/topics/topic-components';

import type {
    FrontendTopicsProps,
    TopicCategoryKey,
    TopicDirectoryFilters,
} from '@/types/frontend';

export default function TopicsIndex({
                                        topics,
                                        filters,
                                        categories,
                                        availableLetters,
                                        researchReferences,
                                    }: FrontendTopicsProps) {
    const [
        search,
        setSearch,
    ] = useState(
        filters.search,
    );

    useEffect(
        () => {
            setSearch(
                filters.search,
            );
        },
        [
            filters.search,
        ],
    );

    const requestTopics = (
        nextFilters:
        TopicDirectoryFilters,
        page = 1,
    ) => {
        const params: Record<
            string,
            string | number
        > = {};

        if (
            nextFilters.category
            !== 'condition'
        ) {
            params.category =
                nextFilters.category;
        }

        if (
            nextFilters.search.trim()
            !== ''
        ) {
            params.search =
                nextFilters.search.trim();
        }

        if (
            nextFilters.letter
            !== ''
        ) {
            params.letter =
                nextFilters.letter;
        }

        if (
            page > 1
        ) {
            params.page =
                page;
        }

        router.get(
            '/topics',
            params,
            {
                preserveState:
                    true,

                preserveScroll:
                    true,

                replace:
                    true,
            },
        );
    };

    const submitSearch = (
        event:
        FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        requestTopics(
            {
                ...filters,

                search,

                letter: '',
            },
            1,
        );
    };

    const changeCategory = (
        category:
        TopicCategoryKey,
    ) => {
        requestTopics(
            {
                category,

                search:
                filters.search,

                letter: '',
            },
            1,
        );
    };

    const changeLetter = (
        letter: string,
    ) => {
        requestTopics(
            {
                ...filters,

                letter,
            },
            1,
        );
    };

    const clearSearch =
        () => {
            setSearch(
                '',
            );

            requestTopics(
                {
                    ...filters,

                    search:
                        '',

                    letter:
                        '',
                },
                1,
            );
        };

    const currentCategory =
        categories.find(
            (
                category,
            ) =>
                category.value
                ===
                filters.category,
        );

    const summaryLabel =
        topics.total === 1
            ? `1 topic with public observations`
            : `${topics.total} topics with public observations`;

    return (
        <>
            <Head title="Explore by topic">
                <meta
                    name="description"
                    content="Explore public observations by condition, organ, administration method, research topic and biomarker."
                />
            </Head>

            {/* Intro */}
            <section className="relative overflow-hidden bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_50%,#E7F5F2_100%)]">
                {/* Decorative molecule */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-5 right-[-80px] hidden h-[250px] w-[380px] opacity-50 md:block"
                >
                    <span className="absolute top-5 left-8 h-20 w-20 rounded-full border border-[#138A83]" />

                    <span className="absolute top-[100px] left-[120px] h-28 w-28 rounded-full border border-[#138A83]" />

                    <span className="absolute top-[42px] left-[250px] h-16 w-16 rounded-full border border-[#138A83]" />

                    <span className="absolute top-[176px] left-[255px] h-14 w-14 rounded-full border border-[#138A83]" />

                    <span className="absolute top-[77px] left-[82px] h-px w-[92px] rotate-[42deg] bg-[#138A83]" />

                    <span className="absolute top-[91px] left-[216px] h-px w-[58px] -rotate-[28deg] bg-[#138A83]" />

                    <span className="absolute top-[173px] left-[206px] h-px w-[75px] rotate-[34deg] bg-[#138A83]" />
                </div>

                <div className="relative mx-auto max-w-[1220px] px-5 py-11 lg:px-6 lg:py-12">
                    <nav
                        aria-label="Breadcrumb"
                        className="mb-5 flex items-center gap-2 text-sm text-[#617681]"
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

                        <span>
                            Topics
                        </span>
                    </nav>

                    <h1 className="text-[38px] leading-tight font-bold tracking-[-0.04em] text-[#112C40] md:text-[46px]">
                        Explore by topic
                    </h1>

                    <p className="mt-2 max-w-[700px] text-[17px] leading-7 text-[#526A76]">
                        Find observations
                        and related
                        research around
                        the subjects that
                        interest you.
                    </p>

                    <form
                        onSubmit={
                            submitSearch
                        }
                        className="mt-7 flex max-w-[850px] gap-2"
                    >
                        <div className="relative flex-1">
                            <Search
                                size={21}
                                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#6F858E]"
                            />

                            <input
                                type="search"
                                value={
                                    search
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Search a condition, organ, method or topic"
                                aria-label="Search topics"
                                className="h-12 w-full rounded-md border border-[#CFDBDD] bg-white pr-11 pl-12 text-sm text-[#112C40] shadow-sm outline-none placeholder:text-[#81919A] focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={
                                        clearSearch
                                    }
                                    aria-label="Clear topic search"
                                    className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#73858E] hover:bg-[#EDF6F3] hover:text-[#087A75]"
                                >
                                    <X
                                        size={
                                            16
                                        }
                                    />
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="grid h-12 w-14 shrink-0 place-items-center rounded-md bg-[#087A75] text-white transition hover:bg-[#06665F]"
                            aria-label="Search"
                        >
                            <Search
                                size={
                                    21
                                }
                            />
                        </button>
                    </form>
                </div>
            </section>

            {/* Directory */}
            <section className="bg-[#FBFCFC] py-8">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    {/* Categories */}
                    <div className="overflow-x-auto border-b border-[#DDE6E6]">
                        <div className="flex min-w-max items-end gap-3">
                            {categories.map(
                                (
                                    category,
                                ) => {
                                    const active =
                                        category.value
                                        ===
                                        filters.category;

                                    return (
                                        <button
                                            key={
                                                category.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                changeCategory(
                                                    category.value,
                                                )
                                            }
                                            className={`relative min-h-12 px-4 text-sm font-semibold transition ${
                                                active
                                                    ? 'text-[#087A75] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[3px] after:bg-[#138A83]'
                                                    : 'text-[#455E69] hover:text-[#087A75]'
                                            }`}
                                        >
                                            {
                                                category.label
                                            }

                                            <span className="ml-1.5 text-xs font-normal text-[#81919A]">
                                                {
                                                    category.count
                                                }
                                            </span>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Alphabet */}
                    <div className="mt-6 overflow-x-auto pb-1">
                        <div className="flex min-w-max gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    changeLetter(
                                        '',
                                    )
                                }
                                className={`grid h-9 min-w-12 place-items-center rounded-md border px-3 text-sm font-semibold transition ${
                                    filters.letter
                                    === ''
                                        ? 'border-[#087A75] bg-[#087A75] text-white'
                                        : 'border-[#D6E0E2] bg-white text-[#455E69] hover:border-[#138A83]/40 hover:text-[#087A75]'
                                }`}
                            >
                                All
                            </button>

                            {availableLetters.map(
                                (
                                    letter,
                                ) => (
                                    <button
                                        key={
                                            letter
                                        }
                                        type="button"
                                        onClick={() =>
                                            changeLetter(
                                                letter,
                                            )
                                        }
                                        className={`grid h-9 min-w-9 place-items-center rounded-md border px-3 text-sm transition ${
                                            filters.letter
                                            ===
                                            letter
                                                ? 'border-[#087A75] bg-[#087A75] font-semibold text-white'
                                                : 'border-[#D6E0E2] bg-white text-[#455E69] hover:border-[#138A83]/40 hover:text-[#087A75]'
                                        }`}
                                    >
                                        {
                                            letter
                                        }
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-5 border-b border-[#DDE6E6] pb-5">
                        <p className="font-semibold text-[#112C40]">
                            {
                                summaryLabel
                            }
                        </p>

                        {currentCategory && (
                            <p className="mt-1 text-xs text-[#7A8B94]">
                                Showing{' '}
                                {
                                    currentCategory.label
                                }
                            </p>
                        )}
                    </div>

                    {/* Cards */}
                    {topics.data.length >
                    0 ? (
                        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {topics.data.map(
                                (
                                    topic,
                                ) => (
                                    <TopicDirectoryCard
                                        key={`${topic.type}-${topic.id}`}
                                        topic={
                                            topic
                                        }
                                    />
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-lg border border-dashed border-[#C9DADA] bg-white px-6 py-14 text-center">
                            <h2 className="text-lg font-bold text-[#112C40]">
                                No topics
                                match these
                                filters.
                            </h2>

                            <p className="mt-2 text-sm text-[#667A85]">
                                Try another
                                search,
                                category or
                                letter.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearch(
                                        '',
                                    );

                                    requestTopics(
                                        {
                                            category:
                                            filters.category,

                                            search:
                                                '',

                                            letter:
                                                '',
                                        },
                                        1,
                                    );
                                }}
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-[#087A75] px-5 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-[#667A85]">
                            {topics.total >
                            0 ? (
                                <>
                                    Showing{' '}
                                    {
                                        topics.from
                                    }
                                    –
                                    {
                                        topics.to
                                    }{' '}
                                    of{' '}
                                    {
                                        topics.total
                                    }{' '}
                                    topics
                                </>
                            ) : (
                                'Showing 0 topics'
                            )}
                        </p>

                        <PublicPagination
                            currentPage={
                                topics.currentPage
                            }
                            lastPage={
                                topics.lastPage
                            }
                            onPageChange={(
                                page,
                            ) =>
                                requestTopics(
                                    filters,
                                    page,
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            {/* Getting started */}
            <section className="py-7">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="relative overflow-hidden rounded-lg bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] px-7 py-9 md:px-10">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute top-[-35px] right-[-30px] h-44 w-44 rounded-full border border-[#138A83]/20"
                        />

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute right-[80px] bottom-[-60px] h-32 w-32 rounded-full border border-[#138A83]/20"
                        />

                        <div className="relative">
                            <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                                Not sure
                                where to
                                begin?
                            </h2>

                            <p className="mt-2 text-base leading-6 text-[#596A75]">
                                Start with
                                the latest
                                observations
                                or learn how
                                contributions
                                are reviewed.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <a
                                    href="/observations"
                                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                                >
                                    Browse all
                                    observations
                                </a>

                                <a
                                    href="/#process"
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#087A75] bg-white px-6 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                                >
                                    How it
                                    works
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic research */}
            {researchReferences.length >
                0 && (
                    <section className="pt-6 pb-14">
                        <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                            <div className="mb-6">
                                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Explore the
                                    research
                                    behind each
                                    topic
                                </h2>

                                <p className="mt-2 text-base text-[#596A75]">
                                    Explore
                                    research
                                    references
                                    connected to
                                    public
                                    observations.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {researchReferences.map(
                                    (
                                        reference,
                                    ) => (
                                        <TopicResearchCard
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
        </>
    );
}
