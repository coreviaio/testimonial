import {
    Activity,
    ArrowRight,
    BookOpen,
    ChevronDown,
    ClipboardCheck,
    FileText,
    Network,
    Send,
    Stethoscope,
    Users,
} from 'lucide-react';

import {
    useState,
} from 'react';

import type {
    PublicObservation,
    PublicResearchReference,
    PublicStat,
    PublicStatKey,
    PublicTopic,
} from '@/types/frontend';

const statIcons: Record<
    PublicStatKey,
    typeof FileText
> = {
    publishedObservations:
    FileText,

    practitionerContributors:
    Users,

    conditionsRepresented:
    Network,

    linkedResearchArticles:
    BookOpen,
};

export function StatGrid({
                             stats,
                         }: {
    stats: PublicStat[];
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(
                (stat) => {
                    const Icon =
                        statIcons[
                            stat.key
                            ];

                    return (
                        <article
                            key={
                                stat.key
                            }
                            className="flex min-h-[112px] items-center gap-5 rounded-lg border border-[#DDE6E6] bg-white px-6 py-5 shadow-[0_4px_20px_rgba(17,44,64,0.035)]"
                        >
                            <Icon
                                size={38}
                                strokeWidth={
                                    1.7
                                }
                                className="shrink-0 text-[#138A83]"
                            />

                            <div>
                                <strong className="block text-[30px] leading-none font-bold text-[#112C40]">
                                    {
                                        stat.value
                                    }
                                </strong>

                                <span className="mt-2 block text-[13px] text-[#596A75]">
                                    {
                                        stat.label
                                    }
                                </span>
                            </div>
                        </article>
                    );
                }
            )}
        </div>
    );
}

function formatDate(
    value: string
) {
    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    ).format(
        new Date(value)
    );
}

export function ObservationCard({
                                    observation,
                                }: {
    observation: PublicObservation;
}) {
    const ContributorIcon =
        observation.contributorType ===
        'practitioner'
            ? Stethoscope
            : Users;

    const contributorLabel =
        observation.contributorType ===
        'practitioner'
            ? 'Practitioner contribution'
            : 'Community contribution';

    return (
        <article className="flex min-h-[270px] flex-col justify-between rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_4px_18px_rgba(17,44,64,0.03)]">
            <div>
                {observation.topic && (
                    <span className="inline-flex rounded-full bg-[#DDF1EC] px-3 py-1 text-xs font-semibold text-[#087A75]">
                        {
                            observation.topic
                        }
                    </span>
                )}

                <h3 className="mt-3 text-xl leading-7 font-bold tracking-[-0.02em] text-[#112C40]">
                    {
                        observation.title
                    }
                </h3>

                {observation.excerpt && (
                    <p className="mt-2 text-[15px] leading-6 text-[#596A75]">
                        {
                            observation.excerpt
                        }
                    </p>
                )}
            </div>

            <div className="mt-6 border-t border-[#DDE6E6] pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#667A85]">
                    <ContributorIcon
                        size={17}
                        className="text-[#138A83]"
                    />

                    <span>
                        {
                            contributorLabel
                        }
                    </span>

                    <span className="text-[#A7B4BA]">
                        •
                    </span>

                    <time
                        dateTime={
                            observation.publishedAt
                        }
                    >
                        {formatDate(
                            observation.publishedAt
                        )}
                    </time>
                </div>

                {observation.url && (
                    <a
                        href={
                            observation.url
                        }
                        className="mt-4 ml-auto flex w-fit items-center gap-1.5 text-sm font-semibold text-[#087A75]"
                    >
                        Read observation

                        <ArrowRight
                            size={17}
                        />
                    </a>
                )}
            </div>
        </article>
    );
}

