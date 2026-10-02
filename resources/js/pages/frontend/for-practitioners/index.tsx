import {
    Head,
} from '@inertiajs/react';

import {
    ArrowRight,
    CalendarDays,
    ClipboardList,
    Clock3,
    FileText,
    MessageSquareText,
    ShieldCheck,
} from 'lucide-react';

import {
    applicationChecklist,
    BenefitCard,
    ChecklistItem,
    ObservationFieldCard,
    practitionerBenefits,
    PractitionerFaq,
    practitionerSteps,
    PractitionerStep,
    privacyItems,
    PrivacyItem,
    ResearchDeskArtwork,
} from '@/components/frontend/for-practitioners/practitioner-components';

import type {
    FrontendForPractitionersProps,
} from '@/types/frontend';

const observationFields = [
    {
        icon:
        ClipboardList,

        title:
            'Context',

        description:
            'Relevant background that helps the reader understand the situation around the observation.',
    },

    {
        icon:
        FileText,

        title:
            'Observation',

        description:
            'A clear description of what was observed, without presenting the experience as proof of effectiveness.',
    },

    {
        icon:
        CalendarDays,

        title:
            'Duration',

        description:
            'The period over which the observation or routine took place.',
    },

    {
        icon:
        Clock3,

        title:
            'Frequency',

        description:
            'How often the relevant activity or observation occurred.',
    },

    {
        icon:
        MessageSquareText,

        title:
            'Timeline',

        description:
            'Useful points in time that help explain when changes or events were recorded.',
    },

    {
        icon:
        ShieldCheck,

        title:
            'Relevant notes',

        description:
            'Additional context that may help interpretation without exposing private identifying information.',
    },
];

const questions = [
    {
        question:
            'How are practitioner credentials reviewed?',

        answer:
            'The practitioner application requires professional information, license details, a primary credential or certificate, and a license or registration document. Submitted applications enter a manual verification workflow where they may be approved, returned for changes or rejected. No fixed approval time is promised.',
    },

    {
        question:
            'What practitioner information can be shown publicly?',

        answer:
            'The application includes a public identity preference. A practitioner can choose whether their identity may be displayed publicly and may provide a public display name and professional description. When public identity is not enabled, public observations use a general practitioner label instead.',
    },

    {
        question:
            'How is patient consent handled?',

        answer:
            'Approved practitioners use the existing patient-consent workflow. Consent can be confirmed or withdrawn, and the current public eligibility rules require the latest applicable consent to remain confirmed before a practitioner observation is included publicly.',
    },
];

function statusClass(
    status:
        string | null,
) {
    switch (status) {
        case 'approved':
            return 'border-[#A9D9D0] bg-[#E7F6F2] text-[#087A75]';

        case 'pending_verification':
            return 'border-[#ECD6A1] bg-[#FFF8E7] text-[#8A6415]';

        case 'changes_requested':
            return 'border-[#ECD6A1] bg-[#FFF8E7] text-[#8A6415]';

        case 'rejected':
            return 'border-[#E8C4C4] bg-[#FFF2F2] text-[#9B4141]';

        default:
            return 'border-[#DDE6E6] bg-[#F6F9F9] text-[#596A75]';
    }
}

