import {
    Head,
} from '@inertiajs/react';

import {
    ArrowRight,
    BookOpen,
    CircleHelp,
    FileText,
    MessageSquareText,
    Network,
    Search,
    ShieldCheck,
    Stethoscope,
    UserRound,
    X,
} from 'lucide-react';

import {
    useMemo,
    useState,
} from 'react';

import {
    HelpAccordion,
    QuickHelpCard,
} from '@/components/frontend/help/help-components';

type HelpCategory =
    | 'all'
    | 'getting-started'
    | 'browsing'
    | 'contributing'
    | 'practitioner'
    | 'privacy'
    | 'research';

type FaqItem = {
    id:
        string;

    category:
        Exclude<
            HelpCategory,
            'all'
        >;

    question:
        string;

    answer:
        string;
};

const categories: {
    value:
        HelpCategory;

    label:
        string;
}[] = [
    {
        value:
            'all',

        label:
            'All questions',
    },

    {
        value:
            'getting-started',

        label:
            'Getting started',
    },

    {
        value:
            'browsing',

        label:
            'Browsing observations',
    },

    {
        value:
            'contributing',

        label:
            'Contributing',
    },

    {
        value:
            'practitioner',

        label:
            'Practitioner verification',
    },

    {
        value:
            'privacy',

        label:
            'Privacy & consent',
    },

    {
        value:
            'research',

        label:
            'Research connections',
    },
];

const faqItems: FaqItem[] = [
    {
        id:
            'what-is-this-collection',

        category:
            'getting-started',

        question:
            'What is this community observation collection?',

        answer:
            'It is a public part of H2 Research that presents reviewed personal and practitioner observations alongside related topics and research references. Observations describe individual experiences and are kept separate from scientific evidence.',
    },

    {
        id:
            'read-without-sign-in',

        category:
            'browsing',

        question:
            'Can I read observations without signing in?',

        answer:
            'Yes. The public homepage, observation browser, public observation details, topic pages, insights, practitioner information and help pages are designed to be readable without signing in.',
    },

    {
        id:
            'review-process',

        category:
            'getting-started',

        question:
            'How are observations reviewed?',

        answer:
            'Public observation pages use approved content rather than exposing editable working content. Practitioner observations also depend on practitioner verification and the applicable consent state before they are eligible for the public collection.',
    },

    {
        id:
            'treatment-effectiveness',

        category:
            'browsing',

        question:
            'Do observations prove that a treatment works?',

        answer:
            'No. An individual observation describes an experience. It does not establish treatment effectiveness, prove causation or replace scientific research or professional medical advice.',
    },

    {
        id:
            'contribute',

        category:
            'contributing',

        question:
            'How can I contribute an observation?',

        answer:
            'The public Contribute action opens the contribution guidance page, which explains the currently available paths. Personal observation records are handled inside the private account area, while practitioners use the separate practitioner application, consent and observation workflow.',
    },

    {
        id:
            'practitioner-eligibility',

        category:
            'practitioner',

        question:
            'Who can apply as a practitioner?',

        answer:
            'The practitioner pathway is intended for applicants who can provide professional information and applicable credential or registration details for manual review. Submitting an application does not guarantee approval or a specific review time.',
    },

    {
        id:
            'public-information',

        category:
            'privacy',

        question:
            'What personal information is shown publicly?',

        answer:
            'Public pages use only information permitted for public display. Practitioner identity is shown only when the relevant public identity preference allows it. Patient names, contact information, private notes, consent documents and private identifiers are not part of the public observation page.',
    },

    {
        id:
            'correction-withdrawal',

        category:
            'privacy',

        question:
            'How can I request a correction or withdrawal?',

        answer:
            'The public website does not expose a general correction or withdrawal form. Where an authenticated observation or consent workflow provides the relevant action, use that signed-in workflow. A separate public support destination should only be shown when a verified support channel is configured.',
    },

    {
        id:
            'research-links',

        category:
            'research',

        question:
            'Why are research articles linked to observations?',

        answer:
            'Research references give readers additional background and a path to explore related topics. A research link does not prove that an individual observation was caused by a treatment or that the observation demonstrates effectiveness.',
    },
];

