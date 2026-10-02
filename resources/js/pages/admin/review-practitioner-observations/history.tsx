import type { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    FileClock,
    Flag,
    History,
    ShieldCheck,
    TriangleAlert,
    UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type UserSummary = {
    id: number;
    name: string;
    email: string;
};

type SnapshotField = {
    key: string;
    label: string;
    value: string | null;
};

type SnapshotChange = {
    key: string;
    label: string;
    before: string | null;
    after: string | null;
};

type ConsentReceipt = {
    id: number;
    action: string;
    statement_version: string;
    statement_text: string;
    occurred_at: string | null;
    recorded_by: UserSummary | null;
};

type Acknowledgement = {
    id: number;
    statement_code: string;
    statement_version: string;
    statement_text: string;
    accepted_at: string | null;
    accepted_by: UserSummary | null;
};

type Version = {
    id: number;
    version_number: number;
    is_latest: boolean;

    submitted_by: UserSummary | null;
    submitted_at: string | null;

    approved_by: UserSummary | null;
    approved_at: string | null;
    is_approved: boolean;

    submitted_snapshot: SnapshotField[];
    approved_snapshot: SnapshotField[];

    changes_from_previous: SnapshotChange[];
    approval_changes: SnapshotChange[];

    client_consent: ConsentReceipt | null;

    acknowledgements: Acknowledgement[];

    acknowledgement_complete: boolean;
    acknowledgement_count: number;
    required_acknowledgement_count: number;
    missing_acknowledgement_codes: string[];
};

type ReviewHistory = {
    id: number;
    action: string;

    from_status: string | null;
    to_status: string;

    review_comment: string | null;
    internal_note: string | null;

    condition_check: string | null;
    observation_language_check: string | null;
    deidentification_check: string | null;
    consent_check: string | null;
    publication_check: string | null;

    acted_at: string | null;

    actor: UserSummary | null;

    version_number: number | null;
};

type Props = {
    observation: {
        id: number;
        title: string | null;
        status: string;
        status_label: string;

        latest_version_id: number | null;

        submitted_at: string | null;
        updated_at: string | null;

        flagged_for_admin: boolean;
        flagged_at: string | null;
        flagged_by: UserSummary | null;
    };

    practitioner: {
        id: number | null;
        name: string | null;
        email: string | null;
        professional_title: string | null;
        verification_status: string | null;
    };

    patient: {
        id: number | null;
        client_reference: string | null;
        status: string | null;
    };

    versions: Version[];
    reviewChecks: ReviewHistory[];
    flagHistory: ReviewHistory[];
};

function formatDate(value: string | null) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatLabel(value: string | null) {
    if (!value) {
        return '—';
    }

    return value
        .replaceAll('_', ' ')
        .split(' ')
        .filter(Boolean)
        .map(
            (word) =>
                word.charAt(0).toUpperCase()
                + word.slice(1),
        )
        .join(' ');
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

function valueText(value: string | null) {
    return value
    && value.trim() !== ''
        ? value
        : '—';
}

export default function PractitionerObservationHistory({
                                                           observation,
                                                           practitioner,
                                                           patient,
                                                           versions,
                                                           reviewChecks,
                                                           flagHistory,
                                                       }: Props) {
    return (
        <>
            <Head
                title={`Practitioner Observation Versions & History #${observation.id}`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={`/admin/review-practitioner-observations/${observation.id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        <ArrowLeft className="size-4" />

                        Back to Review Practitioner Observation
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        {observation.flagged_for_admin && (
                            <Badge
                                variant="outline"
                                className="border-red-300 text-red-700"
                            >
                                <Flag className="mr-1 size-3" />
                                Flagged
                            </Badge>
                        )}

                        <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClass(
                                observation.status,
                            )}`}
                        >
                            {observation.status_label}
                        </span>
                    </div>
                </div>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <History className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                Practitioner Observation Versions & History
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Observation #{observation.id}
                                {observation.title
                                    ? ` · ${observation.title}`
                                    : ''}
                            </p>

                            <p className="mt-2 text-xs text-muted-foreground">
                                Read-only history. Submitted versions,
                                acknowledgements and review events cannot be
                                edited here.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <InfoCard title="Observation">
                        <Detail
                            label="Status"
                            value={observation.status_label}
                        />

                        <Detail
                            label="Versions"
                            value={String(versions.length)}
                        />

                        <Detail
                            label="Submitted"
                            value={formatDate(
                                observation.submitted_at,
                            )}
                        />

                        <Detail
                            label="Last Updated"
                            value={formatDate(
                                observation.updated_at,
                            )}
                        />
                    </InfoCard>

                    <InfoCard title="Practitioner">
                        <Detail
                            label="Name"
                            value={practitioner.name}
                        />

                        <Detail
                            label="Email"
                            value={practitioner.email}
                        />

                        <Detail
                            label="Professional Title"
                            value={
                                practitioner.professional_title
                            }
                        />

                        <Detail
                            label="Verification"
                            value={
                                practitioner.verification_status
                            }
                        />
                    </InfoCard>

                    <InfoCard title="Patient">
                        <Detail
                            label="Patient Reference"
                            value={patient.client_reference}
                        />

                        <Detail
                            label="Status"
                            value={patient.status}
                        />

                        <p className="text-xs text-muted-foreground">
                            Private patient identity is intentionally not shown
                            on this page.
                        </p>
                    </InfoCard>
                </section>

                {/* Submitted Versions */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Submitted Versions
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Every submitted and resubmitted observation version.
                        </p>
                    </div>

                    {versions.length === 0 && (
                        <EmptyState>
                            This observation has no submitted versions yet.
                        </EmptyState>
                    )}

                    {versions.map((version, index) => (
                        <details
                            key={version.id}
                            open={index === 0}
                            className="group overflow-hidden rounded-xl border bg-card shadow-sm"
                        >
                            <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">
                                            Version {version.version_number}
                                        </h3>

                                        {version.is_latest && (
                                            <Badge variant="secondary">
                                                Latest
                                            </Badge>
                                        )}

                                        {version.is_approved && (
                                            <Badge className="bg-green-600 text-white">
                                                Approved
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Submitted by{' '}
                                        {version.submitted_by?.name
                                            ?? 'Unknown user'}
                                        {' · '}
                                        {formatDate(
                                            version.submitted_at,
                                        )}
                                    </p>
                                </div>

                                <span className="text-sm font-medium text-primary group-open:hidden">
                                    View Version
                                </span>

                                <span className="hidden text-sm font-medium text-primary group-open:inline">
                                    Hide Version
                                </span>
                            </summary>

                            <div className="space-y-5 border-t p-5">
                                <SnapshotSection
                                    title="Submitted Snapshot"
                                    fields={
                                        version.submitted_snapshot
                                    }
                                />

                                {version.version_number > 1 && (
                                    <ChangesSection
                                        title={`Changes from Version ${
                                            version.version_number - 1
                                        }`}
                                        changes={
                                            version.changes_from_previous
                                        }
                                    />
                                )}

                                {version.approved_snapshot.length > 0 && (
                                    <>
                                        <SnapshotSection
                                            title="Approved Snapshot"
                                            fields={
                                                version.approved_snapshot
                                            }
                                        />

                                        <div className="rounded-lg border bg-green-50/50 p-4 text-sm">
                                            <p className="font-medium">
                                                Approved by{' '}
                                                {version.approved_by?.name
                                                    ?? 'Admin'}
                                            </p>

                                            <p className="mt-1 text-muted-foreground">
                                                {formatDate(
                                                    version.approved_at,
                                                )}
                                            </p>
                                        </div>

                                        <ChangesSection
                                            title="Changes Before Approval"
                                            changes={
                                                version.approval_changes
                                            }
                                        />
                                    </>
                                )}

                                <div className="rounded-lg border p-4">
                                    <h4 className="font-medium">
                                        Linked Patient Consent
                                    </h4>

                                    {version.client_consent ? (
                                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                            <Detail
                                                label="Receipt ID"
                                                value={`#${version.client_consent.id}`}
                                            />

                                            <Detail
                                                label="State"
                                                value={formatLabel(
                                                    version.client_consent.action,
                                                )}
                                            />

                                            <Detail
                                                label="Statement Version"
                                                value={
                                                    version
                                                        .client_consent
                                                        .statement_version
                                                }
                                            />

                                            <Detail
                                                label="Occurred"
                                                value={formatDate(
                                                    version
                                                        .client_consent
                                                        .occurred_at,
                                                )}
                                            />

                                            <Detail
                                                label="Recorded By"
                                                value={
                                                    version
                                                        .client_consent
                                                        .recorded_by
                                                        ?.name
                                                    ?? null
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            No linked patient consent receipt.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </details>
                    ))}
                </section>

                {/* Acknowledgement History */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Acknowledgements History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Acknowledgements accepted for each submitted
                            version.
                        </p>
                    </div>

                    {versions.length === 0 && (
                        <EmptyState>
                            No acknowledgement history exists yet.
                        </EmptyState>
                    )}

                    {versions.map((version) => (
                        <div
                            key={`ack-${version.id}`}
                            className="rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">
                                        Version {version.version_number}
                                    </h3>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Submitted{' '}
                                        {formatDate(
                                            version.submitted_at,
                                        )}
                                    </p>
                                </div>

                                {version.acknowledgement_complete ? (
                                    <Badge className="bg-green-600 text-white">
                                        <CheckCircle2 className="mr-1 size-3" />

                                        Complete{' '}
                                        {version.acknowledgement_count}/
                                        {
                                            version
                                                .required_acknowledgement_count
                                        }
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="border-red-300 text-red-700"
                                    >
                                        <TriangleAlert className="mr-1 size-3" />

                                        Incomplete{' '}
                                        {version.acknowledgement_count}/
                                        {
                                            version
                                                .required_acknowledgement_count
                                        }
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                {version.acknowledgements.map(
                                    (acknowledgement) => (
                                        <div
                                            key={
                                                acknowledgement.id
                                            }
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-600" />

                                                <div>
                                                    <p className="whitespace-pre-wrap text-sm">
                                                        {
                                                            acknowledgement
                                                                .statement_text
                                                        }
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <span>
                                                            Code:{' '}
                                                            {
                                                                acknowledgement
                                                                    .statement_code
                                                            }
                                                        </span>

                                                        <span>
                                                            Statement version:{' '}
                                                            {
                                                                acknowledgement
                                                                    .statement_version
                                                            }
                                                        </span>

                                                        <span>
                                                            Accepted by:{' '}
                                                            {
                                                                acknowledgement
                                                                    .accepted_by
                                                                    ?.name
                                                                ?? '—'
                                                            }
                                                        </span>

                                                        <span>
                                                            Accepted:{' '}
                                                            {formatDate(
                                                                acknowledgement
                                                                    .accepted_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}

                                {version.acknowledgements.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No acknowledgements recorded for this
                                        version.
                                    </p>
                                )}

                                {!version.acknowledgement_complete
                                    && version
                                        .missing_acknowledgement_codes
                                        .length > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                            <p className="font-medium">
                                                Missing acknowledgements
                                            </p>

                                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                                {version
                                                    .missing_acknowledgement_codes
                                                    .map((code) => (
                                                        <li key={code}>
                                                            {formatLabel(code)}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Review Checks History */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Review Checks History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Historical review decisions, comments and review
                            check results.
                        </p>
                    </div>

                    {reviewChecks.length === 0 && (
                        <EmptyState>
                            No Admin review decisions have been recorded yet.
                        </EmptyState>
                    )}

                    {reviewChecks.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                                        <FileClock className="size-4" />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">
                                                {formatLabel(
                                                    review.action,
                                                )}
                                            </h3>

                                            {review.version_number && (
                                                <Badge variant="outline">
                                                    Version{' '}
                                                    {
                                                        review
                                                            .version_number
                                                    }
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {review.actor?.name
                                                ?? 'Unknown user'}
                                            {' · '}
                                            {formatDate(
                                                review.acted_at,
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatLabel(
                                                review.from_status,
                                            )}
                                            {' → '}
                                            {formatLabel(
                                                review.to_status,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {hasReviewChecks(review) && (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                    <ReviewCheck
                                        label="Condition"
                                        value={
                                            review.condition_check
                                        }
                                    />

                                    <ReviewCheck
                                        label="Language"
                                        value={
                                            review
                                                .observation_language_check
                                        }
                                    />

                                    <ReviewCheck
                                        label="De-identification"
                                        value={
                                            review
                                                .deidentification_check
                                        }
                                    />

                                    <ReviewCheck
                                        label="Consent"
                                        value={
                                            review.consent_check
                                        }
                                    />

                                    <ReviewCheck
                                        label="Publication"
                                        value={
                                            review.publication_check
                                        }
                                    />
                                </div>
                            )}

                            {review.review_comment && (
                                <div className="mt-4 rounded-lg border p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Review Comment
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {review.review_comment}
                                    </p>
                                </div>
                            )}

                            {review.internal_note && (
                                <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Internal Note
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {review.internal_note}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </section>

                {/* Flag History */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Flag / Resolve History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Historical Admin flag and flag-resolution events.
                        </p>
                    </div>

                    {observation.flagged_for_admin && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
                            <div className="flex items-start gap-3">
                                <Flag className="mt-0.5 size-5 shrink-0" />

                                <div>
                                    <p className="font-medium">
                                        Currently Flagged
                                    </p>

                                    <p className="mt-1 text-sm">
                                        Flagged by{' '}
                                        {observation.flagged_by?.name
                                            ?? 'Unknown user'}
                                        {' · '}
                                        {formatDate(
                                            observation.flagged_at,
                                        )}
                                    </p>

                                    <p className="mt-1 text-sm">
                                        Current observation status remains{' '}
                                        <strong>
                                            {observation.status_label}
                                        </strong>
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {flagHistory.length === 0 && (
                        <EmptyState>
                            This observation has never been flagged.
                        </EmptyState>
                    )}

                    {flagHistory.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-xl border bg-card p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                                    <Flag className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">
                                            {review.action === 'flagged'
                                                ? 'Flagged for Admin'
                                                : 'Flag Resolved'}
                                        </h3>

                                        {review.version_number && (
                                            <Badge variant="outline">
                                                Version{' '}
                                                {
                                                    review
                                                        .version_number
                                                }
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {review.actor?.name
                                            ?? 'Unknown user'}
                                        {' · '}
                                        {formatDate(
                                            review.acted_at,
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Observation status remained{' '}
                                        {formatLabel(
                                            review.to_status,
                                        )}
                                    </p>

                                    {review.internal_note && (
                                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {review.action ===
                                                'flagged'
                                                    ? 'Flag Reason'
                                                    : 'Resolution Note'}
                                            </p>

                                            <p className="mt-1 whitespace-pre-wrap text-sm">
                                                {
                                                    review.internal_note
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </>
    );
}

function InfoCard({
                      title,
                      children,
                  }: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
                {title}
            </h2>

            <div className="mt-4 grid gap-3 text-sm">
                {children}
            </div>
        </div>
    );
}

function Detail({
                    label,
                    value,
                }: {
    label: string;
    value: string | null;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1">
                {value || '—'}
            </p>
        </div>
    );
}

function SnapshotSection({
                             title,
                             fields,
                         }: {
    title: string;
    fields: SnapshotField[];
}) {
    return (
        <div className="rounded-lg border p-4">
            <h4 className="font-medium">
                {title}
            </h4>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                    <div
                        key={field.key}
                        className={
                            field.key === 'observation'
                            || field.key === 'timeline_text'
                            || field.key === 'practitioner_note'
                                ? 'md:col-span-2'
                                : ''
                        }
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {field.label}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                            {valueText(field.value)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChangesSection({
                            title,
                            changes,
                        }: {
    title: string;
    changes: SnapshotChange[];
}) {
    return (
        <div className="rounded-lg border p-4">
            <h4 className="font-medium">
                {title}
            </h4>

            {changes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    No changes detected.
                </p>
            ) : (
                <div className="mt-4 space-y-4">
                    {changes.map((change) => (
                        <div
                            key={change.key}
                            className="rounded-lg border p-4"
                        >
                            <p className="text-sm font-medium">
                                {change.label}
                            </p>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-md border bg-muted/30 p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Before
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                        {valueText(
                                            change.before,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-md border p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        After
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                        {valueText(
                                            change.after,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReviewCheck({
                         label,
                         value,
                     }: {
    label: string;
    value: string | null;
}) {
    const passed =
        value === 'passed'
        || value === 'ready';

    return (
        <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <div className="mt-1 flex items-center gap-2 text-sm">
                {value && (
                    passed
                        ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                        )
                        : (
                            <TriangleAlert className="size-4 text-amber-600" />
                        )
                )}

                <span>
                    {formatLabel(value)}
                </span>
            </div>
        </div>
    );
}

function EmptyState({children}: {
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}

function hasReviewChecks(
    review: ReviewHistory,
) {
    return Boolean(
        review.condition_check
        || review.observation_language_check
        || review.deidentification_check
        || review.consent_check
        || review.publication_check,
    );
}

PractitionerObservationHistory.layout = {
    breadcrumbs: [
        {
            title: 'Review Practitioner Observations',
            href: '/admin/review-practitioner-observations',
        },
        {
            title: 'Versions & History',
            href: '#',
        },
    ],
};
