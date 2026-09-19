import {
    useEffect,
    useState,
    type FormEvent,
} from 'react';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import {
    Archive,
    Eye,
    FileText,
    MoreHorizontal,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import observationRoutes from '@/routes/my/observations';

type ObservationRow = {
    id: number;
    title: string | null;
    status_label: string;
    updated_at: string | null;
    can_edit: boolean;
    can_archive: boolean;
    can_restore: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type ObservationCollection = {
    data: ObservationRow[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    observations: ObservationCollection;
    filters: {
        search: string;
    };
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function paginationLabel(label: string): string {
    if (label.includes('Previous')) {
        return 'Previous';
    }

    if (label.includes('Next')) {
        return 'Next';
    }

    return label;
}

export default function MyObservations({
                                           observations,
                                           filters,
                                       }: Props) {
    const [search, setSearch] = useState(
        filters.search ?? '',
    );

    const [searching, setSearching] =
        useState(false);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    function visitSearch(value: string) {
        const searchValue = value.trim();

        setSearching(true);

        router.get(
            observationRoutes.index().url,
            searchValue
                ? {
                    search: searchValue,
                }
                : {},
            {
                replace: true,
                preserveScroll: true,

                onFinish: () => {
                    setSearching(false);
                },
            },
        );
    }

    function submitSearch(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        visitSearch(search);
    }

    function clearSearch() {
        setSearch('');

        if (filters.search) {
            visitSearch('');
        }
    }

    function archiveObservation(
        observation: ObservationRow,
    ) {
        if (!observation.can_archive) {
            return;
        }

        const confirmed = window.confirm(
            `Archive "${
                observation.title ||
                `Observation #${observation.id}`
            }"?`,
        );

        if (!confirmed) {
            return;
        }

        router.patch(
            `/my/observations/${observation.id}/archive`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function restoreObservation(
        observation: ObservationRow,
    ) {
        if (!observation.can_restore) {
            return;
        }

        router.patch(
            `/my/observations/${observation.id}/restore`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <>
            <Head title="My Observations" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                {/* Header */}
                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    My Observations
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Create and manage your
                                    observations.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={
                                observationRoutes.create().url
                            }
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                        >
                            <Plus className="size-4" />
                            New observation
                        </Link>
                    </div>
                </section>

                {/* List */}
                <section className="overflow-hidden rounded-xl border bg-card">
                    {/* Search */}
                    <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Observations
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {observations.total}{' '}
                                {observations.total === 1
                                    ? 'observation'
                                    : 'observations'}
                            </p>
                        </div>

                        <form
                            onSubmit={submitSearch}
                            className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
                            role="search"
                        >
                            <div className="relative w-full sm:w-72">
                                <Search
                                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />

                                <Input
                                    type="search"
                                    value={search}
                                    maxLength={100}
                                    aria-label="Search observations"
                                    placeholder="Search by title"
                                    className="pl-9"
                                    onChange={(event) => {
                                        setSearch(
                                            event.target.value,
                                        );
                                    }}
                                />
                            </div>

                            <a
                                href="#"
                                aria-disabled={searching}
                                onClick={(event) => {
                                    event.preventDefault();

                                    if (!searching) {
                                        visitSearch(search);
                                    }
                                }}
                                className={`inline-flex h-9 items-center justify-center rounded-md border bg-secondary px-4 text-sm font-medium transition-colors hover:bg-secondary/80 ${
                                    searching
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer'
                                }`}
                            >
                                {searching
                                    ? 'Searching...'
                                    : 'Search'}
                            </a>

                            {(search ||
                                filters.search) && (
                                <a
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();

                                        if (!searching) {
                                            clearSearch();
                                        }
                                    }}
                                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted ${
                                        searching
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer'
                                    }`}
                                >
                                    <X className="size-4" />
                                    Clear
                                </a>
                            )}
                        </form>
                    </div>

                    {/* Empty */}
                    {observations.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="size-5 text-muted-foreground" />
                            </div>

                            <h3 className="font-medium">
                                No observations found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                {filters.search
                                    ? 'No observation matches your search.'
                                    : 'Create your first observation to get started.'}
                            </p>

                            {!filters.search && (
                                <Link
                                    href={
                                        observationRoutes.create()
                                            .url
                                    }
                                    className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                                >
                                    <Plus className="size-4" />
                                    New observation
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b bg-muted/40 text-left">
                                    <th className="px-5 py-3 font-medium text-muted-foreground">
                                        Observation
                                    </th>

                                    <th className="px-5 py-3 font-medium text-muted-foreground">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 font-medium text-muted-foreground">
                                        Last updated
                                    </th>

                                    <th className="w-20 px-5 py-3 text-right font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {observations.data.map(
                                    (observation) => (
                                        <tr
                                            key={
                                                observation.id
                                            }
                                            className="border-b last:border-b-0 hover:bg-muted/30"
                                        >
                                            {/* Observation */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                                        <FileText className="size-4 text-muted-foreground" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <Link
                                                            href={
                                                                observationRoutes.edit(
                                                                    observation.id,
                                                                )
                                                                    .url
                                                            }
                                                            className="block cursor-pointer truncate font-medium hover:underline"
                                                        >
                                                            {observation.title ||
                                                                `Observation #${observation.id}`}
                                                        </Link>

                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                                ID #
                                                            {
                                                                observation.id
                                                            }
                                                            </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <Badge variant="outline">
                                                    {
                                                        observation.status_label
                                                    }
                                                </Badge>
                                            </td>

                                            {/* Date */}
                                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                {formatDate(
                                                    observation.updated_at,
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <a
                                                            href="#"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.preventDefault();
                                                            }}
                                                            aria-label={`Actions for ${
                                                                observation.title ||
                                                                `observation ${observation.id}`
                                                            }`}
                                                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </a>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        align="end"
                                                    >
                                                        {/* Edit / View */}
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={
                                                                    observationRoutes.edit(
                                                                        observation.id,
                                                                    )
                                                                        .url
                                                                }
                                                                className="cursor-pointer"
                                                            >
                                                                {observation.can_edit ? (
                                                                    <Pencil className="size-4" />
                                                                ) : (
                                                                    <Eye className="size-4" />
                                                                )}

                                                                {observation.can_edit
                                                                    ? 'Edit observation'
                                                                    : 'View observation'}
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        {/* Archive */}
                                                        {observation.can_archive && (
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <a
                                                                    href="#"
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        event.preventDefault();

                                                                        archiveObservation(
                                                                            observation,
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                >
                                                                    <Archive className="size-4" />
                                                                    Archive
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Restore */}
                                                        {observation.can_restore && (
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <a
                                                                    href="#"
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        event.preventDefault();

                                                                        restoreObservation(
                                                                            observation,
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                    Restore
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {observations.total > 0 && (
                        <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing{' '}
                                {observations.from ?? 0}–
                                {observations.to ?? 0} of{' '}
                                {observations.total}
                            </p>

                            {observations.links.length >
                                3 && (
                                    <nav
                                        aria-label="Observation pagination"
                                        className="flex flex-wrap items-center gap-1"
                                    >
                                        {observations.links.map(
                                            (link, index) => {
                                                const label =
                                                    paginationLabel(
                                                        link.label,
                                                    );

                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={
                                                                index
                                                            }
                                                            className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border px-3 text-sm font-medium opacity-50"
                                                        >
                                                        {
                                                            label
                                                        }
                                                    </span>
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={
                                                            index
                                                        }
                                                        href={
                                                            link.url
                                                        }
                                                        preserveScroll
                                                        className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors ${
                                                            link.active
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-background hover:bg-muted'
                                                        }`}
                                                    >
                                                        {
                                                            label
                                                        }
                                                    </Link>
                                                );
                                            },
                                        )}
                                    </nav>
                                )}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
