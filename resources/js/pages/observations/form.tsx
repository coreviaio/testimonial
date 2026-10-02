import { useState, type ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileText,
    Save,
    Send,
    ShieldCheck,
    TriangleAlert,
    UserRound,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import {
    H2ResearchMultiSelect,
    type H2ResearchOption,
} from '@/components/h2research-multi-select';
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

import observationRoutes from '@/routes/my/observations';

type SelfPatient = {
    name: string;
    email: string;
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

type H2ResearchMappingField =
    keyof H2ResearchCollections;

type Observation = {
    id: number;

    title: string | null;

    observation: string | null;

    condition_symptom_text:
        string | null;

    duration_text:
        string | null;

    frequency_text:
        string | null;

    timeline_text:
        string | null;

    status: string;

    status_label: string;

    updated_at:
        string | null;

    can_edit: boolean;

    can_submit: boolean;

    can_archive: boolean;

    can_restore: boolean;
};

type Props = {
    observation:
        Observation | null;

    self_patient:
        SelfPatient;

    latestFeedback:
        LatestFeedback | null;

    acknowledgements:
        Acknowledgement[];

    h2research_options:
        H2ResearchCollections;

    h2research_mappings:
        H2ResearchCollections;
};

type FormData = {
    title: string;

    condition_symptom_text:
        string;

    duration_text:
        string;

    frequency_text:
        string;

    timeline_text:
        string;

    observation:
        string;

    disease_ids:
        number[];

    organ_ids:
        number[];

    administration_method_ids:
        number[];

    research_topic_ids:
        number[];

    biomarker_ids:
        number[];

    acknowledgements:
        string[];
};

function formatDateTime(
    value: string | null,
): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        },
    ).format(
        new Date(value),
    );
}

