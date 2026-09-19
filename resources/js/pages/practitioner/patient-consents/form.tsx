import {
    useEffect,
    useState,
} from 'react';
import {
    Head,
    Link,
    router,
    useForm,
} from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Search,
    UserRound,
    XCircle,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ConsentState =
    | 'confirmed'
    | 'withdrawn'
    | 'missing';

type PatientSearchResult = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    phone: string | null;
    consent_state: ConsentState;
    consent_state_label: string;
};

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
    can_manage_consent: boolean;
};

type ConsentHistory = {
    id: number;
    action:
        | 'confirmed'
        | 'withdrawn';
    action_label: string;
    statement_version: string;
    statement_text: string;
    occurred_at: string | null;
    note: string | null;
    recorded_by: string | null;
};

type Props = {
    patient: Patient | null;
    currentConsent:
        ConsentHistory | null;
    history: ConsentHistory[];
    statements: {
        version: string;
        confirmed: string;
        withdrawn: string;
    };
};

function formatDate(
    value: string | null
) {
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

function PatientSearch() {
    const [search, setSearch] =
        useState('');

    const [
        results,
        setResults,
    ] = useState<
        PatientSearchResult[]
    >([]);

    const [open, setOpen] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    useEffect(() => {
        if (!open) return;

        const controller =
            new AbortController();

        const timer =
            window.setTimeout(
                async () => {
                    setLoading(true);

                    try {
                        const response =
                            await fetch(
                                `/practitioner/patient-consents/patients/search?search=${encodeURIComponent(
                                    search
                                )}`,
                                {
                                    headers: {
                                        Accept:
                                            'application/json',
                                    },
                                    signal:
                                    controller.signal,
                                }
                            );

                        if (
                            !response.ok
                        ) {
                            setResults(
                                []
                            );

                            return;
                        }

                        const data =
                            (await response.json()) as {
                                patients:
                                    PatientSearchResult[];
                            };

                        setResults(
                            data.patients
                        );
                    } catch (
                        error
                        ) {
                        if (
                            !(
                                error
                                instanceof DOMException
                                && error.name
                                === 'AbortError'
                            )
                        ) {
                            setResults(
                                []
                            );
                        }
                    } finally {
                        if (
                            !controller
                                .signal
                                .aborted
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                },
                300
            );

        return () => {
            window.clearTimeout(
                timer
            );

            controller.abort();
        };
    }, [search, open]);

    return (
        <div className="relative">
            <Label htmlFor="patient_search">
                Patient
            </Label>

            <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    id="patient_search"
                    value={search}
                    autoComplete="off"
                    placeholder="Search patient name, reference, phone or email..."
                    className="pl-9 pr-9"
                    onFocus={() =>
                        setOpen(true)
                    }
                    onChange={(
                        event
                    ) => {
                        setSearch(
                            event.target
                                .value
                        );

                        setOpen(true);
                    }}
                    onBlur={() => {
                        window.setTimeout(
                            () =>
                                setOpen(
                                    false
                                ),
                            150
                        );
                    }}
                />

                <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                    {loading && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                            Searching
                            patients...
                        </div>
                    )}

                    {!loading
                        && results.length
                        === 0 && (
                            <div className="px-3 py-3 text-sm text-muted-foreground">
                                No active
                                patients
                                found.
                            </div>
                        )}

                    {!loading
                        && results.map(
                            (
                                result
                            ) => (
                                <button
                                    key={
                                        result.id
                                    }
                                    type="button"
                                    onMouseDown={(
                                        event
                                    ) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        setOpen(
                                            false
                                        );

                                        router.visit(
                                            `/practitioner/patient-consents/${result.id}`
                                        );
                                    }}
                                    className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent"
                                >
                                    <span>
                                        <span className="block text-sm font-medium">
                                            {
                                                result.name
                                            }
                                        </span>

                                        <span className="block text-xs text-muted-foreground">
                                            {
                                                result.client_reference
                                            }

                                            {result.phone
                                                ? ` · ${result.phone}`
                                                : ''}

                                            {result.email
                                                ? ` · ${result.email}`
                                                : ''}
                                        </span>
                                    </span>

                                    <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
                                        {
                                            result.consent_state_label
                                        }
                                    </span>
                                </button>
                            )
                        )}
                </div>
            )}
        </div>
    );
}

