import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

type Props = {
    currentPage: number;

    lastPage: number;

    onPageChange: (
        page: number,
    ) => void;
};

type PaginationItem =
    | number
    | string;

function buildPages(
    currentPage: number,
    lastPage: number,
): PaginationItem[] {
    if (lastPage <= 5) {
        return Array.from(
            {
                length: lastPage,
            },
            (
                _,
                index,
            ) => index + 1,
        );
    }

    const pages = new Set<number>([
        1,
        lastPage,
        currentPage - 1,
        currentPage,
        currentPage + 1,
    ]);

    const validPages =
        Array.from(pages)
            .filter(
                (page) =>
                    page >= 1
                    && page <=
                    lastPage,
            )
            .sort(
                (
                    first,
                    second,
                ) =>
                    first -
                    second,
            );

    const result:
        PaginationItem[] = [];

    validPages.forEach(
        (
            page,
            index,
        ) => {
            const previous =
                validPages[
                index - 1
                    ];

            if (
                previous
                && page
                - previous
                > 1
            ) {
                result.push(
                    `ellipsis-${previous}-${page}`,
                );
            }

            result.push(
                page,
            );
        },
    );

    return result;
}

export default function PublicPagination({
                                             currentPage,
                                             lastPage,
                                             onPageChange,
                                         }: Props) {
    if (
        lastPage <= 1
    ) {
        return null;
    }

    const pages =
        buildPages(
            currentPage,
            lastPage,
        );

    return (
        <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Observation pagination"
        >
            <button
                type="button"
                disabled={
                    currentPage <= 1
                }
                onClick={() =>
                    onPageChange(
                        currentPage -
                        1,
                    )
                }
                className="inline-flex h-10 items-center gap-1 rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#596A75] transition hover:border-[#138A83]/40 hover:text-[#087A75] disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronLeft
                    size={17}
                />

                Previous
            </button>

            {pages.map(
                (
                    page,
                ) => {
                    if (
                        typeof page
                        === 'string'
                    ) {
                        return (
                            <span
                                key={
                                    page
                                }
                                className="grid h-10 w-10 place-items-center text-sm text-[#75868F]"
                            >
                                ...
                            </span>
                        );
                    }

                    const active =
                        page ===
                        currentPage;

                    return (
                        <button
                            key={
                                page
                            }
                            type="button"
                            aria-current={
                                active
                                    ? 'page'
                                    : undefined
                            }
                            onClick={() =>
                                onPageChange(
                                    page,
                                )
                            }
                            className={`grid h-10 min-w-10 place-items-center rounded-md border px-3 text-sm transition ${
                                active
                                    ? 'border-[#087A75] bg-[#087A75] font-semibold text-white'
                                    : 'border-[#D6E0E2] bg-white text-[#596A75] hover:border-[#138A83]/40 hover:text-[#087A75]'
                            }`}
                        >
                            {
                                page
                            }
                        </button>
                    );
                },
            )}

            <button
                type="button"
                disabled={
                    currentPage >=
                    lastPage
                }
                onClick={() =>
                    onPageChange(
                        currentPage +
                        1,
                    )
                }
                className="inline-flex h-10 items-center gap-1 rounded-md border border-[#D6E0E2] bg-white px-3 text-sm font-medium text-[#087A75] transition hover:border-[#138A83]/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Next

                <ChevronRight
                    size={17}
                />
            </button>
        </nav>
    );
}
