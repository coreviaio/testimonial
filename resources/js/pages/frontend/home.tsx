import {
    Head,
} from '@inertiajs/react';

import {
    ArrowRight,
    CheckCircle2,
    Stethoscope,
} from 'lucide-react';

import {
    EmptySection,
    FAQ,
    HeroArtwork,
    ObservationCard,
    ProcessSteps,
    ResearchCard,
    StatGrid,
    TopicCard,
} from '@/components/frontend/home/home-components';

import type {
    FrontendHomeProps,
} from '@/types/frontend';

export default function Home({
                                 stats,
                                 latestObservations,
                                 heroObservation,
                                 topics,
                                 researchReferences,
                             }: FrontendHomeProps) {
    return (
        <>
            <Head title="Stories">
                <meta
                    name="description"
                    content="Explore thoughtfully reviewed observations connected to molecular hydrogen research."
                />
            </Head>

            {/* Hero */}
            <section className="overflow-hidden bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_48%,#E5F5F2_100%)]">
                <div className="mx-auto grid max-w-[1220px] items-center px-5 lg:min-h-[430px] lg:grid-cols-[0.95fr_1.05fr] lg:px-6">
                    <div className="relative z-10 py-14 lg:py-16">
                        <p className="mb-4 text-xs font-bold tracking-[0.1em] text-[#087A75] uppercase">
                            Community
                            observations
                        </p>

                        <h1 className="max-w-[650px] text-[38px] leading-[1.06] font-bold tracking-[-0.04em] text-[#112C40] sm:text-[46px] lg:text-[58px]">
                            Personal
                            experiences.
                            <br />
                            A shared
                            understanding.
                        </h1>

                        <p className="mt-5 max-w-[580px] text-[17px] leading-7 text-[#506773] lg:text-xl">
                            Explore
                            thoughtfully
                            reviewed
                            observations
                            connected to
                            molecular
                            hydrogen
                            research.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href="/observations"
                                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#087A75] px-7 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                            >
                                Explore
                                observations
                            </a>

                            <a
                                href="#process"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#087A75] bg-white/70 px-7 text-sm font-semibold text-[#087A75] transition hover:bg-white"
                            >
                                How it works
                            </a>
                        </div>
                    </div>

                    <HeroArtwork
                        observation={
                            heroObservation
                        }
                    />
                </div>
            </section>

            {/* Dynamic statistics */}
            <section
                id="statistics"
                className="py-7"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <StatGrid
                        stats={
                            stats
                        }
                    />
                </div>
            </section>

            {/* Dynamic latest observations */}
            <section
                id="observations"
                className="py-14"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="mb-6 flex items-end justify-between gap-5">
                        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                            Latest
                            observations
                        </h2>
                    </div>

                    {latestObservations.length >
                    0 ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {latestObservations.map(
                                (
                                    observation
                                ) => (
                                    <ObservationCard
                                        key={
                                            observation.id
                                        }
                                        observation={
                                            observation
                                        }
                                    />
                                )
                            )}
                        </div>
                    ) : (
                        <EmptySection>
                            Published
                            observations
                            will appear
                            here once
                            they are
                            available.
                        </EmptySection>
                    )}
                </div>
            </section>

            {/* Dynamic topics */}
            <section
                id="topics"
                className="pb-16"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                            Find a topic that matters to you
                        </h2>

                        <a
                            href="/topics"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#087A75]"
                        >
                            Explore all topics

                            <ArrowRight
                                size={17}
                            />
                        </a>
                    </div>

                    {topics.length >
                    0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {topics.map(
                                (
                                    topic
                                ) => (
                                    <TopicCard
                                        key={
                                            `${topic.type}-${topic.id}`
                                        }
                                        topic={
                                            topic
                                        }
                                    />
                                )
                            )}
                        </div>
                    ) : (
                        <EmptySection>
                            Topics will
                            appear here
                            when
                            published
                            observations
                            have research
                            topic
                            mappings.
                        </EmptySection>
                    )}
                </div>
            </section>

            {/* Dynamic research connections */}
            <section className="py-16">
                <div className="mx-auto grid max-w-[1220px] gap-10 px-5 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-6">
                    <div>
                        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                            Connect
                            experiences
                            with research
                        </h2>

                        <p className="mt-4 max-w-[620px] text-base leading-7 text-[#596A75]">
                            Published
                            observations
                            can be linked
                            to relevant
                            research
                            references so
                            readers can
                            explore the
                            broader
                            research
                            context
                            behind the
                            experience.
                        </p>
                    </div>

                    <div>
                        <p className="mb-3 text-sm font-semibold text-[#112C40]">
                            Related
                            reading
                        </p>

                        {researchReferences.length >
                        0 ? (
                            <div className="grid gap-3">
                                {researchReferences.map(
                                    (
                                        reference
                                    ) => (
                                        <ResearchCard
                                            key={
                                                reference.id
                                            }
                                            reference={
                                                reference
                                            }
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <EmptySection>
                                Linked
                                research
                                will appear
                                here when
                                published
                                observations
                                have article
                                mappings.
                            </EmptySection>
                        )}
                    </div>
                </div>
            </section>

            {/* Static process */}
            <section
                id="process"
                className="bg-[linear-gradient(90deg,#EBF7F4,#F1FAF7)] py-16"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <h2 className="mb-7 text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                        From
                        observation to
                        publication
                    </h2>

                    <ProcessSteps />
                </div>
            </section>

            {/* Static practitioner CTA */}
            <section
                id="practitioners"
                className="py-16"
            >
                <div className="mx-auto grid max-w-[1220px] items-center gap-10 px-5 md:grid-cols-[0.8fr_1.2fr] lg:px-6">
                    <div className="relative min-h-[230px] overflow-hidden rounded-2xl bg-[#EDF6F3]">
                        <div className="absolute top-1/2 left-1/2 h-40 w-56 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-xl border border-[#138A83]/20 bg-[#DDF1EC] shadow-lg" />

                        <div className="absolute top-1/2 left-1/2 grid h-40 w-60 -translate-x-[42%] -translate-y-[54%] rotate-3 place-items-center rounded-xl border border-[#138A83]/20 bg-white shadow-xl">
                            <Stethoscope
                                size={
                                    46
                                }
                                strokeWidth={
                                    1.4
                                }
                                className="text-[#138A83]"
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-bold tracking-[0.1em] text-[#087A75] uppercase">
                            For
                            practitioners
                        </p>

                        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                            Contribute
                            your
                            professional
                            observations
                        </h2>

                        <p className="mt-4 max-w-[650px] text-base leading-7 text-[#596A75]">
                            Healthcare
                            practitioners
                            and
                            researchers
                            can share
                            carefully
                            documented,
                            de-identified
                            observations
                            using the
                            existing
                            practitioner
                            workflow.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium text-[#4B636E]">
                            <span className="flex items-center gap-2">
                                <CheckCircle2
                                    size={
                                        18
                                    }
                                    className="text-[#138A83]"
                                />

                                Structured
                                observations
                            </span>

                            <span className="flex items-center gap-2">
                                <CheckCircle2
                                    size={
                                        18
                                    }
                                    className="text-[#138A83]"
                                />

                                Consent-led
                                contributions
                            </span>
                        </div>

                        <a
                            href="/for-practitioners"
                            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#087A75] px-6 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                        >
                            For
                            practitioners

                            <ArrowRight
                                size={17}
                            />
                        </a>
                    </div>
                </div>
            </section>

            {/* Static FAQ */}
            <section
                id="faq"
                className="pb-14"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <h2 className="mb-5 text-[28px] font-bold tracking-[-0.03em] text-[#112C40] lg:text-[32px]">
                        A few common
                        questions
                    </h2>

                    <FAQ />
                </div>
            </section>

            {/* Static CTA */}
            <section
                id="contribute"
                className="bg-[linear-gradient(105deg,#0B3A53,#082F45)] text-white"
            >
                <div className="mx-auto flex max-w-[1220px] flex-col justify-between gap-6 px-5 py-9 md:flex-row md:items-center lg:px-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-[-0.02em]">
                            Help build a
                            more useful
                            collection of
                            observations.
                        </h2>

                        <p className="mt-2 text-sm text-white/75">
                            Share your
                            experience,
                            explore
                            others'
                            observations,
                            and connect
                            them with the
                            research.
                        </p>
                    </div>

                    <a
                        href="#process"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-[#13A79D] px-7 text-sm font-semibold text-white transition hover:bg-[#0E9188]"
                    >
                        Learn how to
                        contribute
                    </a>
                </div>
            </section>
        </>
    );
}
