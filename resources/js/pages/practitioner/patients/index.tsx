import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, Pencil, Plus, RotateCcw, Search, UsersRound } from 'lucide-react';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Input } from '@/components/ui/input';
import type { Paginated } from '@/types/rbac';

type Patient = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    age_years: number | null;
    gender: string | null;
    country_code: string | null;
    status: string;
    status_label: string;
    created_at: string | null;
    archived_at: string | null;
    can_edit: boolean;
    can_archive: boolean;
    can_restore: boolean;
};

type Props = {
    patients: Paginated<Patient>;
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
    }).format(new Date(value));
}

export default function PatientIndex({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    function filter(event?: FormEvent) {
        event?.preventDefault();

        router.get(
            '/practitioner/patients',
            { search, status },
            {
                preserveState: true,
                replace: true,
            }
        );
    }

    function archive(patient: Patient) {
        if (!window.confirm(`Archive ${patient.name}?`)) return;

        router.patch(
            `/practitioner/patients/${patient.id}/archive`,
            {},
            { preserveScroll: true }
        );
    }

    function restore(patient: Patient) {
        if (!window.confirm(`Restore ${patient.name}?`)) return;

        router.patch(
            `/practitioner/patients/${patient.id}/restore`,
            {},
            { preserveScroll: true }
        );
    }

    return (
        <>
            <Head title="My Patients" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <UsersRound className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">My Patients</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage your private patient records.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/practitioner/patients/create"
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        Add Patient
                    </Link>
                </div>

                <FlashMessages />

                <form
                    onSubmit={filter}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row"
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search reference, name, email or phone..."
                        className="sm:max-w-md"
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="all">All</option>
                    </select>

                    <a
                        href="#"
                        onClick={(event) => {
                            event.preventDefault();
                            filter();
                        }}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
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
                                <th className="px-4 py-3 text-left font-medium">Reference</th>
                                <th className="px-4 py-3 text-left font-medium">Patient</th>
                                <th className="px-4 py-3 text-left font-medium">Contact</th>
                                <th className="px-4 py-3 text-left font-medium">DOB / Age</th>
                                <th className="px-4 py-3 text-left font-medium">Gender</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Created</th>
                                <th className="px-4 py-3 text-right font-medium">Action</th>
                            </tr>
                            </thead>

                            <tbody>
                            {patients.data.map((patient) => (
                                <tr key={patient.id} className="border-b last:border-b-0">
                                    <td className="px-4 py-3 font-medium">
                                        {patient.client_reference}
                                    </td>

                                    <td className="px-4 py-3">
                                        <p className="font-medium">{patient.name}</p>

                                        {patient.country_code && (
                                            <p className="text-xs text-muted-foreground">
                                                {patient.country_code}
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <p>{patient.phone || '—'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {patient.email || ''}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3">
                                        {patient.date_of_birth
                                            ? patient.date_of_birth
                                            : patient.age_years !== null
                                                ? `${patient.age_years} years`
                                                : '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                        {patient.gender || '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                            <span className="rounded-full border px-2 py-1 text-xs">
                                                {patient.status_label}
                                            </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {formatDate(patient.created_at)}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-3">
                                            {patient.can_edit && (
                                                <Link
                                                    href={`/practitioner/patients/${patient.id}/edit`}
                                                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-primary hover:underline"
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                            )}

                                            {patient.can_archive && (
                                                <a
                                                    href="#"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        archive(patient);
                                                    }}
                                                    className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-destructive hover:underline"
                                                >
                                                    <Archive className="size-4" />
                                                </a>
                                            )}

                                            {patient.can_restore && (
                                                <a
                                                    href="#"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        restore(patient);
                                                    }}
                                                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-primary hover:underline"
                                                >
                                                    <RotateCcw className="size-4" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {patients.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        No patients found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t p-4">
                        <Pagination
                            links={patients.links}
                            from={patients.from}
                            to={patients.to}
                            total={patients.total}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

PatientIndex.layout = {
    breadcrumbs: [
        {
            title: 'My Patients',
            href: '/practitioner/patients',
        },
    ],
};
