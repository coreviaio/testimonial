import { router } from '@inertiajs/react';
import { AdminList } from '@/components/admin/admin-ui';
import type { Paginated, RoleRecord } from '@/types/rbac';

type Props = { roles: Paginated<RoleRecord>; filters: { search: string } };

export default function RolesIndex({ roles, filters }: Props) {
    return <AdminList
        section="roles" title="Roles" description="Define access groups and the capabilities behind them."
        collection={roles} filters={filters} indexHref="/admin/roles"
        createHref="/admin/roles/create" createLabel="Add role" emptyText="Create a role to get started."
        columns={[
            { heading: 'Role', render: (role) => <div>
                    <span className="rbac-primary">{role.name}</span>
                    <span className="rbac-secondary">{role.description || 'No description'}</span>
                </div> },
            { heading: 'Identifier', render: (role) => <code className="rbac-code">{role.slug}</code> },
            { heading: 'Users', render: (role) => <span className="rbac-badge neutral">{role.users_count ?? 0} assigned</span> },
            { heading: 'Permissions', render: (role) => <span className="rbac-badge">{role.permissions_count ?? 0} permissions</span> },
        ]}
        editHref={(role) => `/admin/roles/${role.id}/edit`}
        canDelete={(role) => role.slug === 'admin'
            ? 'The administrator role is protected.'
            : Number(role.users_count) > 0 ? 'Remove assigned users first.' : null}
        onDelete={(role) => {
            if (window.confirm(`Delete the ${role.name} role?`)) {
                router.delete(`/admin/roles/${role.id}`, { preserveScroll: true });
            }
        }}
    />;
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: '/admin/roles',
        },
    ],
};
