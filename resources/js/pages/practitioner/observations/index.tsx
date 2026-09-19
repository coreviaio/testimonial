import { useEffect, useState, type FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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

type ConsentState = 'confirmed' | 'withdrawn' | 'missing';

type ObservationRow = {
    id: number;
    title: string | null;
    status: string;
    status_label: string;
    updated_at: string | null;
    patient: {
        id: number;
        client_reference: string;
        name: string;
        status: string;
    } | null;
    consent_state: ConsentState;
    consent_state_label: string;
    can_edit: boolean;
    can_archive: boolean;
    can_restore: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    observations: {
        data: ObservationRow[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        search: string;
        status: string;
    };
};

function formatDate(value: string | null): string {
    if (!value) return '—';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function paginationLabel(label: string): string {
    if (label.includes('Previous')) return 'Previous';
    if (label.includes('Next')) return 'Next';

    return label;
}

function consentClass(state: ConsentState): string {
    if (state === 'confirmed') {
        return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300';
    }

    if (state === 'withdrawn') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
}

export default function PractitionerObservations({
                                                     observations,
                                                     filters,
                                                 }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? 'all');
    }, [filters.search, filters.status]);

    function visitFilters(nextSearch = search, nextStatus = status) {
        setSearching(true);

        const params: Record<string, string> = {};

        if (nextSearch.trim()) params.search = nextSearch.trim();
        if (nextStatus !== 'all') params.status = nextStatus;

        router.get('/practitioner/observations', params, {
            replace: true,
            preserveScroll: true,
            onFinish: () => setSearching(false),
        });
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        visitFilters();
    }

    function clearFilters() {
        setSearch('');
        setStatus('all');
        visitFilters('', 'all');
    }

    function archiveObservation(observation: ObservationRow) {
        if (!observation.can_archive) return;

        const confirmed = window.confirm(
            `Archive "${observation.title || `Observation #${observation.id}`}"?`,
        );

        if (!confirmed) return;

        router.patch(
            `/practitioner/observations/${observation.id}/archive`,
            {},
            { preserveScroll: true },
        );
    }

    function restoreObservation(observation: ObservationRow) {
        if (!observation.can_restore) return;

        router.patch(
            `/practitioner/observations/${observation.id}/restore`,
            {},
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Practitioner Observations" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Practitioner Observations
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Create and manage de-identified observations for your patients.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/practitioner/observations/create"
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="size-4" />
                            New observation
                        </Link>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col gap-4 border-b p-5 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="font-semibold">Observations</h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {observations.total}{' '}
                                {observations.total === 1 ? 'observation' : 'observations'}
                            </p>
                        </div>

                        <form
                            onSubmit={submitSearch}
                            className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto"
                        >
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    maxLength={100}
                                    placeholder="Search title or patient"
                                    className="pl-9"
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                            >
                                <option value="all">All statuses</option>
                                <option value="draft">Draft</option>
                                <option value="pending_review">Pending Review</option>
                                <option value="resubmitted">Resubmitted</option>
                                <option value="changes_requested">Changes Requested</option>
                                <option value="approved">Approved</option>
                                <option value="published">Published</option>
                                <option value="rejected">Rejected</option>
                                <option value="archived">Archived</option>
                            </select>

                            <a
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();

                                    if (!searching) {
                                        visitFilters();
                                    }
                                }}
                                className={`inline-flex h-9 items-center justify-center rounded-md border bg-secondary px-4 text-sm font-medium ${
                                    searching
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer hover:bg-secondary/80'
                                }`}
                            >
                                {searching ? 'Searching...' : 'Search'}
                            </a>

                            {(filters.search || filters.status !== 'all') && (
                                <a
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        clearFilters();
                                    }}
                                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted"
                                >
                                    <X className="size-4" />
                                    Clear
                                </a>
                            )}
                        </form>
                    </div>

                    {observations.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                            <FileText className="mb-4 size-8 text-muted-foreground" />

                            <h3 className="font-medium">
                                No practitioner observations found
                            </h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b bg-muted/40 text-left">
                                    <th className="px-5 py-3">Observation</th>
                                    <th className="px-5 py-3">Patient</th>
                                    <th className="px-5 py-3">Consent</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Last updated</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                                </thead>

                                <tbody>
                                {observations.data.map((observation) => (
                                    <tr
                                        key={observation.id}
                                        className="border-b last:border-b-0 hover:bg-muted/30"
                                    >
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/practitioner/observations/${observation.id}/edit`}
                                                className="cursor-pointer font-medium hover:underline"
                                            >
                                                {observation.title || `Observation #${observation.id}`}
                                            </Link>
                                        </td>

                                        <td className="px-5 py-4">
                                            {observation.patient ? (
                                                <>
                                                    <p className="font-medium">
                                                        {observation.patient.name}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {observation.patient.client_reference}
                                                    </p>
                                                </>
                                            ) : '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-xs font-medium ${consentClass(observation.consent_state)}`}
                                                >
                                                    {observation.consent_state_label}
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <Badge variant="outline">
                                                {observation.status_label}
                                            </Badge>
                                        </td>

                                        <td className="px-5 py-4 text-muted-foreground">
                                            {formatDate(observation.updated_at)}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <a
                                                        href="#"
                                                        onClick={(event) => event.preventDefault()}
                                                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </a>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/practitioner/observations/${observation.id}/edit`}
                                                            className="cursor-pointer"
                                                        >
                                                            {observation.can_edit
                                                                ? <Pencil className="size-4" />
                                                                : <Eye className="size-4" />}

                                                            {observation.can_edit
                                                                ? 'Edit observation'
                                                                : 'View observation'}
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    {observation.can_archive && (
                                                        <DropdownMenuItem asChild>
                                                            <a
                                                                href="#"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    archiveObservation(observation);
                                                                }}
                                                                className="cursor-pointer text-destructive"
                                                            >
                                                                <Archive className="size-4" />
                                                                Archive
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {observation.can_restore && (
                                                        <DropdownMenuItem asChild>
                                                            <a
                                                                href="#"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    restoreObservation(observation);
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
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {observations.total > 0 && (
                        <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {observations.from ?? 0}–{observations.to ?? 0} of {observations.total}
                            </p>

                            {observations.links.length > 3 && (
                                <nav className="flex flex-wrap gap-1">
                                    {observations.links.map((link, index) => {
                                        const label = paginationLabel(link.label);

                                        return link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                preserveScroll
                                                className={`inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm ${
                                                    link.active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                {label}
                                            </Link>
                                        ) : (
                                            <span
                                                key={index}
                                                className="inline-flex h-9 cursor-not-allowed items-center rounded-md border px-3 text-sm opacity-50"
                                            >
                                                {label}
                                            </span>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

PractitionerObservations.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Observations',
            href: '/practitioner/observations',
        },
    ],
};
