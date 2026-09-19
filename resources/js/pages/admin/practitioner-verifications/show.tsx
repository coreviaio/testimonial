import { Head, Link, useForm } from '@inertiajs/react';
import { FileText, ShieldCheck } from 'lucide-react';
import FieldError from '@/components/admin/field-error';
import FlashMessages from '@/components/admin/flash-messages';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Verification = {
    id: number;
    attempt_number: number;
    status: string;
    status_label: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    review_comment: string | null;
    reviewer_name: string | null;
    can_review: boolean;
};

type Snapshot = {
    account: {
        name?: string | null;
        email?: string | null;
    };
    profile: {
        phone?: string | null;
        country_code?: string | null;
        city?: string | null;
    };
    practitioner: {
        practitioner_type?: string | null;
        professional_title?: string | null;
        specialty?: string | null;
        professional_bio?: string | null;
        organization_name?: string | null;
        years_of_experience?: string | null;
        license_number?: string | null;
        issuing_authority?: string | null;
        registration_jurisdiction?: string | null;
        professional_website?: string | null;
        verification_notes?: string | null;
        show_identity_publicly?: boolean;
        public_display_name?: string | null;
        public_professional_description?: string | null;
    };
};

type DocumentRecord = {
    id: number;
    document_type: string;
    document_type_label: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    expires_at: string | null;
    created_at: string | null;
    download_url: string;
};

type Acknowledgement = {
    id: number;
    statement_code: string;
    statement_version: string;
    statement_text: string;
    accepted_at: string | null;
};

type HistoryRecord = {
    id: number;
    attempt_number: number;
    status: string;
    status_label: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    review_comment: string | null;
    reviewer_name: string | null;
};

type Props = {
    verification: Verification;
    snapshot: Snapshot;
    documents: DocumentRecord[];
    acknowledgements: Acknowledgement[];
    history: HistoryRecord[];
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

function fileSize(bytes: number) {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Detail({
                    label,
                    value,
                }: {
    label: string;
    value: string | number | boolean | null | undefined;
}) {
    let displayValue = 'Not provided';

    if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
    } else if (value !== null && value !== undefined && value !== '') {
        displayValue = String(value);
    }

    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{displayValue}</p>
        </div>
    );
}

