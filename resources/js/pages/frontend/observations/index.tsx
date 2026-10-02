import {
    Head,
    router,
} from '@inertiajs/react';

import {
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';

import {
    type FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ObservationCard,
} from '@/components/frontend/home/home-components';

import ObservationFiltersPanel from '@/components/frontend/observations/observation-filters';

import PublicPagination from '@/components/frontend/observations/public-pagination';

import type {
    FrontendObservationsProps,
    ObservationFilters,
} from '@/types/frontend';

const emptyFilters: ObservationFilters = {
    search: '',
    condition: '',
    method: '',
    topic: '',
    contributors: [],
    sort: 'newest',
};

export default function ObservationsIndex({
                                              observations,
                                              filters,
                                              filterOptions,
                                          }: FrontendObservationsProps) {
    const [
        form,
        setForm,
    ] =
        useState<ObservationFilters>(
            filters,
        );

    const [
        mobileOpen,
        setMobileOpen,
    ] =
        useState(false);

    const [
        mobileFilters,
        setMobileFilters,
    ] =
        useState<ObservationFilters>(
            filters,
        );

    useEffect(
        () => {
            setForm(
                filters,
            );

            setMobileFilters(
                filters,
            );
        },
        [
            filters.search,
            filters.condition,
            filters.method,
            filters.topic,
            filters.sort,
            filters.contributors.join(
                ',',
            ),
        ],
    );

    const requestResults = (
        nextFilters:
        ObservationFilters,
        page = 1,
    ) => {
        const params: Record<
            string,
            string
            | string[]
            | number
        > = {};

        if (
            nextFilters.search.trim()
            !== ''
        ) {
            params.search =
                nextFilters.search.trim();
        }

        if (
            nextFilters.condition
        ) {
            params.condition =
                nextFilters.condition;
        }

        if (
            nextFilters.method
        ) {
            params.method =
                nextFilters.method;
        }

        if (
            nextFilters.topic
        ) {
            params.topic =
                nextFilters.topic;
        }

        if (
            nextFilters.contributors
                .length > 0
        ) {
            params.contributors =
                nextFilters.contributors;
        }

        if (
            nextFilters.sort
            !== 'newest'
        ) {
            params.sort =
                nextFilters.sort;
        }

        if (
            page > 1
        ) {
            params.page =
                page;
        }

        router.get(
            '/observations',
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

    const handleSearch = (
        event:
        FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        requestResults(
            form,
            1,
        );
    };

    const updateDesktopFilters = (
        nextFilters:
        ObservationFilters,
    ) => {
        setForm(
            nextFilters,
        );

        requestResults(
            nextFilters,
            1,
        );
    };

    const clearAll = () => {
        setForm(
            emptyFilters,
        );

        setMobileFilters(
            emptyFilters,
        );

        setMobileOpen(
            false,
        );

        requestResults(
            emptyFilters,
            1,
        );
    };

    const openMobileFilters =
        () => {
            setMobileFilters(
                form,
            );

            setMobileOpen(
                true,
            );
        };

    const applyMobileFilters =
        () => {
            setForm(
                mobileFilters,
            );

            setMobileOpen(
                false,
            );

            requestResults(
                mobileFilters,
                1,
            );
        };

    const conditionLabel =
        useMemo(
            () =>
                filterOptions
                    .conditions
                    .find(
                        (
                            option,
                        ) =>
                            String(
                                option.id,
                            )
                            === form.condition,
                    )
                    ?.label
                ?? null,

            [
                filterOptions
                    .conditions,
                form.condition,
            ],
        );

    const methodLabel =
        useMemo(
            () =>
                filterOptions
                    .methods
                    .find(
                        (
                            option,
                        ) =>
                            String(
                                option.id,
                            )
                            === form.method,
                    )
                    ?.label
                ?? null,

            [
                filterOptions
                    .methods,
                form.method,
            ],
        );

    const topicLabel =
        useMemo(
            () =>
                filterOptions
                    .topics
                    .find(
                        (
                            option,
                        ) =>
                            String(
                                option.id,
                            )
                            === form.topic,
                    )
                    ?.label
                ?? null,

            [
                filterOptions
                    .topics,
                form.topic,
            ],
        );

    const activeFilterCount =
        [
            form.condition,
            form.method,
            form.topic,
        ].filter(Boolean)
            .length
        + form.contributors.length;

    const removeSearch =
        () => {
            const next = {
                ...form,
                search: '',
            };

            setForm(
                next,
            );

            requestResults(
                next,
                1,
            );
        };

    const removeCondition =
        () => {
            const next = {
                ...form,
                condition: '',
            };

            setForm(
                next,
            );

            requestResults(
                next,
                1,
            );
        };

    const removeMethod =
        () => {
            const next = {
                ...form,
                method: '',
            };

            setForm(
                next,
            );

            requestResults(
                next,
                1,
            );
        };

    const removeTopic =
        () => {
            const next = {
                ...form,
                topic: '',
            };

            setForm(
                next,
            );

            requestResults(
                next,
                1,
            );
        };

    const removeContributor =
        (
            contributor:
                'community'
                | 'practitioner',
        ) => {
            const next = {
                ...form,

                contributors:
                    form.contributors.filter(
                        (
                            item,
                        ) =>
                            item !==
                            contributor,
                    ),
            };

            setForm(
                next,
            );

            requestResults(
                next,
                1,
            );
        };

    const changeSort = (
        sort:
            'newest'
            | 'oldest',
    ) => {
        const next = {
            ...form,
            sort,
        };

        setForm(
            next,
        );

        requestResults(
            next,
            1,
        );
    };

    const resultLabel =
        observations.total === 1
            ? '1 observation'
            : `${observations.total} observations`;

    return (
        <>
            <Head title="Explore observations">
                <meta
                    name="description"
                    content="Browse approved observations by topic, method and contributor."
                />
            </Head>

            {/* Intro */}
            <section className="relative overflow-hidden bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_50%,#E6F5F2_100%)]">
                <div className="pointer-events-none absolute top-8 right-[5%] hidden md:block">
                    <div className="absolute top-0 right-12 h-28 w-28 rounded-full border border-[#138A83]/10 bg-[#138A83]/7" />

                    <div className="absolute top-14 right-0 h-24 w-24 rounded-full border border-[#138A83]/10 bg-[#138A83]/7" />
                </div>

                <div className="relative mx-auto max-w-[1220px] px-5 py-11 lg:px-6 lg:py-12">
                    <div className="mb-4 flex items-center gap-2 text-sm text-[#55717D]">
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
                            Observations
                        </span>
                    </div>

                    <h1 className="text-[38px] leading-tight font-bold tracking-[-0.04em] text-[#112C40] md:text-[46px]">
                        Explore
                        observations
                    </h1>

                    <p className="mt-2 text-[17px] leading-7 text-[#526A76]">
                        Browse
                        experiences by
                        topic, method
                        and contributor.
                    </p>

                    <form
                        onSubmit={
                            handleSearch
                        }
                        className="mt-7 flex max-w-[860px] flex-col gap-3 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search
                                size={21}
                                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#6F858E]"
                            />

                            <input
                                type="search"
                                value={
                                    form.search
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setForm(
                                        {
                                            ...form,

                                            search:
                                            event
                                                .target
                                                .value,
                                        },
                                    )
                                }
                                placeholder="Search observations, conditions or topics"
                                aria-label="Search observations"
                                className="h-12 w-full rounded-md border border-[#CFDBDD] bg-white pr-4 pl-12 text-sm text-[#112C40] shadow-sm outline-none placeholder:text-[#81919A] focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                            />
                        </div>

                        <button
                            type="submit"
                            className="h-12 rounded-md bg-[#087A75] px-10 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </section>

            {/* Results */}
            <section className="bg-[#FBFCFC] py-9 lg:py-10">
                <div className="mx-auto grid max-w-[1220px] gap-6 px-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
                    {/* Desktop filters */}
                    <aside className="hidden lg:block">
                        <div className="rounded-lg border border-[#DDE6E6] bg-white p-5 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
                            <ObservationFiltersPanel
                                filters={
                                    form
                                }
                                options={
                                    filterOptions
                                }
                                onChange={
                                    updateDesktopFilters
                                }
                                onClear={
                                    clearAll
                                }
                            />
                        </div>
                    </aside>

                    <div className="min-w-0">
                        {/* Toolbar */}
                        <div className="mb-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-[22px] font-bold text-[#112C40]">
                                        {
                                            resultLabel
                                        }
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={
                                            openMobileFilters
                                        }
                                        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D6E0E2] bg-white px-3 text-sm font-medium text-[#405864] lg:hidden"
                                    >
                                        <SlidersHorizontal
                                            size={
                                                17
                                            }
                                        />

                                        Filters

                                        {activeFilterCount >
                                            0 && (
                                                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#087A75] px-1 text-[11px] font-bold text-white">
                                                {
                                                    activeFilterCount
                                                }
                                            </span>
                                            )}
                                    </button>
                                </div>

                                <label className="flex items-center gap-3 text-sm text-[#697D86]">
                                    <span className="hidden sm:inline">
                                        Sort by:
                                    </span>

                                    <select
                                        value={
                                            form.sort
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

                            {/* Chips */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {form.search && (
                                    <FilterChip
                                        label={`Search: ${form.search}`}
                                        onRemove={
                                            removeSearch
                                        }
                                    />
                                )}

                                {conditionLabel && (
                                    <FilterChip
                                        label={
                                            conditionLabel
                                        }
                                        onRemove={
                                            removeCondition
                                        }
                                    />
                                )}

                                {methodLabel && (
                                    <FilterChip
                                        label={
                                            methodLabel
                                        }
                                        onRemove={
                                            removeMethod
                                        }
                                    />
                                )}

                                {topicLabel && (
                                    <FilterChip
                                        label={
                                            topicLabel
                                        }
                                        onRemove={
                                            removeTopic
                                        }
                                    />
                                )}

                                {form.contributors.includes(
                                    'community',
                                ) && (
                                    <FilterChip
                                        label="Community contribution"
                                        onRemove={() =>
                                            removeContributor(
                                                'community',
                                            )
                                        }
                                    />
                                )}

                                {form.contributors.includes(
                                    'practitioner',
                                ) && (
                                    <FilterChip
                                        label="Practitioner contribution"
                                        onRemove={() =>
                                            removeContributor(
                                                'practitioner',
                                            )
                                        }
                                    />
                                )}

                                {(form.search
                                    || activeFilterCount
                                    > 0) && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearAll
                                        }
                                        className="px-2 text-xs font-semibold text-[#087A75] hover:underline"
                                    >
                                        Clear
                                        all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cards */}
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
                            <div className="rounded-lg border border-dashed border-[#C9DADA] bg-white px-6 py-16 text-center">
                                <h3 className="text-lg font-bold text-[#112C40]">
                                    No
                                    observations
                                    match
                                    these
                                    filters.
                                </h3>

                                <p className="mt-2 text-sm text-[#667A85]">
                                    Try
                                    another
                                    search
                                    or clear
                                    the
                                    selected
                                    filters.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        clearAll
                                    }
                                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-[#087A75] px-5 text-sm font-semibold text-[#087A75] hover:bg-[#EDF6F3]"
                                >
                                    Clear
                                    filters
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
                                    'Showing 0 results'
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
                                    requestResults(
                                        form,
                                        page,
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[linear-gradient(100deg,#EAF7F4,#F1FAF8)]">
                <div className="mx-auto flex max-w-[1220px] flex-col justify-between gap-6 px-5 py-10 md:flex-row md:items-center lg:px-6">
                    <div>
                        <h2 className="max-w-[620px] text-[27px] leading-tight font-bold tracking-[-0.03em] text-[#112C40]">
                            Your
                            observation
                            could help
                            someone
                            explore a new
                            question.
                        </h2>

                        <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#596A75]">
                            Real-world
                            observations
                            add useful
                            context to
                            research and
                            may help
                            others
                            explore
                            related
                            questions.
                        </p>
                    </div>

                    <a
                        href="/#process"
                        className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-[#087A75] px-7 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                    >
                        Learn how to
                        contribute
                    </a>
                </div>
            </section>

            {/* Mobile filter drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[80] lg:hidden">
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() =>
                            setMobileOpen(
                                false,
                            )
                        }
                        className="absolute inset-0 bg-[#112C40]/40"
                    />

                    <div className="absolute top-0 right-0 h-full w-[min(88vw,360px)] overflow-y-auto bg-white shadow-2xl">
                        <div className="flex min-h-16 items-center justify-between border-b border-[#DDE6E6] px-5">
                            <h2 className="text-lg font-bold text-[#112C40]">
                                Filters
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setMobileOpen(
                                        false,
                                    )
                                }
                                className="grid h-9 w-9 place-items-center rounded-md border border-[#DDE6E6] text-[#405864]"
                                aria-label="Close filters"
                            >
                                <X
                                    size={
                                        19
                                    }
                                />
                            </button>
                        </div>

                        <div className="p-5">
                            <ObservationFiltersPanel
                                filters={
                                    mobileFilters
                                }
                                options={
                                    filterOptions
                                }
                                onChange={
                                    setMobileFilters
                                }
                                onClear={
                                    clearAll
                                }
                                showApply
                                onApply={
                                    applyMobileFilters
                                }
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function FilterChip({
                        label,
                        onRemove,
                    }: {
    label: string;

    onRemove: () => void;
}) {
    return (
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#DDF1EC] px-3 text-xs font-medium text-[#087A75]">
            {label}

            <button
                type="button"
                onClick={
                    onRemove
                }
                aria-label={`Remove ${label} filter`}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#087A75]/10"
            >
                <X
                    size={13}
                />
            </button>
        </span>
    );
}
