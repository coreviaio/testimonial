import { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    CheckCircle2,
    RotateCcw,
    Save,
    Search,
    Send,
    ShieldCheck,
    TriangleAlert,
} from 'lucide-react';
import {
    H2ResearchMultiSelect,
    type H2ResearchOption,
} from '@/components/h2research-multi-select';

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

type PatientOption = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    status: string;
    consent_state: string;
    consent_state_label: string;
};

type Acknowledgement = {
    code: string;
    version: string;
    text: string;
};

type LatestFeedback = {
    review_comment: string | null;
    acted_at: string | null;
};

type H2ResearchCollections = {
    disease_ids: H2ResearchOption[];
    organ_ids: H2ResearchOption[];
    administration_method_ids: H2ResearchOption[];
    research_topic_ids: H2ResearchOption[];
    biomarker_ids: H2ResearchOption[];
};

type H2ResearchMappingField = keyof H2ResearchCollections;

type Observation = {
    id: number;
    client_id: number | null;
    title: string | null;
    observation: string | null;
    condition_symptom_text: string | null;
    duration_text: string | null;
    frequency_text: string | null;
    timeline_text: string | null;
    practitioner_note: string | null;
    status: string;
    status_label: string;
    can_edit: boolean;
    can_submit: boolean;
    can_archive: boolean;
    can_restore: boolean;
    patient_locked: boolean;
};

type Props = {
    observation: Observation | null;
    patient: PatientOption | null;
    latestFeedback: LatestFeedback | null;
    acknowledgements: Acknowledgement[];
    h2research_options: H2ResearchCollections;
    h2research_mappings: H2ResearchCollections;
};

type FormData = {
    client_id: number | '';
    title: string;
    observation: string;
    condition_symptom_text: string;
    duration_text: string;
    frequency_text: string;
    timeline_text: string;
    practitioner_note: string;

    disease_ids: number[];
    organ_ids: number[];
    administration_method_ids: number[];
    research_topic_ids: number[];
    biomarker_ids: number[];

    acknowledgements: string[];
};

