import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AdminForm, FormHeading, TextAreaField, TextField } from '@/components/admin/admin-ui';

type PermissionFormRecord = { id: number; name: string; slug: string; description: string | null; protected: boolean };
type Props = { permission: PermissionFormRecord | null };

export default function PermissionForm({ permission }: Props) {
    const editing = permission !== null;
    const form = useForm({
        name: permission?.name ?? '',
        slug: permission?.slug ?? '',
        description: permission?.description ?? '',
    });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editing) form.put(`/admin/permissions/${permission.id}`);
        else form.post('/admin/permissions');
    }
    return <AdminForm
        section="permissions" title={editing ? 'Edit permission' : 'Create permission'}
        description="Create an action that can be granted through roles."
        backHref="/admin/permissions" editing={editing} processing={form.processing} onSubmit={submit}
        guidance={<><h3>Permission guidance</h3><p>A permission grants access once it is assigned to a role and checked by application code.</p>
            <ul><li>Use a consistent resource.action identifier.</li><li>System identifiers stay fixed to protect admin access.</li><li>Remove a permission from roles before deleting it.</li></ul></>}
    >
        <FormHeading title="Permission details" description="Use a readable name and an identifier for route checks." />
        <div className="rbac-fields-two">
            <TextField id="name" label="Permission name" value={form.data.name} required maxLength={100}
                       placeholder="Manage testimonials" onChange={(event) => form.setData('name', event.target.value)} error={form.errors.name} />
            <TextField id="slug" label="Identifier" value={form.data.slug} required maxLength={100}
                       placeholder="testimonials.manage" readOnly={permission?.protected} hint="Example: testimonials.manage"
                       onChange={(event) => form.setData('slug', event.target.value)} error={form.errors.slug} />
        </div>
        <TextAreaField id="description" label="Description" value={form.data.description} maxLength={255}
                       onChange={(event) => form.setData('description', event.target.value)} error={form.errors.description} />
    </AdminForm>;
}

PermissionForm.layout = {
    breadcrumbs: [
        {
            title: 'Permissions',
            href: '/admin/permissions',
        },
    ],
};
