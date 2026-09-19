import { router } from '@inertiajs/react';
import { AdminList } from '@/components/admin/admin-ui';
import type { Paginated, PermissionRecord } from '@/types/rbac';

type Props = {
    permissions: Paginated<PermissionRecord>;
    protectedPermissions: string[];
    filters: { search: string };
};

export default function PermissionsIndex({ permissions, protectedPermissions, filters }: Props) {
    return <AdminList
        section="permissions" title="Permissions"
        description="Maintain the capabilities assigned to access roles."
        collection={permissions} filters={filters} indexHref="/admin/permissions"
        createHref="/admin/permissions/create" createLabel="Add permission"
        emptyText="Create a permission to get started."
        columns={[
            { heading: 'Permission', render: (permission) => <div>
                    <span className="rbac-primary">{permission.name}</span>
                    <span className="rbac-secondary">{permission.description || 'No description'}</span>
                </div> },
            { heading: 'Identifier', render: (permission) => <code className="rbac-code">{permission.slug}</code> },
            { heading: 'Used by', render: (permission) => <span className="rbac-badge neutral">{permission.roles_count ?? 0} roles</span> },
            { heading: 'Type', render: (permission) => protectedPermissions.includes(permission.slug)
                    ? <span className="rbac-badge">System</span>
                    : <span className="rbac-badge neutral">Custom</span> },
        ]}
        editHref={(permission) => `/admin/permissions/${permission.id}/edit`}
        canDelete={(permission) => protectedPermissions.includes(permission.slug)
            ? 'This system permission is protected.'
            : Number(permission.roles_count) > 0 ? 'Remove it from roles first.' : null}
        onDelete={(permission) => {
            if (window.confirm(`Delete ${permission.name}?`)) {
                router.delete(`/admin/permissions/${permission.id}`, { preserveScroll: true });
            }
        }}
    />;
}

PermissionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Permissions',
            href: '/admin/permissions',
        },
    ],
};
