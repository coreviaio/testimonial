import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import {
    BriefcaseMedical,
    FileCheck2,
    LockKeyhole,
    Save,
    Send,
    ShieldCheck,
    Upload,
    UserRound,
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

type DocumentType =
    | 'primary_credential'
    | 'license_registration'
    | 'supporting_document';

type DocumentInfo = {
    id: number;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    expires_at: string | null;
};

type Acknowledgement = {
    code: string;
    text: string;
    accepted: boolean;
};

type Props = {
    account: {
        name: string;
        email: string;
    };

    profile: {
        phone: string | null;
        country_code: string | null;
        city: string | null;
        profile_photo_url: string | null;
    };

    practitioner: {
        practitioner_type: string | null;
        professional_title: string | null;
        specialty: string | null;
        professional_bio: string | null;
        organization_name: string | null;
        years_of_experience: string | null;
        license_number: string | null;
        issuing_authority: string | null;
        registration_jurisdiction: string | null;
        professional_website: string | null;
        verification_notes: string | null;
        show_identity_publicly: boolean;
        public_display_name: string | null;
        public_professional_description:
            string | null;
    } | null;

    verification: {
        status: string;
        status_label: string;
        attempt_number: number | null;
        submitted_at: string | null;
        review_comment: string | null;
        can_edit: boolean;
    };

    documents: Partial<
        Record<
            DocumentType,
            DocumentInfo
        >
    >;

    document_expiry_date: string | null;

    acknowledgements: Acknowledgement[];
};

type FormData = {
    phone: string;
    country_code: string;
    city: string;

    profile_photo: File | null;

    practitioner_type: string;
    professional_title: string;
    specialty: string;
    professional_bio: string;
    organization_name: string;
    years_of_experience: string;

    license_number: string;
    issuing_authority: string;
    registration_jurisdiction: string;

    professional_website: string;
    verification_notes: string;

    show_identity_publicly: boolean;
    public_display_name: string;
    public_professional_description: string;

    primary_credential: File | null;
    license_document: File | null;
    supporting_document: File | null;

    document_expiry_date: string;

    acknowledgements: Record<
        string,
        boolean
    >;
};

type TextFieldProps = {
    id: keyof FormData;
    label: string;
    value: string;
    error?: string;
    disabled: boolean;
    required?: boolean;
    type?: string;
    maxLength?: number;
    min?: string;
    max?: string;
    step?: string;
    onChange: (
        value: string,
    ) => void;
};

function RequiredMark() {
    return (
        <span className="text-destructive">
            {' '}
            *
        </span>
    );
}

function TextField({
                       id,
                       label,
                       value,
                       error,
                       disabled,
                       required,
                       type = 'text',
                       maxLength,
                       min,
                       max,
                       step,
                       onChange,
                   }: TextFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}

                {required && (
                    <RequiredMark />
                )}
            </Label>

            <Input
                id={id}
                type={type}
                value={value}
                disabled={disabled}
                maxLength={maxLength}
                min={min}
                max={max}
                step={step}
                onChange={(event) => {
                    onChange(
                        event.target.value,
                    );
                }}
            />

            <InputError
                message={error}
            />
        </div>
    );
}

function TextAreaField({
                           id,
                           label,
                           value,
                           error,
                           disabled,
                           required = false,
                           rows = 4,
                           maxLength,
                           onChange,
                       }: {
    id: string;
    label: string;
    value: string;
    error?: string;
    disabled: boolean;
    required?: boolean;
    rows?: number;
    maxLength?: number;
    onChange: (
        value: string,
    ) => void;
}) {
    return (
        <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={id}>
                {label}

                {required && (
                    <RequiredMark />
                )}
            </Label>

            <textarea
                id={id}
                rows={rows}
                maxLength={maxLength}
                value={value}
                disabled={disabled}
                onChange={(event) => {
                    onChange(
                        event.target.value,
                    );
                }}
                className="border-input bg-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <InputError
                message={error}
            />
        </div>
    );
}

