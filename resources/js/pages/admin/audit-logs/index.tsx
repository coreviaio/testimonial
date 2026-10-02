import {
    useState,
    type FormEvent,
} from 'react';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import {
    ExternalLink,
    Eye,
    Search,
    ScrollText,
    X,
} from 'lucide-react';

import Pagination from '@/components/admin/pagination';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Paginated } from '@/types/rbac';

type Actor = {
    id: number;
    name: string;
    email: string;
};

type AuditLogRow = {
    id: number;

    actor:
        Actor | null;

    action: string;
    action_label: string;

    subject_type: string;
    subject_type_label: string;

    subject_id:
        number | null;

    request_id:
        string | null;

    occurred_at:
        string | null;
};

type AuditLogDetail = AuditLogRow & {
    subject_url:
        string | null;

    old_values:
        unknown;

    new_values:
        unknown;

    metadata:
        unknown;

    created_at:
        string | null;
};

type SubjectTypeOption = {
    value: string;
    label: string;
};

type Props = {
    logs:
        Paginated<AuditLogRow>;

    actions:
        string[];

    subjectTypes:
        SubjectTypeOption[];

    filters: {
        actor: string;
        action: string;
        subject_type: string;

        subject_id:
            number | string;

        request_id: string;
        from_date: string;
        to_date: string;

        sort: string;
        direction: string;
    };
};

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
        },
    ).format(
        new Date(value),
    );
}

function actionLabel(
    value: string,
): string {
    return value
        .replaceAll('.', ' ')
        .replaceAll('_', ' ')
        .split(' ')
        .filter(Boolean)
        .map(
            (word) =>
                word.charAt(0).toUpperCase()
                + word.slice(1),
        )
        .join(' ');
}

