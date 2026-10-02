import {
    Link,
    usePage,
} from '@inertiajs/react';

import {
    Menu,
    X,
} from 'lucide-react';

import {
    useState,
} from 'react';

import {
    dashboard,
    login,
} from '@/routes';

export function Brand() {
    return (
        <span className="inline-flex items-center gap-3">
            <span
                className="relative block h-8 w-11"
                aria-hidden="true"
            >
                <span className="absolute top-[7px] left-0 h-[18px] w-[18px] rounded-full border-2 border-[#138A83] bg-white" />

                <span className="absolute top-[2px] left-[12px] h-[18px] w-[18px] rounded-full border-2 border-[#138A83] bg-white" />

                <span className="absolute top-[7px] left-[24px] h-[18px] w-[18px] rounded-full border-2 border-[#138A83] bg-white" />
            </span>

            <span className="text-xl font-bold tracking-[-0.02em] text-[#112C40]">
                H
                <sub className="text-[11px]">
                    2
                </sub>{' '}
                Research
            </span>
        </span>
    );
}

const navigation = [
    {
        label: 'Overview',
        href: '/',
        section: 'home',
    },

    {
        label: 'Observations',
        href: '/observations',
        section: 'observations',
    },

    {
        label: 'Topics',
        href: '/topics',
        section: 'topics',
    },

    {
        label: 'Insights',
        href: '/insights',
        section: 'insights',
    },

    {
        label: 'How it works',
        href: '/how-it-works',
        section: 'how-it-works',
    },

    {
        label: 'For practitioners',
        href: '/for-practitioners',
        section: 'for-practitioners',
    },
];

export default function PublicHeader() {
    const [
        open,
        setOpen,
    ] =
        useState(false);

    const page =
        usePage();

    const {
        auth,
    } =
        page.props;

    const currentPath =
        page.url.split(
            '?',
        )[0];

    const isActive = (
        section: string,
    ) => {
        if (
            section
            === 'home'
        ) {
            return currentPath
                === '/';
        }

        if (
            section
            === 'observations'
        ) {
            return currentPath.startsWith(
                '/observations',
            );
        }

        if (
            section
            === 'topics'
        ) {
            return currentPath.startsWith(
                '/topics',
            );
        }

        if (
            section
            === 'insights'
        ) {
            return currentPath.startsWith(
                '/insights',
            );
        }

        if (
            section
            === 'how-it-works'
        ) {
            return currentPath.startsWith(
                '/how-it-works',
            );
        }

        if (
            section
            === 'for-practitioners'
        ) {
            return currentPath.startsWith(
                '/for-practitioners',
            );
        }

        return false;
    };

    return (
        <header className="relative z-50 bg-white">
            {/* Parent header */}
            <div className="border-b border-[#DDE6E6]">
                <div className="mx-auto flex min-h-16 max-w-[1220px] items-center justify-between gap-6 px-5 lg:px-6">
                    <Link href="/">
                        <Brand />
                    </Link>

                    <div className="flex items-center gap-7 text-sm text-[#112C40]">
                        <a
                            href="https://h2-research.site/"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden transition-colors hover:text-[#087A75] md:inline"
                        >
                            Research
                            Library
                        </a>

                        <span className="hidden md:inline">
                            About
                        </span>

                        <span className="hidden md:inline">
                            Contact
                        </span>

                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="font-semibold text-[#087A75]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="font-semibold text-[#087A75]"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Public navigation */}
            <div className="border-b border-[#DDE6E6] bg-[#FBFCFC]">
                <div className="mx-auto grid min-h-[64px] max-w-[1220px] grid-cols-[1fr_auto] items-center gap-5 px-5 lg:grid-cols-[auto_1fr_auto] lg:px-6">
                    <Link
                        href="/"
                        className="text-lg font-bold text-[#112C40]"
                    >
                        Stories
                    </Link>

                    <nav
                        className="hidden h-16 items-stretch justify-start lg:flex"
                        aria-label="Public navigation"
                    >
                        {navigation.map(
                            (
                                item,
                            ) => {
                                const active =
                                    isActive(
                                        item.section,
                                    );

                                return (
                                    <a
                                        key={
                                            item.label
                                        }
                                        href={
                                            item.href
                                        }
                                        aria-current={
                                            active
                                                ? 'page'
                                                : undefined
                                        }
                                        className={`relative flex items-center px-4 text-sm transition-colors hover:text-[#087A75] ${
                                            active
                                                ? 'font-semibold text-[#087A75] after:absolute after:right-3 after:bottom-0 after:left-3 after:h-[3px] after:bg-[#138A83]'
                                                : 'text-[#3F5663]'
                                        }`}
                                    >
                                        {
                                            item.label
                                        }
                                    </a>
                                );
                            },
                        )}
                    </nav>

                    <a
                        href="/#contribute"
                        className="hidden min-h-10 items-center justify-center rounded-md bg-[#087A75] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#06665F] lg:inline-flex"
                    >
                        Contribute
                    </a>

                    <button
                        type="button"
                        onClick={() =>
                            setOpen(
                                (
                                    value,
                                ) =>
                                    !value,
                            )
                        }
                        className="grid h-10 w-10 place-items-center rounded-md border border-[#DDE6E6] text-[#112C40] lg:hidden"
                        aria-expanded={
                            open
                        }
                        aria-label={
                            open
                                ? 'Close navigation'
                                : 'Open navigation'
                        }
                    >
                        {open ? (
                            <X
                                size={
                                    21
                                }
                            />
                        ) : (
                            <Menu
                                size={
                                    21
                                }
                            />
                        )}
                    </button>
                </div>

                {open && (
                    <nav className="border-t border-[#DDE6E6] bg-white px-5 py-4 lg:hidden">
                        <div className="mx-auto grid max-w-[1220px] gap-1">
                            {navigation.map(
                                (
                                    item,
                                ) => {
                                    const active =
                                        isActive(
                                            item.section,
                                        );

                                    return (
                                        <a
                                            key={
                                                item.label
                                            }
                                            href={
                                                item.href
                                            }
                                            onClick={() =>
                                                setOpen(
                                                    false,
                                                )
                                            }
                                            className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                                                active
                                                    ? 'bg-[#EDF6F3] text-[#087A75]'
                                                    : 'text-[#3F5663] hover:bg-[#EDF6F3] hover:text-[#087A75]'
                                            }`}
                                        >
                                            {
                                                item.label
                                            }
                                        </a>
                                    );
                                },
                            )}

                            <a
                                href="/#contribute"
                                onClick={() =>
                                    setOpen(
                                        false,
                                    )
                                }
                                className="mt-2 flex min-h-11 items-center justify-center rounded-md bg-[#087A75] px-5 text-sm font-semibold text-white"
                            >
                                Contribute
                            </a>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
