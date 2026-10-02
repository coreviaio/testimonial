import {
    Head,
} from '@inertiajs/react';

import {
    ArrowRight,
    BookOpen,
    ClipboardList,
    EyeOff,
    FileCheck2,
    Link2,
    LockKeyhole,
    MessageSquareText,
    SearchCheck,
    Send,
    ShieldCheck,
    Stethoscope,
    UserRound,
} from 'lucide-react';

import {
    ContributionTypeCard,
    FaqItem,
    NotebookArtwork,
    ProcessStep,
    ReviewMeaningCard,
} from '@/components/frontend/how-it-works/how-it-works-components';

const faqs = [
    {
        question:
            'What should an observation include?',

        answer:
            'A useful observation focuses on what was experienced or recorded, with relevant context such as duration, frequency, timeline and administration method where applicable. It should describe the experience without presenting it as proof of medical effectiveness.',
    },

    {
        question:
            'Can my identity remain private?',

        answer:
            'Public presentation depends on the available identity and display settings. When a public identity is not permitted, the public page uses a general contributor label rather than exposing a private name. Patient identifying information is not shown publicly.',
    },

    {
        question:
            'What happens after an observation is submitted?',

        answer:
            'Practitioner observations can enter the existing review workflow, where content may be reviewed, approved, returned for changes, rejected or archived. Personal observation records currently support draft management, so this public page does not claim that the full personal publication workflow is complete.',
    },

    {
        question:
            'Why are research references connected to observations?',

        answer:
            'Research references provide additional background and context for readers. A linked article does not prove that an individual observation is medically effective or establish a treatment outcome.',
    },
];

