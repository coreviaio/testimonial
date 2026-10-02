import { useState, type FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardCheck, Search, X } from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Input } from '@/components/ui/input';
import type { Paginated } from '@/types/rbac';

type ObservationRow = {
    id: number;
    title: string | null;
    status: string;
    status_label: string;
    status_note: string;

    practitioner_name: string | null;
    professional_title: string | null;

    patient_reference: string | null;
    patient_status: string | null;

    consent_state: string;
    consent_state_label: string;

    submitted_at: string | null;
    updated_at: string | null;
};

type Props = {
    observations: Paginated<ObservationRow>;

    filters: {
        search: string;
        status: string;
    };
};

function formatDate(value: string | null) {
    if (!value) return '—';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function statusClass(status: string) {
    if (status === 'approved') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (status === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (status === 'changes_requested') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (status === 'pending_review') {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    if (status === 'archived') {
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

function consentClass(state: string) {
    if (state === 'confirmed') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (state === 'withdrawn') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
}

export default function ReviewPractitionerObservationsIndex({
                                                                observations,
                                                                filters,
                                                            }: Props) {
    const [search, setSearch] =
        useState(filters.search ?? '');

    const [status, setStatus] =
        useState(filters.status ?? 'all');

    function filter(
        event?: FormEvent,
    ) {
        event?.preventDefault();

        const params:
            Record<string, string> = {};

        if (search.trim()) {
            params.search =
                search.trim();
        }

        if (status !== 'all') {
            params.status =
                status;
        }

        router.get(
            '/admin/review-practitioner-observations',
            params,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setSearch('');
        setStatus('all');

        router.get(
            '/admin/review-practitioner-observations',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <>
            <Head title="Review Practitioner Observations" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                        <ClipboardCheck className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold">
                            Review Practitioner Observations
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review, edit, approve, request changes, reject or archive practitioner observations.
                        </p>
                    </div>
                </div>

                <FlashMessages />

                <form
                    onSubmit={filter}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row"
                >
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            value={search}
                            onChange={
                                (event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                            }
                            placeholder="Search ID, title, practitioner, patient reference..."
                            className="pl-9"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={
                            (event) =>
                                setStatus(
                                    event.target.value,
                                )
                        }
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="all">
                            All statuses
                        </option>

                        <option value="draft">
                            Draft
                        </option>

                        <option value="pending_review">
                            Pending Review
                        </option>

                        <option value="changes_requested">
                            Changes Requested
                        </option>

                        <option value="approved">
                            Approved
                        </option>

                        <option value="rejected">
                            Rejected
                        </option>

                        <option value="archived">
                            Archived
                        </option>
                    </select>

                    <button
                        type="submit"
                        className="h-9 cursor-pointer rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Filter
                    </button>

                    {(filters.search
                        || filters.status
                        !== 'all') && (
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
                        >
                            <X className="size-4" />

                            Clear
                        </button>
                    )}
                </form>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Observation
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Practitioner
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Patient
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Consent
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Submitted
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {observations.data.map(
                                (item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-medium">
                                                {item.title
                                                    || `Observation #${item.id}`}
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                ID #{item.id}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p>
                                                {item.practitioner_name
                                                    || '—'}
                                            </p>

                                            {item.professional_title
                                                && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            item.professional_title
                                                        }
                                                    </p>
                                                )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p>
                                                {item.patient_reference
                                                    || '—'}
                                            </p>

                                            {item.patient_status
                                                && (
                                                    <p className="text-xs capitalize text-muted-foreground">
                                                        {
                                                            item.patient_status
                                                        }
                                                    </p>
                                                )}
                                        </td>

                                        <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-xs font-medium ${consentClass(
                                                        item.consent_state,
                                                    )}`}
                                                >
                                                    {
                                                        item.consent_state_label
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-4">
                                                <span
                                                    title={
                                                        item.status_note
                                                    }
                                                    className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(
                                                        item.status,
                                                    )}`}
                                                >
                                                    {
                                                        item.status_label
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-4 text-muted-foreground">
                                            {formatDate(
                                                item.submitted_at,
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/admin/review-practitioner-observations/${item.id}`}
                                                    className="cursor-pointer font-medium text-primary hover:underline"
                                                >
                                                    Review / View
                                                </Link>

                                                <Link
                                                    href={`/admin/review-practitioner-observations/${item.id}/history`}
                                                    className="cursor-pointer font-medium text-primary hover:underline"
                                                >
                                                    History
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}

                            {observations.data.length
                                === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No practitioner observations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t p-4">
                        <Pagination
                            links={
                                observations.links
                            }
                            from={
                                observations.from
                            }
                            to={
                                observations.to
                            }
                            total={
                                observations.total
                            }
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

ReviewPractitionerObservationsIndex.layout = {
    breadcrumbs: [
        {
            title:
                'Review Practitioner Observations',

            href:
                '/admin/review-practitioner-observations',
        },
    ],
};
