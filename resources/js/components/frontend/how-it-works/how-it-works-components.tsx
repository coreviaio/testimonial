import {
    BookOpen,
    ChevronDown,
} from 'lucide-react';

import type {
    LucideIcon,
} from 'lucide-react';

type IconCardProps = {
    icon:
        LucideIcon;

    title:
        string;

    description:
        string;
};

export function ContributionTypeCard({
                                         icon: Icon,
                                         title,
                                         description,
                                     }: IconCardProps) {
    return (
        <article className="flex min-h-[190px] gap-5 rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_3px_14px_rgba(17,44,64,0.025)]">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={31}
                    strokeWidth={1.6}
                />
            </span>

            <div>
                <h3 className="text-lg font-bold tracking-[-0.02em] text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

type ProcessStepProps = {
    number:
        number;

    icon:
        LucideIcon;

    title:
        string;

    description:
        string;
};

export function ProcessStep({
                                number,
                                icon: Icon,
                                title,
                                description,
                            }: ProcessStepProps) {
    return (
        <article className="relative rounded-lg border border-[#DCE7E5] bg-white p-5">
            <span className="absolute top-4 left-4 grid h-8 w-8 place-items-center rounded-full bg-[#138A83] text-sm font-bold text-white">
                {number}
            </span>

            <div className="pt-12">
                <Icon
                    size={34}
                    strokeWidth={1.6}
                    className="text-[#138A83]"
                />

                <h3 className="mt-4 text-base font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

export function ReviewMeaningCard({
                                      icon: Icon,
                                      title,
                                      description,
                                  }: IconCardProps) {
    return (
        <article className="flex gap-4 md:border-r md:border-[#DDE6E6] md:pr-7 md:last:border-r-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={25}
                    strokeWidth={1.6}
                />
            </span>

            <div>
                <h3 className="text-base font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

type FaqItemProps = {
    question:
        string;

    answer:
        string;
};

export function FaqItem({
                            question,
                            answer,
                        }: FaqItemProps) {
    return (
        <details className="group rounded-md border border-[#DDE6E6] bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 px-5 py-3 text-sm font-semibold text-[#112C40] [&::-webkit-details-marker]:hidden">
                <span>
                    {question}
                </span>

                <ChevronDown
                    size={19}
                    className="shrink-0 text-[#087A75] transition-transform duration-200 group-open:rotate-180"
                />
            </summary>

            <div className="border-t border-[#EEF2F2] px-5 py-4">
                <p className="text-sm leading-6 text-[#596A75]">
                    {answer}
                </p>
            </div>
        </details>
    );
}

export function NotebookArtwork() {
    return (
        <div
            aria-hidden="true"
            className="relative mx-auto h-[330px] w-full max-w-[520px]"
        >
            <span className="absolute top-4 left-[14%] h-20 w-20 rounded-full border border-[#138A83]/25 bg-[#DDF1EC]/60" />

            <span className="absolute top-16 left-[36%] h-32 w-32 rounded-full border border-[#138A83]/30 bg-[#DDF1EC]/65" />

            <span className="absolute top-3 right-[13%] h-16 w-16 rounded-full border border-[#138A83]/25 bg-[#DDF1EC]/60" />

            <span className="absolute top-[122px] right-[2%] h-10 w-10 rounded-full border border-[#138A83]/25 bg-[#DDF1EC]/60" />

            <span className="absolute top-[73px] left-[26%] h-px w-[105px] rotate-[28deg] bg-[#138A83]/30" />

            <span className="absolute top-[93px] right-[24%] h-px w-[100px] -rotate-[23deg] bg-[#138A83]/30" />

            <div className="absolute right-[8%] bottom-4 left-[8%] flex h-[155px] items-center justify-center rounded-[32px] border border-[#CDE7E2] bg-white/70 shadow-[0_16px_40px_rgba(17,44,64,0.06)] backdrop-blur-sm">
                <BookOpen
                    size={104}
                    strokeWidth={1.1}
                    className="text-[#138A83]"
                />
            </div>
        </div>
    );
}