export default function HelpIndex() {
    const [
        search,
        setSearch,
    ] =
        useState('');

    const [
        selectedCategory,
        setSelectedCategory,
    ] =
        useState<HelpCategory>(
            'all',
        );

    const [
        openFaqId,
        setOpenFaqId,
    ] =
        useState<string | null>(
            null,
        );

    const filteredFaqs =
        useMemo(
            () => {
                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();

                return faqItems.filter(
                    (
                        item,
                    ) => {
                        const matchesCategory =
                            selectedCategory
                            === 'all'
                            || item.category
                            === selectedCategory;

                        if (
                            ! matchesCategory
                        ) {
                            return false;
                        }

                        if (
                            normalizedSearch
                            === ''
                        ) {
                            return true;
                        }

                        const searchableText =
                            `${item.question} ${item.answer}`
                                .toLowerCase();

                        return searchableText.includes(
                            normalizedSearch,
                        );
                    },
                );
            },
            [
                search,
                selectedCategory,
            ],
        );

    const selectCategory = (
        category:
        HelpCategory,
    ) => {
        setSelectedCategory(
            category,
        );

        setOpenFaqId(
            null,
        );

        window.setTimeout(
            () => {
                document
                    .getElementById(
                        'help-content',
                    )
                    ?.scrollIntoView({
                        behavior:
                            'smooth',

                        block:
                            'start',
                    });
            },
            0,
        );
    };

    const clearSearch =
        () => {
            setSearch(
                '',
            );

            setOpenFaqId(
                null,
            );
        };

    return (
        <>
            <Head title="Help & FAQs">
                <meta
                    name="description"
                    content="Find answers about browsing public observations, contributing, practitioner verification, privacy, consent and research connections."
                />
            </Head>

            {/* Hero */}
            <section className="bg-[linear-gradient(100deg,#EFF9F6_0%,#EDF8F5_50%,#E7F5F2_100%)]">
                <div className="mx-auto max-w-[1220px] px-5 py-12 text-center lg:px-6">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/80 text-[#138A83] shadow-sm">
                        <CircleHelp
                            size={32}
                            strokeWidth={1.7}
                        />
                    </span>

                    <h1 className="mt-5 text-[39px] leading-tight font-bold tracking-[-0.04em] text-[#112C40] md:text-[48px]">
                        How can we help?
                    </h1>

                    <p className="mx-auto mt-3 max-w-[700px] text-[17px] leading-7 text-[#526A76]">
                        Find answers about browsing,
                        contributing and understanding
                        the public observation collection.
                    </p>

                    {/* Search */}
                    <div className="relative mx-auto mt-7 max-w-[720px]">
                        <Search
                            size={21}
                            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#71858E]"
                        />

                        <label
                            htmlFor="faq-search"
                            className="sr-only"
                        >
                            Search help questions
                        </label>

                        <input
                            id="faq-search"
                            type="search"
                            value={
                                search
                            }
                            onChange={(
                                event,
                            ) => {
                                setSearch(
                                    event
                                        .target
                                        .value,
                                );

                                setOpenFaqId(
                                    null,
                                );
                            }}
                            placeholder="Search help and FAQs"
                            className="h-13 w-full rounded-md border border-[#CDDADB] bg-white pr-12 pl-12 text-sm text-[#112C40] shadow-sm outline-none placeholder:text-[#81919A] focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={
                                    clearSearch
                                }
                                aria-label="Clear FAQ search"
                                className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#71858E] transition hover:bg-[#EDF6F3] hover:text-[#087A75]"
                            >
                                <X
                                    size={17}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Quick links */}
            <section className="border-b border-[#E4EBEB] bg-white py-8">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <QuickHelpCard
                            icon={
                                BookOpen
                            }
                            title="Reading observations"
                            description="Understand public observations, review and interpretation."
                            onClick={() =>
                                selectCategory(
                                    'browsing',
                                )
                            }
                        />

                        <QuickHelpCard
                            icon={
                                MessageSquareText
                            }
                            title="Contributing"
                            description="Learn about the available contribution paths and workflow."
                            onClick={() =>
                                selectCategory(
                                    'contributing',
                                )
                            }
                        />

                        <QuickHelpCard
                            icon={
                                Stethoscope
                            }
                            title="For practitioners"
                            description="Read about practitioner applications, verification and consent."
                            onClick={() =>
                                selectCategory(
                                    'practitioner',
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            {/* FAQ content */}
            <section
                id="help-content"
                className="scroll-mt-5 bg-[#FBFCFC] py-10 lg:py-12"
            >
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    {/* Mobile category tabs */}
                    <div className="mb-6 overflow-x-auto pb-2 lg:hidden">
                        <div className="flex min-w-max gap-2">
                            {categories.map(
                                (
                                    category,
                                ) => {
                                    const active =
                                        selectedCategory
                                        === category.value;

                                    return (
                                        <button
                                            key={
                                                category.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                selectCategory(
                                                    category.value,
                                                )
                                            }
                                            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${
                                                active
                                                    ? 'border-[#087A75] bg-[#087A75] text-white'
                                                    : 'border-[#D6E0E2] bg-white text-[#526A76] hover:border-[#138A83]/40 hover:text-[#087A75]'
                                            }`}
                                        >
                                            {
                                                category.label
                                            }
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    <div className="grid gap-7 lg:grid-cols-[245px_minmax(0,1fr)]">
                        {/* Desktop category nav */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-5 rounded-lg border border-[#DDE6E6] bg-white p-3">
                                <p className="px-3 pt-2 pb-3 text-xs font-bold tracking-[0.08em] text-[#788A92] uppercase">
                                    Help topics
                                </p>

                                <nav
                                    aria-label="Help categories"
                                    className="space-y-1"
                                >
                                    {categories.map(
                                        (
                                            category,
                                        ) => {
                                            const active =
                                                selectedCategory
                                                === category.value;

                                            return (
                                                <button
                                                    key={
                                                        category.value
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        selectCategory(
                                                            category.value,
                                                        )
                                                    }
                                                    aria-current={
                                                        active
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={`w-full rounded-md px-3 py-2.5 text-left text-sm transition ${
                                                        active
                                                            ? 'bg-[#EDF6F3] font-semibold text-[#087A75]'
                                                            : 'text-[#526A76] hover:bg-[#F5F9F8] hover:text-[#087A75]'
                                                    }`}
                                                >
                                                    {
                                                        category.label
                                                    }
                                                </button>
                                            );
                                        },
                                    )}
                                </nav>
                            </div>
                        </aside>

                        {/* FAQs */}
                        <div className="min-w-0">
                            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#112C40]">
                                        Frequently asked questions
                                    </h2>

                                    <p className="mt-1 text-sm text-[#687B84]">
                                        {
                                            filteredFaqs.length
                                        }{' '}
                                        {filteredFaqs.length
                                        === 1
                                            ? 'answer'
                                            : 'answers'}
                                    </p>
                                </div>

                                {(search
                                    || selectedCategory
                                    !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch(
                                                '',
                                            );

                                            setSelectedCategory(
                                                'all',
                                            );

                                            setOpenFaqId(
                                                null,
                                            );
                                        }}
                                        className="text-sm font-semibold text-[#087A75] hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>

                            {filteredFaqs.length >
                            0 ? (
                                <div className="space-y-3">
                                    {filteredFaqs.map(
                                        (
                                            faq,
                                        ) => (
                                            <HelpAccordion
                                                key={
                                                    faq.id
                                                }
                                                id={
                                                    faq.id
                                                }
                                                question={
                                                    faq.question
                                                }
                                                answer={
                                                    faq.answer
                                                }
                                                isOpen={
                                                    openFaqId
                                                    === faq.id
                                                }
                                                onToggle={() =>
                                                    setOpenFaqId(
                                                        (
                                                            current,
                                                        ) =>
                                                            current
                                                            === faq.id
                                                                ? null
                                                                : faq.id,
                                                    )
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-[#CBDADA] bg-white px-6 py-14 text-center">
                                    <Search
                                        size={32}
                                        className="mx-auto text-[#94A5AC]"
                                    />

                                    <h3 className="mt-4 text-lg font-bold text-[#112C40]">
                                        No answers found
                                    </h3>

                                    <p className="mt-2 text-sm text-[#667A84]">
                                        Try another search or clear your
                                        current filters.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch(
                                                '',
                                            );

                                            setSelectedCategory(
                                                'all',
                                            );

                                            setOpenFaqId(
                                                null,
                                            );
                                        }}
                                        className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-[#087A75] px-5 text-sm font-semibold text-[#087A75] transition hover:bg-[#EDF6F3]"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Support guidance */}
            <section className="py-10">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <div className="grid gap-6 rounded-lg border border-[#D9E7E4] bg-[#EDF7F4] p-6 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-[#112C40]">
                                Still have a question?
                            </h2>

                            <p className="mt-2 max-w-[760px] text-sm leading-6 text-[#596A75]">
                                For contribution and practitioner questions,
                                the public guidance pages explain the currently
                                available workflows. Account-specific actions
                                remain inside the signed-in application.
                            </p>
                        </div>

                        <a
                            href="/how-it-works"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                        >
                            How it works

                            <ArrowRight
                                size={17}
                            />
                        </a>
                    </div>
                </div>
            </section>

            {/* Related links */}
            <section className="pb-12">
                <div className="mx-auto max-w-[1220px] px-5 lg:px-6">
                    <h2 className="text-[25px] font-bold tracking-[-0.02em] text-[#112C40]">
                        Related links
                    </h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <a
                            href="/how-it-works"
                            className="flex items-center justify-between gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5 transition hover:border-[#138A83]/40 hover:shadow-sm"
                        >
                            <span className="flex items-center gap-4">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                                    <FileText
                                        size={22}
                                    />
                                </span>

                                <span className="text-sm font-semibold text-[#112C40]">
                                    Learn how it works
                                </span>
                            </span>

                            <ArrowRight
                                size={17}
                                className="text-[#087A75]"
                            />
                        </a>

                        <a
                            href="/observations"
                            className="flex items-center justify-between gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5 transition hover:border-[#138A83]/40 hover:shadow-sm"
                        >
                            <span className="flex items-center gap-4">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                                    <BookOpen
                                        size={22}
                                    />
                                </span>

                                <span className="text-sm font-semibold text-[#112C40]">
                                    Explore observations
                                </span>
                            </span>

                            <ArrowRight
                                size={17}
                                className="text-[#087A75]"
                            />
                        </a>

                        <a
                            href="/for-practitioners"
                            className="flex items-center justify-between gap-4 rounded-lg border border-[#DDE6E6] bg-white p-5 transition hover:border-[#138A83]/40 hover:shadow-sm"
                        >
                            <span className="flex items-center gap-4">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EDF6F3] text-[#138A83]">
                                    <Stethoscope
                                        size={22}
                                    />
                                </span>

                                <span className="text-sm font-semibold text-[#112C40]">
                                    For practitioners
                                </span>
                            </span>

                            <ArrowRight
                                size={17}
                                className="text-[#087A75]"
                            />
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
