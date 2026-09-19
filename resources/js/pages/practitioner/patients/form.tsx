import { Head, Link, useForm } from '@inertiajs/react';
import { Save, UserRound } from 'lucide-react';
import FlashMessages from '@/components/admin/flash-messages';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Patient = {
    id: number;
    client_reference: string;
    name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    age_years: number | null;
    age_recorded_on: string | null;
    gender: string | null;
    country_code: string | null;
    private_notes: string | null;
    status: string;
};

type Props = {
    patient: Patient | null;
};

type PatientForm = {
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    age_years: string;
    age_recorded_on: string;
    gender: string;
    country_code: string;
    private_notes: string;
};

export default function PatientFormPage({ patient }: Props) {
    const editing = patient !== null;

    const form = useForm<PatientForm>({
        name: patient?.name ?? '',
        email: patient?.email ?? '',
        phone: patient?.phone ?? '',
        date_of_birth: patient?.date_of_birth ?? '',
        age_years: patient?.age_years?.toString() ?? '',
        age_recorded_on: patient?.age_recorded_on ?? '',
        gender: patient?.gender ?? '',
        country_code: patient?.country_code ?? '',
        private_notes: patient?.private_notes ?? '',
    });

    function save() {
        if (form.processing) return;

        if (editing) {
            form.put(`/practitioner/patients/${patient.id}`, {
                preserveScroll: true,
            });

            return;
        }

        form.post('/practitioner/patients', {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={editing ? 'Edit Patient' : 'Add Patient'} />

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-hidden p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                        <UserRound className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold">
                            {editing ? 'Edit Patient' : 'Add Patient'}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Patient information is private and linked only to your practitioner account.
                        </p>
                    </div>
                </div>

                <FlashMessages />

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    {editing && (
                        <div className="mb-5 grid gap-2">
                            <Label>Patient Reference</Label>

                            <Input
                                value={patient.client_reference}
                                disabled
                            />

                            <p className="text-xs text-muted-foreground">
                                Patient reference is generated automatically and cannot be changed.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Patient Name <span className="text-destructive">*</span>
                            </Label>

                            <Input
                                id="name"
                                value={form.data.name}
                                maxLength={200}
                                onChange={(event) => form.setData('name', event.target.value)}
                            />

                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>

                            <Input
                                id="phone"
                                value={form.data.phone}
                                maxLength={30}
                                onChange={(event) => form.setData('phone', event.target.value)}
                            />

                            <InputError message={form.errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>

                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                maxLength={254}
                                onChange={(event) => form.setData('email', event.target.value)}
                            />

                            <InputError message={form.errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gender">Gender</Label>

                            <Input
                                id="gender"
                                value={form.data.gender}
                                maxLength={32}
                                onChange={(event) => form.setData('gender', event.target.value)}
                            />

                            <InputError message={form.errors.gender} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>

                            <Input
                                id="date_of_birth"
                                type="date"
                                value={form.data.date_of_birth}
                                onChange={(event) => {
                                    form.setData((data) => ({
                                        ...data,
                                        date_of_birth: event.target.value,
                                        age_years: event.target.value ? '' : data.age_years,
                                        age_recorded_on: event.target.value ? '' : data.age_recorded_on,
                                    }));
                                }}
                            />

                            <InputError message={form.errors.date_of_birth} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="age_years">Age in Years</Label>

                            <Input
                                id="age_years"
                                type="number"
                                min="0"
                                max="130"
                                value={form.data.age_years}
                                onChange={(event) => {
                                    form.setData((data) => ({
                                        ...data,
                                        age_years: event.target.value,
                                        date_of_birth: event.target.value ? '' : data.date_of_birth,
                                    }));
                                }}
                            />

                            <p className="text-xs text-muted-foreground">
                                Use age only when date of birth is not available.
                            </p>

                            <InputError message={form.errors.age_years} />
                        </div>

                        {form.data.age_years !== '' && (
                            <div className="grid gap-2">
                                <Label htmlFor="age_recorded_on">Age Recorded On</Label>

                                <Input
                                    id="age_recorded_on"
                                    type="date"
                                    value={form.data.age_recorded_on}
                                    onChange={(event) =>
                                        form.setData('age_recorded_on', event.target.value)
                                    }
                                />

                                <p className="text-xs text-muted-foreground">
                                    If left empty, today's date will be recorded automatically.
                                </p>

                                <InputError message={form.errors.age_recorded_on} />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="country_code">Country Code</Label>

                            <Input
                                id="country_code"
                                value={form.data.country_code}
                                maxLength={2}
                                placeholder="BD"
                                onChange={(event) =>
                                    form.setData(
                                        'country_code',
                                        event.target.value.toUpperCase()
                                    )
                                }
                            />

                            <InputError message={form.errors.country_code} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="private_notes">Private Notes</Label>

                            <textarea
                                id="private_notes"
                                rows={5}
                                value={form.data.private_notes}
                                onChange={(event) =>
                                    form.setData('private_notes', event.target.value)
                                }
                                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                            />

                            <p className="text-xs text-muted-foreground">
                                Private practitioner notes. These must never be shown publicly.
                            </p>

                            <InputError message={form.errors.private_notes} />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                        <Link
                            href="/practitioner/patients"
                            className="inline-flex h-9 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </Link>

                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                save();
                            }}
                            className={`inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${
                                form.processing
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'cursor-pointer'
                            }`}
                        >
                            <Save className="size-4" />

                            {form.processing
                                ? 'Saving...'
                                : editing
                                    ? 'Update Patient'
                                    : 'Save Patient'}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

PatientFormPage.layout = {
    breadcrumbs: [
        {
            title: 'My Patients',
            href: '/practitioner/patients',
        },
    ],
};
