import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AdminForm, FormHeading, MultiSelect, TextAreaField, TextField } from '@/components/admin/admin-ui';
import type { PermissionOption } from '@/types/rbac';

type RoleFormRecord = { id: number; name: string; slug: string; description: string | null; permission_ids: number[] };
type Props = { role: RoleFormRecord | null; permissions: PermissionOption[] };

export default function RoleForm({ role, permissions }: Props) {
    const editing = role !== null;
    const form = useForm({
        name: role?.name ?? '',
        slug: role?.slug ?? '',
        description: role?.description ?? '',
        permission_ids: (role?.permission_ids ?? []).map(Number),
    });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editing) form.put(`/admin/roles/${role.id}`);
        else form.post('/admin/roles');
    }
    return <AdminForm
        section="roles" title={editing ? 'Edit role' : 'Create role'}
        description="Choose what members of this access group can do."
        backHref="/admin/roles" editing={editing} processing={form.processing} onSubmit={submit}
        guidance={<><h3>How roles work</h3><p>Assign a role to a user to grant its permissions.</p>
            <ul><li>The administrator role is protected.</li><li>You may create a role without permissions and assign them later.</li><li>Changes to a role affect its assigned users.</li></ul></>}
    >
        <FormHeading title="Role details" description="Give this access group a clear name and stable identifier." />
        <div className="rbac-fields-two">
            <TextField id="name" label="Role name" value={form.data.name} maxLength={100} required
                       onChange={(event) => form.setData('name', event.target.value)} error={form.errors.name} />
            <TextField id="slug" label="Identifier" value={form.data.slug} maxLength={50} required readOnly={role?.slug === 'admin'}
                       placeholder="content_manager" hint="Lowercase letters, numbers, hyphens and underscores."
                       onChange={(event) => form.setData('slug', event.target.value)} error={form.errors.slug} />
        </div>
        <TextAreaField id="description" label="Description" value={form.data.description} maxLength={255}
                       onChange={(event) => form.setData('description', event.target.value)} error={form.errors.description} />
        <div className="rbac-divider" />
        <FormHeading title="Capabilities" description="Search permissions and choose the ones this role should grant." />
        <MultiSelect label="Permissions" options={permissions} selected={form.data.permission_ids}
                     onChange={(ids) => form.setData('permission_ids', ids)} error={form.errors.permission_ids ?? form.errors['permission_ids.0' as keyof typeof form.errors]} />
    </AdminForm>;
}

RoleForm.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: '/admin/roles',
        },
    ],
};
