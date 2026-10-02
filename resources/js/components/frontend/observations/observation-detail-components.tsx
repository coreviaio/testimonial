import {
    BookOpen,
    CalendarDays,
    Check,
    Clock3,
    Copy,
    Droplet,
    ExternalLink,
    Info,
    Stethoscope,
    UserRound,
} from 'lucide-react';

import {
    useState,
} from 'react';

import type {
    PublicObservationDetail,
    PublicResearchReference,
} from '@/types/frontend';

export function CopyLinkButton() {
    const [
        copied,
        setCopied,
    ] = useState(false);

    const copyLink =
        async () => {
            try {
                await navigator
                    .clipboard
                    .writeText(
                        window
                            .location
                            .href,
                    );

                setCopied(
                    true,
                );

                window.setTimeout(
                    () =>
                        setCopied(
                            false,
                        ),
                    2000,
                );
            } catch {
                setCopied(
                    false,
                );
            }
        };

    return (
        <button
            type="button"
            onClick={
                copyLink
            }
            className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
        >
            {copied ? (
                <>
                    <Check
                        size={17}
                    />

                    Copied
                </>
            ) : (
                <>
                    <Copy
                        size={17}
                    />

                    Copy link
                </>
            )}
        </button>
    );
}

export function AtAGlance({
                              observation,
                          }: {
    observation:
        PublicObservationDetail;
}) {
    const firstMethod =
        observation.methods[0]
            ?.name
        ?? null;

    const rows = [
        observation.durationText
            ? {
                icon:
                CalendarDays,

                label:
                    'Observation period',

                value:
                observation.durationText,
            }
            : null,

        observation.frequencyText
            ? {
                icon:
                Clock3,

                label:
                    'Frequency',

                value:
                observation.frequencyText,
            }
            : null,

        firstMethod
            ? {
                icon:
                Droplet,

                label:
                    'Method',

                value:
                firstMethod,
            }
            : null,

        {
            icon:
                observation.isVerifiedPractitioner
                    ? Stethoscope
                    : UserRound,

            label:
                'Contributor',

            value:
            observation.contributorLabel,
        },
    ].filter(
        Boolean,
    ) as {
        icon:
            typeof CalendarDays;

        label: string;

        value: string;
    }[];

    return (
        <aside className="rounded-lg border border-[#DDE6E6] bg-white p-5 shadow-[0_4px_18px_rgba(17,44,64,0.03)]">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[#112C40]">
                At a glance
            </h2>

            <div className="mt-3 divide-y divide-[#DDE6E6]">
                {rows.map(
                    (
                        row,
                    ) => {
                        const Icon =
                            row.icon;

                        return (
                            <div
                                key={
                                    row.label
                                }
                                className="flex gap-4 py-4"
                            >
                                <Icon
                                    size={
                                        25
                                    }
                                    strokeWidth={
                                        1.7
                                    }
                                    className="mt-0.5 shrink-0 text-[#138A83]"
                                />

                                <div>
                                    <strong className="block text-sm font-semibold text-[#112C40]">
                                        {
                                            row.label
                                        }
                                    </strong>

                                    <span className="mt-1 block text-sm leading-5 text-[#596A75]">
                                        {
                                            row.value
                                        }
                                    </span>
                                </div>
                            </div>
                        );
                    },
                )}
            </div>
        </aside>
    );
}

export function EditorialReviewNote() {
    return (
        <aside className="rounded-lg bg-[#EDF6F3] p-5">
            <div className="flex items-start gap-3">
                <Info
                    size={23}
                    className="mt-0.5 shrink-0 text-[#138A83]"
                />

                <div>
                    <h2 className="text-base font-bold text-[#112C40]">
                        About editorial
                        review
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#596A75]">
                        Public
                        observations
                        use content
                        approved through
                        the review
                        process for
                        clarity, consent
                        and appropriate
                        presentation.
                    </p>
                </div>
            </div>
        </aside>
    );
}

export function ResearchReferenceDetailCard({
                                                reference,
                                            }: {
    reference:
        PublicResearchReference;
}) {
    const content = (
        <>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#EDF6F3] text-[#138A83]">
                <BookOpen
                    size={23}
                    strokeWidth={
                        1.7
                    }
                />
            </span>

            <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold tracking-[0.07em] text-[#138A83] uppercase">
                    Related reading
                </span>

                <h3 className="mt-1 text-base leading-6 font-bold text-[#112C40]">
                    {
                        reference.title
                    }
                </h3>

                {!reference.url && (
                    <p className="mt-1 text-xs text-[#71838C]">
                        H
                        <sub>
                            2
                        </sub>{' '}
                        Research
                        reference
                    </p>
                )}
            </div>

            {reference.url && (
                <ExternalLink
                    size={
                        18
                    }
                    className="shrink-0 text-[#087A75]"
                />
            )}
        </>
    );

    if (
        reference.url
    ) {
        return (
            <a
                href={
                    reference.url
                }
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5 transition hover:border-[#138A83]/40 hover:shadow-sm"
            >
                {content}
            </a>
        );
    }

    return (
        <article className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5">
            {content}
        </article>
    );
}
