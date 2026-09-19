import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ShieldCheck } from 'lucide-react';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Input } from '@/components/ui/input';

type Verification = {
    id: number;
    attempt_number: number;
    status: string;
    status_label: string;
    practitioner_name: string;
    practitioner_email: string;
    practitioner_type: string | null;
    professional_title: string | null;
    country_code: string | null;
    reviewer_name: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedVerifications = {
    data: Verification[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    verifications: PaginatedVerifications;
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

export default function PractitionerVerificationIndex({ verifications, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    function filter(event?: FormEvent) {
        event?.preventDefault();

        router.get(
            '/admin/practitioner-verifications',
            { search, status },
            {
                preserveState: true,
                replace: true,
            }
        );
    }

    return (
        <>
            <Head title="Practitioner Verification" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                        <ShieldCheck className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold">
                            Practitioner Verification
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review practitioner applications and verification attempts.
                        </p>
                    </div>
                </div>

                <FlashMessages />

                <form
                    onSubmit={filter}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row"
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, email, license, organization..."
                        className="sm:max-w-md"
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="pending_verification">Pending Verification</option>
                        <option value="draft">Draft</option>
                        <option value="changes_requested">Changes Requested</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>

                    <a
                        href="#"
                        onClick={(event) => {
                            event.preventDefault();
                            filter();
                        }}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                        <Search className="size-4" />
                        Search
                    </a>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Practitioner</th>
                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                <th className="px-4 py-3 text-left font-medium">Title</th>
                                <th className="px-4 py-3 text-left font-medium">Country</th>
                                <th className="px-4 py-3 text-left font-medium">Attempt</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                                <th className="px-4 py-3 text-left font-medium">Reviewer</th>
                                <th className="px-4 py-3 text-right font-medium">Action</th>
                            </tr>
                            </thead>

                            <tbody>
                            {verifications.data.map((verification) => (
                                <tr
                                    key={verification.id}
                                    className="border-b last:border-b-0"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium">
                                            {verification.practitioner_name}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {verification.practitioner_email}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3">
                                        {verification.practitioner_type || '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                        {verification.professional_title || '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                        {verification.country_code || '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                        #{verification.attempt_number}
                                    </td>

                                    <td className="px-4 py-3">
                                            <span className="rounded-full border px-2 py-1 text-xs">
                                                {verification.status_label}
                                            </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {formatDate(verification.submitted_at)}
                                    </td>

                                    <td className="px-4 py-3">
                                        {verification.reviewer_name || '—'}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/admin/practitioner-verifications/${verification.id}`}
                                            className="cursor-pointer font-medium text-primary hover:underline"
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {verifications.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        No practitioner verification applications found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t p-4">
                        <Pagination
                            links={verifications.links}
                            from={verifications.from}
                            to={verifications.to}
                            total={verifications.total}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

PractitionerVerificationIndex.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Verification',
            href: '/admin/practitioner-verifications',
        },
    ],
};