function statusClass(status: string) {
    if (status === 'approved') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (status === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (status === 'pending_review') {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    if (status === 'changes_requested') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
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

function formatDate(value: string | null) {
    if (!value) return '';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function PractitionerObservationForm({
    observation,
    patient,
    latestFeedback,
    acknowledgements,
    h2research_options,
    h2research_mappings,
}: Props) {
    const [selectedPatient, setSelectedPatient] =
        useState<PatientOption | null>(patient);

    const [mappingSelections, setMappingSelections] =
        useState<H2ResearchCollections>(h2research_mappings);

    const form = useForm<FormData>({
        client_id: observation?.client_id ?? '',
        title: observation?.title ?? '',
        observation: observation?.observation ?? '',
        condition_symptom_text: observation?.condition_symptom_text ?? '',
        duration_text: observation?.duration_text ?? '',
        frequency_text: observation?.frequency_text ?? '',
        timeline_text: observation?.timeline_text ?? '',
        practitioner_note: observation?.practitioner_note ?? '',

        disease_ids: h2research_mappings.disease_ids.map(
            (item) => item.id,
        ),

        organ_ids: h2research_mappings.organ_ids.map(
            (item) => item.id,
        ),

        administration_method_ids:
            h2research_mappings.administration_method_ids.map(
                (item) => item.id,
            ),

        research_topic_ids:
            h2research_mappings.research_topic_ids.map(
                (item) => item.id,
            ),

        biomarker_ids: h2research_mappings.biomarker_ids.map(
            (item) => item.id,
        ),

        // Always empty.
        // Practitioner must accept them again for each submitted version.
        acknowledgements: [],
    });

    const isNew = !observation;
    const canEdit = isNew || observation.can_edit;
    const canSubmit = Boolean(observation?.can_submit);

    const allAcknowledgementsAccepted =
        acknowledgements.length > 0
        && acknowledgements.every((item) =>
            form.data.acknowledgements.includes(item.code),
        );

    const patientConsentConfirmed =
        selectedPatient?.consent_state === 'confirmed';

    function updateMapping(
        field: H2ResearchMappingField,
        items: H2ResearchOption[],
    ) {
        setMappingSelections((current) => ({
            ...current,
            [field]: items,
        }));

        form.setData(
            field,
            items.map((item) => item.id),
        );

        form.clearErrors(field);
    }

    function toggleAcknowledgement(code: string) {
        const current = form.data.acknowledgements;

        if (current.includes(code)) {
            form.setData(
                'acknowledgements',
                current.filter((item) => item !== code),
            );

            return;
        }

        form.setData('acknowledgements', [...current, code]);
    }

    function save() {
        form.clearErrors();

        if (isNew) {
            form.post('/practitioner/observations', {
                preserveScroll: true,
            });

            return;
        }

        if (!observation?.can_edit) {
            return;
        }

        form.put(`/practitioner/observations/${observation.id}`, {
            preserveScroll: true,
        });
    }

    function submitForReview() {
        if (!observation || !observation.can_submit || form.processing) {
            return;
        }

        form.clearErrors();

        if (!allAcknowledgementsAccepted) {
            form.setError(
                'acknowledgements',
                'You must accept every acknowledgement before submitting.',
            );

            return;
        }

        if (!patientConsentConfirmed) {
            form.setError(
                'client_id',
                'Current patient consent must be confirmed before submitting.',
            );

            return;
        }

        form.patch(
            `/practitioner/observations/${observation.id}/submit`,
            {
                preserveScroll: true,
            },
        );
    }

    function archive() {
        if (!observation?.can_archive) {
            return;
        }

        if (!window.confirm('Archive this draft observation?')) {
            return;
        }

        router.patch(
            `/practitioner/observations/${observation.id}/archive`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function restore() {
        if (!observation?.can_restore) {
            return;
        }

        router.patch(
            `/practitioner/observations/${observation.id}/restore`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <>
            <Head
                title={
                    isNew
                        ? 'Create Practitioner Observation'
                        : `Practitioner Observation #${observation.id}`
                }
            />

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-hidden p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/practitioner/observations"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        <ArrowLeft className="size-4" />
                        Practitioner Observations
                    </Link>

                    {observation && (
                        <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClass(
                                observation.status,
                            )}`}
                        >
                            {observation.status_label}
                        </span>
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-semibold">
                        {isNew
                            ? 'Create Practitioner Observation'
                            : `Practitioner Observation #${observation.id}`}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Record a de-identified patient observation and submit it
                        for review when ready.
                    </p>
                </div>

                <FlashMessages />

                {observation?.status === 'changes_requested'
                    && latestFeedback?.review_comment && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />

                                <div>
                                    <p className="font-medium text-amber-900">
                                        Changes Requested
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">
                                        {latestFeedback.review_comment}
                                    </p>

                                    {latestFeedback.acted_at && (
                                        <p className="mt-2 text-xs text-amber-700">
                                            {formatDate(latestFeedback.acted_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                {observation?.status === 'rejected'
                    && latestFeedback?.review_comment && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-700" />

                                <div>
                                    <p className="font-medium text-red-900">
                                        Observation Rejected
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-red-800">
                                        {latestFeedback.review_comment}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                <Card>
                    <CardHeader>
                        <CardTitle>Patient</CardTitle>

                        <CardDescription>
                            Select one of your active patients. Patient consent
                            must be confirmed before submission.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <PatientSearch
                            selectedPatient={selectedPatient}
                            disabled={
                                !canEdit
                                || Boolean(observation?.patient_locked)
                            }
                            onSelect={(selected) => {
                                setSelectedPatient(selected);
                                form.setData('client_id', selected.id);
                                form.clearErrors('client_id');
                            }}
                        />

                        <InputError message={form.errors.client_id} />

                        {selectedPatient && (
                            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            {selectedPatient.name}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {selectedPatient.client_reference}
                                        </p>

                                        {selectedPatient.email && (
                                            <p className="text-xs text-muted-foreground">
                                                {selectedPatient.email}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className={`rounded-full border px-2 py-1 text-xs font-medium ${consentClass(
                                            selectedPatient.consent_state,
                                        )}`}
                                    >
                                        Consent:{' '}
                                        {selectedPatient.consent_state_label}
                                    </span>
                                </div>

                                {observation?.patient_locked && (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Patient cannot be changed after the first
                                        submitted version.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Observation Details</CardTitle>

                        <CardDescription>
                            Save as draft while working. Title and observation
                            are required when submitting for review.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-5">
                        <Field
                            label="Title"
                            error={form.errors.title}
                        >
                            <Input
                                value={form.data.title}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                        </Field>

                        <Field
                            label="Condition / Symptom"
                            error={form.errors.condition_symptom_text}
                        >
                            <Input
                                value={form.data.condition_symptom_text}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'condition_symptom_text',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Duration"
                                error={form.errors.duration_text}
                            >
                                <Input
                                    value={form.data.duration_text}
                                    disabled={!canEdit}
                                    onChange={(event) =>
                                        form.setData(
                                            'duration_text',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>

                            <Field
                                label="Frequency"
                                error={form.errors.frequency_text}
                            >
                                <Input
                                    value={form.data.frequency_text}
                                    disabled={!canEdit}
                                    onChange={(event) =>
                                        form.setData(
                                            'frequency_text',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>

                        <Field
                            label="Timeline"
                            error={form.errors.timeline_text}
                        >
                            <textarea
                                rows={5}
                                value={form.data.timeline_text}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'timeline_text',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        <Field
                            label="Observation"
                            error={form.errors.observation}
                        >
                            <textarea
                                rows={10}
                                value={form.data.observation}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'observation',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        <Field
                            label="Practitioner Note"
                            error={form.errors.practitioner_note}
                        >
                            <textarea
                                rows={4}
                                value={form.data.practitioner_note}
                                disabled={!canEdit}
                                onChange={(event) =>
                                    form.setData(
                                        'practitioner_note',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <p className="text-xs text-muted-foreground">
                                Internal practitioner note. This should not be
                                shown publicly.
                            </p>
                        </Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>H2Research Mapping</CardTitle>

                        <CardDescription>
                            Select relevant H2Research reference data for this
                            observation.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <Field
                            label="Diseases"
                            error={form.errors.disease_ids}
                        >
                            <H2ResearchMultiSelect
                                source="disease"
                                options={h2research_options.disease_ids}
                                value={mappingSelections.disease_ids}
                                onChange={(items) =>
                                    updateMapping('disease_ids', items)
                                }
                                placeholder="Search diseases..."
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field
                            label="Organs / Tissues"
                            error={form.errors.organ_ids}
                        >
                            <H2ResearchMultiSelect
                                source="organ"
                                options={h2research_options.organ_ids}
                                value={mappingSelections.organ_ids}
                                onChange={(items) =>
                                    updateMapping('organ_ids', items)
                                }
                                placeholder="Search organs or tissues..."
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field
                            label="Administration Methods"
                            error={form.errors.administration_method_ids}
                        >
                            <H2ResearchMultiSelect
                                source="administration_method"
                                options={
                                    h2research_options.administration_method_ids
                                }
                                value={
                                    mappingSelections.administration_method_ids
                                }
                                onChange={(items) =>
                                    updateMapping(
                                        'administration_method_ids',
                                        items,
                                    )
                                }
                                placeholder="Search administration methods..."
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field
                            label="Research Topics"
                            error={form.errors.research_topic_ids}
                        >
                            <H2ResearchMultiSelect
                                source="research_topic"
                                options={h2research_options.research_topic_ids}
                                value={mappingSelections.research_topic_ids}
                                onChange={(items) =>
                                    updateMapping('research_topic_ids', items)
                                }
                                placeholder="Search research topics..."
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field
                            label="Biomarkers"
                            error={form.errors.biomarker_ids}
                        >
                            <H2ResearchMultiSelect
                                source="biomarker"
                                options={h2research_options.biomarker_ids}
                                value={mappingSelections.biomarker_ids}
                                onChange={(items) =>
                                    updateMapping('biomarker_ids', items)
                                }
                                placeholder="Search biomarkers..."
                                disabled={!canEdit}
                            />
                        </Field>
                    </CardContent>
                </Card>

                {canSubmit && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="size-5" />
                                Acknowledgements
                            </CardTitle>

                            <CardDescription>
                                You must confirm every statement each time you
                                submit or resubmit an observation.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {acknowledgements.map((item) => {
                                const checked =
                                    form.data.acknowledgements.includes(
                                        item.code,
                                    );

                                return (
                                    <label
                                        key={item.code}
                                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/30"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={form.processing}
                                            onChange={() =>
                                                toggleAcknowledgement(item.code)
                                            }
                                            className="mt-1 size-4"
                                        />

                                        <div>
                                            <p className="text-sm">
                                                {item.text}
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Statement version {item.version}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}

                            <InputError
                                message={
                                    form.errors.acknowledgements as string
                                }
                            />

                            {allAcknowledgementsAccepted && (
                                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                    <CheckCircle2 className="size-4" />
                                    All required acknowledgements accepted.
                                </div>
                            )}

                            {!patientConsentConfirmed && selectedPatient && (
                                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />

                                    Patient consent must be confirmed before this
                                    observation can be submitted.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap justify-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
                    <Link
                        href="/practitioner/observations"
                        className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                    >
                        Back
                    </Link>

                    {observation?.can_restore && (
                        <button
                            type="button"
                            onClick={restore}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            <RotateCcw className="size-4" />
                            Restore Draft
                        </button>
                    )}

                    {observation?.can_archive && (
                        <button
                            type="button"
                            onClick={archive}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            <Archive className="size-4" />
                            Archive
                        </button>
                    )}

                    {canEdit && (
                        <button
                            type="button"
                            onClick={save}
                            disabled={form.processing}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="size-4" />

                            {form.processing
                                ? 'Saving...'
                                : isNew
                                    ? 'Create Draft'
                                    : observation?.status ===
                                    'changes_requested'
                                        ? 'Save Changes'
                                        : 'Save Draft'}
                        </button>
                    )}

                    {canSubmit && (
                        <button
                            type="button"
                            onClick={submitForReview}
                            disabled={
                                form.processing
                                || !allAcknowledgementsAccepted
                                || !patientConsentConfirmed
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send className="size-4" />

                            {observation?.status === 'changes_requested'
                                ? 'Resubmit for Review'
                                : 'Submit for Review'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

function PatientSearch({
                           selectedPatient,
                           disabled,
                           onSelect,
                       }: {
    selectedPatient: PatientOption | null;
    disabled: boolean;
    onSelect: (patient: PatientOption) => void;
}) {
    const [search, setSearch] = useState(
        selectedPatient
            ? `${selectedPatient.client_reference} - ${selectedPatient.name}`
            : '',
    );

    const [results, setResults] = useState<PatientOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (disabled || !open) {
            return;
        }

        const timeout = window.setTimeout(async () => {
            setLoading(true);

            try {
                const response = await fetch(
                    `/practitioner/observations/patients/search?search=${encodeURIComponent(
                        search,
                    )}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    setResults([]);
                    return;
                }

                const data = (await response.json()) as {
                    data: PatientOption[];
                };

                setResults(data.data ?? []);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, open, disabled]);

    return (
        <div className="relative">
            <Label htmlFor="patient-search">
                Patient
                <span className="ml-1 text-destructive">*</span>
            </Label>

            <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    id="patient-search"
                    value={search}
                    disabled={disabled}
                    autoComplete="off"
                    placeholder="Search patient reference, name or email..."
                    className="pl-9"
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setOpen(true);
                    }}
                />
            </div>

            {open && !disabled && (
                <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
                    {loading && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            Searching...
                        </div>
                    )}

                    {!loading
                        && results.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    onSelect(item);
                                    setSearch(
                                        `${item.client_reference} - ${item.name}`,
                                    );
                                    setOpen(false);
                                }}
                                className="flex w-full cursor-pointer items-center justify-between gap-4 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted"
                            >
                                <div>
                                    <p className="font-medium">
                                        {item.name}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {item.client_reference}
                                    </p>
                                </div>

                                <Badge
                                    variant="outline"
                                    className={consentClass(
                                        item.consent_state,
                                    )}
                                >
                                    {item.consent_state_label}
                                </Badge>
                            </button>
                        ))}

                    {!loading && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            No active patients found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Field({
                   label,
                   error,
                   children,
               }: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

PractitionerObservationForm.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Observations',
            href: '/practitioner/observations',
        },
        {
            title: 'Observation',
            href: '#',
        },
    ],
};