function statusClass(
    status: string,
) {
    if (
        status === 'published'
    ) {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (
        status === 'rejected'
    ) {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (
        status
        === 'pending_review'
    ) {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    if (
        status
        === 'changes_requested'
    ) {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (
        status === 'archived'
    ) {
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

export default function ObservationForm({
                                            observation,
                                            self_patient,
                                            latestFeedback,
                                            acknowledgements,
                                            h2research_options,
                                            h2research_mappings,
                                        }: Props) {
    const editing =
        observation !== null;

    const canEdit =
        observation?.can_edit
        ?? true;

    const canSubmit =
        Boolean(
            observation?.can_submit,
        );

    const [
        mappingSelections,
        setMappingSelections,
    ] = useState<H2ResearchCollections>(
        h2research_mappings,
    );

    const form =
        useForm<FormData>({
            title:
                observation?.title
                ?? '',

            condition_symptom_text:
                observation
                    ?.condition_symptom_text
                ?? '',

            duration_text:
                observation
                    ?.duration_text
                ?? '',

            frequency_text:
                observation
                    ?.frequency_text
                ?? '',

            timeline_text:
                observation
                    ?.timeline_text
                ?? '',

            observation:
                observation
                    ?.observation
                ?? '',

            disease_ids:
                h2research_mappings
                    .disease_ids
                    .map(
                        (item) =>
                            item.id,
                    ),

            organ_ids:
                h2research_mappings
                    .organ_ids
                    .map(
                        (item) =>
                            item.id,
                    ),

            administration_method_ids:
                h2research_mappings
                    .administration_method_ids
                    .map(
                        (item) =>
                            item.id,
                    ),

            research_topic_ids:
                h2research_mappings
                    .research_topic_ids
                    .map(
                        (item) =>
                            item.id,
                    ),

            biomarker_ids:
                h2research_mappings
                    .biomarker_ids
                    .map(
                        (item) =>
                            item.id,
                    ),

            acknowledgements: [],
        });

    const allAcknowledgementsAccepted =
        acknowledgements.length > 0
        && acknowledgements.every(
            (item) =>
                form.data
                    .acknowledgements
                    .includes(
                        item.code,
                    ),
        );

    function updateMapping(
        field:
        H2ResearchMappingField,

        items:
        H2ResearchOption[],
    ) {
        setMappingSelections(
            (current) => ({
                ...current,
                [field]: items,
            }),
        );

        form.setData(
            field,
            items.map(
                (item) =>
                    item.id,
            ),
        );

        form.clearErrors(
            field,
        );
    }

    function toggleAcknowledgement(
        code: string,
    ) {
        const current =
            form.data
                .acknowledgements;

        if (
            current.includes(code)
        ) {
            form.setData(
                'acknowledgements',
                current.filter(
                    (item) =>
                        item !== code,
                ),
            );

            return;
        }

        form.setData(
            'acknowledgements',
            [
                ...current,
                code,
            ],
        );
    }

    function saveObservation() {
        if (
            !canEdit
            || form.processing
        ) {
            return;
        }

        form.clearErrors();

        if (observation) {
            form.put(
                observationRoutes
                    .update(
                        observation.id,
                    )
                    .url,
                {
                    preserveScroll:
                        true,

                    onSuccess: () => {
                        form.setDefaults();
                    },
                },
            );

            return;
        }

        form.post(
            observationRoutes
                .store()
                .url,
            {
                preserveScroll:
                    true,
            },
        );
    }

    function submitForReview() {
        if (
            !observation
            || !observation
                .can_submit
            || form.processing
        ) {
            return;
        }

        form.clearErrors();

        if (
            !allAcknowledgementsAccepted
        ) {
            form.setError(
                'acknowledgements',
                'You must accept every acknowledgement before submitting.',
            );

            return;
        }

        form.patch(
            `/my/observations/${observation.id}/submit`,
            {
                preserveScroll:
                    true,
            },
        );
    }

    return (
        <>
            <Head
                title={
                    editing
                        ? 'Observation Details'
                        : 'New Observation'
                }
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                <div>
                    <Link
                        href={
                            observationRoutes
                                .index()
                        }
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />

                        My Observations
                    </Link>
                </div>

                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {editing
                                        ? 'Observation details'
                                        : 'New observation'}
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Record your own experience and submit it for review when ready.
                                </p>
                            </div>
                        </div>

                        {observation && (
                            <Badge
                                variant="outline"
                                className={statusClass(
                                    observation.status,
                                )}
                            >
                                {
                                    observation.status_label
                                }
                            </Badge>
                        )}
                    </div>
                </section>

                {observation
                        ?.status
                    === 'changes_requested'
                    && latestFeedback
                        ?.review_comment
                    && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />

                                <div>
                                    <p className="font-medium text-amber-900">
                                        Changes Requested
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">
                                        {
                                            latestFeedback
                                                .review_comment
                                        }
                                    </p>

                                    {latestFeedback
                                            .acted_at
                                        && (
                                            <p className="mt-2 text-xs text-amber-700">
                                                {formatDateTime(
                                                    latestFeedback
                                                        .acted_at,
                                                )}
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                {observation
                        ?.status
                    === 'rejected'
                    && latestFeedback
                        ?.review_comment
                    && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-700" />

                                <div>
                                    <p className="font-medium text-red-900">
                                        Observation Rejected
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-red-800">
                                        {
                                            latestFeedback
                                                .review_comment
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {!canEdit
                    && observation
                    && (
                        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            This observation is read-only in its current status.
                        </div>
                    )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserRound className="size-5" />

                            Patient
                        </CardTitle>

                        <CardDescription>
                            This observation is about your own experience. No patient selection is required.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <p className="font-medium">
                                {
                                    self_patient.name
                                }
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {
                                    self_patient.email
                                }
                            </p>

                            <Badge
                                variant="outline"
                                className="mt-3"
                            >
                                Self / Patient
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <CardTitle>
                                    Observation Details
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    Save as draft while working. Title and observation are required when submitting.
                                </CardDescription>
                            </div>

                            {observation && (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            Status:
                                        </span>

                                        <Badge
                                            variant="outline"
                                            className={statusClass(
                                                observation.status,
                                            )}
                                        >
                                            {
                                                observation.status_label
                                            }
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock3 className="size-4 text-muted-foreground" />

                                        <span className="text-muted-foreground">
                                            Last updated:
                                        </span>

                                        <span className="font-medium">
                                            {formatDateTime(
                                                observation.updated_at,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-5 sm:p-6">
                        <Field
                            label="Title"
                            error={
                                form.errors
                                    .title
                            }
                        >
                            <Input
                                value={
                                    form.data
                                        .title
                                }
                                disabled={
                                    !canEdit
                                }
                                maxLength={
                                    255
                                }
                                onChange={(
                                    event,
                                ) =>
                                    form.setData(
                                        'title',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </Field>

                        <Field
                            label="Condition / Symptom"
                            error={
                                form.errors
                                    .condition_symptom_text
                            }
                        >
                            <Input
                                value={
                                    form.data
                                        .condition_symptom_text
                                }
                                disabled={
                                    !canEdit
                                }
                                maxLength={
                                    500
                                }
                                onChange={(
                                    event,
                                ) =>
                                    form.setData(
                                        'condition_symptom_text',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </Field>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field
                                label="Duration"
                                error={
                                    form.errors
                                        .duration_text
                                }
                            >
                                <Input
                                    value={
                                        form.data
                                            .duration_text
                                    }
                                    disabled={
                                        !canEdit
                                    }
                                    maxLength={
                                        255
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'duration_text',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                />
                            </Field>

                            <Field
                                label="Frequency"
                                error={
                                    form.errors
                                        .frequency_text
                                }
                            >
                                <Input
                                    value={
                                        form.data
                                            .frequency_text
                                    }
                                    disabled={
                                        !canEdit
                                    }
                                    maxLength={
                                        255
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'frequency_text',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                />
                            </Field>
                        </div>

                        <Field
                            label="Timeline"
                            error={
                                form.errors
                                    .timeline_text
                            }
                        >
                            <textarea
                                rows={5}
                                value={
                                    form.data
                                        .timeline_text
                                }
                                disabled={
                                    !canEdit
                                }
                                onChange={(
                                    event,
                                ) =>
                                    form.setData(
                                        'timeline_text',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        <Field
                            label="Observation"
                            error={
                                form.errors
                                    .observation
                            }
                        >
                            <textarea
                                rows={10}
                                value={
                                    form.data
                                        .observation
                                }
                                disabled={
                                    !canEdit
                                }
                                onChange={(
                                    event,
                                ) =>
                                    form.setData(
                                        'observation',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            H2Research Mapping
                        </CardTitle>

                        <CardDescription>
                            Select relevant H2Research reference data for your observation.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <Field
                            label="Diseases"
                            error={
                                form.errors
                                    .disease_ids
                            }
                        >
                            <H2ResearchMultiSelect
                                source="disease"
                                options={
                                    h2research_options
                                        .disease_ids
                                }
                                value={
                                    mappingSelections
                                        .disease_ids
                                }
                                onChange={(
                                    items,
                                ) =>
                                    updateMapping(
                                        'disease_ids',
                                        items,
                                    )
                                }
                                placeholder="Search diseases..."
                                disabled={
                                    !canEdit
                                }
                            />
                        </Field>

                        <Field
                            label="Organs / Tissues"
                            error={
                                form.errors
                                    .organ_ids
                            }
                        >
                            <H2ResearchMultiSelect
                                source="organ"
                                options={
                                    h2research_options
                                        .organ_ids
                                }
                                value={
                                    mappingSelections
                                        .organ_ids
                                }
                                onChange={(
                                    items,
                                ) =>
                                    updateMapping(
                                        'organ_ids',
                                        items,
                                    )
                                }
                                placeholder="Search organs or tissues..."
                                disabled={
                                    !canEdit
                                }
                            />
                        </Field>

                        <Field
                            label="Administration Methods"
                            error={
                                form.errors
                                    .administration_method_ids
                            }
                        >
                            <H2ResearchMultiSelect
                                source="administration_method"
                                options={
                                    h2research_options
                                        .administration_method_ids
                                }
                                value={
                                    mappingSelections
                                        .administration_method_ids
                                }
                                onChange={(
                                    items,
                                ) =>
                                    updateMapping(
                                        'administration_method_ids',
                                        items,
                                    )
                                }
                                placeholder="Search administration methods..."
                                disabled={
                                    !canEdit
                                }
                            />
                        </Field>

                        <Field
                            label="Research Topics"
                            error={
                                form.errors
                                    .research_topic_ids
                            }
                        >
                            <H2ResearchMultiSelect
                                source="research_topic"
                                options={
                                    h2research_options
                                        .research_topic_ids
                                }
                                value={
                                    mappingSelections
                                        .research_topic_ids
                                }
                                onChange={(
                                    items,
                                ) =>
                                    updateMapping(
                                        'research_topic_ids',
                                        items,
                                    )
                                }
                                placeholder="Search research topics..."
                                disabled={
                                    !canEdit
                                }
                            />
                        </Field>

                        <Field
                            label="Biomarkers"
                            error={
                                form.errors
                                    .biomarker_ids
                            }
                        >
                            <H2ResearchMultiSelect
                                source="biomarker"
                                options={
                                    h2research_options
                                        .biomarker_ids
                                }
                                value={
                                    mappingSelections
                                        .biomarker_ids
                                }
                                onChange={(
                                    items,
                                ) =>
                                    updateMapping(
                                        'biomarker_ids',
                                        items,
                                    )
                                }
                                placeholder="Search biomarkers..."
                                disabled={
                                    !canEdit
                                }
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
                                You must accept every statement each time you submit or resubmit.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {acknowledgements.map(
                                (item) => {
                                    const checked =
                                        form.data
                                            .acknowledgements
                                            .includes(
                                                item.code,
                                            );

                                    return (
                                        <label
                                            key={
                                                item.code
                                            }
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/30"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    checked
                                                }
                                                disabled={
                                                    form.processing
                                                }
                                                onChange={() =>
                                                    toggleAcknowledgement(
                                                        item.code,
                                                    )
                                                }
                                                className="mt-1 size-4"
                                            />

                                            <div>
                                                <p className="text-sm">
                                                    {
                                                        item.text
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Statement version{' '}
                                                    {
                                                        item.version
                                                    }
                                                </p>
                                            </div>
                                        </label>
                                    );
                                },
                            )}

                            <InputError
                                message={
                                    form.errors
                                        .acknowledgements as string
                                }
                            />

                            {allAcknowledgementsAccepted
                                && (
                                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                        <CheckCircle2 className="size-4" />

                                        All required acknowledgements accepted.
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap justify-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
                    <Link
                        href={
                            observationRoutes
                                .index()
                        }
                        className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                    >
                        Back
                    </Link>

                    {canEdit && (
                        <button
                            type="button"
                            onClick={
                                saveObservation
                            }
                            disabled={
                                form.processing
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="size-4" />

                            {form.processing
                                ? 'Saving...'
                                : editing
                                    ? 'Save Draft'
                                    : 'Create Draft'}
                        </button>
                    )}

                    {canSubmit && (
                        <button
                            type="button"
                            onClick={
                                submitForReview
                            }
                            disabled={
                                form.processing
                                || !allAcknowledgementsAccepted
                            }
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send className="size-4" />

                            {observation
                                ?.status
                            === 'changes_requested'
                                ? 'Resubmit for Review'
                                : 'Submit for Review'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

function Field({
                   label,
                   error,
                   children,
               }: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
            </Label>

            {children}

            <InputError
                message={error}
            />
        </div>
    );
}
