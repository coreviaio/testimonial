import { router, usePage } from '@inertiajs/react';
import { AdminList } from '@/components/admin/admin-ui';
import type { Paginated, RbacPageProps, UserRecord } from '@/types/rbac';

type Props = { users: Paginated<UserRecord>; filters: { search: string } };

export default function UsersIndex({ users, filters }: Props) {
    const currentUserId = usePage<RbacPageProps>().props.auth.user?.id;
    return <AdminList
        section="users" title="Users"
        description="Manage accounts and decide who can access the platform."
        collection={users} filters={filters} indexHref="/admin/users"
        createHref="/admin/users/create" createLabel="Add user"
        emptyText="Create a user to get started."
        columns={[
            { heading: 'Account', render: (user) => <div className="rbac-identity">
                    <span className="rbac-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                    <div><span className="rbac-primary">{user.name}</span><span className="rbac-secondary">User #{user.id}</span></div>
                </div> },
            { heading: 'Email address', render: (user) => user.email },
            { heading: 'Assigned roles', render: (user) => <div className="rbac-badges">
                    {user.roles.length ? user.roles.map((role) => <span className="rbac-badge" key={role.id}>{role.name}</span>) : <span className="rbac-badge neutral">No role</span>}
                </div> },
        ]}
        editHref={(user) => `/admin/users/${user.id}/edit`}
        canDelete={(user) => user.id === currentUserId ? 'You cannot delete your own account.' : null}
        onDelete={(user) => {
            if (window.confirm(`Delete ${user.name}?`)) {
                router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
            }
        }}
    />;
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: '/admin/users',
        },
    ],
};
