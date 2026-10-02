import {
    Head,
} from '@inertiajs/react';

import {
    AlertCircle,
    ArrowRight,
    Quote,
} from 'lucide-react';

import {
    ObservationCard,
} from '@/components/frontend/home/home-components';

import {
    AtAGlance,
    CopyLinkButton,
    EditorialReviewNote,
    ResearchReferenceDetailCard,
} from '@/components/frontend/observations/observation-detail-components';

import type {
    FrontendObservationShowProps,
} from '@/types/frontend';

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        },
    ).format(
        new Date(
            value,
        ),
    );
}

function contributorEyebrow(
    type:
        'community'
        | 'practitioner',
) {
    return type
    === 'practitioner'
        ? 'Practitioner contribution'
        : 'Community contribution';
}

export default function ObservationShow({
                                            observation,
                                        }: FrontendObservationShowProps) {
    const pageDescription =
        observation.summary
        ?? 'Read this approved observation and its related research context.';

    return (
        <>
            <Head
                title={
                    observation.title
                }
            >
                <meta
                    name="description"
                    content={
                        pageDescription
                    }
                />
            </Head>

            {/* Header / title */}
            <section className="bg-white">
                <div className="mx-auto max-w-[1220px] px-5 pt-8 pb-10 lg:px-6">
                    {/* Breadcrumb */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex flex-wrap items-center gap-2 text-sm text-[#657A85]"
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
                            href="/observations"
                            className="font-medium text-[#087A75] hover:underline"
                        >
                            Observations
                        </a>

                        <span>
                            /
                        </span>

                        <span className="max-w-[280px] truncate">
                            {
                                observation.title
                            }
                        </span>
                    </nav>

                    <div className="mt-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div className="max-w-[880px]">
                            <p className="text-xs font-bold tracking-[0.1em] text-[#138A83] uppercase">
                                {contributorEyebrow(
                                    observation.contributorType,
                                )}
                            </p>

                            <h1 className="mt-2 text-[36px] leading-[1.08] font-bold tracking-[-0.04em] text-[#112C40] sm:text-[44px] lg:text-[50px]">
                                {
                                    observation.title
                                }
                            </h1>

                            {observation.summary && (
                                <p className="mt-3 max-w-[820px] text-lg leading-7 text-[#596A75]">
                                    {
                                        observation.summary
                                    }
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#70818A]">
                                <span>
                                    Published{' '}
                                    {formatDate(
                                        observation.publishedAt,
                                    )}
                                </span>

                                {observation.isVerifiedPractitioner && (
                                    <>
                                        <span>
                                            •
                                        </span>

                                        <span>
                                            Verified
                                            practitioner
                                        </span>
                                    </>
                                )}
                            </div>

                            {observation.topics.length >
                                0 && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {observation.topics.map(
                                            (
                                                topic,
                                            ) => (
                                                <span
                                                    key={`${topic.type}-${topic.id}`}
                                                    className="inline-flex rounded-full bg-[#DDF1EC] px-3 py-1.5 text-xs font-semibold text-[#087A75]"
                                                >
                                                {
                                                    topic.name
                                                }
                                            </span>
                                            ),
                                        )}
                                    </div>
                                )}
                        </div>

                        <div className="shrink-0">
                            <CopyLinkButton />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main observation */}
            <section className="pb-12">
                <div className="mx-auto grid max-w-[1220px] gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:px-6">
                    <article className="min-w-0">
                        {observation.observation && (
                            <section>
                                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    The observation
                                </h2>

                                <div className="mt-4 whitespace-pre-line text-[16px] leading-7 text-[#596A75]">
                                    {
                                        observation.observation
                                    }
                                </div>
                            </section>
                        )}

                        {observation.conditionText && (
                            <section className="mt-9">
                                <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Routine and
                                    context
                                </h2>

                                <div className="mt-3 whitespace-pre-line text-[16px] leading-7 text-[#596A75]">
                                    {
                                        observation.conditionText
                                    }
                                </div>
                            </section>
                        )}

                        {observation.timelineText && (
                            <section className="mt-9">
                                <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Timeline
                                </h2>

                                <div className="relative mt-4 border-l-2 border-[#CBE7E2] pl-7">
                                    <span className="absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-[#45ADA5] bg-white" />

                                    <div className="whitespace-pre-line text-[16px] leading-7 text-[#596A75]">
                                        {
                                            observation.timelineText
                                        }
                                    </div>
                                </div>
                            </section>
                        )}

                        {observation.publicDisplayNote && (
                            <section className="mt-9">
                                <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Contributor's
                                    reflection
                                </h2>

                                <div className="relative mt-4 rounded-lg border border-[#DDE6E6] bg-white px-12 py-5">
                                    <Quote
                                        size={
                                            25
                                        }
                                        className="absolute top-4 left-4 text-[#138A83]"
                                    />

                                    <p className="whitespace-pre-line text-[15px] leading-7 text-[#596A75]">
                                        {
                                            observation.publicDisplayNote
                                        }
                                    </p>
                                </div>
                            </section>
                        )}
                    </article>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <AtAGlance
                            observation={
                                observation
                            }
                        />

                        <EditorialReviewNote />
                    </div>
                </div>
            </section>

            {/* Medical interpretation note */}
            <section className="border-y border-[#DCEBE8] bg-[#EDF7F4]">
                <div className="mx-auto flex max-w-[1220px] items-start gap-5 px-5 py-6 lg:px-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#138A83] text-[#138A83]">
                        <AlertCircle
                            size={
                                24
                            }
                        />
                    </span>

                    <div>
                        <h2 className="text-base font-bold text-[#112C40]">
                            An individual
                            observation is
                            not evidence of
                            treatment
                            effectiveness.
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#596A75]">
                            These
                            observations
                            share
                            real-world
                            experiences to
                            inform and
                            inspire further
                            research. They
                            should not be
                            taken as proof
                            of treatment
                            effectiveness.
                        </p>
                    </div>
                </div>
            </section>

            {/* Related research */}
            {observation.researchReferences
                .length > 0 && (
                <section className="py-12">
                    <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                        <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Explore the
                            related
                            research
                        </h2>

                        <p className="mt-1 text-sm text-[#596A75]">
                            Explore the
                            research
                            references
                            connected to
                            this approved
                            observation.
                        </p>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            {observation.researchReferences.map(
                                (
                                    reference,
                                ) => (
                                    <ResearchReferenceDetailCard
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

            {/* Related observations */}
            {observation.relatedObservations
                .length > 0 && (
                <section className="bg-[linear-gradient(100deg,#F0F9F7,#EAF6F3)] py-11">
                    <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                                    Related
                                    observations
                                </h2>

                                <p className="mt-1 text-sm text-[#596A75]">
                                    Explore
                                    other
                                    public
                                    observations
                                    connected
                                    through
                                    shared
                                    topics,
                                    conditions
                                    or
                                    methods.
                                </p>
                            </div>

                            <a
                                href="/observations"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#087A75]"
                            >
                                View all
                                observations

                                <ArrowRight
                                    size={
                                        17
                                    }
                                />
                            </a>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {observation.relatedObservations.map(
                                (
                                    relatedObservation,
                                ) => (
                                    <ObservationCard
                                        key={
                                            relatedObservation.id
                                        }
                                        observation={
                                            relatedObservation
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Contribution CTA */}
            <section className="py-7">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="flex flex-col justify-between gap-5 rounded-lg border border-[#D9E9E6] bg-[#EDF7F4] px-6 py-5 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-[#112C40]">
                                Share your
                                own
                                observation
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-[#596A75]">
                                Contribute
                                to the
                                collection
                                and help
                                build a
                                richer
                                understanding
                                of
                                real-world
                                experiences.
                            </p>
                        </div>

                        <a
                            href="/#process"
                            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                        >
                            Learn how to
                            contribute
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
