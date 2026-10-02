import type {
    LucideIcon,
} from 'lucide-react';

import {
    ChevronDown,
} from 'lucide-react';

type QuickHelpCardProps = {
    icon:
        LucideIcon;

    title:
        string;

    description:
        string;

    onClick:
        () => void;
};

export function QuickHelpCard({
                                  icon: Icon,
                                  title,
                                  description,
                                  onClick,
                              }: QuickHelpCardProps) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className="group flex min-h-[125px] w-full items-start gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#138A83]/40 hover:shadow-sm"
        >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={24}
                    strokeWidth={1.7}
                />
            </span>

            <span>
                <strong className="block text-base font-bold text-[#112C40] group-hover:text-[#087A75]">
                    {title}
                </strong>

                <span className="mt-1.5 block text-sm leading-5 text-[#596A75]">
                    {description}
                </span>
            </span>
        </button>
    );
}

type HelpAccordionProps = {
    id:
        string;

    question:
        string;

    answer:
        string;

    isOpen:
        boolean;

    onToggle:
        () => void;
};

export function HelpAccordion({
                                  id,
                                  question,
                                  answer,
                                  isOpen,
                                  onToggle,
                              }: HelpAccordionProps) {
    const panelId =
        `faq-panel-${id}`;

    const buttonId =
        `faq-button-${id}`;

    return (
        <article className="overflow-hidden rounded-md border border-[#DDE6E6] bg-white">
            <h3>
                <button
                    id={
                        buttonId
                    }
                    type="button"
                    aria-expanded={
                        isOpen
                    }
                    aria-controls={
                        panelId
                    }
                    onClick={
                        onToggle
                    }
                    className="flex min-h-14 w-full items-center justify-between gap-5 px-5 py-4 text-left text-sm font-semibold text-[#112C40] transition hover:bg-[#FBFDFD]"
                >
                    <span>
                        {question}
                    </span>

                    <ChevronDown
                        size={19}
                        className={`shrink-0 text-[#087A75] transition-transform duration-200 ${
                            isOpen
                                ? 'rotate-180'
                                : ''
                        }`}
                    />
                </button>
            </h3>

            {isOpen && (
                <div
                    id={
                        panelId
                    }
                    role="region"
                    aria-labelledby={
                        buttonId
                    }
                    className="border-t border-[#EEF2F2] px-5 py-4"
                >
                    <p className="text-sm leading-6 text-[#596A75]">
                        {answer}
                    </p>
                </div>
            )}
        </article>
    );
}
