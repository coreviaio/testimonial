import {
    BookOpen,
    FileText,
    Network,
    Stethoscope,
    Users,
} from 'lucide-react';

import type {
    InsightsContributionTypes,
    InsightsCountItem,
    InsightsMonthlyPoint,
    PublicStat,
    PublicStatKey,
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

export function InsightStatGrid({
                                    stats,
                                    scopeLabel,
                                }: {
    stats:
        PublicStat[];

    scopeLabel:
        string;
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
                            className="flex min-h-[118px] items-center gap-5 rounded-lg border border-[#DDE6E6] bg-white px-6 py-5 shadow-[0_3px_14px_rgba(17,44,64,0.03)]"
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

                                <span className="mt-2 block text-[13px] leading-5 text-[#596A75]">
                                    {
                                        stat.label
                                    }
                                </span>

                                <span className="mt-1 block text-[10px] font-medium tracking-wide text-[#829198] uppercase">
                                    {
                                        scopeLabel
                                    }
                                </span>
                            </div>
                        </article>
                    );
                },
            )}
        </div>
    );
}

export function MonthlyPublicationChart({
                                            data,
                                        }: {
    data:
        InsightsMonthlyPoint[];
}) {
    if (
        data.length
        === 0
    ) {
        return (
            <EmptyInsightPanel>
                No public
                observations are
                available in this
                period.
            </EmptyInsightPanel>
        );
    }

    const maximum =
        Math.max(
            ...data.map(
                (
                    item,
                ) =>
                    item.count,
            ),
            1,
        );

    return (
        <div className="overflow-x-auto pb-2">
            <div
                className="flex min-w-max items-end gap-5 border-b border-[#DDE6E6] px-3 pt-6"
                style={{
                    minHeight:
                        260,
                }}
                role="img"
                aria-label="Observations published over time"
            >
                {data.map(
                    (
                        item,
                    ) => {
                        const height =
                            item.count
                            === 0
                                ? 4
                                : Math.max(
                                    18,
                                    Math.round(
                                        (item.count /
                                            maximum)
                                        * 180,
                                    ),
                                );

                        return (
                            <div
                                key={
                                    item.month
                                }
                                className="flex w-[78px] shrink-0 flex-col items-center justify-end"
                            >
                                <strong className="mb-2 text-xs font-bold text-[#112C40]">
                                    {
                                        item.count
                                    }
                                </strong>

                                <div
                                    className="w-12 rounded-t-sm bg-[#138A83]"
                                    style={{
                                        height,
                                    }}
                                />

                                <span className="mt-3 pb-3 text-center text-[11px] leading-4 text-[#647983]">
                                    {
                                        item.label
                                    }
                                </span>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}

export function HorizontalCountBars({
                                        items,
                                    }: {
    items:
        InsightsCountItem[];
}) {
    if (
        items.length
        === 0
    ) {
        return (
            <EmptyInsightPanel>
                No mapped data is
                available for this
                period.
            </EmptyInsightPanel>
        );
    }

    const maximum =
        Math.max(
            ...items.map(
                (
                    item,
                ) =>
                    item.count,
            ),
            1,
        );

    return (
        <div className="space-y-5">
            {items.map(
                (
                    item,
                ) => {
                    const width =
                        Math.max(
                            6,
                            (item.count /
                                maximum)
                            * 100,
                        );

                    const content = (
                        <>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <span className="truncate text-sm font-medium text-[#405864]">
                                    {
                                        item.name
                                    }
                                </span>

                                <strong className="text-sm text-[#112C40]">
                                    {
                                        item.count
                                    }
                                </strong>
                            </div>

                            <div className="h-5 overflow-hidden rounded-sm bg-[#EDF4F2]">
                                <div
                                    className="h-full bg-[#63BDB4]"
                                    style={{
                                        width:
                                            `${width}%`,
                                    }}
                                />
                            </div>
                        </>
                    );

                    if (
                        item.url
                    ) {
                        return (
                            <a
                                key={
                                    item.id
                                }
                                href={
                                    item.url
                                }
                                className="block"
                            >
                                {
                                    content
                                }
                            </a>
                        );
                    }

                    return (
                        <div
                            key={
                                item.id
                            }
                        >
                            {
                                content
                            }
                        </div>
                    );
                },
            )}
        </div>
    );
}

export function ContributionDonut({
                                      data,
                                  }: {
    data:
        InsightsContributionTypes;
}) {
    const total =
        data.total;

    const communityPercent =
        total > 0
            ? (
                data.community
                / total
            )
            * 100
            : 0;

    if (
        total === 0
    ) {
        return (
            <EmptyInsightPanel>
                No contribution data
                is available in this
                period.
            </EmptyInsightPanel>
        );
    }

    return (
        <div className="flex flex-col items-center gap-8 py-3 sm:flex-row sm:justify-center">
            <div
                className="grid h-[190px] w-[190px] shrink-0 place-items-center rounded-full"
                style={{
                    background:
                        `conic-gradient(
                            #138A83 0 ${communityPercent}%,
                            #B8E3DD ${communityPercent}% 100%
                        )`,
                }}
                role="img"
                aria-label={`${data.community} community contributions and ${data.practitioner} practitioner contributions`}
            >
                <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-white text-center">
                    <div>
                        <strong className="block text-3xl font-bold text-[#112C40]">
                            {
                                total
                            }
                        </strong>

                        <span className="mt-1 block text-xs text-[#667A84]">
                            observations
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-w-[210px] space-y-4">
                <div className="flex items-center justify-between gap-8">
                    <span className="flex items-center gap-2 text-sm text-[#596A75]">
                        <span className="h-3 w-3 rounded-full bg-[#138A83]" />

                        Community
                    </span>

                    <strong className="text-sm text-[#112C40]">
                        {
                            data.community
                        }
                    </strong>
                </div>

                <div className="flex items-center justify-between gap-8">
                    <span className="flex items-center gap-2 text-sm text-[#596A75]">
                        <span className="h-3 w-3 rounded-full bg-[#B8E3DD]" />

                        Practitioner
                    </span>

                    <strong className="text-sm text-[#112C40]">
                        {
                            data.practitioner
                        }
                    </strong>
                </div>
            </div>
        </div>
    );
}

export function EmptyInsightPanel({
                                      children,
                                  }: {
    children:
        string;
}) {
    return (
        <div className="grid min-h-[180px] place-items-center rounded-md border border-dashed border-[#D3DFDF] bg-[#FAFCFC] px-6 text-center text-sm leading-6 text-[#687B84]">
            {children}
        </div>
    );
}

export function ResearchConnectionPanel({
                                            count,
                                        }: {
    count: number;
}) {
    return (
        <div className="flex h-full min-h-[290px] flex-col justify-between overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0B3A53,#082F45)] p-7 text-white">
            <div>
                <div className="flex items-start justify-between gap-5">
                    <h2 className="max-w-[310px] text-[27px] leading-tight font-bold tracking-[-0.03em]">
                        Connecting
                        observations
                        with research
                    </h2>

                    <BookOpen
                        size={42}
                        strokeWidth={
                            1.5
                        }
                        className="shrink-0 text-[#6AD6CB]"
                    />
                </div>

                <div className="mt-8 flex items-end gap-3">
                    <strong className="text-5xl leading-none font-bold">
                        {
                            count
                        }
                    </strong>

                    <span className="pb-1 text-sm text-white/80">
                        distinct linked
                        research articles
                    </span>
                </div>

                <p className="mt-5 max-w-[470px] text-sm leading-6 text-white/75">
                    Research references
                    connected to public
                    observations help
                    readers explore the
                    wider context behind
                    shared experiences.
                </p>
            </div>

            <a
                href="/topics"
                className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#6AD6CB]"
            >
                Explore topics
            </a>
        </div>
    );
}
