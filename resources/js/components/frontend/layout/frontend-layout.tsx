import type {
    ReactNode,
} from 'react';

import PublicFooter from '@/components/frontend/layout/public-footer';

import PublicHeader from '@/components/frontend/layout/public-header';

export default function FrontendLayout({
                                           children,
                                       }: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white font-sans text-[#112C40]">
            <a
                href="#main-content"
                className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-md bg-[#112C40] px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
            >
                Skip to content
            </a>

            <PublicHeader />

            <main id="main-content">
                {children}
            </main>

            <PublicFooter />
        </div>
    );
}
