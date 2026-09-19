import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock3,
    FileText,
    Save,
} from 'lucide-react';

import FlashMessages from '@/components/admin/flash-messages';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import observationRoutes from '@/routes/my/observations';

type Observation = {
    id: number;
    title: string | null;
    observation: string | null;
    condition_symptom_text: string | null;
    duration_text: string | null;
    frequency_text: string | null;
    timeline_text: string | null;
    status_label: string;
    updated_at: string | null;
    can_edit: boolean;
};

type Props = {
    observation: Observation | null;
};

function formatDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

export default function ObservationForm({
                                            observation,
                                        }: Props) {
    const editing = observation !== null;
    const canEdit = observation?.can_edit ?? true;

    const form = useForm({
        title: observation?.title ?? '',
        condition_symptom_text:
            observation?.condition_symptom_text ?? '',
        duration_text:
            observation?.duration_text ?? '',
        frequency_text:
            observation?.frequency_text ?? '',
        timeline_text:
            observation?.timeline_text ?? '',
        observation:
            observation?.observation ?? '',
    });

    function saveObservation() {
        if (!canEdit || form.processing) {
            return;
        }

        if (observation) {
            form.put(
                observationRoutes.update(observation.id).url,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.setDefaults();
                    },
                },
            );

            return;
        }

        form.post(observationRoutes.store().url);
    }

    return (
        <>
            <Head
                title={
                    editing
                        ? 'Observation Details'
                        : 'New Observation'
                }
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                <FlashMessages />

                <div>
                    <Link
                        href={observationRoutes.index()}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />

                        My Observations
                    </Link>
                </div>

                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {editing
                                        ? 'Observation details'
                                        : 'New observation'}
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    {editing
                                        ? 'Review and update your observation while it is available for editing.'
                                        : 'Create a new observation and save it as a draft.'}
                                </p>
                            </div>
                        </div>

                        {observation && (
                            <Badge
                                variant="outline"
                                className="self-start"
                            >
                                {observation.status_label}
                            </Badge>
                        )}
                    </div>
                </section>

                {!canEdit && observation && (
                    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        This observation is read-only in its
                        current status.
                    </div>
                )}

                <Card>
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <CardTitle>
                                    Observation
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    Enter the details related to
                                    your observation.
                                </CardDescription>
                            </div>

                            {observation && (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            Status:
                                        </span>

                                        <Badge variant="outline">
                                            {
                                                observation.status_label
                                            }
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock3 className="size-4 text-muted-foreground" />

                                        <span className="text-muted-foreground">
                                            Last updated:
                                        </span>

                                        <span className="font-medium">
                                            {formatDateTime(
                                                observation.updated_at,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-5 sm:p-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title
                            </Label>

                            <Input
                                id="title"
                                type="text"
                                value={form.data.title}
                                disabled={!canEdit}
                                maxLength={255}
                                aria-invalid={Boolean(
                                    form.errors.title,
                                )}
                                onChange={(event) =>
                                    form.setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                            />

                            <InputError
                                message={form.errors.title}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="condition_symptom_text">
                                Condition / Symptom
                            </Label>

                            <Input
                                id="condition_symptom_text"
                                type="text"
                                value={
                                    form.data
                                        .condition_symptom_text
                                }
                                disabled={!canEdit}
                                maxLength={500}
                                aria-invalid={Boolean(
                                    form.errors
                                        .condition_symptom_text,
                                )}
                                onChange={(event) =>
                                    form.setData(
                                        'condition_symptom_text',
                                        event.target.value,
                                    )
                                }
                            />

                            <InputError
                                message={
                                    form.errors
                                        .condition_symptom_text
                                }
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="duration_text">
                                    Duration
                                </Label>

                                <Input
                                    id="duration_text"
                                    type="text"
                                    value={
                                        form.data.duration_text
                                    }
                                    disabled={!canEdit}
                                    maxLength={255}
                                    aria-invalid={Boolean(
                                        form.errors
                                            .duration_text,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'duration_text',
                                            event.target.value,
                                        )
                                    }
                                />

                                <InputError
                                    message={
                                        form.errors
                                            .duration_text
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="frequency_text">
                                    Frequency
                                </Label>

                                <Input
                                    id="frequency_text"
                                    type="text"
                                    value={
                                        form.data.frequency_text
                                    }
                                    disabled={!canEdit}
                                    maxLength={255}
                                    aria-invalid={Boolean(
                                        form.errors
                                            .frequency_text,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'frequency_text',
                                            event.target.value,
                                        )
                                    }
                                />

                                <InputError
                                    message={
                                        form.errors
                                            .frequency_text
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeline_text">
                                Timeline
                            </Label>

                            <textarea
                                id="timeline_text"
                                rows={5}
                                value={form.data.timeline_text}
                                disabled={!canEdit}
                                aria-invalid={Boolean(
                                    form.errors.timeline_text,
                                )}
                                onChange={(event) =>
                                    form.setData(
                                        'timeline_text',
                                        event.target.value,
                                    )
                                }
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex min-h-28 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <InputError
                                message={
                                    form.errors.timeline_text
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observation">
                                Observation
                            </Label>

                            <textarea
                                id="observation"
                                rows={10}
                                value={form.data.observation}
                                disabled={!canEdit}
                                aria-invalid={Boolean(
                                    form.errors.observation,
                                )}
                                onChange={(event) =>
                                    form.setData(
                                        'observation',
                                        event.target.value,
                                    )
                                }
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex min-h-52 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <InputError
                                message={
                                    form.errors.observation
                                }
                            />
                        </div>

                        {canEdit && (
                            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    {editing &&
                                        form.isDirty && (
                                            <p className="text-sm text-muted-foreground">
                                                You have unsaved
                                                changes.
                                            </p>
                                        )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href={observationRoutes.index()}
                                        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Cancel
                                    </Link>

                                    <a
                                        href="#"
                                        aria-disabled={
                                            form.processing
                                        }
                                        onClick={(event) => {
                                            event.preventDefault();

                                            saveObservation();
                                        }}
                                        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors ${
                                            form.processing
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer hover:bg-primary/90'
                                        }`}
                                    >
                                        <Save className="size-4" />

                                        {form.processing
                                            ? 'Saving...'
                                            : 'Save draft'}
                                    </a>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
