import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    BookOpen,
    BriefcaseMedical, ClipboardCheck, ClipboardList,
    FileCheck2,
    FolderGit2,
    KeyRound,
    LayoutGrid,
    NotebookPen, RefreshCw, ScrollText,
    ShieldCheck,
    Users,
    UsersRound,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import type { RbacPageProps } from '@/types/rbac';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    // {
    //     title: 'My Observations',
    //     href: '/my/observations',
    //     icon: NotebookPen,
    // },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const { auth } = usePage<RbacPageProps>().props;
    const permissions = new Set(auth.permissions ?? []);

    const roles = new Set(auth.roles ?? []);

    const isNormalUser =
        roles.has('user')
        && !roles.has('admin')
        && !roles.has('practitioner');

    const userNavItems: NavItem[] = isNormalUser
        ? [
            {
                title: 'My Observations',
                href: '/my/observations',
                icon: NotebookPen,
            },
        ]
        : [];

    const [syncRequesting, setSyncRequesting] = useState(false);

    const canSyncH2Research = permissions.has(
        'h2research_data.sync'
    );

    const syncH2Research = () => {
        if (syncRequesting) {
            return;
        }

        router.post(
            '/admin/h2research-sync',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSyncRequesting(true),
                onFinish: () => setSyncRequesting(false),
            },
        );
    };

    const isApprovedPractitioner = auth.practitioner?.approved ?? false;

    const practitionerNavItems = [
        !isApprovedPractitioner
            ? {
                title: 'Practitioner Application',
                href: '/practitioner/application',
                icon: BriefcaseMedical,
            }
            : null,

        isApprovedPractitioner && permissions.has('practitioner_clients.manage')
            ? {
                title: 'My Patients',
                href: '/practitioner/patients',
                icon: UsersRound,
            }
            : null,

        isApprovedPractitioner
        && permissions.has(
            'practitioner_consents.manage'
        )
            ? {
                title: 'Patient Consent',
                href: '/practitioner/patient-consents',
                icon: ClipboardCheck,
            }
            : null,

        isApprovedPractitioner
        && permissions.has('practitioner_observations.manage')
            ? {
                title: 'Practitioner Observations',
                href: '/practitioner/observations',
                icon: ClipboardList,
            }
            : null,
    ].filter((item): item is NavItem => item !== null);

    const rbacNavItems = [
        permissions.has('users.manage')
            ? {
                title: 'Users',
                href: '/admin/users',
                icon: Users,
            }
            : null,

        permissions.has('practitioner_verifications.manage')
            ? {
                title: 'Practitioner Verification',
                href: '/admin/practitioner-verifications',
                icon: FileCheck2,
            }
            : null,

        permissions.has(
            'practitioner_observations.review',
        )
            ? {
                title: 'Review Practitioner Observations',
                href: '/admin/review-practitioner-observations',
                icon: ClipboardList,
            }
            : null,

        permissions.has('audit_logs.view')
            ? {
                title: 'Audit Logs',
                href: '/admin/audit-logs',
                icon: ScrollText,
            }
            : null,
    ].filter((item): item is NavItem => item !== null);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={[
                        ...mainNavItems,
                        ...userNavItems,
                        ...practitionerNavItems,
                        ...rbacNavItems,
                    ]}
                />
            </SidebarContent>

            <SidebarFooter>
                {canSyncH2Research && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                type="button"
                                tooltip="Sync H2Research"
                                disabled={syncRequesting}
                                onClick={syncH2Research}
                            >
                                <RefreshCw
                                    className={
                                        syncRequesting
                                            ? 'animate-spin'
                                            : ''
                                    }
                                />

                                <span>
                        {syncRequesting
                            ? 'Starting Sync...'
                            : 'Sync H2Research'}
                    </span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}

                <NavFooter
                    items={footerNavItems}
                    className="mt-auto"
                />

                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