export default function PractitionerVerificationShow({
                                                         verification,
                                                         snapshot,
                                                         documents,
                                                         acknowledgements,
                                                         history,
                                                     }: Props) {
    const form = useForm({
        decision: 'approved',
        review_comment: '',
        internal_note: '',
    });

    function review() {
        if (!verification.can_review || form.processing) return;

        const confirmed = window.confirm(
            `Are you sure you want to mark this practitioner verification as ${form.data.decision.replaceAll('_', ' ')}?`
        );

        if (!confirmed) return;

        form.patch(
            `/admin/practitioner-verifications/${verification.id}/review`,
            {
                preserveScroll: true,
                onSuccess: () => form.reset(),
            }
        );
    }

    return (
        <>
            <Head title={`Practitioner Verification #${verification.id}`} />

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-hidden p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                            <ShieldCheck className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                Practitioner Verification
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Attempt #{verification.attempt_number}
                            </p>
                        </div>
                    </div>

                    <span className="w-fit rounded-full border px-3 py-1 text-sm">
                        {verification.status_label}
                    </span>
                </div>

                <FlashMessages />

                {verification.review_comment && (
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm font-medium">Review Comment</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {verification.review_comment}
                        </p>
                    </div>
                )}

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Account</h2>

                    <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        <Detail label="Name" value={snapshot.account.name} />
                        <Detail label="Email" value={snapshot.account.email} />
                        <Detail label="Phone" value={snapshot.profile.phone} />
                        <Detail label="Country" value={snapshot.profile.country_code} />
                        <Detail label="City" value={snapshot.profile.city} />
                        <Detail label="Submitted" value={formatDate(verification.submitted_at)} />
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Professional Details</h2>

                    <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        <Detail
                            label="Practitioner Type"
                            value={snapshot.practitioner.practitioner_type}
                        />

                        <Detail
                            label="Professional Title"
                            value={snapshot.practitioner.professional_title}
                        />

                        <Detail
                            label="Specialty"
                            value={snapshot.practitioner.specialty}
                        />

                        <Detail
                            label="Organization / Clinic"
                            value={snapshot.practitioner.organization_name}
                        />

                        <Detail
                            label="Years of Experience"
                            value={snapshot.practitioner.years_of_experience}
                        />

                        <Detail
                            label="License Number"
                            value={snapshot.practitioner.license_number}
                        />

                        <Detail
                            label="Issuing Authority"
                            value={snapshot.practitioner.issuing_authority}
                        />

                        <Detail
                            label="Registration Jurisdiction"
                            value={snapshot.practitioner.registration_jurisdiction}
                        />

                        <Detail
                            label="Professional Website"
                            value={snapshot.practitioner.professional_website}
                        />

                        <Detail
                            label="Show Identity Publicly"
                            value={snapshot.practitioner.show_identity_publicly}
                        />

                        <Detail
                            label="Public Display Name"
                            value={snapshot.practitioner.public_display_name}
                        />
                    </div>

                    <div className="mt-5 grid gap-5">
                        <Detail
                            label="Professional Bio"
                            value={snapshot.practitioner.professional_bio}
                        />

                        <Detail
                            label="Verification Notes"
                            value={snapshot.practitioner.verification_notes}
                        />

                        <Detail
                            label="Public Professional Description"
                            value={snapshot.practitioner.public_professional_description}
                        />
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Documents</h2>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-3 py-3 text-left font-medium">Type</th>
                                <th className="px-3 py-3 text-left font-medium">File</th>
                                <th className="px-3 py-3 text-left font-medium">Size</th>
                                <th className="px-3 py-3 text-left font-medium">Expiry</th>
                                <th className="px-3 py-3 text-right font-medium">Action</th>
                            </tr>
                            </thead>

                            <tbody>
                            {documents.map((document) => (
                                <tr key={document.id} className="border-b last:border-b-0">
                                    <td className="px-3 py-3">
                                        {document.document_type_label}
                                    </td>

                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-4" />

                                            <div>
                                                <p>{document.original_filename}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {document.mime_type}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-3 py-3">
                                        {fileSize(document.size_bytes)}
                                    </td>

                                    <td className="px-3 py-3">
                                        {document.expires_at || '—'}
                                    </td>

                                    <td className="px-3 py-3 text-right">
                                        <a
                                            href={document.download_url}
                                            className="cursor-pointer font-medium text-primary hover:underline"
                                        >
                                            Download
                                        </a>
                                    </td>
                                </tr>
                            ))}

                            {documents.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-3 py-8 text-center text-muted-foreground"
                                    >
                                        No documents uploaded.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Acknowledgements</h2>

                    <div className="mt-4 space-y-3">
                        {acknowledgements.map((item) => (
                            <div key={item.id} className="rounded-lg border p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium">
                                        {item.statement_code.replaceAll('_', ' ')}
                                    </p>

                                    <span className="text-xs text-muted-foreground">
                                        Version {item.statement_version}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    {item.statement_text}
                                </p>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Accepted: {formatDate(item.accepted_at)}
                                </p>
                            </div>
                        ))}

                        {acknowledgements.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No acknowledgements found.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Attempt History</h2>

                    <div className="mt-4 space-y-3">
                        {history.map((attempt) => (
                            <div
                                key={attempt.id}
                                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div>
                                    <p className="font-medium">
                                        Attempt #{attempt.attempt_number}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {attempt.status_label}
                                    </p>

                                    {attempt.review_comment && (
                                        <p className="mt-2 whitespace-pre-wrap text-sm">
                                            {attempt.review_comment}
                                        </p>
                                    )}
                                </div>

                                <div className="text-sm text-muted-foreground sm:text-right">
                                    <p>Submitted: {formatDate(attempt.submitted_at)}</p>
                                    <p>Reviewed: {formatDate(attempt.reviewed_at)}</p>

                                    {attempt.reviewer_name && (
                                        <p>By: {attempt.reviewer_name}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {verification.can_review && (
                    <section className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Decision</h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Approve the practitioner, request changes, or reject the application.
                        </p>

                        <div className="mt-5 grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="decision">Decision</Label>

                                <select
                                    id="decision"
                                    value={form.data.decision}
                                    onChange={(event) =>
                                        form.setData('decision', event.target.value)
                                    }
                                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                                >
                                    <option value="approved">Approve</option>
                                    <option value="changes_requested">
                                        Request Changes
                                    </option>
                                    <option value="rejected">Reject</option>
                                </select>

                                <FieldError message={form.errors.decision} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="review_comment">
                                    Review Comment
                                    {form.data.decision !== 'approved' && (
                                        <span className="text-destructive"> *</span>
                                    )}
                                </Label>

                                <textarea
                                    id="review_comment"
                                    rows={4}
                                    maxLength={5000}
                                    value={form.data.review_comment}
                                    onChange={(event) =>
                                        form.setData('review_comment', event.target.value)
                                    }
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />

                                <FieldError message={form.errors.review_comment} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="internal_note">Internal Note</Label>

                                <textarea
                                    id="internal_note"
                                    rows={4}
                                    maxLength={5000}
                                    value={form.data.internal_note}
                                    onChange={(event) =>
                                        form.setData('internal_note', event.target.value)
                                    }
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />

                                <FieldError message={form.errors.internal_note} />
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Link
                                    href="/admin/practitioner-verifications"
                                    className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                                >
                                    Back
                                </Link>

                                <a
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        review();
                                    }}
                                    className={`inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ${
                                        form.processing
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer'
                                    }`}
                                >
                                    {form.processing ? 'Processing...' : 'Save Decision'}
                                </a>
                            </div>
                        </div>
                    </section>
                )}

                {!verification.can_review && (
                    <div className="flex justify-end">
                        <Link
                            href="/admin/practitioner-verifications"
                            className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            Back to Practitioner Verification
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

PractitionerVerificationShow.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Verification',
            href: '/admin/practitioner-verifications',
        },
    ],
};
