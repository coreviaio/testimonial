export type RoleOption = {
    id: number;
    name: string;
    slug: string;
};

export type PermissionOption = {
    id: number;
    name: string;
    slug: string;
};

export type UserRecord = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: RoleOption[];
    role_ids?: number[];
};

export type RoleRecord = RoleOption & {
    description: string | null;
    users_count?: number;
    permissions_count?: number;
    permission_ids?: number[];
};

export type PermissionRecord = PermissionOption & {
    description: string | null;
    roles_count?: number;
    protected?: boolean;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export type RbacPageProps = {
    [key: string]: unknown;

    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;

        permissions: string[];

        practitioner: {
            exists: boolean;
            status: string | null;
            approved: boolean;
        };
    };

    flash: {
        success?: string;
        error?: string;
    };
};
