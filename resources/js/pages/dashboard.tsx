import type { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BriefcaseMedical,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    FileCheck2,
    Flag,
    History,
    MailCheck,
    ScrollText,
    ShieldCheck,
    UserCheck,
    Users,
    UsersRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

type AdminKpis = {
    total_users: number;
    approved_practitioners: number;
    pending_verifications: number;
    pending_reviews: number;
    changes_requested: number;
    flagged: number;
    approved_not_published: number;
    published: number;
};

type StatusCount = {
    status: string;
    label: string;
    total: number;
};

type PendingWork = {
    type: string;
    id: number;
    title: string;
    description: string | null;
    status: string;
    status_label: string;
    date: string | null;
    url: string;
};

type RecentActivity = {
    id: number;
    actor: {
        id: number;
        name: string;
        email: string;
    } | null;
    action: string;
    action_label: string;
    subject_label: string;
    subject_url: string | null;
    occurred_at: string | null;
};

type AdminDashboardData = {
    kpis: AdminKpis;
    testimonialStatuses: StatusCount[];
    publishedLast30Days: number;
    pendingWork: PendingWork[];
    recentActivity: RecentActivity[];
};

type PractitionerObservation = {
    id: number;
    title: string;
    status: string;
    status_label: string;
    submitted_at: string | null;
    updated_at: string | null;
    url: string;
};

type PractitionerDashboardData = {
    exists: boolean;
    approved: boolean;
    status: string | null;
    status_label: string;
    professional_title: string | null;
    specialty: string | null;
    organization_name: string | null;

    kpis: {
        total_patients: number;
        active_patients: number;
        draft_observations: number;
        pending_reviews: number;
        changes_requested: number;
        approved_observations: number;
    };

    recentObservations: PractitionerObservation[];
};

type UserDashboardData = {
    account: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string | null;
        created_at: string | null;
    };

    practitionerApplication: {
        exists: boolean;
        status: string | null;
        status_label: string;
    };
};

type Props = {
    dashboardRole: 'admin' | 'practitioner' | 'user';
    roles: string[];
    adminDashboard: AdminDashboardData | null;
    practitionerDashboard: PractitionerDashboardData | null;
    userDashboard: UserDashboardData | null;
};

