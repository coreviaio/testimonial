import {
    Activity,
    ArrowRight,
    BookOpen,
    Droplet,
    FlaskConical,
    HeartPulse,
    Network,
} from 'lucide-react';

import type {
    PublicResearchReference,
    TopicCategoryKey,
    TopicDirectoryItem,
} from '@/types/frontend';

function getTopicIcon(
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

        default:
            return BookOpen;
    }
}

export function TopicDirectoryCard({
                                       topic,
                                   }: {
    topic:
        TopicDirectoryItem;
}) {
    const Icon =
        getTopicIcon(
            topic.type,
        );

    const content = (
        <>
            <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-xl bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={30}
                    strokeWidth={
                        1.7
                    }
                />
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold tracking-[-0.02em] text-[#112C40]">
                    {topic.name}
                </h3>

                {topic.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#596A75]">
                        {
                            topic.description
                        }
                    </p>
                )}

                <p className="mt-4 text-sm text-[#596A75]">
                    {
                        topic.observationCount
                    }{' '}
                    {topic.observationCount ===
                    1
                        ? 'observation'
                        : 'observations'}
                </p>
            </div>

            {topic.url && (
                <ArrowRight
                    size={20}
                    className="shrink-0 self-end text-[#138A83]"
                />
            )}
        </>
    );

    if (topic.url) {
        return (
            <a
                href={topic.url}
                className="grid min-h-[160px] grid-cols-[auto_1fr_auto] gap-5 rounded-lg border border-[#DDE6E6] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#138A83]/40 hover:shadow-md"
            >
                {content}
            </a>
        );
    }

    return (
        <article className="grid min-h-[160px] grid-cols-[auto_1fr] gap-5 rounded-lg border border-[#DDE6E6] bg-white p-5">
            {content}
        </article>
    );
}

export function TopicResearchCard({
                                      reference,
                                  }: {
    reference:
        PublicResearchReference;
}) {
    return (
        <article className="overflow-hidden rounded-lg border border-[#DDE6E6] bg-white">
            <div className="grid h-32 place-items-center bg-[linear-gradient(135deg,#EDF7F4,#DDF1EC)]">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-[#138A83]/15 bg-white/75 text-[#138A83] shadow-sm">
                    <BookOpen
                        size={30}
                        strokeWidth={
                            1.6
                        }
                    />
                </span>
            </div>

            <div className="p-5">
                <h3 className="line-clamp-2 text-base leading-6 font-bold text-[#112C40]">
                    {
                        reference.title
                    }
                </h3>

                {typeof reference.observationCount
                    ===
                    'number' && (
                        <p className="mt-2 text-sm leading-5 text-[#596A75]">
                            Connected to{' '}
                            {
                                reference.observationCount
                            }{' '}
                            {reference.observationCount ===
                            1
                                ? 'public observation'
                                : 'public observations'}
                            .
                        </p>
                    )}

                {reference.url && (
                    <a
                        href={
                            reference.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#087A75]"
                    >
                        Read article

                        <ArrowRight
                            size={16}
                        />
                    </a>
                )}
            </div>
        </article>
    );
}
