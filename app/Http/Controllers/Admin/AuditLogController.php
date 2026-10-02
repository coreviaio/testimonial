<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\PractitionerVerification;
use App\Models\Role;
use App\Models\Testimonial;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    private const PERMISSION = 'audit_logs.view';

    private const SORT_COLUMNS = [
        'occurred_at',
        'id',
        'action',
        'subject_type',
    ];

    public function index(Request $request): Response
    {
        $this->ensureAccess($request);

        $validated = $request->validate([
            'actor' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:100'],
            'subject_type' => ['nullable', 'string', 'max:80'],
            'subject_id' => ['nullable', 'integer', 'min:1'],
            'request_id' => ['nullable', 'string', 'max:36'],
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'sort' => ['nullable', Rule::in(self::SORT_COLUMNS)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $actor = trim((string) ($validated['actor'] ?? ''));
        $action = trim((string) ($validated['action'] ?? ''));
        $subjectType = trim((string) ($validated['subject_type'] ?? ''));
        $requestId = trim((string) ($validated['request_id'] ?? ''));
        $sort = $validated['sort'] ?? 'occurred_at';
        $direction = $validated['direction'] ?? 'desc';

        $logs = AuditLog::query()
            ->with('actor:id,name,email')
            ->when(
                $actor !== '',
                function (Builder $query) use ($actor): void {
                    $query->whereHas(
                        'actor',
                        function (Builder $query) use ($actor): void {
                            $query->where('name', 'like', "%{$actor}%")
                                ->orWhere('email', 'like', "%{$actor}%");
                        }
                    );
                }
            )
            ->when(
                $action !== '',
                fn (Builder $query) =>
                $query->where('action', $action)
            )
            ->when(
                $subjectType !== '',
                fn (Builder $query) =>
                $query->where('subject_type', $subjectType)
            )
            ->when(
                filled($validated['subject_id'] ?? null),
                fn (Builder $query) =>
                $query->where(
                    'subject_id',
                    (int) $validated['subject_id']
                )
            )
            ->when(
                $requestId !== '',
                fn (Builder $query) =>
                $query->where(
                    'request_id',
                    'like',
                    "%{$requestId}%"
                )
            )
            ->when(
                $validated['from_date'] ?? null,
                fn (Builder $query, string $fromDate) =>
                $query->whereDate(
                    'occurred_at',
                    '>=',
                    $fromDate
                )
            )
            ->when(
                $validated['to_date'] ?? null,
                fn (Builder $query, string $toDate) =>
                $query->whereDate(
                    'occurred_at',
                    '<=',
                    $toDate
                )
            )
            ->orderBy($sort, $direction)
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $logs->getCollection()->transform(
            fn (AuditLog $log): array => [
                'id' => $log->id,

                'actor' => $log->actor
                    ? [
                        'id' => $log->actor->id,
                        'name' => $log->actor->name,
                        'email' => $log->actor->email,
                    ]
                    : null,

                'action' => $log->action,
                'action_label' => $this->actionLabel($log->action),

                'subject_type' => $log->subject_type,
                'subject_type_label' => $this->subjectTypeLabel(
                    $log->subject_type
                ),

                'subject_id' => $log->subject_id,
                'request_id' => $log->request_id,

                'occurred_at' => $log
                    ->occurred_at
                    ?->toIso8601String(),
            ]
        );

        $actions = AuditLog::query()
            ->whereNotNull('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values();

        $subjectTypes = AuditLog::query()
            ->whereNotNull('subject_type')
            ->distinct()
            ->orderBy('subject_type')
            ->pluck('subject_type')
            ->map(
                fn (string $subjectType): array => [
                    'value' => $subjectType,
                    'label' => $this->subjectTypeLabel($subjectType),
                ]
            )
            ->values();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,

            'actions' => $actions,
            'subjectTypes' => $subjectTypes,

            'filters' => [
                'actor' => $actor,
                'action' => $action,
                'subject_type' => $subjectType,
                'subject_id' => $validated['subject_id'] ?? '',
                'request_id' => $requestId,
                'from_date' => $validated['from_date'] ?? '',
                'to_date' => $validated['to_date'] ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function show(
        Request $request,
        AuditLog $auditLog
    ): JsonResponse {
        $this->ensureAccess($request);

        $auditLog->load('actor:id,name,email');

        return response()->json([
            'log' => [
                'id' => $auditLog->id,

                'actor' => $auditLog->actor
                    ? [
                        'id' => $auditLog->actor->id,
                        'name' => $auditLog->actor->name,
                        'email' => $auditLog->actor->email,
                    ]
                    : null,

                'action' => $auditLog->action,
                'action_label' => $this->actionLabel(
                    $auditLog->action
                ),

                'subject_type' => $auditLog->subject_type,

                'subject_type_label' =>
                    $this->subjectTypeLabel(
                        $auditLog->subject_type
                    ),

                'subject_id' => $auditLog->subject_id,

                'subject_url' => $this->subjectUrl(
                    $auditLog->subject_type,
                    $auditLog->subject_id
                ),

                'old_values' => $this->sanitizeAuditData(
                    $auditLog->old_values
                ),

                'new_values' => $this->sanitizeAuditData(
                    $auditLog->new_values
                ),

                'metadata' => $this->sanitizeAuditData(
                    $auditLog->metadata
                ),

                'request_id' => $auditLog->request_id,

                'occurred_at' => $auditLog
                    ->occurred_at
                    ?->toIso8601String(),

                'created_at' => $auditLog
                    ->created_at
                    ?->toIso8601String(),
            ],
        ]);
    }

    private function ensureAccess(Request $request): void
    {
        $userId = $request->user()?->id;

        abort_unless(
            $userId
            && Rbac::isAdmin($userId)
            && Rbac::hasPermission(
                $userId,
                self::PERMISSION
            ),
            403
        );
    }

    private function subjectTypeLabel(string $subjectType): string
    {
        return Str::headline(
            class_basename($subjectType)
        );
    }

    private function actionLabel(string $action): string
    {
        return Str::headline(
            str_replace('.', ' ', $action)
        );
    }

    private function subjectUrl(
        string $subjectType,
        ?int $subjectId
    ): ?string {
        if (! $subjectId) {
            return null;
        }

        if ($subjectType === Testimonial::class) {
            $testimonial = Testimonial::query()
                ->select([
                    'id',
                    'submission_type',
                ])
                ->find($subjectId);

            if (
                $testimonial
                && $testimonial->submission_type === 'practitioner'
            ) {
                return "/admin/review-practitioner-observations/{$subjectId}";
            }

            return null;
        }

        if ($subjectType === PractitionerVerification::class) {
            return "/admin/practitioner-verifications/{$subjectId}";
        }

        if ($subjectType === User::class) {
            return "/admin/users/{$subjectId}/edit";
        }

        if ($subjectType === Role::class) {
            return "/admin/roles/{$subjectId}/edit";
        }

        if ($subjectType === Permission::class) {
            return "/admin/permissions/{$subjectId}/edit";
        }

        return null;
    }

    private function sanitizeAuditData(
        mixed $value
    ): mixed {
        if (! is_array($value)) {
            return $value;
        }

        $sanitized = [];

        foreach ($value as $key => $item) {
            if (
                is_string($key)
                && $this->shouldRedactKey($key)
            ) {
                $sanitized[$key] = '[REDACTED]';

                continue;
            }

            $sanitized[$key] =
                $this->sanitizeAuditData($item);
        }

        return $sanitized;
    }

    private function shouldRedactKey(string $key): bool
    {
        $key = Str::lower(
            str_replace(
                ['-', '.', ' '],
                '_',
                $key
            )
        );

        return Str::contains(
            $key,
            [
                'password',
                'remember_token',
                'access_token',
                'refresh_token',
                'api_token',
                'secret',
                'credential',
                'document_body',
                'document_content',
                'private_notes',
            ]
        );
    }
}
