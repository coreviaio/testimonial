import {
    Head,
    router,
} from '@inertiajs/react';

import {
    FileText,
    Info,
    Network,
    Users,
} from 'lucide-react';

import {
    ContributionDonut,
    HorizontalCountBars,
    InsightStatGrid,
    MonthlyPublicationChart,
    ResearchConnectionPanel,
} from '@/components/frontend/insights/insight-components';

import type {
    FrontendInsightsProps,
    InsightsRange,
} from '@/types/frontend';

export default function InsightsIndex({
                                          range,
                                          scopeLabel,
                                          rangeOptions,
                                          stats,
                                          monthlyPublications,
                                          topics,
                                          contributionTypes,
                                          administrationMethods,
                                          researchConnections,
                                      }: FrontendInsightsProps) {
    const changeRange = (
        nextRange:
        InsightsRange,
    ) => {
        router.get(
            '/insights',

            nextRange ===
            'all'
                ? {}
                : {
                    range:
                    nextRange,
                },

            {
                preserveState:
                    true,

                preserveScroll:
                    false,

                replace:
                    true,
            },
        );
    };

    return (
        <>
            <Head title="Community insights">
                <meta
                    name="description"
                    content="Explore public observation counts, topic coverage, contribution types, administration methods and research connections."
                />
            </Head>

            {/* Intro */}
            <section className="bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_52%,#E8F6F3_100%)]">
                <div className="mx-auto max-w-[1220px] px-5 py-10 lg:px-6 lg:py-12">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                        <div>
                            <p className="text-xs font-bold tracking-[0.1em] text-[#637985] uppercase">
                                Stories in
                                numbers
                            </p>

                            <h1 className="mt-2 text-[38px] leading-tight font-bold tracking-[-0.04em] text-[#112C40] md:text-[48px]">
                                Community
                                insights
                            </h1>

                            <p className="mt-2 max-w-[760px] text-[17px] leading-7 text-[#526A76]">
                                A closer
                                look at the
                                observations,
                                topics and
                                research
                                connections
                                represented
                                in the
                                public
                                collection.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <label
                                htmlFor="insight-range"
                                className="mb-2 block text-xs font-semibold text-[#596A75]"
                            >
                                Date range
                            </label>

                            <select
                                id="insight-range"
                                value={
                                    range
                                }
                                onChange={(
                                    event,
                                ) =>
                                    changeRange(
                                        event
                                            .target
                                            .value as
                                            InsightsRange,
                                    )
                                }
                                className="h-11 min-w-[180px] rounded-md border border-[#CFDBDD] bg-white px-4 text-sm font-medium text-[#405864] shadow-sm outline-none focus:border-[#138A83]"
                            >
                                {rangeOptions.map(
                                    (
                                        option,
                                    ) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="mt-5 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#087A75]">
                        Scope:{' '}
                        {scopeLabel}
                    </div>

                    <div className="mt-6">
                        <InsightStatGrid
                            stats={
                                stats
                            }
                            scopeLabel={
                                scopeLabel
                            }
                        />
                    </div>
                </div>
            </section>

            {/* Monthly chart */}
            <section className="bg-[#FBFCFC] py-8">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <article className="rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
                        <div>
                            <h2 className="text-xl font-bold text-[#112C40]">
                                Observations
                                published
                                over time
                            </h2>

                            <p className="mt-1 text-sm text-[#697D86]">
                                Monthly
                                public
                                observation
                                count ·{' '}
                                {
                                    scopeLabel
                                }
                            </p>
                        </div>

                        <MonthlyPublicationChart
                            data={
                                monthlyPublications
                            }
                        />
                    </article>
                </div>
            </section>

            {/* Topics + contribution type */}
            <section className="bg-[#FBFCFC] pb-7">
                <div className="mx-auto grid max-w-[1220px] gap-6 px-5 lg:grid-cols-2 lg:px-6">
                    <article className="rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
                        <h2 className="text-xl font-bold text-[#112C40]">
                            Most
                            represented
                            topics
                        </h2>

                        <p className="mt-1 text-sm text-[#697D86]">
                            Public
                            observations
                            may appear in
                            more than one
                            topic.
                        </p>

                        <div className="mt-6">
                            <HorizontalCountBars
                                items={
                                    topics
                                }
                            />
                        </div>
                    </article>

                    <article className="rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
                        <h2 className="text-xl font-bold text-[#112C40]">
                            Contribution
                            types
                        </h2>

                        <p className="mt-1 text-sm text-[#697D86]">
                            Community and
                            practitioner
                            observations
                            in the
                            selected
                            scope.
                        </p>

                        <div className="mt-5">
                            <ContributionDonut
                                data={
                                    contributionTypes
                                }
                            />
                        </div>
                    </article>
                </div>
            </section>

            {/* Methods + research */}
            <section className="bg-[#FBFCFC] pb-9">
                <div className="mx-auto grid max-w-[1220px] gap-6 px-5 lg:grid-cols-2 lg:px-6">
                    <article className="rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
                        <h2 className="text-xl font-bold text-[#112C40]">
                            Administration
                            methods
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#697D86]">
                            One
                            observation
                            may be mapped
                            to more than
                            one method,
                            so these
                            counts can
                            overlap.
                        </p>

                        <div className="mt-6">
                            <HorizontalCountBars
                                items={
                                    administrationMethods
                                }
                            />
                        </div>
                    </article>

                    <ResearchConnectionPanel
                        count={
                            researchConnections
                                .linkedResearchArticles
                        }
                    />
                </div>
            </section>

            {/* Meaning */}
            <section className="py-10">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <article className="rounded-lg border border-[#DDE6E6] bg-white p-6">
                        <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#112C40]">
                            What these
                            numbers mean
                        </h2>

                        <div className="mt-6 grid gap-6 md:grid-cols-3">
                            <MeaningCard
                                icon={
                                    FileText
                                }
                                title="Public content only"
                            >
                                These
                                figures
                                include
                                only
                                observations
                                currently
                                eligible
                                for public
                                display
                                within the
                                selected
                                period.
                            </MeaningCard>

                            <MeaningCard
                                icon={
                                    Network
                                }
                                title="Topics can overlap"
                            >
                                One
                                observation
                                can be
                                connected
                                to several
                                topics,
                                conditions
                                or methods,
                                so category
                                counts are
                                not
                                mutually
                                exclusive.
                            </MeaningCard>

                            <MeaningCard
                                icon={
                                    Users
                                }
                                title="Participation, not effectiveness"
                            >
                                These
                                numbers
                                describe
                                collection
                                activity
                                and
                                coverage.
                                They do
                                not measure
                                treatment
                                outcomes
                                or medical
                                effectiveness.
                            </MeaningCard>
                        </div>
                    </article>
                </div>
            </section>

            {/* CTA */}
            <section className="pb-8">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="flex flex-col justify-between gap-5 rounded-lg bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] px-7 py-7 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#112C40]">
                                Explore the
                                observations
                                behind the
                                numbers.
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-[#596A75]">
                                Read
                                individual
                                observations
                                and explore
                                how they
                                connect to
                                topics and
                                research.
                            </p>
                        </div>

                        <a
                            href="/observations"
                            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[#087A75] px-7 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                        >
                            Browse
                            observations
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}

function MeaningCard({
                         icon: Icon,
                         title,
                         children,
                     }: {
    icon:
        typeof Info;

    title:
        string;

    children:
        string;
}) {
    return (
        <div className="flex gap-4 md:border-r md:border-[#DDE6E6] md:pr-6 md:last:border-r-0">
            <Icon
                size={30}
                strokeWidth={
                    1.6
                }
                className="mt-0.5 shrink-0 text-[#138A83]"
            />

            <div>
                <h3 className="text-sm font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#596A75]">
                    {children}
                </p>
            </div>
        </div>
    );
}