export default function PatientConsentForm({
                                               patient,
                                               currentConsent,
                                               history,
                                               statements,
                                           }: Props) {
    const form = useForm({
        note: '',
    });

    const currentState:
        ConsentState =
        currentConsent?.action
        ?? 'missing';

    const action =
        currentState
        === 'confirmed'
            ? 'withdrawn'
            : 'confirmed';

    const actionStatement =
        action === 'confirmed'
            ? statements.confirmed
            : statements.withdrawn;

    const consentError =
        (
            form.errors as Record<
                string,
                string | undefined
            >
        ).consent;

    function submitConsent() {
        if (
            !patient
            || !patient.can_manage_consent
            || form.processing
        ) {
            return;
        }

        if (
            action === 'withdrawn'
        ) {
            const confirmed =
                window.confirm(
                    `Withdraw consent for ${patient.name}? This will prevent new practitioner observations from being submitted using current consent.`
                );

            if (!confirmed) {
                return;
            }
        }

        form.post(
            `/practitioner/patient-consents/${patient.id}/${
                action
                === 'confirmed'
                    ? 'confirm'
                    : 'withdraw'
            }`,
            {
                preserveScroll:
                    true,

                onSuccess:
                    () =>
                        form.reset(),
            }
        );
    }

    return (
        <>
            <Head
                title={
                    patient
                        ? `Patient Consent - ${patient.name}`
                        : 'Add Patient Consent'
                }
            />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <ClipboardCheck className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                {patient
                                    ? 'Manage Patient Consent'
                                    : 'Add Patient Consent'}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {patient
                                    ? 'Review the current consent state and record a new consent event.'
                                    : 'Search and select one of your active patients.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {patient && (
                            <Link
                                href="/practitioner/patient-consents/create"
                                className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                            >
                                Choose Another
                                Patient
                            </Link>
                        )}

                        <Link
                            href="/practitioner/patient-consents"
                            className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            Back to List
                        </Link>
                    </div>
                </div>

                <FlashMessages />

                {!patient && (
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="mb-5 flex items-start gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
                                <UserRound className="size-4" />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Select
                                    Patient
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Only your
                                    active
                                    patients
                                    are
                                    available
                                    in this
                                    search.
                                </p>
                            </div>
                        </div>

                        <PatientSearch />
                    </div>
                )}

                {patient && (
                    <>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
                                <h2 className="font-semibold">
                                    Patient
                                    Details
                                </h2>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Patient
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {
                                                patient.name
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Reference
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {
                                                patient.client_reference
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Status
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {
                                                patient.status_label
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Phone
                                        </p>

                                        <p className="mt-1">
                                            {
                                                patient.phone
                                                || '—'
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Email
                                        </p>

                                        <p className="mt-1 break-all">
                                            {
                                                patient.email
                                                || '—'
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            DOB /
                                            Age
                                        </p>

                                        <p className="mt-1">
                                            {patient.date_of_birth
                                                ? patient.date_of_birth
                                                : patient.age_years
                                                !== null
                                                    ? `${patient.age_years} years`
                                                    : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <p className="text-sm text-muted-foreground">
                                    Current
                                    Consent
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    {currentState
                                    === 'confirmed'
                                        ? (
                                            <CheckCircle2 className="size-5 text-green-600" />
                                        )
                                        : currentState
                                        === 'withdrawn'
                                            ? (
                                                <XCircle className="size-5 text-red-600" />
                                            )
                                            : (
                                                <ClipboardCheck className="size-5 text-amber-600" />
                                            )}

                                    <span className="text-lg font-semibold capitalize">
                                        {
                                            currentState
                                        }
                                    </span>
                                </div>

                                <p className="mt-3 text-sm text-muted-foreground">
                                    {currentConsent
                                        ? `Last updated ${formatDate(
                                            currentConsent.occurred_at
                                        )}`
                                        : 'No consent has been recorded for this patient.'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="font-semibold">
                                {action
                                === 'confirmed'
                                    ? 'Confirm Consent'
                                    : 'Withdraw Consent'}
                            </h2>

                            {!patient.can_manage_consent
                                ? (
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        This patient
                                        is archived.
                                        Restore the
                                        patient before
                                        changing
                                        consent.
                                    </p>
                                )
                                : (
                                    <>
                                        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Statement
                                                Version{' '}
                                                {
                                                    statements.version
                                                }
                                            </p>

                                            <p className="mt-2 text-sm leading-6">
                                                {
                                                    actionStatement
                                                }
                                            </p>
                                        </div>

                                        <div className="mt-4 grid gap-2">
                                            <Label htmlFor="note">
                                                Private
                                                Note
                                            </Label>

                                            <textarea
                                                id="note"
                                                rows={
                                                    4
                                                }
                                                value={
                                                    form.data.note
                                                }
                                                maxLength={
                                                    2000
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    form.setData(
                                                        'note',
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Optional note about how or when consent was recorded..."
                                                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                            />

                                            <InputError
                                                message={
                                                    form.errors.note
                                                }
                                            />

                                            <InputError
                                                message={
                                                    consentError
                                                }
                                            />
                                        </div>

                                        <div className="mt-5 flex justify-end border-t pt-5">
                                            <a
                                                href="#"
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.preventDefault();

                                                    submitConsent();
                                                }}
                                                className={`inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium ${
                                                    action
                                                    === 'confirmed'
                                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                        : 'border border-destructive text-destructive hover:bg-destructive/10'
                                                } ${
                                                    form.processing
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : 'cursor-pointer'
                                                }`}
                                            >
                                                {action
                                                === 'confirmed'
                                                    ? (
                                                        <CheckCircle2 className="size-4" />
                                                    )
                                                    : (
                                                        <XCircle className="size-4" />
                                                    )}

                                                {form.processing
                                                    ? 'Saving...'
                                                    : action
                                                    === 'confirmed'
                                                        ? 'Confirm Consent'
                                                        : 'Withdraw Consent'}
                                            </a>
                                        </div>
                                    </>
                                )}
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="border-b px-5 py-4">
                                <h2 className="font-semibold">
                                    Consent
                                    History
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Consent
                                    events are
                                    append-only
                                    and are
                                    never edited
                                    or deleted.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">
                                            Action
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Statement
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Recorded
                                            By
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Date
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium">
                                            Note
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {history.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                                className="border-b align-top last:border-b-0"
                                            >
                                                <td className="px-4 py-3">
                                                        <span className="rounded-full border px-2 py-1 text-xs font-medium">
                                                            {
                                                                item.action_label
                                                            }
                                                        </span>
                                                </td>

                                                <td className="max-w-md whitespace-normal px-4 py-3">
                                                    <p>
                                                        {
                                                            item.statement_text
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Version{' '}
                                                        {
                                                            item.statement_version
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {
                                                        item.recorded_by
                                                        || '—'
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {formatDate(
                                                        item.occurred_at
                                                    )}
                                                </td>

                                                <td className="max-w-xs whitespace-normal px-4 py-3">
                                                    {
                                                        item.note
                                                        || '—'
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )}

                                    {history.length
                                        === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        5
                                                    }
                                                    className="px-4 py-10 text-center text-muted-foreground"
                                                >
                                                    No
                                                    consent
                                                    history
                                                    has been
                                                    recorded
                                                    yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

PatientConsentForm.layout = {
    breadcrumbs: [
        {
            title: 'Patient Consent',
            href: '/practitioner/patient-consents',
        },
    ],
};
