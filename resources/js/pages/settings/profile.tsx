import {
    useEffect,
    useState,
} from 'react';

import {
    Form,
    Head,
    Link,
    usePage,
} from '@inertiajs/react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

type ProfileData = {
    phone: string;
    country_code: string;
    city: string;
    short_bio: string;
    is_public: boolean;
    profile_photo_url: string | null;
};

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
    profile: ProfileData;
};

export default function Profile({
                                    mustVerifyEmail,
                                    status,
                                    profile,
                                }: Props) {
    const { auth } = usePage<PageProps>().props;

    const [
        photoPreview,
        setPhotoPreview,
    ] = useState<string | null>(
        profile.profile_photo_url,
    );

    const [
        removePhoto,
        setRemovePhoto,
    ] = useState(false);

    useEffect(() => {
        setPhotoPreview(
            profile.profile_photo_url,
        );

        setRemovePhoto(false);
    }, [
        profile.profile_photo_url,
    ]);

    const handlePhotoChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {
            if (
                typeof reader.result
                === 'string'
            ) {
                setPhotoPreview(
                    reader.result,
                );
            }
        };

        reader.readAsDataURL(file);

        setRemovePhoto(false);
    };

    const removeCurrentPhoto = () => {
        setPhotoPreview(null);
        setRemovePhoto(true);

        const input =
            document.getElementById(
                'profile_photo',
            ) as HTMLInputElement | null;

        if (input) {
            input.value = '';
        }
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">
                Profile settings
            </h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your personal profile information"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({
                          processing,
                          errors,
                      }) => (
                        <>
                            <div className="grid gap-2">
                                <Label>
                                    Profile photo
                                </Label>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                        {photoPreview ? (
                                            <img
                                                src={
                                                    photoPreview
                                                }
                                                alt="Profile"
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-semibold uppercase text-muted-foreground">
                                                {auth.user.name
                                                    .charAt(
                                                        0,
                                                    )}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid flex-1 gap-3">
                                        <Input
                                            id="profile_photo"
                                            name="profile_photo"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={
                                                handlePhotoChange
                                            }
                                        />

                                        <input
                                            type="hidden"
                                            name="remove_profile_photo"
                                            value={
                                                removePhoto
                                                    ? '1'
                                                    : '0'
                                            }
                                        />

                                        {photoPreview && (
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={
                                                        removeCurrentPhoto
                                                    }
                                                >
                                                    Remove photo
                                                </Button>
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            JPG, PNG or WEBP.
                                            Maximum 2MB.
                                        </p>

                                        <InputError
                                            message={
                                                errors.profile_photo
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Name
                                </Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={
                                        auth.user.name
                                    }
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={
                                        errors.name
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email address
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={
                                        auth.user.email
                                    }
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={
                                        errors.email
                                    }
                                />
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">
                                        Phone
                                    </Label>

                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={
                                            profile.phone
                                        }
                                        autoComplete="tel"
                                        placeholder="Phone number"
                                    />

                                    <InputError
                                        message={
                                            errors.phone
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="country_code">
                                        Country code
                                    </Label>

                                    <Input
                                        id="country_code"
                                        name="country_code"
                                        defaultValue={
                                            profile.country_code
                                        }
                                        maxLength={
                                            2
                                        }
                                        autoComplete="country"
                                        placeholder="BD"
                                        className="uppercase"
                                    />

                                    <InputError
                                        message={
                                            errors.country_code
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city">
                                    City
                                </Label>

                                <Input
                                    id="city"
                                    name="city"
                                    defaultValue={
                                        profile.city
                                    }
                                    maxLength={
                                        150
                                    }
                                    autoComplete="address-level2"
                                    placeholder="City"
                                />

                                <InputError
                                    message={
                                        errors.city
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="short_bio">
                                    Short bio
                                </Label>

                                <textarea
                                    id="short_bio"
                                    name="short_bio"
                                    rows={5}
                                    maxLength={
                                        1000
                                    }
                                    defaultValue={
                                        profile.short_bio
                                    }
                                    placeholder="Write a short bio..."
                                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />

                                <div className="text-xs text-muted-foreground">
                                    Maximum 1000 characters.
                                </div>

                                <InputError
                                    message={
                                        errors.short_bio
                                    }
                                />
                            </div>

                            <div className="rounded-lg border p-4">
                                <input
                                    type="hidden"
                                    name="is_public"
                                    value="0"
                                />

                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        value="1"
                                        defaultChecked={
                                            profile.is_public
                                        }
                                        className="mt-1 size-4"
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            Public profile
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Allow your profile information to be shown publicly where supported.
                                        </p>
                                    </div>
                                </label>

                                <InputError
                                    className="mt-2"
                                    message={
                                        errors.is_public
                                    }
                                />
                            </div>

                            {mustVerifyEmail
                                && auth.user
                                    .email_verified_at
                                === null
                                && (
                                    <div>
                                        <p className="text-muted-foreground -mt-4 text-sm">
                                            Your email
                                            address is
                                            unverified.{' '}

                                            <Link
                                                href={
                                                    send()
                                                }
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here
                                                to re-send
                                                the
                                                verification
                                                email.
                                            </Link>
                                        </p>

                                        {status
                                            === 'verification-link-sent'
                                            && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has been sent to your email address.
                                                </div>
                                            )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={
                                        processing
                                    }
                                    data-test="update-profile-button"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : 'Save'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