export default function ForPractitionersIndex({
                                                  application,
                                              }: FrontendForPractitionersProps) {
    return (
        <>
            <Head title="For practitioners">
                <meta
                    name="description"
                    content="Learn about practitioner verification, consent-led observations and the professional contribution workflow."
                />
            </Head>

            {/* Hero */}
            <section className="overflow-hidden bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_48%,#E6F5F2_100%)]">
                <div className="mx-auto grid max-w-[1220px] items-stretch md:grid-cols-2">
                    <div className="px-5 py-12 md:py-14 lg:px-6">
                        <p className="text-xs font-bold tracking-[0.1em] text-[#087A75] uppercase">
                            For practitioners
                        </p>

                        <h1 className="mt-3 max-w-[620px] text-[38px] leading-[1.07] font-bold tracking-[-0.04em] text-[#112C40] md:text-[48px]">
                            Bring a professional perspective to the collection.
                        </h1>

                        <p className="mt-4 max-w-[610px] text-[17px] leading-7 text-[#526A76]">
                            Contribute carefully documented, de-identified
                            observations and connect them with a wider research
                            context.
                        </p>

                        {application.statusLabel && (
                            <div
                                className={`mt-5 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(
                                    application.status,
                                )}`}
                            >
                                Application status:{' '}
                                {application.statusLabel}
                            </div>
                        )}

                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                href={
                                    application.url
                                }
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                            >
                                {application.label}

                                <ArrowRight
                                    size={17}
                                />
                            </a>

                            <a
                                href="#contribution-process"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#087A75] bg-white/70 px-6 text-sm font-semibold text-[#087A75] transition hover:bg-white"
                            >
                                How contributions work

                                <ArrowRight
                                    size={17}
                                />
                            </a>
                        </div>

                        {!application.isAuthenticated && (
                            <p className="mt-3 text-xs leading-5 text-[#6F818A]">
                                Sign in is required to open the practitioner
                                application.
                            </p>
                        )}
                    </div>

                    <ResearchDeskArtwork />
                </div>
            </section>

            {/* Benefits */}
            <section className="border-b border-[#E1E9E9] bg-white">
                <div className="mx-auto grid max-w-[1220px] gap-2 px-5 py-5 md:grid-cols-3 lg:px-6">
                    {practitionerBenefits.map(
                        (
                            benefit,
                            index,
                        ) => (
                            <div
                                key={
                                    benefit.title
                                }
                                className={
                                    index > 0
                                        ? 'md:border-l md:border-[#DDE6E6] md:pl-5'
                                        : ''
                                }
                            >
                                <BenefitCard
                                    {...benefit}
                                />
                            </div>
                        ),
                    )}
                </div>
            </section>

            {/* Who can apply */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto grid max-w-[1220px] gap-10 px-5 lg:grid-cols-[1fr_0.95fr] lg:px-6">
                    <div>
                        <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Who can apply?
                        </h2>

                        <p className="mt-4 max-w-[650px] text-base leading-7 text-[#596A75]">
                            The practitioner pathway is intended for people who
                            can provide professional details and verifiable
                            credential or registration information for manual
                            review.
                        </p>

                        <p className="mt-3 max-w-[650px] text-base leading-7 text-[#596A75]">
                            The application asks about your practitioner type,
                            professional title, specialty, professional
                            background and licensing or registration details.
                            Submission also requires the applicable credential
                            documents and acknowledgements.
                        </p>

                        <p className="mt-3 max-w-[650px] text-sm leading-6 text-[#6B7E87]">
                            Submitting an application does not guarantee
                            approval or a specific review time.
                        </p>
                    </div>

                    <aside className="rounded-lg border border-[#DDE6E6] bg-white p-6 shadow-[0_4px_18px_rgba(17,44,64,0.03)]">
                        <h3 className="text-xl font-bold tracking-[-0.02em] text-[#112C40]">
                            Prepare your application
                        </h3>

                        <div className="mt-5 divide-y divide-[#E4EBEB]">
                            {applicationChecklist.map(
                                (
                                    item,
                                ) => (
                                    <ChecklistItem
                                        key={
                                            item.title
                                        }
                                        {...item}
                                    />
                                ),
                            )}
                        </div>
                    </aside>
                </div>
            </section>

            {/* Process */}
            <section
                id="contribution-process"
                className="scroll-mt-5 bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] py-12"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div>
                        <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                            A clear path to contributing
                        </h2>

                        <p className="mt-2 max-w-[760px] text-sm leading-6 text-[#596A75]">
                            Verification, consent and observation review are
                            separate parts of the professional contribution
                            workflow.
                        </p>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {practitionerSteps.map(
                            (
                                step,
                            ) => (
                                <PractitionerStep
                                    key={
                                        step.number
                                    }
                                    {...step}
                                />
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* Privacy / people */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto grid max-w-[1220px] gap-9 px-5 lg:grid-cols-[1fr_0.95fr] lg:px-6">
                    <div>
                        <h2 className="max-w-[600px] text-[30px] leading-tight font-bold tracking-[-0.03em] text-[#112C40]">
                            Respecting the people behind each observation
                        </h2>

                        <p className="mt-4 max-w-[650px] text-base leading-7 text-[#596A75]">
                            Professional observations should preserve useful
                            context without exposing patient-identifying
                            information.
                        </p>

                        <p className="mt-3 max-w-[650px] text-base leading-7 text-[#596A75]">
                            The existing practitioner workflow separates
                            patient management, consent and observation review
                            from the public website. Public pages do not expose
                            patient records or consent-management screens.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {privacyItems.map(
                            (
                                item,
                            ) => (
                                <PrivacyItem
                                    key={
                                        item.title
                                    }
                                    {...item}
                                />
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* Useful observation */}
            <section className="bg-[linear-gradient(100deg,#EDF8F5,#F5FAF9)] py-12">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                        What a useful observation includes
                    </h2>

                    <p className="mt-2 max-w-[760px] text-sm leading-6 text-[#596A75]">
                        Clear, structured context helps readers understand what
                        was recorded without turning an individual experience
                        into a medical claim.
                    </p>

                    <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {observationFields.map(
                            (
                                item,
                            ) => (
                                <ObservationFieldCard
                                    key={
                                        item.title
                                    }
                                    {...item}
                                />
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-12">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                        Practitioner questions
                    </h2>

                    <div className="mt-6 space-y-3">
                        {questions.map(
                            (
                                question,
                            ) => (
                                <PractitionerFaq
                                    key={
                                        question.question
                                    }
                                    question={
                                        question.question
                                    }
                                    answer={
                                        question.answer
                                    }
                                />
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* Final action */}
            <section className="bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] py-9">
                <div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-6 px-5 text-center md:items-center lg:px-6">
                    <div>
                        <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Ready to contribute your professional perspective?
                        </h2>

                        <p className="mx-auto mt-2 max-w-[700px] text-sm leading-6 text-[#596A75]">
                            Start or continue the existing practitioner
                            application and verification process.
                        </p>

                        {application.statusLabel && (
                            <span
                                className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(
                                    application.status,
                                )}`}
                            >
                                Current status:{' '}
                                {application.statusLabel}
                            </span>
                        )}
                    </div>

                    <a
                        href={
                            application.url
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#087A75] px-7 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                    >
                        {application.label}

                        <ArrowRight
                            size={17}
                        />
                    </a>
                </div>
            </section>
        </>
    );
}
