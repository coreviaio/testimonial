import {
    Brand,
} from './public-header';

export default function PublicFooter() {
    return (
        <footer className="bg-[#0B3A53] text-white">
            <div className="mx-auto max-w-[1220px] px-5 py-8 lg:px-6">
                <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                    <div>
                        <div className="[&_span:last-child]:!text-white [&_span>span]:!bg-transparent">
                            <Brand />
                        </div>

                        <p className="mt-2 text-sm text-white/65">
                            Stories is part of
                            H
                            <sub>
                                2
                            </sub>{' '}
                            Research.
                        </p>
                    </div>

                    <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/80">
                        <a
                            href="https://h2-research.site/"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-white"
                        >
                            Research Library
                        </a>

                        <a
                            href="/how-it-works"
                            className="hover:text-white"
                        >
                            How it works
                        </a>

                        <a
                            href="/help"
                            className="transition hover:text-white"
                        >
                            Help
                        </a>

                        <span>
                            Privacy
                        </span>

                        <span>
                            Terms
                        </span>
                    </nav>
                </div>

                <div className="mt-7 border-t border-white/25 pt-5 text-xs text-white/60">
                    ©{' '}
                    {new Date().getFullYear()}{' '}
                    H
                    <sub>
                        2
                    </sub>{' '}
                    Research
                </div>
            </div>
        </footer>
    );
}
