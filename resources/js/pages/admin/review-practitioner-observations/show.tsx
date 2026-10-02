import {
    useState,
    type ReactNode,
} from 'react';

import {
    Head,
    Link,
    router,
    useForm,
    usePage,
} from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    Save,
    ShieldAlert,
    TriangleAlert,
    XCircle,
    RefreshCw,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    H2ResearchMultiSelect,
    type H2ResearchOption,
} from '@/components/h2research-multi-select';

import type { RbacPageProps } from '@/types/rbac';

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

    practitioner_note:
        string | null;

    status: string;
    status_label: string;
    status_note: string;

    submitted_at:
        string | null;

    updated_at:
        string | null;

    latest_version_number:
        number | null;

    can_edit: boolean;
    can_approve: boolean;

    can_request_changes:
        boolean;

    can_reject:
        boolean;

    can_archive:
        boolean;

    approval_blockers:
        string[];
};

type Practitioner = {
    id: number | null;
    name: string | null;
    email: string | null;

    professional_title:
        string | null;

    specialty:
        string | null;

    verification_status:
        string | null;
};

type Patient = {
    id: number | null;

    client_reference:
        string | null;

    status:
        string | null;

    current_consent_state:
        string;

    current_consent_state_label:
        string;

    current_consent_id:
        number | null;

    current_consent_occurred_at:
        string | null;

    submitted_consent_id:
        number | null;

    submitted_consent_state:
        string | null;

    submitted_consent_occurred_at:
        string | null;
};

type ReviewHistory = {
    id: number;
    action: string;

    from_status:
        string | null;

    to_status: string;

    review_comment:
        string | null;

    internal_note:
        string | null;

    actor_name:
        string | null;

    acted_at:
        string | null;
};

type StatusNote = {
    value: string;
    label: string;
    note: string;
};

type H2ResearchMappings = {
    disease_ids:
        H2ResearchOption[];

    organ_ids:
        H2ResearchOption[];

    administration_method_ids:
        H2ResearchOption[];

    research_topic_ids:
        H2ResearchOption[];

    biomarker_ids:
        H2ResearchOption[];

    article_ids:
        H2ResearchOption[];
};

type H2MappingField =
    keyof H2ResearchMappings;

type Props = {
    observation: Observation;
    practitioner: Practitioner;
    patient: Patient;

    history:
        ReviewHistory[];

    status_notes:
        StatusNote[];

    h2research_mappings:
        H2ResearchMappings;
};

type EditForm = {
    title: string;
    observation: string;

    condition_symptom_text:
        string;

    duration_text:
        string;

    frequency_text:
        string;

    timeline_text:
        string;

    practitioner_note:
        string;
};

type ReviewForm = {
    decision: string;
    condition_check: string;
    observation_language_check: string;
    deidentification_check: string;
    consent_check: string;
    publication_check: string;
    review_comment: string;
    internal_note: string;

    disease_ids: number[];
    organ_ids: number[];

    administration_method_ids:
        number[];

    research_topic_ids:
        number[];

    biomarker_ids:
        number[];

    article_ids:
        number[];
};