export default function HowItWorksIndex() {
    return (
        <>
            <Head title="How it works">
                <meta
                    name="description"
                    content="Learn how public observations are prepared, reviewed, presented and connected with research."
                />
            </Head>

            {/* Hero */}
            <section className="overflow-hidden bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_52%,#E6F5F2_100%)]">
                <div className="mx-auto grid max-w-[1220px] items-center gap-8 px-5 py-10 md:grid-cols-2 lg:px-6 lg:py-14">
                    <div>
                        <p className="text-xs font-bold tracking-[0.1em] text-[#647A84] uppercase">
                            About community observations
                        </p>

                        <h1 className="mt-3 max-w-[620px] text-[39px] leading-[1.08] font-bold tracking-[-0.04em] text-[#112C40] md:text-[49px]">
                            Every observation starts with a question.
                        </h1>

                        <p className="mt-4 max-w-[610px] text-[17px] leading-7 text-[#526A76]">
                            A thoughtful place for sharing real-world
                            experiences and exploring how those observations
                            connect with molecular hydrogen research.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                href="/observations"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                            >
                                Explore observations

                                <ArrowRight
                                    size={17}
                                />
                            </a>

                            <a
                                href="#contribute"
                                className="inline-flex h-12 items-center justify-center rounded-md border border-[#087A75] bg-white/70 px-6 text-sm font-semibold text-[#087A75] transition hover:bg-white"
                            >
                                Learn how to contribute
                            </a>
                        </div>
                    </div>

                    <NotebookArtwork />
                </div>
            </section>

            {/* Community resource */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto grid max-w-[1220px] gap-8 px-5 md:grid-cols-[0.85fr_1.15fr] md:items-center lg:px-6">
                    <div className="flex min-h-[245px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#EDF7F4,#DDF1EC)]">
                        <div className="relative">
                            <span className="absolute -top-8 -left-12 h-20 w-20 rounded-full border border-[#138A83]/20" />

                            <span className="absolute -right-14 -bottom-8 h-16 w-16 rounded-full border border-[#138A83]/20" />

                            <BookOpen
                                size={105}
                                strokeWidth={1.2}
                                className="relative text-[#138A83]"
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[29px] leading-tight font-bold tracking-[-0.03em] text-[#112C40]">
                            A community resource within H
                            <sub className="text-base">
                                2
                            </sub>{' '}
                            Research
                        </h2>

                        <p className="mt-4 text-base leading-7 text-[#596A75]">
                            The public collection brings structured
                            observations together with research topics and
                            references. It gives readers a way to explore
                            real-world experiences while keeping those
                            experiences separate from scientific evidence.
                        </p>

                        <p className="mt-3 text-base leading-7 text-[#596A75]">
                            Research connections provide context for further
                            reading. They are not presented as proof of an
                            individual observation or as treatment advice.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contribution types */}
            <section className="bg-[#FBFCFC] py-12">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="mb-7">
                        <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Two ways to contribute
                        </h2>

                        <p className="mt-2 max-w-[760px] text-base leading-7 text-[#596A75]">
                            Personal and practitioner observations have
                            different workflows and privacy requirements.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <ContributionTypeCard
                            icon={UserRound}
                            title="Personal observations"
                            description="Individuals can record their own experiences in their own words. The current application supports personal draft management, while the complete public submission and publication workflow should only be described once it is fully implemented."
                        />

                        <ContributionTypeCard
                            icon={Stethoscope}
                            title="Practitioner observations"
                            description="Verified practitioners can document de-identified observations connected to people in their care. Public eligibility also depends on the required consent and review state."
                        />
                    </div>
                </div>
            </section>

            {/* Process */}
            <section
                id="process"
                className="scroll-mt-6 bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] py-12"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="text-center">
                        <h2 className="text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                            From your notes to a public observation
                        </h2>

                        <p className="mx-auto mt-2 max-w-[760px] text-sm leading-6 text-[#596A75]">
                            A structured process helps keep public content
                            useful, respectful and connected to appropriate
                            research context.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <ProcessStep
                            number={1}
                            icon={ClipboardList}
                            title="Prepare"
                            description="Record the experience and the context needed to understand what was observed."
                        />

                        <ProcessStep
                            number={2}
                            icon={Send}
                            title="Submit"
                            description="Where a submission workflow is available, provide the required information for review."
                        />

                        <ProcessStep
                            number={3}
                            icon={SearchCheck}
                            title="Review"
                            description="The review process checks content, presentation, consent requirements and relevant context."
                        />

                        <ProcessStep
                            number={4}
                            icon={BookOpen}
                            title="Public display"
                            description="Only content that satisfies the public eligibility rules is shown in the public collection."
                        />
                    </div>

                    <div className="mt-6 rounded-lg border border-[#CFE4DF] bg-white/70 px-5 py-4">
                        <p className="text-sm leading-6 text-[#596A75]">
                            <strong className="font-semibold text-[#112C40]">
                                Current workflow note:
                            </strong>{' '}
                            practitioner observations have a review workflow.
                            Personal records currently support draft
                            management, so this page does not claim a complete
                            personal publication process.
                        </p>
                    </div>
                </div>
            </section>

            {/* Editorial review */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="text-center">
                        <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                            What editorial review means
                        </h2>

                        <p className="mt-2 text-sm text-[#687B84]">
                            Review helps make public observations clearer and
                            safer to read.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-7 md:grid-cols-3">
                        <ReviewMeaningCard
                            icon={MessageSquareText}
                            title="Clear and respectful language"
                            description="Content should describe the observation clearly without unsupported claims or unnecessary identifying details."
                        />

                        <ReviewMeaningCard
                            icon={ShieldCheck}
                            title="Consent and privacy"
                            description="Practitioner observations must satisfy the applicable consent and public-display checks before appearing publicly."
                        />

                        <ReviewMeaningCard
                            icon={Link2}
                            title="Relevant research connections"
                            description="Where mappings exist, observations can be connected with research topics and references to provide further context."
                        />
                    </div>
                </div>
            </section>

            {/* Identity */}
            <section className="bg-[#FBFCFC] py-12">
                <div className="mx-auto grid max-w-[1220px] items-center gap-10 px-5 md:grid-cols-[1.05fr_0.95fr] lg:px-6">
                    <div>
                        <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Your identity. Your choice.
                        </h2>

                        <p className="mt-4 text-base leading-7 text-[#596A75]">
                            Public pages use only information that is permitted
                            for public display. When a contributor's identity
                            is not approved for public display, the observation
                            uses a general contributor label instead.
                        </p>

                        <p className="mt-3 text-base leading-7 text-[#596A75]">
                            Practitioner observations are presented without
                            patient-identifying information. Private client
                            details, contact information, internal notes and
                            private identifiers are not part of the public
                            observation page.
                        </p>
                    </div>

                    <div className="relative mx-auto flex min-h-[260px] w-full max-w-[420px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#EDF7F4,#DDF1EC)]">
                        <span className="absolute top-6 left-8 h-20 w-20 rounded-full bg-white/55" />

                        <span className="absolute right-8 bottom-5 h-24 w-24 rounded-full bg-white/45" />

                        <div className="relative grid h-36 w-36 place-items-center rounded-full border border-[#138A83]/20 bg-white/80 shadow-sm">
                            <ShieldCheck
                                size={70}
                                strokeWidth={1.35}
                                className="text-[#138A83]"
                            />

                            <span className="absolute right-1 bottom-3 grid h-10 w-10 place-items-center rounded-full bg-[#087A75] text-white">
                                <LockKeyhole
                                    size={20}
                                />
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-12">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="max-w-[820px]">
                        <h2 className="text-[29px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Before you contribute
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#596A75]">
                            Common questions about public observations,
                            identity, review and research connections.
                        </p>
                    </div>

                    <div className="mt-6 space-y-3">
                        {faqs.map(
                            (
                                faq,
                            ) => (
                                <FaqItem
                                    key={
                                        faq.question
                                    }
                                    question={
                                        faq.question
                                    }
                                    answer={
                                        faq.answer
                                    }
                                />
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* Contribution guidance */}
            <section
                id="contribute"
                className="scroll-mt-6 bg-[linear-gradient(100deg,#EAF7F4,#F2FAF8)] py-12"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="text-center">
                        <p className="text-xs font-bold tracking-[0.1em] text-[#087A75] uppercase">
                            Contribution guidance
                        </p>

                        <h2 className="mt-2 text-[30px] font-bold tracking-[-0.03em] text-[#112C40]">
                            Choose the path that matches your contribution
                        </h2>

                        <p className="mx-auto mt-2 max-w-[760px] text-sm leading-6 text-[#596A75]">
                            Public pages do not expose private observation or
                            patient-management screens.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <article className="rounded-lg border border-[#D6E5E2] bg-white p-6">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                                <UserRound
                                    size={25}
                                />
                            </span>

                            <h3 className="mt-4 text-lg font-bold text-[#112C40]">
                                Personal experience
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#596A75]">
                                Signed-in users can manage their personal
                                observation records inside the private account
                                area. This public page intentionally does not
                                expose that private route.
                            </p>

                            <p className="mt-4 text-xs leading-5 text-[#75868F]">
                                The complete personal submit, review and public
                                publication flow should not be presented as
                                available until that workflow is implemented.
                            </p>
                        </article>

                        <article className="rounded-lg border border-[#D6E5E2] bg-white p-6">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                                <Stethoscope
                                    size={25}
                                />
                            </span>

                            <h3 className="mt-4 text-lg font-bold text-[#112C40]">
                                Professional observation
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#596A75]">
                                Practitioners use a separate verification and
                                observation workflow. Public practitioner
                                observations also depend on the required
                                consent and review checks.
                            </p>

                            <a
                                href="/#practitioners"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#087A75]"
                            >
                                Practitioner information

                                <ArrowRight
                                    size={16}
                                />
                            </a>
                        </article>
                    </div>
                </div>
            </section>

            {/* Closing CTA */}
            <section className="bg-[#0B3850] py-10 text-white">
                <div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center lg:px-6">
                    <div>
                        <h2 className="text-[27px] font-bold tracking-[-0.02em]">
                            Explore the public collection.
                        </h2>

                        <p className="mt-2 max-w-[680px] text-sm leading-6 text-white/75">
                            Read approved public observations and explore the
                            topics and research connections represented in the
                            collection.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href="/observations"
                            className="inline-flex h-11 items-center justify-center rounded-md bg-[#0A958C] px-6 text-sm font-semibold text-white transition hover:bg-[#087A75]"
                        >
                            Explore observations
                        </a>

                        <a
                            href="/#practitioners"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-white/55 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            For practitioners
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
