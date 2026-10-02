import {
    Activity,
    ArrowRight,
    BookOpen,
    Droplet,
    FlaskConical,
    HeartPulse,
    Network,
    Stethoscope,
    Users,
} from 'lucide-react';

import type {
    PublicResearchReference,
    RelatedTopic,
    TopicCategoryKey,
    TopicDetail,
} from '@/types/frontend';

function topicIcon(
    type: TopicCategoryKey,
) {
    switch (type) {
        case 'condition':
            return Activity;

        case 'organ':
            return HeartPulse;

        case 'method':
            return Droplet;

        case 'research-topic':
            return Network;

        case 'biomarker':
            return FlaskConical;
    }
}

export function TopicHeroIcon({
                                  type,
                              }: {
    type:
        TopicCategoryKey;
}) {
    const Icon =
        topicIcon(type);

    return (
        <span className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full bg-[#DDF1EC] text-[#138A83]">
            <Icon
                size={42}
                strokeWidth={
                    1.5
                }
            />
        </span>
    );
}

export function TopicStats({
                               topic,
                           }: {
    topic:
        TopicDetail;
}) {
    const stats = [
        {
            label:
                'Published observations',

            value:
            topic.observationCount,

            icon:
            BookOpen,
        },

        {
            label:
                'Practitioner contributors',

            value:
            topic.practitionerContributors,

            icon:
            Stethoscope,
        },

        {
            label:
                'Linked research articles',

            value:
            topic.linkedResearchArticles,

            icon:
            Network,
        },
    ];

    return (
        <div className="mt-9 grid max-w-[720px] grid-cols-1 gap-0 sm:grid-cols-3">
            {stats.map(
                (
                    stat,
                    index,
                ) => {
                    const Icon =
                        stat.icon;

                    return (
                        <div
                            key={
                                stat.label
                            }
                            className={`flex items-center gap-4 py-3 sm:block sm:px-6 sm:text-center ${
                                index >
                                0
                                    ? 'border-t border-[#C8DDD9] sm:border-t-0 sm:border-l'
                                    : ''
                            }`}
                        >
                            <Icon
                                size={
                                    23
                                }
                                className="text-[#138A83] sm:hidden"
                            />

                            <strong className="block text-[26px] leading-none font-bold text-[#112C40]">
                                {
                                    stat.value
                                }
                            </strong>

                            <span className="mt-2 block text-xs leading-5 text-[#596A75]">
                                {
                                    stat.label
                                }
                            </span>
                        </div>
                    );
                },
            )}
        </div>
    );
}

export function TopicResearchRow({
                                     reference,
                                 }: {
    reference:
        PublicResearchReference;
}) {
    return (
        <article className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[#DDE6E6] py-5 last:border-b-0">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#EDF6F3] text-[#138A83]">
                <BookOpen
                    size={23}
                    strokeWidth={
                        1.6
                    }
                />
            </span>

            <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-[0.08em] text-[#6D7E86] uppercase">
                    Research
                    reference
                </span>

                <h3 className="mt-1 text-sm leading-5 font-bold text-[#112C40]">
                    {
                        reference.title
                    }
                </h3>

                {typeof reference.observationCount
                    ===
                    'number' && (
                        <p className="mt-1 text-xs text-[#75868F]">
                            Connected
                            to{' '}
                            {
                                reference.observationCount
                            }{' '}
                            {reference.observationCount ===
                            1
                                ? 'observation'
                                : 'observations'}
                            .
                        </p>
                    )}
            </div>

            {reference.url && (
                <a
                    href={
                        reference.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#087A75]"
                >
                    Open

                    <ArrowRight
                        size={
                            15
                        }
                    />
                </a>
            )}
        </article>
    );
}

export function RelatedTopicCard({
                                     topic,
                                 }: {
    topic:
        RelatedTopic;
}) {
    const Icon =
        topicIcon(
            topic.type,
        );

    return (
        <a
            href={
                topic.url
            }
            className="grid min-h-[92px] grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-[#DDE6E6] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#138A83]/40 hover:shadow-sm"
        >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={
                        25
                    }
                    strokeWidth={
                        1.6
                    }
                />
            </span>

            <div className="min-w-0">
                <strong className="block truncate text-sm font-bold text-[#112C40]">
                    {
                        topic.name
                    }
                </strong>

                <span className="mt-1 block text-xs text-[#687B84]">
                    {
                        topic.overlapCount
                    }{' '}
                    shared{' '}
                    {topic.overlapCount ===
                    1
                        ? 'observation'
                        : 'observations'}
                </span>
            </div>

            <ArrowRight
                size={18}
                className="text-[#138A83]"
            />
        </a>
    );
}
