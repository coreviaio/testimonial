import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ClipboardCheck,
    Plus,
    Search,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Input } from '@/components/ui/input';
import type { Paginated } from '@/types/rbac';

type PatientConsentRow = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    status_label: string;
    consent_state:
        | 'confirmed'
        | 'withdrawn'
        | 'missing';
    consent_state_label: string;
    latest_consent_at: string | null;
};

type Props = {
    patients: Paginated<PatientConsentRow>;
    filters: {
        search: string;
        patient_status: string;
        consent_state: string;
    };
};

function formatDate(value: string | null) {
    if (!value) return '—';

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }
    ).format(new Date(value));
}

function consentClass(
    state: PatientConsentRow['consent_state']
) {
    if (state === 'confirmed') {
        return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300';
    }

    if (state === 'withdrawn') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
}

export default function PatientConsentIndex({
                                                patients,
                                                filters,
                                            }: Props) {
    const [search, setSearch] =
        useState(filters.search);

    const [
        patientStatus,
        setPatientStatus,
    ] = useState(
        filters.patient_status
    );

    const [
        consentState,
        setConsentState,
    ] = useState(
        filters.consent_state
    );

    function filter(
        event?: FormEvent
    ) {
        event?.preventDefault();

        router.get(
            '/practitioner/patient-consents',
            {
                search,
                patient_status:
                patientStatus,
                consent_state:
                consentState,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    }

    return (
        <>
            <Head title="Patient Consent" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <ClipboardCheck className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                Patient Consent
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Record and review
                                consent history for
                                your patients.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/practitioner/patient-consents/create"
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        Add Consent
                    </Link>
                </div>

                <FlashMessages />

                <form
                    onSubmit={filter}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row"
                >
                    <Input
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search reference, name, email or phone..."
                        className="lg:max-w-md"
                    />

                    <select
                        value={patientStatus}
                        onChange={(event) =>
                            setPatientStatus(
                                event.target.value
                            )
                        }
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="active">
                            Active Patients
                        </option>
                        <option value="archived">
                            Archived Patients
                        </option>
                        <option value="all">
                            All Patients
                        </option>
                    </select>

                    <select
                        value={consentState}
                        onChange={(event) =>
                            setConsentState(
                                event.target.value
                            )
                        }
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="all">
                            All Consent States
                        </option>
                        <option value="confirmed">
                            Confirmed
                        </option>
                        <option value="withdrawn">
                            Withdrawn
                        </option>
                        <option value="missing">
                            Missing
                        </option>
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
                                <th className="px-4 py-3 text-left font-medium">
                                    Reference
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Patient
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Contact
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Patient Status
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Consent
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Last Action
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {patients.data.map(
                                (patient) => (
                                    <tr
                                        key={
                                            patient.id
                                        }
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {
                                                patient.client_reference
                                            }
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {
                                                    patient.name
                                                }
                                            </p>
                                        </td>

                                        <td className="px-4 py-3">
                                            <p>
                                                {
                                                    patient.phone
                                                    || '—'
                                                }
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    patient.email
                                                    || ''
                                                }
                                            </p>
                                        </td>

                                        <td className="px-4 py-3">
                                                <span className="rounded-full border px-2 py-1 text-xs">
                                                    {
                                                        patient.status_label
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-xs font-medium ${consentClass(
                                                        patient.consent_state
                                                    )}`}
                                                >
                                                    {
                                                        patient.consent_state_label
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            {formatDate(
                                                patient.latest_consent_at
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/practitioner/patient-consents/${patient.id}`}
                                                className="cursor-pointer font-medium text-primary hover:underline"
                                            >
                                                {
                                                    patient.consent_state
                                                    === 'missing'
                                                        ? 'Add Consent'
                                                        : 'Manage'
                                                }
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            )}

                            {patients.data.length
                                === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                7
                                            }
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No patients
                                            found for
                                            the selected
                                            filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    links={
                        patients.links
                    }
                    from={
                        patients.from
                    }
                    to={patients.to}
                    total={
                        patients.total
                    }
                />
            </div>
        </>
    );
}

PatientConsentIndex.layout = {
    breadcrumbs: [
        {
            title: 'Patient Consent',
            href: '/practitioner/patient-consents',
        },
    ],
};
