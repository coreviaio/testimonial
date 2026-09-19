import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AdminForm, FormHeading, MultiSelect, TextField } from '@/components/admin/admin-ui';
import type { RoleOption } from '@/types/rbac';

type UserFormRecord = { id: number; name: string; email: string; role_ids: number[] };
type Props = { user: UserFormRecord | null; roles: RoleOption[] };

export default function UserForm({ user, roles }: Props) {
    const editing = user !== null;
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        role_ids: (user?.role_ids ?? []).map(Number),
    });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editing) form.put(`/admin/users/${user.id}`);
        else form.post('/admin/users');
    }
    return <AdminForm
        section="users" title={editing ? 'Edit user' : 'Create user'}
        description="Set account details, credentials, and the roles that grant access."
        backHref="/admin/users" editing={editing} processing={form.processing} onSubmit={submit}
        guidance={<><h3>Access guidance</h3>
            <p>Users receive permissions through the roles you assign here.</p>
            <ul><li>Every account needs at least one role.</li><li>Leave the password blank when editing to keep the existing password.</li><li>Changes to roles take effect on the next request.</li></ul></>}
    >
        <FormHeading title="Account information" description="Basic details displayed throughout the application." />
        <div className="rbac-fields-two">
            <TextField id="name" label="Full name" value={form.data.name} maxLength={255} autoComplete="name" required
                       onChange={(event) => form.setData('name', event.target.value)} error={form.errors.name} />
            <TextField id="email" label="Email address" value={form.data.email} type="email" maxLength={255} autoComplete="email" required
                       onChange={(event) => form.setData('email', event.target.value)} error={form.errors.email} />
        </div>
        <div className="rbac-divider" />
        <FormHeading title="Security" description={editing ? 'Only enter a new password if it needs to change.' : 'Create a password for the new account.'} />
        <div className="rbac-fields-two">
            <TextField id="password" label={editing ? 'New password' : 'Password'} value={form.data.password} type="password"
                       autoComplete="new-password" required={!editing} onChange={(event) => form.setData('password', event.target.value)} error={form.errors.password} />
            <TextField id="password_confirmation" label="Confirm password" value={form.data.password_confirmation} type="password"
                       autoComplete="new-password" required={!editing} onChange={(event) => form.setData('password_confirmation', event.target.value)}
                       error={form.errors.password_confirmation} />
        </div>
        <div className="rbac-divider" />
        <FormHeading title="Access" description="Select one or more roles for this account." />
        <MultiSelect label="Assigned roles" options={roles} selected={form.data.role_ids}
                     onChange={(ids) => form.setData('role_ids', ids)} error={form.errors.role_ids ?? form.errors['role_ids.0' as keyof typeof form.errors]} />
    </AdminForm>;
}

UserForm.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: '/admin/users',
        },
    ],
};