export default function AuditLogsIndex({
                                           logs,
                                           actions,
                                           subjectTypes,
                                           filters,
                                       }: Props) {
    const [actor, setActor] =
        useState(
            filters.actor ?? '',
        );

    const [action, setAction] =
        useState(
            filters.action ?? '',
        );

    const [
        subjectType,
        setSubjectType,
    ] =
        useState(
            filters.subject_type
            ?? '',
        );

    const [
        subjectId,
        setSubjectId,
    ] =
        useState(
            filters.subject_id
                ? String(
                    filters.subject_id,
                )
                : '',
        );

    const [
        requestId,
        setRequestId,
    ] =
        useState(
            filters.request_id
            ?? '',
        );

    const [
        fromDate,
        setFromDate,
    ] =
        useState(
            filters.from_date
            ?? '',
        );

    const [
        toDate,
        setToDate,
    ] =
        useState(
            filters.to_date
            ?? '',
        );

    const [sort, setSort] =
        useState(
            filters.sort
            ?? 'occurred_at',
        );

    const [
        direction,
        setDirection,
    ] =
        useState(
            filters.direction
            ?? 'desc',
        );

    const [
        detailOpen,
        setDetailOpen,
    ] = useState(false);

    const [
        detailLoading,
        setDetailLoading,
    ] = useState(false);

    const [
        detailError,
        setDetailError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        selectedLog,
        setSelectedLog,
    ] =
        useState<AuditLogDetail | null>(
            null,
        );

    function submitFilters(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const params:
            Record<string, string> = {};

        if (actor.trim()) {
            params.actor =
                actor.trim();
        }

        if (action) {
            params.action =
                action;
        }

        if (subjectType) {
            params.subject_type =
                subjectType;
        }

        if (subjectId.trim()) {
            params.subject_id =
                subjectId.trim();
        }

        if (requestId.trim()) {
            params.request_id =
                requestId.trim();
        }

        if (fromDate) {
            params.from_date =
                fromDate;
        }

        if (toDate) {
            params.to_date =
                toDate;
        }

        params.sort = sort;
        params.direction =
            direction;

        router.get(
            '/admin/audit-logs',
            params,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setActor('');
        setAction('');
        setSubjectType('');
        setSubjectId('');
        setRequestId('');
        setFromDate('');
        setToDate('');
        setSort('occurred_at');
        setDirection('desc');

        router.get(
            '/admin/audit-logs',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    async function openDetails(
        logId: number,
    ) {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setSelectedLog(null);

        try {
            const response =
                await fetch(
                    `/admin/audit-logs/${logId}`,
                    {
                        headers: {
                            Accept:
                                'application/json',
                        },
                    },
                );

            if (!response.ok) {
                throw new Error(
                    'Unable to load audit log details.',
                );
            }

            const data =
                await response.json() as {
                    log:
                        AuditLogDetail;
                };

            setSelectedLog(
                data.log,
            );
        } catch {
            setDetailError(
                'Unable to load audit log details.',
            );
        } finally {
            setDetailLoading(
                false,
            );
        }
    }

    const hasFilters =
        Boolean(
            filters.actor
            || filters.action
            || filters.subject_type
            || filters.subject_id
            || filters.request_id
            || filters.from_date
            || filters.to_date
            || filters.sort
            !== 'occurred_at'
            || filters.direction
            !== 'desc',
        );

    return (
        <>
            <Head title="Audit Logs" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <section className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <ScrollText className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold">
                                Audit Logs
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Read-only history of important administrative and workflow actions.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <form
                        onSubmit={
                            submitFilters
                        }
                        className="grid gap-4"
                    >
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Actor
                                </label>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        value={
                                            actor
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setActor(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Name or email"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Action
                                </label>

                                <select
                                    value={
                                        action
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setAction(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                    <option value="">
                                        All actions
                                    </option>

                                    {actions.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item
                                                }
                                                value={
                                                    item
                                                }
                                            >
                                                {actionLabel(
                                                    item,
                                                )}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Subject Type
                                </label>

                                <select
                                    value={
                                        subjectType
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSubjectType(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                    <option value="">
                                        All subject types
                                    </option>

                                    {subjectTypes.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Subject ID
                                </label>

                                <Input
                                    type="number"
                                    min="1"
                                    value={
                                        subjectId
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSubjectId(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Example: 12"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Request ID
                                </label>

                                <Input
                                    value={
                                        requestId
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setRequestId(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="UUID"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    From Date
                                </label>

                                <Input
                                    type="date"
                                    value={
                                        fromDate
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setFromDate(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    To Date
                                </label>

                                <Input
                                    type="date"
                                    value={
                                        toDate
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setToDate(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Sort
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={
                                            sort
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setSort(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                                    >
                                        <option value="occurred_at">
                                            Date
                                        </option>

                                        <option value="id">
                                            Log ID
                                        </option>

                                        <option value="action">
                                            Action
                                        </option>

                                        <option value="subject_type">
                                            Subject Type
                                        </option>
                                    </select>

                                    <select
                                        value={
                                            direction
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setDirection(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                                    >
                                        <option value="desc">
                                            Desc
                                        </option>

                                        <option value="asc">
                                            Asc
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                            {hasFilters
                                && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                                    >
                                        <X className="size-4" />

                                        Clear
                                    </button>
                                )}

                            <button
                                type="submit"
                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Search className="size-4" />

                                Filter
                            </button>
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-4">
                        <h2 className="font-semibold">
                            Audit History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {logs.total}{' '}
                            {logs.total === 1
                                ? 'log entry'
                                : 'log entries'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Log ID
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Occurred
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Actor
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Action
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Subject
                                </th>

                                <th className="px-4 py-3 text-left font-medium">
                                    Request ID
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {logs.data.map(
                                (log) => (
                                    <tr
                                        key={
                                            log.id
                                        }
                                        className="border-b last:border-b-0 hover:bg-muted/30"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 font-medium">
                                            #{log.id}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                                            {formatDate(
                                                log.occurred_at,
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            {log.actor
                                                ? (
                                                    <>
                                                        <p className="font-medium">
                                                            {
                                                                log.actor.name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                log.actor.email
                                                            }
                                                        </p>
                                                    </>
                                                )
                                                : (
                                                    <span className="text-muted-foreground">
                                                            System
                                                        </span>
                                                )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="font-medium">
                                                {
                                                    log.action_label
                                                }
                                            </p>

                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                {
                                                    log.action
                                                }
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p>
                                                {
                                                    log.subject_type_label
                                                }
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {log.subject_id
                                                    ? `ID #${log.subject_id}`
                                                    : 'No subject ID'}
                                            </p>
                                        </td>

                                        <td className="max-w-52 px-4 py-4">
                                                <span
                                                    className="block truncate font-mono text-xs text-muted-foreground"
                                                    title={
                                                        log.request_id
                                                        ?? ''
                                                    }
                                                >
                                                    {
                                                        log.request_id
                                                        || '—'
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDetails(
                                                        log.id,
                                                    )
                                                }
                                                className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs font-medium hover:bg-muted"
                                            >
                                                <Eye className="size-3.5" />

                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ),
                            )}

                            {logs.data.length
                                === 0
                                && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            No audit logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t p-4">
                        <Pagination
                            links={
                                logs.links
                            }
                            from={
                                logs.from
                            }
                            to={
                                logs.to
                            }
                            total={
                                logs.total
                            }
                        />
                    </div>
                </section>
            </div>

            <Dialog
                open={
                    detailOpen
                }
                onOpenChange={
                    setDetailOpen
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            Audit Log Details
                        </DialogTitle>

                        <DialogDescription>
                            Read-only audit event details.
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading
                        && (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                Loading audit log...
                            </div>
                        )}

                    {detailError
                        && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {
                                    detailError
                                }
                            </div>
                        )}

                    {!detailLoading
                        && selectedLog
                        && (
                            <div className="space-y-6">
                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Detail
                                        label="Log ID"
                                        value={`#${selectedLog.id}`}
                                    />

                                    <Detail
                                        label="Occurred"
                                        value={
                                            formatDate(
                                                selectedLog.occurred_at,
                                            )
                                        }
                                    />

                                    <Detail
                                        label="Actor"
                                        value={
                                            selectedLog.actor
                                                ? `${selectedLog.actor.name} (${selectedLog.actor.email})`
                                                : 'System'
                                        }
                                    />

                                    <Detail
                                        label="Action"
                                        value={
                                            selectedLog.action_label
                                        }
                                    />

                                    <Detail
                                        label="Action Code"
                                        value={
                                            selectedLog.action
                                        }
                                        mono
                                    />

                                    <Detail
                                        label="Subject"
                                        value={`${selectedLog.subject_type_label}${
                                            selectedLog.subject_id
                                                ? ` #${selectedLog.subject_id}`
                                                : ''
                                        }`}
                                    />

                                    <Detail
                                        label="Subject Type"
                                        value={
                                            selectedLog.subject_type
                                        }
                                        mono
                                    />

                                    <Detail
                                        label="Request ID"
                                        value={
                                            selectedLog.request_id
                                        }
                                        mono
                                    />

                                    <Detail
                                        label="Database Created"
                                        value={
                                            formatDate(
                                                selectedLog.created_at,
                                            )
                                        }
                                    />
                                </div>

                                {selectedLog.subject_url
                                    && (
                                        <div>
                                            <Link
                                                href={
                                                    selectedLog.subject_url
                                                }
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                                            >
                                                <ExternalLink className="size-4" />

                                                Open Related Record
                                            </Link>
                                        </div>
                                    )}

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <AuditDataSection
                                        title="Old Values"
                                        value={
                                            selectedLog.old_values
                                        }
                                    />

                                    <AuditDataSection
                                        title="New Values"
                                        value={
                                            selectedLog.new_values
                                        }
                                    />
                                </div>

                                <AuditDataSection
                                    title="Metadata"
                                    value={
                                        selectedLog.metadata
                                    }
                                />
                            </div>
                        )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({
                    label,
                    value,
                    mono = false,
                }: {
    label: string;
    value: string | null;
    mono?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p
                className={`mt-1 break-words text-sm ${
                    mono
                        ? 'font-mono text-xs'
                        : ''
                }`}
            >
                {value || '—'}
            </p>
        </div>
    );
}

function AuditDataSection({
                              title,
                              value,
                          }: {
    title: string;
    value: unknown;
}) {
    const hasValue =
        value !== null
        && value !== undefined
        && (
            typeof value !== 'object'
            || Object.keys(
                value as object,
            ).length > 0
        );

    return (
        <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
                <h3 className="font-semibold">
                    {title}
                </h3>
            </div>

            <div className="p-4">
                {!hasValue
                    ? (
                        <p className="text-sm text-muted-foreground">
                            No data.
                        </p>
                    )
                    : (
                        <AuditValue
                            value={
                                value
                            }
                        />
                    )}
            </div>
        </section>
    );
}

function AuditValue({
                        value,
                    }: {
    value: unknown;
}) {
    if (
        value === null
        || value === undefined
    ) {
        return (
            <span className="text-muted-foreground">
                —
            </span>
        );
    }

    if (
        typeof value
        === 'boolean'
    ) {
        return (
            <span>
                {value
                    ? 'Yes'
                    : 'No'}
            </span>
        );
    }

    if (
        typeof value
        === 'string'
        || typeof value
        === 'number'
    ) {
        return (
            <span className="whitespace-pre-wrap break-words">
                {String(value)}
            </span>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return (
                <span className="text-muted-foreground">
                    Empty
                </span>
            );
        }

        return (
            <div className="space-y-2">
                {value.map(
                    (
                        item,
                        index,
                    ) => (
                        <div
                            key={
                                index
                            }
                            className="rounded-md border bg-muted/20 p-3"
                        >
                            <AuditValue
                                value={
                                    item
                                }
                            />
                        </div>
                    ),
                )}
            </div>
        );
    }

    if (
        typeof value
        === 'object'
    ) {
        return (
            <div className="divide-y rounded-md border">
                {Object.entries(
                    value as Record<
                        string,
                        unknown
                    >,
                ).map(
                    ([
                         key,
                         item,
                     ]) => (
                        <div
                            key={
                                key
                            }
                            className="grid gap-2 p-3 md:grid-cols-[180px_1fr]"
                        >
                            <div className="break-words text-sm font-medium">
                                {actionLabel(
                                    key,
                                )}
                            </div>

                            <div className="min-w-0 break-words text-sm text-muted-foreground">
                                <AuditValue
                                    value={
                                        item
                                    }
                                />
                            </div>
                        </div>
                    ),
                )}
            </div>
        );
    }

    return (
        <span>
            {String(value)}
        </span>
    );
}

AuditLogsIndex.layout = {
    breadcrumbs: [
        {
            title:
                'Audit Logs',

            href:
                '/admin/audit-logs',
        },
    ],
};
