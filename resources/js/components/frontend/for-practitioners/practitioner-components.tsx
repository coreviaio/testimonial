import {
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    FileText,
    Network,
    Send,
    ShieldCheck,
    Stethoscope,
    UserRound,
    Users,
} from 'lucide-react';

import type {
    LucideIcon,
} from 'lucide-react';

type BenefitCardProps = {
    icon: LucideIcon;

    title: string;

    description: string;
};

export function BenefitCard({
                                icon: Icon,
                                title,
                                description,
                            }: BenefitCardProps) {
    return (
        <article className="flex gap-5 px-2 py-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={29}
                    strokeWidth={1.6}
                />
            </span>

            <div>
                <h3 className="text-base font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

type ChecklistItemProps = {
    icon: LucideIcon;

    title: string;

    description: string;
};

export function ChecklistItem({
                                  icon: Icon,
                                  title,
                                  description,
                              }: ChecklistItemProps) {
    return (
        <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <Icon
                size={23}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0 text-[#138A83]"
            />

            <div>
                <strong className="block text-sm font-bold text-[#112C40]">
                    {title}
                </strong>

                <p className="mt-1 text-xs leading-5 text-[#667A84]">
                    {description}
                </p>
            </div>
        </div>
    );
}

type PractitionerStepProps = {
    number: number;

    title: string;

    description: string;

    icon: LucideIcon;
};

export function PractitionerStep({
                                     number,
                                     title,
                                     description,
                                     icon: Icon,
                                 }: PractitionerStepProps) {
    return (
        <article className="relative rounded-lg border border-[#D7E5E2] bg-white p-5">
            <div className="flex items-center justify-between gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#138A83] text-sm font-bold text-white">
                    {number}
                </span>

                <Icon
                    size={28}
                    strokeWidth={1.6}
                    className="text-[#138A83]"
                />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#112C40]">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#596A75]">
                {description}
            </p>
        </article>
    );
}

type PrivacyItemProps = {
    icon: LucideIcon;

    title: string;

    description: string;
};

export function PrivacyItem({
                                icon: Icon,
                                title,
                                description,
                            }: PrivacyItemProps) {
    return (
        <article className="flex gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                <Icon
                    size={22}
                    strokeWidth={1.7}
                />
            </span>

            <div>
                <h3 className="text-sm font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

type ObservationFieldCardProps = {
    icon: LucideIcon;

    title: string;

    description: string;
};

export function ObservationFieldCard({
                                         icon: Icon,
                                         title,
                                         description,
                                     }: ObservationFieldCardProps) {
    return (
        <article className="flex min-h-[125px] gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5">
            <Icon
                size={25}
                strokeWidth={1.6}
                className="mt-0.5 shrink-0 text-[#138A83]"
            />

            <div>
                <h3 className="text-sm font-bold text-[#112C40]">
                    {title}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#596A75]">
                    {description}
                </p>
            </div>
        </article>
    );
}

type PractitionerFaqProps = {
    question: string;

    answer: string;
};

export function PractitionerFaq({
                                    question,
                                    answer,
                                }: PractitionerFaqProps) {
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

export function ResearchDeskArtwork() {
    return (
        <div
            aria-hidden="true"
            className="relative min-h-[360px] overflow-hidden bg-[linear-gradient(135deg,#F4F9F8,#E2F0ED)]"
        >
            {/* Window */}
            <div className="absolute top-7 left-7 h-36 w-32 rounded-lg border border-white/80 bg-white/45 shadow-sm">
                <span className="absolute top-0 bottom-0 left-1/2 w-px bg-[#CDE0DC]" />

                <span className="absolute top-1/2 right-0 left-0 h-px bg-[#CDE0DC]" />
            </div>

            {/* Plant */}
            <div className="absolute top-16 left-[190px]">
                <span className="absolute top-0 left-7 h-20 w-5 rotate-[-24deg] rounded-[100%_0_100%_0] bg-[#8ABEB5]/65" />

                <span className="absolute top-4 left-12 h-16 w-5 rotate-[25deg] rounded-[100%_0_100%_0] bg-[#77ADA4]/60" />

                <span className="absolute top-8 left-0 h-14 w-5 rotate-[-55deg] rounded-[100%_0_100%_0] bg-[#9AC8C0]/65" />

                <span className="absolute top-[76px] left-5 h-12 w-14 rounded-b-2xl bg-white/90 shadow-sm" />
            </div>

            {/* Desk */}
            <div className="absolute right-0 bottom-0 left-0 h-[165px] bg-[#D5C9B9]/65" />

            {/* Notebook */}
            <div className="absolute right-[8%] bottom-[74px] grid h-[145px] w-[270px] rotate-[-4deg] place-items-center rounded-lg border border-[#D7E2E0] bg-white shadow-[0_18px_35px_rgba(17,44,64,0.13)]">
                <span className="absolute top-0 bottom-0 left-1/2 w-px bg-[#D7E3E1]" />

                <BookOpen
                    size={74}
                    strokeWidth={1.1}
                    className="text-[#138A83]/70"
                />
            </div>

            {/* Papers */}
            <div className="absolute right-[48%] bottom-[84px] h-[105px] w-[145px] rotate-[5deg] rounded-md border border-[#DDE6E6] bg-white shadow-md">
                <FileText
                    size={40}
                    strokeWidth={1.3}
                    className="absolute top-7 left-10 text-[#138A83]/65"
                />
            </div>

            {/* Practitioner hint */}
            <div className="absolute top-[46px] right-[7%] grid h-[90px] w-[90px] place-items-center rounded-full bg-white/70 shadow-sm">
                <Stethoscope
                    size={43}
                    strokeWidth={1.4}
                    className="text-[#138A83]"
                />
            </div>
        </div>
    );
}

export const practitionerBenefits = [
    {
        icon:
        FileText,

        title:
            'Structured observations',

        description:
            'A consistent format helps professional observations include useful context and relevant details.',
    },

    {
        icon:
        Users,

        title:
            'Consent-led contributions',

        description:
            'Practitioner observations are connected to the existing consent workflow before they are eligible for public display.',
    },

    {
        icon:
        Network,

        title:
            'Research connections',

        description:
            'Approved observations can be mapped to relevant topics, methods and research references for additional context.',
    },
];

export const applicationChecklist = [
    {
        icon:
        UserRound,

        title:
            'Professional information',

        description:
            'Provide your practitioner type, professional title, specialty and professional background.',
    },

    {
        icon:
        ClipboardCheck,

        title:
            'Relevant credentials',

        description:
            'Provide your license information plus the required primary credential and license or registration document.',
    },

    {
        icon:
        Stethoscope,

        title:
            'Area of practice',

        description:
            'Describe your specialty, organization and relevant professional experience where applicable.',
    },

    {
        icon:
        ShieldCheck,

        title:
            'Public display preference',

        description:
            'Choose whether your identity may be shown publicly and optionally provide a public display name and professional description.',
    },
];

export const practitionerSteps = [
    {
        number:
            1,

        icon:
        Send,

        title:
            'Apply',

        description:
            'Complete the practitioner application and provide the required professional and credential information.',
    },

    {
        number:
            2,

        icon:
        ClipboardCheck,

        title:
            'Credential review',

        description:
            'The submitted practitioner information and required documents are manually reviewed.',
    },

    {
        number:
            3,

        icon:
        ShieldCheck,

        title:
            'Record consent',

        description:
            'Approved practitioners use the existing consent workflow before submitting an observation about a person in their care.',
    },

    {
        number:
            4,

        icon:
        BookOpen,

        title:
            'Submit observations',

        description:
            'De-identified practitioner observations can enter the review workflow before becoming publicly eligible.',
    },
];

export const privacyItems = [
    {
        icon:
        CheckCircle2,

        title:
            'Confirm consent',

        description:
            'The current public eligibility rules require the latest applicable patient consent to remain confirmed.',
    },

    {
        icon:
        ShieldCheck,

        title:
            'Remove identifying details',

        description:
            'Practitioner submissions should contain de-identified observations rather than patient-identifying information.',
    },

    {
        icon:
        ClipboardCheck,

        title:
            'Review before public display',

        description:
            'Practitioner observations are reviewed for content and presentation before they can appear in the public collection.',
    },
];