function ExistingDocument({
                              document,
                          }: {
    document?: DocumentInfo;
}) {
    if (!document) {
        return (
            <p className="mt-2 text-xs text-muted-foreground">
                No document uploaded yet.
            </p>
        );
    }

    const size =
        document.size_bytes < 1048576
            ? `${(
                document.size_bytes /
                1024
            ).toFixed(1)} KB`
            : `${(
                document.size_bytes /
                1048576
            ).toFixed(1)} MB`;

    return (
        <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
            <p className="font-medium">
                {
                    document.original_filename
                }
            </p>

            <p className="mt-1 text-muted-foreground">
                {document.mime_type}
                {' · '}
                {size}

                {document.expires_at
                    ? ` · Expires ${document.expires_at}`
                    : ''}
            </p>
        </div>
    );
}

function FileField({
                       id,
                       label,
                       required,
                       disabled,
                       document,
                       error,
                       onChange,
                   }: {
    id:
        | 'primary_credential'
        | 'license_document'
        | 'supporting_document';

    label: string;
    required?: boolean;
    disabled: boolean;
    document?: DocumentInfo;
    error?: string;

    onChange: (
        file: File | null,
    ) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}

                {required && (
                    <RequiredMark />
                )}
            </Label>

            <div className="relative">
                <Upload className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    id={id}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={disabled}
                    className="cursor-pointer pl-9"
                    onChange={(event) => {
                        onChange(
                            event.target
                                .files?.[0]
                            ?? null,
                        );
                    }}
                />
            </div>

            <ExistingDocument
                document={document}
            />

            <InputError
                message={error}
            />
        </div>
    );
}

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