export function TopicCard({
                              topic,
                          }: {
    topic: PublicTopic;
}) {
    const content = (
        <>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#EDF6F3] text-[#138A83]">
                <Network
                    size={30}
                    strokeWidth={
                        1.7
                    }
                />
            </span>

            <div className="min-w-0 flex-1">
                <strong className="block truncate text-base font-bold text-[#112C40]">
                    {topic.name}
                </strong>

                <span className="mt-1 block text-xs text-[#596A75]">
                    {
                        topic.observationCount
                    }{' '}
                    {topic.observationCount ===
                    1
                        ? 'observation'
                        : 'observations'}
                </span>
            </div>

            {topic.url && (
                <ArrowRight
                    size={19}
                    className="shrink-0 text-[#138A83]"
                />
            )}
        </>
    );

    if (topic.url) {
        return (
            <a
                href={topic.url}
                className="grid min-h-[96px] grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-[#DDE6E6] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[#138A83]/40 hover:shadow-md"
            >
                {content}
            </a>
        );
    }

    return (
        <div className="grid min-h-[96px] grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-[#DDE6E6] bg-white px-5 py-4">
            {content}
        </div>
    );
}

export function ResearchCard({
                                 reference,
                             }: {
    reference:
        PublicResearchReference;
}) {
    return (
        <article className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-[#DDE6E6] bg-white p-4">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#EDF6F3] text-[#138A83]">
                <FileText
                    size={22}
                />
            </span>

            <div>
                <strong className="block text-sm leading-5 font-semibold text-[#112C40]">
                    {
                        reference.title
                    }
                </strong>

                <span className="mt-1 block text-xs text-[#788A93]">
                    Connected to{' '}
                    {
                        reference.observationCount
                    }{' '}
                    {reference.observationCount ===
                    1
                        ? 'published observation'
                        : 'published observations'}
                </span>
            </div>
        </article>
    );
}

export function EmptySection({
                                 children,
                             }: {
    children: string;
}) {
    return (
        <div className="rounded-lg border border-dashed border-[#C9DADA] bg-[#F8FBFA] px-6 py-10 text-center text-sm text-[#596A75]">
            {children}
        </div>
    );
}

export function HeroArtwork({
                                observation,
                            }: {
    observation:
        PublicObservation | null;
}) {
    return (
        <div className="relative min-h-[360px] overflow-hidden lg:min-h-[430px]">
            <svg
                className="absolute top-0 right-[-90px] h-full w-[650px] max-w-none"
                viewBox="0 0 650 430"
                aria-hidden="true"
            >
                <defs>
                    <radialGradient
                        id="bubble"
                        cx="32%"
                        cy="25%"
                        r="70%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#FFFFFF"
                            stopOpacity="0.95"
                        />

                        <stop
                            offset="38%"
                            stopColor="#C4F0EB"
                            stopOpacity="0.85"
                        />

                        <stop
                            offset="100%"
                            stopColor="#138A83"
                            stopOpacity="0.34"
                        />
                    </radialGradient>
                </defs>

                <g
                    stroke="#65C9C0"
                    strokeWidth="8"
                    strokeLinecap="round"
                >
                    <line
                        x1="120"
                        y1="280"
                        x2="270"
                        y2="205"
                    />

                    <line
                        x1="300"
                        y1="190"
                        x2="430"
                        y2="115"
                    />

                    <line
                        x1="305"
                        y1="215"
                        x2="450"
                        y2="270"
                    />

                    <line
                        x1="470"
                        y1="120"
                        x2="550"
                        y2="185"
                    />
                </g>

                <g>
                    <circle
                        cx="105"
                        cy="292"
                        r="72"
                        fill="url(#bubble)"
                    />

                    <circle
                        cx="286"
                        cy="203"
                        r="61"
                        fill="url(#bubble)"
                    />

                    <circle
                        cx="449"
                        cy="104"
                        r="55"
                        fill="url(#bubble)"
                    />

                    <circle
                        cx="470"
                        cy="286"
                        r="52"
                        fill="url(#bubble)"
                    />

                    <circle
                        cx="570"
                        cy="193"
                        r="48"
                        fill="url(#bubble)"
                    />

                    <circle
                        cx="230"
                        cy="78"
                        r="26"
                        fill="url(#bubble)"
                        opacity="0.75"
                    />
                </g>
            </svg>

            {observation && (
                <div className="absolute right-2 bottom-8 w-[310px] rounded-lg border border-[#DDE6E6] bg-white/95 p-4 shadow-xl backdrop-blur-sm">
                    {observation.topic && (
                        <span className="text-[11px] font-semibold tracking-wide text-[#087A75] uppercase">
                            {
                                observation.topic
                            }
                        </span>
                    )}

                    <h3 className="mt-1.5 text-sm font-bold text-[#112C40]">
                        {
                            observation.title
                        }
                    </h3>

                    {observation.excerpt && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#596A75]">
                            {
                                observation.excerpt
                            }
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

const processSteps = [
    {
        number: 1,
        title: 'Prepare',
        text: 'Document the experience with useful context and relevant details.',
        icon: FileText,
    },

    {
        number: 2,
        title: 'Submit',
        text: 'Share the observation for editorial review.',
        icon: Send,
    },

    {
        number: 3,
        title: 'Review',
        text: 'Content is checked for clarity, consent and presentation.',
        icon: ClipboardCheck,
    },

    {
        number: 4,
        title: 'Publish',
        text: 'Eligible observations can be added to the public collection.',
        icon: BookOpen,
    },
];

export function ProcessSteps() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map(
                (step) => {
                    const Icon =
                        step.icon;

                    return (
                        <article
                            key={
                                step.number
                            }
                            className="rounded-lg bg-white/85 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#138A83] text-sm font-bold text-white">
                                    {
                                        step.number
                                    }
                                </span>

                                <Icon
                                    size={31}
                                    strokeWidth={
                                        1.6
                                    }
                                    className="text-[#138A83]"
                                />
                            </div>

                            <h3 className="mt-5 font-bold text-[#112C40]">
                                {
                                    step.title
                                }
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#596A75]">
                                {
                                    step.text
                                }
                            </p>
                        </article>
                    );
                }
            )}
        </div>
    );
}

const questions = [
    {
        question:
            'What kinds of observations are included?',

        answer:
            'Public observations are intended to share carefully reviewed personal or practitioner experiences with useful context while avoiding unsupported medical claims.',
    },

    {
        question:
            'How are observations reviewed?',

        answer:
            'Practitioner submissions go through review checks covering clarity, de-identification, consent and publication readiness before approval.',
    },

    {
        question:
            'Can anyone contribute an observation?',

        answer:
            'Community members can prepare personal observations, while practitioner contributions use the practitioner verification and consent workflow.',
    },
];

export function FAQ() {
    const [
        openIndex,
        setOpenIndex,
    ] = useState<number | null>(
        null
    );

    return (
        <div className="divide-y divide-[#DDE6E6] border-y border-[#DDE6E6]">
            {questions.map(
                (
                    item,
                    index
                ) => {
                    const isOpen =
                        openIndex ===
                        index;

                    return (
                        <div
                            key={
                                item.question
                            }
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenIndex(
                                        isOpen
                                            ? null
                                            : index
                                    )
                                }
                                className="flex min-h-[58px] w-full items-center justify-between gap-5 py-3 text-left text-sm font-semibold text-[#112C40]"
                                aria-expanded={
                                    isOpen
                                }
                            >
                                <span>
                                    {
                                        item.question
                                    }
                                </span>

                                <ChevronDown
                                    size={19}
                                    className={`shrink-0 text-[#087A75] transition-transform ${
                                        isOpen
                                            ? 'rotate-180'
                                            : ''
                                    }`}
                                />
                            </button>

                            {isOpen && (
                                <p className="max-w-4xl pb-5 text-sm leading-6 text-[#596A75]">
                                    {
                                        item.answer
                                    }
                                </p>
                            )}
                        </div>
                    );
                }
            )}
        </div>
    );
}