function formatDate(
    value: string | null,
) {
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
        status === 'approved'
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
        === 'changes_requested'
    ) {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (
        status
        === 'pending_review'
    ) {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    if (
        status === 'archived'
    ) {
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

function consentClass(
    state: string | null,
) {
    if (
        state === 'confirmed'
    ) {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (
        state === 'withdrawn'
    ) {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700';
}

export default function ReviewPractitionerObservationShow({
                                                              observation,
                                                              practitioner,
                                                              patient,
                                                              history,
                                                              status_notes = [],
                                                              h2research_mappings,
                                                          }: Props) {

    const { auth } =
        usePage<RbacPageProps>().props;

    const canSyncH2Research =
        (auth.permissions ?? []).includes(
            'h2research_data.sync',
        );

    const [
        syncRequesting,
        setSyncRequesting,
    ] = useState(false);

    const [
        mappingSelections,
        setMappingSelections,
    ] = useState<H2ResearchMappings>(
        h2research_mappings,
    );

    const editForm =
        useForm<EditForm>({
            title:
                observation.title
                ?? '',

            observation:
                observation.observation
                ?? '',

            condition_symptom_text:
                observation
                    .condition_symptom_text
                ?? '',

            duration_text:
                observation.duration_text
                ?? '',

            frequency_text:
                observation.frequency_text
                ?? '',

            timeline_text:
                observation.timeline_text
                ?? '',

            practitioner_note:
                observation.practitioner_note
                ?? '',
        });

    const reviewForm = useForm<ReviewForm>({
        decision: '',
        condition_check: '',
        observation_language_check: '',
        deidentification_check: '',
        consent_check: '',
        publication_check: '',
        review_comment: '',
        internal_note: '',
        disease_ids:
            h2research_mappings
                .disease_ids
                .map((item) => item.id),

        organ_ids:
            h2research_mappings
                .organ_ids
                .map((item) => item.id),

        administration_method_ids:
            h2research_mappings
                .administration_method_ids
                .map((item) => item.id),

        research_topic_ids:
            h2research_mappings
                .research_topic_ids
                .map((item) => item.id),

        biomarker_ids:
            h2research_mappings
                .biomarker_ids
                .map((item) => item.id),

        article_ids:
            h2research_mappings
                .article_ids
                .map((item) => item.id),
    });

    const allReviewChecksPass =
        reviewForm.data.condition_check === 'passed'
        && reviewForm.data.observation_language_check === 'passed'
        && reviewForm.data.deidentification_check === 'passed'
        && reviewForm.data.consent_check === 'passed'
        && reviewForm.data.publication_check === 'ready';

    function updateMapping(
        field: H2MappingField,
        items: H2ResearchOption[],
    ) {
        setMappingSelections(
            (current) => ({
                ...current,
                [field]: items,
            }),
        );

        reviewForm.setData(
            field,
            items.map(
                (item) => item.id,
            ),
        );
    }

    function syncH2Research() {
        if (syncRequesting) {
            return;
        }

        router.post(
            '/admin/h2research-sync',
            {},
            {
                preserveScroll: true,
                preserveState: true,

                onStart: () =>
                    setSyncRequesting(true),

                onFinish: () =>
                    setSyncRequesting(false),
            },
        );
    }

    function save() {
        if (
            !observation.can_edit
            || editForm.processing
        ) {
            return;
        }

        editForm.put(
            `/admin/review-practitioner-observations/${observation.id}`,
            {
                preserveScroll:
                    true,
            },
        );
    }

    function review(
        decision:
            | 'approve'
            | 'changes_requested'
            | 'reject'
            | 'archive',
    ) {
        if (reviewForm.processing) {
            return;
        }

        reviewForm.clearErrors();

        if (
            decision === 'approve'
            && !allReviewChecksPass
        ) {
            reviewForm.setError(
                'decision',
                'All review checks must pass before approval.',
            );

            return;
        }

        if (
            (
                decision === 'changes_requested'
                || decision === 'reject'
            )
            && !reviewForm.data.review_comment.trim()
        ) {
            reviewForm.setError(
                'review_comment',
                'Review comment is required for this action.',
            );

            return;
        }

        const confirmation = {
            approve: 'Approve this practitioner observation?',
            changes_requested: 'Request changes from the practitioner?',
            reject: 'Reject this practitioner observation?',
            archive: 'Archive this practitioner observation?',
        }[decision];

        if (!window.confirm(confirmation)) {
            return;
        }

        reviewForm.transform((data) => ({
            ...data,
            decision,
        }));

        reviewForm.patch(
            `/admin/review-practitioner-observations/${observation.id}/review`,
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <>
            <Head
                title={`Review Practitioner Observation #${observation.id}`}
            />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden p-4 md:p-6">
                <Link
                    href="/admin/review-practitioner-observations"
                    className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeft className="size-4" />

                    Review Practitioner Observations
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <ClipboardCheck className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                Review Practitioner Observation #
                                {observation.id}
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {
                                    observation.status_note
                                }
                            </p>
                        </div>
                    </div>

                    <span
                        className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${statusClass(
                            observation.status,
                        )}`}
                    >
                        {
                            observation.status_label
                        }
                    </span>
                </div>

                <FlashMessages />

                <div className="flex justify-end">
                    <Link
                        href={`/admin/review-practitioner-observations/${observation.id}/history`}
                        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                    >
                        Versions & History
                    </Link>
                </div>

                <section className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="font-semibold">
                            Observation
                        </h2>

                        <div className="mt-4 grid gap-3 text-sm">
                            <Detail
                                label="Status"
                                value={
                                    observation.status_label
                                }
                            />

                            <Detail
                                label="Version"
                                value={
                                    observation
                                        .latest_version_number
                                        ? `Version ${observation.latest_version_number}`
                                        : 'Not submitted yet'
                                }
                            />

                            <Detail
                                label="Submitted"
                                value={
                                    formatDate(
                                        observation.submitted_at,
                                    )
                                }
                            />

                            <Detail
                                label="Last updated"
                                value={
                                    formatDate(
                                        observation.updated_at,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="font-semibold">
                            Practitioner
                        </h2>

                        <div className="mt-4 grid gap-3 text-sm">
                            <Detail
                                label="Name"
                                value={
                                    practitioner.name
                                }
                            />

                            <Detail
                                label="Email"
                                value={
                                    practitioner.email
                                }
                            />

                            <Detail
                                label="Professional title"
                                value={
                                    practitioner.professional_title
                                }
                            />

                            <Detail
                                label="Specialty"
                                value={
                                    practitioner.specialty
                                }
                            />

                            <Detail
                                label="Verification"
                                value={
                                    practitioner.verification_status
                                }
                                capitalize
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="font-semibold">
                            Patient / Consent
                        </h2>

                        <div className="mt-4 grid gap-3 text-sm">
                            <Detail
                                label="Patient reference"
                                value={
                                    patient.client_reference
                                }
                            />

                            <Detail
                                label="Patient status"
                                value={
                                    patient.status
                                }
                                capitalize
                            />

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Current consent
                                </p>

                                <span
                                    className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${consentClass(
                                        patient.current_consent_state,
                                    )}`}
                                >
                                    {
                                        patient.current_consent_state_label
                                    }
                                </span>
                            </div>

                            <Detail
                                label="Current consent receipt"
                                value={
                                    patient.current_consent_id
                                        ? `#${patient.current_consent_id}`
                                        : '—'
                                }
                            />

                            <Detail
                                label="Submitted consent receipt"
                                value={
                                    patient.submitted_consent_id
                                        ? `#${patient.submitted_consent_id}`
                                        : '—'
                                }
                            />

                            {patient.submitted_consent_state
                                && (
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Submitted consent state
                                        </p>

                                        <span
                                            className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${consentClass(
                                                patient.submitted_consent_state,
                                            )}`}
                                        >
                                            {patient.submitted_consent_state
                                            === 'confirmed'
                                                ? 'Confirmed'
                                                : 'Withdrawn'}
                                        </span>
                                    </div>
                                )}
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">
                            Observation Details
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Admin can edit local observation fields while the status is Draft, Pending Review or Changes Requested.
                        </p>
                    </div>

                    <div className="grid gap-5">
                        <Field
                            label="Title"
                            error={
                                editForm.errors.title
                            }
                        >
                            <Input
                                value={
                                    editForm.data.title
                                }
                                disabled={
                                    !observation.can_edit
                                }
                                onChange={
                                    (event) =>
                                        editForm.setData(
                                            'title',
                                            event.target.value,
                                        )
                                }
                            />
                        </Field>

                        <Field
                            label="Condition / Symptom"
                            error={
                                editForm.errors
                                    .condition_symptom_text
                            }
                        >
                            <Input
                                value={
                                    editForm.data
                                        .condition_symptom_text
                                }
                                disabled={
                                    !observation.can_edit
                                }
                                onChange={
                                    (event) =>
                                        editForm.setData(
                                            'condition_symptom_text',
                                            event.target.value,
                                        )
                                }
                            />
                        </Field>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Duration"
                                error={
                                    editForm.errors
                                        .duration_text
                                }
                            >
                                <Input
                                    value={
                                        editForm.data
                                            .duration_text
                                    }
                                    disabled={
                                        !observation.can_edit
                                    }
                                    onChange={
                                        (event) =>
                                            editForm.setData(
                                                'duration_text',
                                                event.target.value,
                                            )
                                    }
                                />
                            </Field>

                            <Field
                                label="Frequency"
                                error={
                                    editForm.errors
                                        .frequency_text
                                }
                            >
                                <Input
                                    value={
                                        editForm.data
                                            .frequency_text
                                    }
                                    disabled={
                                        !observation.can_edit
                                    }
                                    onChange={
                                        (event) =>
                                            editForm.setData(
                                                'frequency_text',
                                                event.target.value,
                                            )
                                    }
                                />
                            </Field>
                        </div>

                        <Field
                            label="Timeline"
                            error={
                                editForm.errors
                                    .timeline_text
                            }
                        >
                            <textarea
                                rows={5}
                                value={
                                    editForm.data
                                        .timeline_text
                                }
                                disabled={
                                    !observation.can_edit
                                }
                                onChange={
                                    (event) =>
                                        editForm.setData(
                                            'timeline_text',
                                            event.target.value,
                                        )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        <Field
                            label="Observation"
                            error={
                                editForm.errors
                                    .observation
                            }
                        >
                            <textarea
                                rows={10}
                                value={
                                    editForm.data
                                        .observation
                                }
                                disabled={
                                    !observation.can_edit
                                }
                                onChange={
                                    (event) =>
                                        editForm.setData(
                                            'observation',
                                            event.target.value,
                                        )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        <Field
                            label="Practitioner Note"
                            error={
                                editForm.errors
                                    .practitioner_note
                            }
                        >
                            <textarea
                                rows={4}
                                value={
                                    editForm.data
                                        .practitioner_note
                                }
                                disabled={
                                    !observation.can_edit
                                }
                                onChange={
                                    (event) =>
                                        editForm.setData(
                                            'practitioner_note',
                                            event.target.value,
                                        )
                                }
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        {observation.can_edit
                            && (
                                <div className="flex justify-end border-t pt-5">
                                    <button
                                        type="button"
                                        onClick={
                                            save
                                        }
                                        disabled={
                                            editForm.processing
                                        }
                                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="size-4" />

                                        {editForm.processing
                                            ? 'Saving...'
                                            : 'Save changes'}
                                    </button>
                                </div>
                            )}
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        Review Decision
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Review the observation, optionally assign H2Research mappings, then complete the review decision.
                    </p>

                    {observation.status
                        === 'draft'
                        && (
                            <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm">
                                This observation is still a draft. Review decisions become available after the practitioner submits it.
                            </div>
                        )}

                    {observation.status
                        === 'changes_requested'
                        && (
                            <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0" />

                                Changes were requested. The practitioner must edit and resubmit before it can be approved or rejected again.
                            </div>
                        )}

                    {observation.status
                        === 'approved'
                        && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                                <CheckCircle2 className="size-4" />

                                This observation is approved.
                            </div>
                        )}

                    {observation.status
                        === 'rejected'
                        && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <XCircle className="size-4" />

                                This observation is rejected.
                            </div>
                        )}

                    {observation.status
                        === 'archived'
                        && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-4 text-sm">
                                <Archive className="size-4" />

                                This observation is archived. No further review action is available.
                            </div>
                        )}

                    {observation.approval_blockers
                            .length > 0
                        && observation.status
                        === 'pending_review'
                        && (
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />

                                    <div>
                                        <p className="font-medium">
                                            Approval is blocked:
                                        </p>

                                        <ul className="mt-2 list-disc space-y-1 pl-5">
                                            {observation
                                                .approval_blockers
                                                .map(
                                                    (item) => (
                                                        <li
                                                            key={
                                                                item
                                                            }
                                                        >
                                                            {
                                                                item
                                                            }
                                                        </li>
                                                    ),
                                                )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                    {(observation.can_request_changes
                            || observation.can_reject
                            || observation.can_archive
                            || observation.can_approve)
                        && (
                            <div className="mt-5 grid gap-4">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="font-medium">
                                                H2Research Mapping
                                            </h3>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Optional. Select zero, one, or multiple items. These mappings do not block approval.
                                            </p>
                                        </div>

                                        {canSyncH2Research && (
                                            <button
                                                type="button"
                                                disabled={
                                                    syncRequesting
                                                }
                                                onClick={
                                                    syncH2Research
                                                }
                                                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <RefreshCw
                                                    className={`size-4 ${
                                                        syncRequesting
                                                            ? 'animate-spin'
                                                            : ''
                                                    }`}
                                                />

                                                {syncRequesting
                                                    ? 'Starting Sync...'
                                                    : 'Sync H2Research'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                        <Field
                                            label="Diseases"
                                            error={
                                                reviewForm.errors
                                                    .disease_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="disease"
                                                value={
                                                    mappingSelections
                                                        .disease_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'disease_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search diseases..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Organs / Tissues"
                                            error={
                                                reviewForm.errors
                                                    .organ_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="organ"
                                                value={
                                                    mappingSelections
                                                        .organ_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'organ_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search organs or tissues..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Administration Methods"
                                            error={
                                                reviewForm.errors
                                                    .administration_method_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="administration_method"
                                                value={
                                                    mappingSelections
                                                        .administration_method_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'administration_method_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search administration methods..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Research Topics"
                                            error={
                                                reviewForm.errors
                                                    .research_topic_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="research_topic"
                                                value={
                                                    mappingSelections
                                                        .research_topic_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'research_topic_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search research topics..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Biomarkers"
                                            error={
                                                reviewForm.errors
                                                    .biomarker_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="biomarker"
                                                value={
                                                    mappingSelections
                                                        .biomarker_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'biomarker_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search biomarkers..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Articles"
                                            error={
                                                reviewForm.errors
                                                    .article_ids
                                            }
                                        >
                                            <H2ResearchMultiSelect
                                                source="article"
                                                value={
                                                    mappingSelections
                                                        .article_ids
                                                }
                                                onChange={(items) =>
                                                    updateMapping(
                                                        'article_ids',
                                                        items,
                                                    )
                                                }
                                                placeholder="Search article titles..."
                                                disabled={
                                                    observation.status
                                                    !== 'pending_review'
                                                }
                                            />
                                        </Field>
                                    </div>
                                </div>
                                {observation.status === 'pending_review' && (
                                    <>
                                        <div>
                                            <h3 className="font-medium">
                                                Review Checks
                                            </h3>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                All checks must pass before this observation can be approved.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            <ReviewCheck
                                                label="Condition Check"
                                                value={reviewForm.data.condition_check}
                                                options={[
                                                    ['passed', 'Passed'],
                                                    ['needs_change', 'Needs Change'],
                                                ]}
                                                onChange={(value) =>
                                                    reviewForm.setData(
                                                        'condition_check',
                                                        value,
                                                    )
                                                }
                                                error={reviewForm.errors.condition_check}
                                            />

                                            <ReviewCheck
                                                label="Observation Language Check"
                                                value={reviewForm.data.observation_language_check}
                                                options={[
                                                    ['passed', 'Passed'],
                                                    ['needs_change', 'Needs Change'],
                                                ]}
                                                onChange={(value) =>
                                                    reviewForm.setData(
                                                        'observation_language_check',
                                                        value,
                                                    )
                                                }
                                                error={
                                                    reviewForm.errors
                                                        .observation_language_check
                                                }
                                            />

                                            <ReviewCheck
                                                label="De-identification Check"
                                                value={reviewForm.data.deidentification_check}
                                                options={[
                                                    ['passed', 'Passed'],
                                                    ['needs_change', 'Needs Change'],
                                                ]}
                                                onChange={(value) =>
                                                    reviewForm.setData(
                                                        'deidentification_check',
                                                        value,
                                                    )
                                                }
                                                error={
                                                    reviewForm.errors
                                                        .deidentification_check
                                                }
                                            />

                                            <ReviewCheck
                                                label="Consent Check"
                                                value={reviewForm.data.consent_check}
                                                options={[
                                                    ['passed', 'Passed'],
                                                    ['missing', 'Missing'],
                                                ]}
                                                onChange={(value) =>
                                                    reviewForm.setData(
                                                        'consent_check',
                                                        value,
                                                    )
                                                }
                                                error={reviewForm.errors.consent_check}
                                            />

                                            <ReviewCheck
                                                label="Publication Check"
                                                value={reviewForm.data.publication_check}
                                                options={[
                                                    ['ready', 'Ready'],
                                                    ['not_ready', 'Not Ready'],
                                                ]}
                                                onChange={(value) =>
                                                    reviewForm.setData(
                                                        'publication_check',
                                                        value,
                                                    )
                                                }
                                                error={reviewForm.errors.publication_check}
                                            />
                                        </div>
                                    </>
                                )}
                                <Field
                                    label="Review comment"
                                    error={
                                        reviewForm
                                            .errors
                                            .review_comment
                                    }
                                >
                                    <textarea
                                        rows={4}
                                        value={
                                            reviewForm
                                                .data
                                                .review_comment
                                        }
                                        onChange={
                                            (event) =>
                                                reviewForm.setData(
                                                    'review_comment',
                                                    event.target.value,
                                                )
                                        }
                                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                        placeholder="Required for Request Changes and Reject. Optional for Approve or Archive."
                                    />
                                </Field>

                                <Field
                                    label="Internal note"
                                    error={
                                        reviewForm
                                            .errors
                                            .internal_note
                                    }
                                >
                                    <textarea
                                        rows={3}
                                        value={
                                            reviewForm
                                                .data
                                                .internal_note
                                        }
                                        onChange={
                                            (event) =>
                                                reviewForm.setData(
                                                    'internal_note',
                                                    event.target.value,
                                                )
                                        }
                                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                        placeholder="Optional Admin-only note"
                                    />
                                </Field>

                                <InputError
                                    message={
                                        reviewForm
                                            .errors
                                            .decision
                                    }
                                />

                                <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
                                    {observation.can_request_changes
                                        && (
                                            <button
                                                type="button"
                                                onClick={
                                                    () =>
                                                        review(
                                                            'changes_requested',
                                                        )
                                                }
                                                disabled={
                                                    reviewForm.processing
                                                }
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-amber-300 px-4 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <TriangleAlert className="size-4" />

                                                Request Changes
                                            </button>
                                        )}

                                    {observation.can_reject
                                        && (
                                            <button
                                                type="button"
                                                onClick={
                                                    () =>
                                                        review(
                                                            'reject',
                                                        )
                                                }
                                                disabled={
                                                    reviewForm.processing
                                                }
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <XCircle className="size-4" />

                                                Reject
                                            </button>
                                        )}

                                    {observation.can_archive
                                        && (
                                            <button
                                                type="button"
                                                onClick={
                                                    () =>
                                                        review(
                                                            'archive',
                                                        )
                                                }
                                                disabled={
                                                    reviewForm.processing
                                                }
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Archive className="size-4" />

                                                Archive
                                            </button>
                                        )}

                                    {observation.status
                                        === 'pending_review'
                                        && (
                                            <button
                                                type="button"
                                                onClick={
                                                    () =>
                                                        review(
                                                            'approve',
                                                        )
                                                }
                                                disabled={
                                                    !observation.can_approve
                                                    || !allReviewChecksPass
                                                    || reviewForm.processing
                                                }
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="size-4" />

                                                Approve
                                            </button>
                                        )}
                                </div>
                            </div>
                        )}
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        Status Reference
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {status_notes.map(
                            (item) => (
                                <div
                                    key={
                                        item.value
                                    }
                                    className="rounded-lg border p-3"
                                >
                                    <p className="text-sm font-medium">
                                        {
                                            item.label
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {
                                            item.note
                                        }
                                    </p>
                                </div>
                            ),
                        )}
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        Review History
                    </h2>

                    <div className="mt-4 space-y-3">
                        {history.map(
                            (item) => (
                                <div
                                    key={
                                        item.id
                                    }
                                    className="rounded-lg border p-4 text-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-medium capitalize">
                                            {item.action.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </p>

                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(
                                                item.acted_at,
                                            )}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {item.from_status
                                            || '—'}
                                        {' → '}
                                        {
                                            item.to_status
                                        }

                                        {item.actor_name
                                            ? ` by ${item.actor_name}`
                                            : ''}
                                    </p>

                                    {item.review_comment
                                        && (
                                            <p className="mt-2 whitespace-pre-wrap">
                                                {
                                                    item.review_comment
                                                }
                                            </p>
                                        )}

                                    {item.internal_note
                                        && (
                                            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                                                Internal:{' '}
                                                {
                                                    item.internal_note
                                                }
                                            </p>
                                        )}
                                </div>
                            ),
                        )}

                        {history.length
                            === 0
                            && (
                                <p className="text-sm text-muted-foreground">
                                    No review actions recorded yet.
                                </p>
                            )}
                    </div>
                </section>
            </div>
        </>
    );
}

function Detail({
                    label,
                    value,
                    capitalize = false,
                }: {
    label: string;
    value: string | null;
    capitalize?: boolean;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p
                className={`mt-1 ${
                    capitalize
                        ? 'capitalize'
                        : ''
                }`}
            >
                {value || '—'}
            </p>
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

function ReviewCheck({
                         label,
                         value,
                         options,
                         onChange,
                         error,
                     }: {
    label: string;
    value: string;
    options: [string, string][];
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium">
                {label}
                <span className="ml-1 text-destructive">*</span>
            </label>

            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
                <option value="">
                    Select result
                </option>

                {options.map(([optionValue, optionLabel]) => (
                    <option
                        key={optionValue}
                        value={optionValue}
                    >
                        {optionLabel}
                    </option>
                ))}
            </select>

            <InputError message={error} />
        </div>
    );
}

ReviewPractitionerObservationShow.layout = {
    breadcrumbs: [
        {
            title:
                'Review Practitioner Observations',

            href:
                '/admin/review-practitioner-observations',
        },
        {
            title:
                'Review Observation',

            href:
                '#',
        },
    ],
};