function formatDate(value: string | null) {
    if (!value) return '—';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatLabel(value: string | null) {
    if (!value) return '—';

    return value
        .replaceAll('_', ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function statusClass(status: string | null) {
    if (status === 'approved' || status === 'active') {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    if (status === 'published') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (status === 'pending_review' || status === 'pending_verification') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (status === 'changes_requested') {
        return 'border-orange-200 bg-orange-50 text-orange-700';
    }

    if (status === 'rejected' || status === 'suspended') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    if (status === 'archived') {
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

export default function Dashboard({
                                      dashboardRole,
                                      roles,
                                      adminDashboard,
                                      practitionerDashboard,
                                      userDashboard,
                                  }: Props) {
    const title =
        dashboardRole === 'admin'
            ? 'Admin Dashboard'
            : dashboardRole === 'practitioner'
                ? 'Practitioner Dashboard'
                : 'Dashboard';

    const description =
        dashboardRole === 'admin'
            ? 'Operational overview of users, practitioners and practitioner observations.'
            : dashboardRole === 'practitioner'
                ? 'Manage your patients, consent and practitioner observations.'
                : 'View your account and available H2Stories features.';

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <section className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <Activity className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold">{title}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <Badge key={role} variant="outline">
                                    {formatLabel(role)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>

                {dashboardRole === 'admin' && adminDashboard && (
                    <AdminDashboardView data={adminDashboard} />
                )}

                {dashboardRole === 'practitioner' && practitionerDashboard && (
                    <PractitionerDashboardView data={practitionerDashboard} />
                )}

                {dashboardRole === 'user' && userDashboard && (
                    <UserDashboardView data={userDashboard} roles={roles} />
                )}
            </div>
        </>
    );
}

function AdminDashboardView({ data }: { data: AdminDashboardData }) {
    const maxStatusCount = Math.max(
        ...data.testimonialStatuses.map((item) => item.total),
        1,
    );

    return (
        <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={data.kpis.total_users}
                    description="Registered user accounts"
                    icon={<Users className="size-5" />}
                    href="/admin/users"
                />

                <StatCard title="Approved Practitioners" value={data.kpis.approved_practitioners} description="Verified practitioners" icon={<UserCheck className="size-5" />} />

                <StatCard title="Pending Verifications" value={data.kpis.pending_verifications} description="Waiting for Admin review" icon={<FileCheck2 className="size-5" />} href="/admin/practitioner-verifications" />

                <StatCard title="Pending Reviews" value={data.kpis.pending_reviews} description="Observations waiting for review" icon={<ClipboardList className="size-5" />} href="/admin/review-practitioner-observations?status=pending_review" />

                <StatCard title="Changes Requested" value={data.kpis.changes_requested} description="Waiting for practitioner resubmission" icon={<History className="size-5" />} href="/admin/review-practitioner-observations?status=changes_requested" />

                <StatCard title="Flagged for Admin" value={data.kpis.flagged} description="Observations needing attention" icon={<Flag className="size-5" />} href="/admin/review-practitioner-observations" />

                <StatCard title="Approved" value={data.kpis.approved_not_published} description="Approved observations" icon={<CheckCircle2 className="size-5" />} href="/admin/review-practitioner-observations?status=approved" />

                <StatCard title="Published" value={data.kpis.published} description={`${data.publishedLast30Days} published in the last 30 days`} icon={<ShieldCheck className="size-5" />} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">Practitioner Observation Status</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Current practitioner observation count by workflow status.
                            </p>
                        </div>

                        <Link href="/admin/review-practitioner-observations" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                            View observations
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {data.testimonialStatuses.map((item) => {
                            const percentage = (item.total / maxStatusCount) * 100;

                            return (
                                <div key={item.status}>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>
                                            {item.label}
                                        </span>

                                        <span className="text-sm font-semibold">{item.total}</span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Quick Links</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Open the main Admin work areas.
                    </p>

                    <div className="mt-5 grid gap-3">
                        <QuickLink title="Users" description="Manage users and role assignments." href="/admin/users" icon={<Users className="size-5" />} />

                        <QuickLink title="Practitioner Verifications" description="Review practitioner applications." href="/admin/practitioner-verifications" icon={<UserCheck className="size-5" />} />

                        <QuickLink title="Review Practitioner Observations" description="Review submitted observations." href="/admin/review-practitioner-observations" icon={<ClipboardList className="size-5" />} />

                        <QuickLink title="Audit Logs" description="View workflow and administrative history." href="/admin/audit-logs" icon={<ScrollText className="size-5" />} />
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5">
                        <h2 className="text-lg font-semibold">Pending Work</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Newest five items waiting for Admin action.
                        </p>
                    </div>

                    <div className="divide-y">
                        {data.pendingWork.map((item) => (
                            <Link key={`${item.type}-${item.id}`} href={item.url} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-medium">{item.title}</p>

                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>
                                            {item.status_label}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.type === 'practitioner_verification'
                                            ? 'Practitioner Verification'
                                            : 'Practitioner Observation'}

                                        {item.description ? ` · ${item.description}` : ''}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(item.date)}
                                    </p>
                                </div>

                                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}

                        {data.pendingWork.length === 0 && (
                            <EmptyState text="There is currently no pending Admin work." />
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex items-start justify-between gap-4 border-b p-5">
                        <div>
                            <h2 className="text-lg font-semibold">Recent Moderation Activity</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Latest practitioner and observation workflow actions.
                            </p>
                        </div>

                        <Link href="/admin/audit-logs" className="text-sm font-medium text-primary hover:underline">
                            Audit Logs
                        </Link>
                    </div>

                    <div className="divide-y">
                        {data.recentActivity.map((activity) => {
                            const content = (
                                <>
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                                        <Activity className="size-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">
                                            <span className="font-medium">
                                                {activity.actor?.name ?? 'System'}
                                            </span>
                                            {' · '}
                                            {activity.action_label}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {activity.subject_label}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDate(activity.occurred_at)}
                                        </p>
                                    </div>
                                </>
                            );

                            return activity.subject_url ? (
                                <Link key={activity.id} href={activity.subject_url} className="flex items-start gap-3 p-4 hover:bg-muted/30">
                                    {content}
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                </Link>
                            ) : (
                                <div key={activity.id} className="flex items-start gap-3 p-4">
                                    {content}
                                </div>
                            );
                        })}

                        {data.recentActivity.length === 0 && (
                            <EmptyState text="No moderation activity recorded yet." />
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

function PractitionerDashboardView({ data }: { data: PractitionerDashboardData }) {
    if (!data.exists || !data.approved) {
        return (
            <section className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                        <BriefcaseMedical className="size-5" />
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold">Practitioner Application</h2>

                            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(data.status)}`}>
                                {data.status_label}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Your practitioner features become available after your practitioner application is approved.
                        </p>

                        <Link href="/practitioner/application" className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                            Open Practitioner Application
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Practitioner Account</h2>

                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {data.professional_title && <p>{data.professional_title}</p>}
                            {data.specialty && <p>{data.specialty}</p>}
                            {data.organization_name && <p>{data.organization_name}</p>}
                        </div>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClass(data.status)}`}>
                        {data.status_label}
                    </span>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard title="Total Patients" value={data.kpis.total_patients} description="All your patient records" icon={<UsersRound className="size-5" />} href="/practitioner/patients" />

                <StatCard title="Active Patients" value={data.kpis.active_patients} description="Currently active patients" icon={<Users className="size-5" />} href="/practitioner/patients" />

                <StatCard title="Draft Observations" value={data.kpis.draft_observations} description="Observations still being prepared" icon={<ClipboardList className="size-5" />} href="/practitioner/observations?status=draft" />

                <StatCard title="Pending Reviews" value={data.kpis.pending_reviews} description="Submitted and waiting for review" icon={<History className="size-5" />} href="/practitioner/observations?status=pending_review" />

                <StatCard title="Changes Requested" value={data.kpis.changes_requested} description="Observations that need changes" icon={<ClipboardCheck className="size-5" />} href="/practitioner/observations?status=changes_requested" />

                <StatCard title="Approved Observations" value={data.kpis.approved_observations} description="Approved practitioner observations" icon={<CheckCircle2 className="size-5" />} href="/practitioner/observations?status=approved" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
                        <div>
                            <h2 className="text-lg font-semibold">Recent Observations</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your latest practitioner observations.
                            </p>
                        </div>

                        <Link href="/practitioner/observations" className="text-sm font-medium text-primary hover:underline">
                            View All
                        </Link>
                    </div>

                    <div className="divide-y">
                        {data.recentObservations.map((observation) => (
                            <Link key={observation.id} href={observation.url} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-medium">{observation.title}</p>

                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(observation.status)}`}>
                                            {observation.status_label}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Updated {formatDate(observation.updated_at)}
                                    </p>
                                </div>

                                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}

                        {data.recentObservations.length === 0 && (
                            <EmptyState text="You have not created any practitioner observations yet." />
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Quick Links</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Open your practitioner workspace.
                    </p>

                    <div className="mt-5 grid gap-3">
                        <QuickLink title="My Patients" description="Manage your patient records." href="/practitioner/patients" icon={<UsersRound className="size-5" />} />

                        <QuickLink title="Patient Consent" description="Manage current patient consent." href="/practitioner/patient-consents" icon={<ClipboardCheck className="size-5" />} />

                        <QuickLink title="Practitioner Observations" description="View and manage observations." href="/practitioner/observations" icon={<ClipboardList className="size-5" />} />

                        <QuickLink title="New Observation" description="Create a new practitioner observation." href="/practitioner/observations/create" icon={<BriefcaseMedical className="size-5" />} />
                    </div>
                </div>
            </section>
        </>
    );
}

function UserDashboardView({
                               data,
                               roles,
                           }: {
    data: UserDashboardData;
    roles: string[];
}) {
    return (
        <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                    title="Email Status"
                    value={
                        data.account.email_verified_at
                            ? 'Verified'
                            : 'Unverified'
                    }
                    description={
                        data.account.email_verified_at
                            ? `Verified ${formatDate(data.account.email_verified_at)}`
                            : 'Email verification is pending'
                    }
                    icon={<ShieldCheck className="size-5" />}
                />

                <InfoCard
                    title="Email"
                    value={data.account.email}
                    description={
                        data.account.email_verified_at
                            ? `Verified ${formatDate(data.account.email_verified_at)}`
                            : 'Email not verified'
                    }
                    icon={<MailCheck className="size-5" />}
                />

                <InfoCard
                    title="Role"
                    value={roles.map(formatLabel).join(', ') || 'User'}
                    description="Your current account role"
                    icon={<Users className="size-5" />}
                />

                <InfoCard
                    title="Member Since"
                    value={formatDate(data.account.created_at)}
                    description="Account creation date"
                    icon={<History className="size-5" />}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <BriefcaseMedical className="size-5" />
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold">
                                    Practitioner Application
                                </h2>

                                <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(data.practitionerApplication.status)}`}>
                                    {data.practitionerApplication.status_label}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Apply for practitioner access or continue your existing application.
                            </p>

                            <Link href="/practitioner/application" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                Open Practitioner Application
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Account</h2>

                    <div className="mt-5 grid gap-3">
                        <QuickLink title="Profile Settings" description="Update your account profile." href="/settings/profile" icon={<UserCheck className="size-5" />} />

                        <QuickLink title="Security Settings" description="Manage password and account security." href="/settings/security" icon={<ShieldCheck className="size-5" />} />
                    </div>
                </div>
            </section>
        </>
    );
}

function StatCard({
                      title,
                      value,
                      description,
                      icon,
                      href,
                  }: {
    title: string;
    value: number;
    description: string;
    icon: ReactNode;
    href?: string;
}) {
    const content = (
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/20">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>

                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{description}</p>
                {href && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function InfoCard({
                      title,
                      value,
                      description,
                      icon,
                  }: {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 break-words text-lg font-semibold">{value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{description}</p>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function QuickLink({
                       title,
                       description,
                       href,
                       icon,
                   }: {
    title: string;
    description: string;
    href: string;
    icon: ReactNode;
}) {
    return (
        <Link href={href} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>

            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{text}</p>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
