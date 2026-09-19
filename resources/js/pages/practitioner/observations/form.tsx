import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    FileText,
    Save,
    Search,
    TriangleAlert,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ConsentState = 'confirmed' | 'withdrawn' | 'missing';

type PatientOption = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    phone: string | null;
    status?: string;
    consent_state: ConsentState;
    consent_state_label: string;
};

type Observation = {
    id: number;
    client_id: number;
    title: string | null;
    observation: string | null;
    condition_symptom_text: string | null;
    duration_text: string | null;
    frequency_text: string | null;
    timeline_text: string | null;
    practitioner_note: string | null;
    status: string;
    status_label: string;
    updated_at: string | null;
    can_edit: boolean;
    patient_locked: boolean;
    patient: PatientOption | null;
};

type Props = {
    observation: Observation | null;
};

type FormData = {
    client_id: number | '';
    title: string;
    condition_symptom_text: string;
    duration_text: string;
    frequency_text: string;
    timeline_text: string;
    observation: string;
    practitioner_note: string;
};

function consentClass(state: ConsentState) {
    if (state === 'confirmed') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (state === 'withdrawn') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
}

function PatientSearch({
                           value,
                           disabled,
                           onChange,
                       }: {
    value: PatientOption | null;
    disabled: boolean;
    onChange: (patient: PatientOption) => void;
}) {
    const [search, setSearch] = useState(
        value ? `${value.name} · ${value.client_reference}` : '',
    );

    const [results, setResults] = useState<PatientOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || disabled) return;

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            setLoading(true);

            try {
                const response = await fetch(
                    `/practitioner/observations/patients/search?search=${encodeURIComponent(search)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    setResults([]);
                    return;
                }

                const data = await response.json() as {
                    patients: PatientOption[];
                };

                setResults(data.patients);
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [search, open, disabled]);

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
                    disabled={disabled}
                    autoComplete="off"
                    placeholder="Search name, reference, phone or email..."
                    className="pl-9 pr-9"
                    onFocus={() => {
                        if (value) {
                            setSearch('');
                        }

                        setOpen(true);
                    }}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setOpen(true);
                    }}
                    onBlur={() => {
                        window.setTimeout(() => {
                            setOpen(false);

                            if (value) {
                                setSearch(
                                    `${value.name} · ${value.client_reference}`,
                                );
                            }
                        }, 150);
                    }}
                />

                <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {open && !disabled && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                    {loading && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                            Searching patients...
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                            No active patients found.
                        </div>
                    )}

                    {!loading && results.map((patient) => (
                        <button
                            key={patient.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setSearch(
                                    `${patient.name} · ${patient.client_reference}`,
                                );

                                onChange(patient);
                                setOpen(false);
                            }}
                            className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent"
                        >
                            <span>
                                <span className="block text-sm font-medium">
                                    {patient.name}
                                </span>

                                <span className="block text-xs text-muted-foreground">
                                    {patient.client_reference}
                                    {patient.phone ? ` · ${patient.phone}` : ''}
                                    {patient.email ? ` · ${patient.email}` : ''}
                                </span>
                            </span>

                            <span
                                className={`rounded-full border px-2 py-1 text-xs ${consentClass(patient.consent_state)}`}
                            >
                                {patient.consent_state_label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PractitionerObservationForm({
                                                        observation,
                                                    }: Props) {
    const editing = observation !== null;
    const canEdit = observation?.can_edit ?? true;

    const [selectedPatient, setSelectedPatient] =
        useState<PatientOption | null>(observation?.patient ?? null);

    const form = useForm<FormData>({
        client_id: observation?.client_id ?? '',
        title: observation?.title ?? '',
        condition_symptom_text: observation?.condition_symptom_text ?? '',
        duration_text: observation?.duration_text ?? '',
        frequency_text: observation?.frequency_text ?? '',
        timeline_text: observation?.timeline_text ?? '',
        observation: observation?.observation ?? '',
        practitioner_note: observation?.practitioner_note ?? '',
    });

    function selectPatient(patient: PatientOption) {
        setSelectedPatient(patient);
        form.setData('client_id', patient.id);
    }

    function saveObservation() {
        if (!canEdit || form.processing) {
            return;
        }

        if (observation) {
            form.put(
                `/practitioner/observations/${observation.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => form.setDefaults(),
                },
            );

            return;
        }

        form.post('/practitioner/observations');
    }

    return (
        <>
            <Head
                title={
                    editing
                        ? 'Practitioner Observation'
                        : 'New Practitioner Observation'
                }
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                <Link
                    href="/practitioner/observations"
                    className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                    <ArrowLeft className="size-4" />
                    Practitioner Observations
                </Link>

                <section className="rounded-xl border bg-card">
                    <div className="flex items-start justify-between p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 items-center justify-center rounded-lg border bg-muted">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold">
                                    {editing
                                        ? 'Practitioner observation'
                                        : 'New practitioner observation'}
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Record a de-identified patient observation and save it as a draft.
                                </p>
                            </div>
                        </div>

                        {observation && (
                            <Badge variant="outline">
                                {observation.status_label}
                            </Badge>
                        )}
                    </div>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>Patient</CardTitle>

                        <CardDescription>
                            Select one of your active patients. Consent will be required when submitting for review.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <PatientSearch
                            value={selectedPatient}
                            disabled={
                                !canEdit
                                || Boolean(observation?.patient_locked)
                            }
                            onChange={selectPatient}
                        />

                        <InputError message={form.errors.client_id} />

                        {observation?.patient_locked && (
                            <p className="text-sm text-muted-foreground">
                                The patient cannot be changed after this observation has been submitted once.
                            </p>
                        )}

                        {selectedPatient && (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-medium">
                                        {selectedPatient.name}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {selectedPatient.client_reference}
                                        {selectedPatient.phone
                                            ? ` · ${selectedPatient.phone}`
                                            : ''}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full border px-2 py-1 text-xs ${consentClass(selectedPatient.consent_state)}`}
                                >
                                    Consent: {selectedPatient.consent_state_label}
                                </span>
                            </div>
                        )}

                        {selectedPatient
                            && selectedPatient.consent_state !== 'confirmed' && (
                                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />

                                    <p>
                                        You can save this observation as a draft, but patient consent must be confirmed before it can be submitted for review.
                                    </p>
                                </div>
                            )}

                        {selectedPatient?.consent_state === 'confirmed' && (
                            <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

                                <p>
                                    Current patient consent is confirmed. It will be checked again during submission.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Observation</CardTitle>

                        <CardDescription>
                            Do not include the patient's name, phone, email or other direct identifiers in observation text.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title
                            </Label>

                            <Input
                                id="title"
                                value={form.data.title}
                                disabled={!canEdit}
                                maxLength={255}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />

                            <InputError message={form.errors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="condition_symptom_text">
                                Condition / Symptom
                            </Label>

                            <Input
                                id="condition_symptom_text"
                                value={form.data.condition_symptom_text}
                                disabled={!canEdit}
                                maxLength={500}
                                onChange={(event) =>
                                    form.setData(
                                        'condition_symptom_text',
                                        event.target.value,
                                    )
                                }
                            />

                            <InputError
                                message={form.errors.condition_symptom_text}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="duration_text">
                                    Duration
                                </Label>

                                <Input
                                    id="duration_text"
                                    value={form.data.duration_text}
                                    disabled={!canEdit}
                                    maxLength={255}
                                    onChange={(event) =>
                                        form.setData(
                                            'duration_text',
                                            event.target.value,
                                        )
                                    }
                                />

                                <InputError
                                    message={form.errors.duration_text}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="frequency_text">
                                    Frequency
                                </Label>

                                <Input
                                    id="frequency_text"
                                    value={form.data.frequency_text}
                                    disabled={!canEdit}
                                    maxLength={255}
                                    onChange={(event) =>
                                        form.setData(
                                            'frequency_text',
                                            event.target.value,
                                        )
                                    }
                                />

                                <InputError
                                    message={form.errors.frequency_text}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeline_text">
                                Timeline
                            </Label>

                            <textarea
                                id="timeline_text"
                                rows={5}
                                value={form.data.timeline_text}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'timeline_text',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <InputError
                                message={form.errors.timeline_text}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observation">
                                Observation
                            </Label>

                            <textarea
                                id="observation"
                                rows={10}
                                value={form.data.observation}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'observation',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background min-h-52 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <InputError
                                message={form.errors.observation}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="practitioner_note">
                                Practitioner Note
                            </Label>

                            <textarea
                                id="practitioner_note"
                                rows={4}
                                value={form.data.practitioner_note}
                                disabled={!canEdit}
                                placeholder="Optional internal note."
                                onChange={(event) =>
                                    form.setData(
                                        'practitioner_note',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <InputError
                                message={form.errors.practitioner_note}
                            />
                        </div>

                        {canEdit && (
                            <div className="flex justify-end gap-3 border-t pt-6">
                                <Link
                                    href="/practitioner/observations"
                                    className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                                >
                                    Cancel
                                </Link>

                                <a
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        saveObservation();
                                    }}
                                    className={`inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ${
                                        form.processing
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer hover:bg-primary/90'
                                    }`}
                                >
                                    <Save className="size-4" />

                                    {form.processing
                                        ? 'Saving...'
                                        : 'Save draft'}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PractitionerObservationForm.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Observations',
            href: '/practitioner/observations',
        },
    ],
};