export default function PractitionerApplication({
                                                    account,
                                                    profile,
                                                    practitioner,
                                                    verification,
                                                    documents,
                                                    document_expiry_date,
                                                    acknowledgements,
                                                }: Props) {
    const canEdit =
        verification.can_edit;

    const form =
        useForm<FormData>({
            phone:
                profile.phone
                ?? '',

            country_code:
                profile.country_code
                ?? '',

            city:
                profile.city
                ?? '',

            profile_photo: null,

            practitioner_type:
                practitioner
                    ?.practitioner_type
                ?? '',

            professional_title:
                practitioner
                    ?.professional_title
                ?? '',

            specialty:
                practitioner
                    ?.specialty
                ?? '',

            professional_bio:
                practitioner
                    ?.professional_bio
                ?? '',

            organization_name:
                practitioner
                    ?.organization_name
                ?? '',

            years_of_experience:
                practitioner
                    ?.years_of_experience
                ?? '',

            license_number:
                practitioner
                    ?.license_number
                ?? '',

            issuing_authority:
                practitioner
                    ?.issuing_authority
                ?? '',

            registration_jurisdiction:
                practitioner
                    ?.registration_jurisdiction
                ?? '',

            professional_website:
                practitioner
                    ?.professional_website
                ?? '',

            verification_notes:
                practitioner
                    ?.verification_notes
                ?? '',

            show_identity_publicly:
                practitioner
                    ?.show_identity_publicly
                ?? false,

            public_display_name:
                practitioner
                    ?.public_display_name
                ?? '',

            public_professional_description:
                practitioner
                    ?.public_professional_description
                ?? '',

            primary_credential: null,

            license_document: null,

            supporting_document: null,

            document_expiry_date:
                document_expiry_date
                ?? '',

            acknowledgements:
                Object.fromEntries(
                    acknowledgements.map(
                        (item) => [
                            item.code,
                            item.accepted,
                        ],
                    ),
                ),
        });

    const errors =
        form.errors as Record<
            string,
            string | undefined
        >;

    function clearFiles() {
        form.setData(
            (data) => ({
                ...data,

                profile_photo: null,

                primary_credential:
                    null,

                license_document:
                    null,

                supporting_document:
                    null,
            }),
        );
    }

    function saveDraft() {
        if (
            !canEdit
            || form.processing
        ) {
            return;
        }

        form.post(
            '/practitioner/application/draft',
            {
                forceFormData: true,
                preserveScroll: true,

                onSuccess: () => {
                    clearFiles();
                },
            },
        );
    }

    function submitForVerification() {
        if (
            !canEdit
            || form.processing
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                'Submit this practitioner application for Admin verification?',
            );

        if (!confirmed) {
            return;
        }

        form.post(
            '/practitioner/application/submit',
            {
                forceFormData: true,
                preserveScroll: true,

                onSuccess: () => {
                    clearFiles();
                },
            },
        );
    }

    return (
        <>
            <Head title="Practitioner Application" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                <section className="rounded-xl border bg-card p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <BriefcaseMedical className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Practitioner
                                    Application
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Complete your
                                    professional
                                    information,
                                    upload
                                    credentials, and
                                    submit for
                                    verification.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Badge variant="outline">
                                {
                                    verification.status_label
                                }
                            </Badge>

                            {verification.attempt_number && (
                                <Badge variant="secondary">
                                    Attempt #
                                    {
                                        verification.attempt_number
                                    }
                                </Badge>
                            )}
                        </div>
                    </div>
                </section>

                {!canEdit && (
                    <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                        <LockKeyhole className="mt-0.5 size-4 shrink-0" />

                        <div>
                            <p className="font-medium">
                                This application
                                is read-only.
                            </p>

                            <p className="mt-1 text-muted-foreground">
                                Current status:{' '}
                                {
                                    verification.status_label
                                }.
                                Admin review is
                                the next step.
                            </p>
                        </div>
                    </div>
                )}

                {verification.review_comment && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                        <p className="font-medium">
                            Admin review note
                        </p>

                        <p className="mt-1 whitespace-pre-wrap">
                            {
                                verification.review_comment
                            }
                        </p>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex gap-3">
                            <UserRound className="mt-1 size-5" />

                            <div>
                                <CardTitle>
                                    1. Basic
                                    Information
                                </CardTitle>

                                <CardDescription>
                                    Your account and
                                    contact
                                    information.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                Name
                            </Label>

                            <Input
                                value={
                                    account.name
                                }
                                disabled
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                Email
                            </Label>

                            <Input
                                value={
                                    account.email
                                }
                                disabled
                            />
                        </div>

                        <TextField
                            id="phone"
                            label="Phone"
                            value={
                                form.data.phone
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={30}
                            error={
                                errors.phone
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'phone',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="country_code"
                            label="Country Code"
                            value={
                                form.data
                                    .country_code
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={2}
                            error={
                                errors.country_code
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'country_code',
                                    value.toUpperCase(),
                                )
                            }
                        />

                        <TextField
                            id="city"
                            label="City / Location"
                            value={
                                form.data.city
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={150}
                            error={
                                errors.city
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'city',
                                    value,
                                )
                            }
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="profile_photo">
                                Profile Photo
                            </Label>

                            <Input
                                id="profile_photo"
                                type="file"
                                accept="image/*"
                                disabled={
                                    !canEdit
                                }
                                className="cursor-pointer"
                                onChange={(
                                    event,
                                ) => {
                                    form.setData(
                                        'profile_photo',
                                        event.target
                                            .files?.[0]
                                        ?? null,
                                    );
                                }}
                            />

                            {profile.profile_photo_url && (
                                <img
                                    src={
                                        profile.profile_photo_url
                                    }
                                    alt="Current profile"
                                    className="size-14 rounded-md border object-cover"
                                />
                            )}

                            <InputError
                                message={
                                    errors.profile_photo
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex gap-3">
                            <BriefcaseMedical className="mt-1 size-5" />

                            <div>
                                <CardTitle>
                                    2. Practitioner
                                    / Professional
                                    Information
                                </CardTitle>

                                <CardDescription>
                                    Professional
                                    details reviewed
                                    by Admin.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <TextField
                            id="practitioner_type"
                            label="Practitioner Type"
                            value={
                                form.data
                                    .practitioner_type
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={50}
                            error={
                                errors.practitioner_type
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'practitioner_type',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="professional_title"
                            label="Professional Title"
                            value={
                                form.data
                                    .professional_title
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={150}
                            error={
                                errors.professional_title
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'professional_title',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="specialty"
                            label="Specialty / Area of Practice"
                            value={
                                form.data
                                    .specialty
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={255}
                            error={
                                errors.specialty
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'specialty',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="organization_name"
                            label="Organization / Clinic"
                            value={
                                form.data
                                    .organization_name
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={255}
                            error={
                                errors.organization_name
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'organization_name',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="years_of_experience"
                            label="Years of Experience"
                            type="number"
                            min="0"
                            max="99.9"
                            step="0.1"
                            value={
                                form.data
                                    .years_of_experience
                            }
                            disabled={
                                !canEdit
                            }
                            error={
                                errors.years_of_experience
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'years_of_experience',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="license_number"
                            label="Registration / License Number"
                            value={
                                form.data
                                    .license_number
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={150}
                            error={
                                errors.license_number
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'license_number',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="issuing_authority"
                            label="Issuing Authority / Professional Body"
                            value={
                                form.data
                                    .issuing_authority
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={255}
                            error={
                                errors.issuing_authority
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'issuing_authority',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="registration_jurisdiction"
                            label="Registration Country / Jurisdiction"
                            value={
                                form.data
                                    .registration_jurisdiction
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            maxLength={150}
                            error={
                                errors.registration_jurisdiction
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'registration_jurisdiction',
                                    value,
                                )
                            }
                        />

                        <TextField
                            id="professional_website"
                            label="Professional Website / Profile URL"
                            type="url"
                            value={
                                form.data
                                    .professional_website
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={2048}
                            error={
                                errors.professional_website
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'professional_website',
                                    value,
                                )
                            }
                        />

                        <TextAreaField
                            id="professional_bio"
                            label="Professional Bio"
                            value={
                                form.data
                                    .professional_bio
                            }
                            disabled={
                                !canEdit
                            }
                            required
                            rows={5}
                            error={
                                errors.professional_bio
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'professional_bio',
                                    value,
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex gap-3">
                            <FileCheck2 className="mt-1 size-5" />

                            <div>
                                <CardTitle>
                                    3. Verification
                                    Documents
                                </CardTitle>

                                <CardDescription>
                                    Credential files
                                    are stored
                                    privately.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <FileField
                            id="primary_credential"
                            label="Primary Credential / Certificate"
                            required
                            disabled={
                                !canEdit
                            }
                            document={
                                documents.primary_credential
                            }
                            error={
                                errors.primary_credential
                            }
                            onChange={(
                                file,
                            ) =>
                                form.setData(
                                    'primary_credential',
                                    file,
                                )
                            }
                        />

                        <FileField
                            id="license_document"
                            label="License / Registration Document"
                            required
                            disabled={
                                !canEdit
                            }
                            document={
                                documents.license_registration
                            }
                            error={
                                errors.license_document
                            }
                            onChange={(
                                file,
                            ) =>
                                form.setData(
                                    'license_document',
                                    file,
                                )
                            }
                        />

                        <FileField
                            id="supporting_document"
                            label="Additional Supporting Document"
                            disabled={
                                !canEdit
                            }
                            document={
                                documents.supporting_document
                            }
                            error={
                                errors.supporting_document
                            }
                            onChange={(
                                file,
                            ) =>
                                form.setData(
                                    'supporting_document',
                                    file,
                                )
                            }
                        />

                        <TextField
                            id="document_expiry_date"
                            label="Document Expiry Date"
                            type="date"
                            value={
                                form.data
                                    .document_expiry_date
                            }
                            disabled={
                                !canEdit
                            }
                            error={
                                errors.document_expiry_date
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'document_expiry_date',
                                    value,
                                )
                            }
                        />

                        <TextAreaField
                            id="verification_notes"
                            label="Verification Notes"
                            value={
                                form.data
                                    .verification_notes
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={
                                2000
                            }
                            error={
                                errors.verification_notes
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'verification_notes',
                                    value,
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex gap-3">
                            <ShieldCheck className="mt-1 size-5" />

                            <div>
                                <CardTitle>
                                    4. Public
                                    Profile &
                                    Identity
                                </CardTitle>

                                <CardDescription>
                                    Identity
                                    visibility only
                                    affects
                                    published
                                    content later.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-5 md:grid-cols-2">
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={
                                    form.data
                                        .show_identity_publicly
                                }
                                disabled={
                                    !canEdit
                                }
                                onChange={(
                                    event,
                                ) => {
                                    form.setData(
                                        'show_identity_publicly',
                                        event
                                            .target
                                            .checked,
                                    );
                                }}
                                className="mt-1 size-4 cursor-pointer"
                            />

                            <span>
                                <span className="block text-sm font-medium">
                                    Show
                                    Practitioner
                                    Identity
                                    Publicly
                                </span>

                                <span className="mt-1 block text-xs text-muted-foreground">
                                    This does
                                    not publish
                                    any
                                    observation
                                    automatically.
                                </span>
                            </span>
                        </label>

                        <TextField
                            id="public_display_name"
                            label="Public Display Name"
                            value={
                                form.data
                                    .public_display_name
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={150}
                            error={
                                errors.public_display_name
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'public_display_name',
                                    value,
                                )
                            }
                        />

                        <TextAreaField
                            id="public_professional_description"
                            label="Public Professional Description"
                            value={
                                form.data
                                    .public_professional_description
                            }
                            disabled={
                                !canEdit
                            }
                            maxLength={
                                1000
                            }
                            error={
                                errors.public_professional_description
                            }
                            onChange={(
                                value,
                            ) =>
                                form.setData(
                                    'public_professional_description',
                                    value,
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            5. Required
                            Acknowledgements
                        </CardTitle>

                        <CardDescription>
                            All must be
                            accepted before
                            submission.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {acknowledgements.map(
                            (item) => (
                                <div
                                    key={
                                        item.code
                                    }
                                >
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                                        <input
                                            type="checkbox"
                                            checked={
                                                form
                                                    .data
                                                    .acknowledgements[
                                                    item
                                                        .code
                                                    ]
                                                ?? false
                                            }
                                            disabled={
                                                !canEdit
                                            }
                                            onChange={(
                                                event,
                                            ) => {
                                                form.setData(
                                                    'acknowledgements',
                                                    {
                                                        ...form
                                                            .data
                                                            .acknowledgements,

                                                        [item.code]:
                                                        event
                                                            .target
                                                            .checked,
                                                    },
                                                );
                                            }}
                                            className="mt-1 size-4 cursor-pointer"
                                        />

                                        <span className="text-sm">
                                            {
                                                item.text
                                            }

                                            <RequiredMark />
                                        </span>
                                    </label>

                                    <InputError
                                        className="mt-1"
                                        message={
                                            errors[
                                                `acknowledgements.${item.code}`
                                                ]
                                        }
                                    />
                                </div>
                            ),
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            6. Submission
                        </CardTitle>

                        <CardDescription>
                            Save your
                            progress or
                            submit for
                            Admin
                            verification.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Status
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {
                                        verification.status_label
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Attempt
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {verification.attempt_number
                                        ? `#${verification.attempt_number}`
                                        : 'Not submitted'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Submitted
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {formatDate(
                                        verification.submitted_at,
                                    )}
                                </p>
                            </div>
                        </div>

                        {form.progress && (
                            <p className="text-sm text-muted-foreground">
                                Uploading{' '}
                                {form.progress
                                        .percentage
                                    ?? 0}
                                %
                            </p>
                        )}

                        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
                            <Link
                                href="/dashboard"
                                className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                            >
                                Back
                            </Link>

                            {canEdit && (
                                <>
                                    <a
                                        href="#"
                                        onClick={(
                                            event,
                                        ) => {
                                            event.preventDefault();

                                            saveDraft();
                                        }}
                                        className={`inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted ${
                                            form.processing
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer'
                                        }`}
                                    >
                                        <Save className="size-4" />

                                        Save Draft
                                    </a>

                                    <a
                                        href="#"
                                        onClick={(
                                            event,
                                        ) => {
                                            event.preventDefault();

                                            submitForVerification();
                                        }}
                                        className={`inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${
                                            form.processing
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer'
                                        }`}
                                    >
                                        <Send className="size-4" />

                                        {form.processing
                                            ? 'Processing...'
                                            : 'Submit for Verification'}
                                    </a>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PractitionerApplication.layout = {
    breadcrumbs: [
        {
            title: 'Practitioner Application',
            href: '/practitioner/application',
        },
    ],
};
