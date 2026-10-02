<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Practitioner;
use App\Models\PractitionerVerification;
use App\Models\Testimonial;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user, 401);

        $roles = $this->userRoles($user->id);
        $dashboardRole = $this->dashboardRole($roles);

        $dashboardData = match ($dashboardRole) {
            'admin' => $this->adminDashboardData(),
            'practitioner' => $this->practitionerDashboardData($user->id),
            default => $this->userDashboardData($user->id),
        };

        return Inertia::render('dashboard', [
            'dashboardRole' => $dashboardRole,
            'roles' => $roles,

            'adminDashboard' => null,
            'practitionerDashboard' => null,
            'userDashboard' => null,

            ...$dashboardData,
        ]);
    }

    private function userRoles(int $userId): array
    {
        return Rbac::roles($userId);
    }

    private function dashboardRole(array $roles): string
    {
        if (in_array('admin', $roles, true)) {
            return 'admin';
        }

        if (in_array('practitioner', $roles, true)) {
            return 'practitioner';
        }

        return 'user';
    }

    private function adminDashboardData(): array
    {
        return [
            'adminDashboard' => [
                'kpis' => [
                    'total_users' => User::query()->count(),

                    'approved_practitioners' => Practitioner::query()
                        ->where('verification_status', 'approved')
                        ->count(),

                    'pending_verifications' => PractitionerVerification::query()
                        ->where('status', 'pending_verification')
                        ->count(),

                    'pending_reviews' => Testimonial::query()
                        ->where('submission_type', 'practitioner')
                        ->where('status', 'pending_review')
                        ->count(),

                    'changes_requested' => Testimonial::query()
                        ->where('submission_type', 'practitioner')
                        ->where('status', 'changes_requested')
                        ->count(),

                    'flagged' => Testimonial::query()
                        ->where('submission_type', 'practitioner')
                        ->where('flagged_for_admin', true)
                        ->count(),

                    'approved_not_published' => Testimonial::query()
                        ->where('submission_type', 'practitioner')
                        ->where('status', 'approved')
                        ->count(),

                    'published' => Testimonial::query()
                        ->where('submission_type', 'practitioner')
                        ->where('status', 'published')
                        ->count(),
                ],

                'testimonialStatuses' => $this->adminTestimonialStatuses(),

                'publishedLast30Days' => Testimonial::query()
                    ->where('submission_type', 'practitioner')
                    ->whereNotNull('published_at')
                    ->where('published_at', '>=', now()->subDays(30))
                    ->count(),

                'pendingWork' => $this->adminPendingWork(),

                'recentActivity' => $this->adminRecentActivity(),
            ],
        ];
    }

    private function practitionerDashboardData(int $userId): array
    {
        $practitioner = Practitioner::query()
            ->where('user_id', $userId)
            ->first([
                'id',
                'user_id',
                'professional_title',
                'specialty',
                'organization_name',
                'verification_status',
            ]);

        if (! $practitioner) {
            return [
                'practitionerDashboard' => [
                    'exists' => false,
                    'approved' => false,
                    'status' => null,
                    'status_label' => 'Not Started',
                    'professional_title' => null,
                    'specialty' => null,
                    'organization_name' => null,
                    'kpis' => [
                        'total_patients' => 0,
                        'active_patients' => 0,
                        'draft_observations' => 0,
                        'pending_reviews' => 0,
                        'changes_requested' => 0,
                        'approved_observations' => 0,
                    ],
                    'recentObservations' => [],
                ],
            ];
        }

        $observationQuery = Testimonial::query()
            ->where('submission_type', 'practitioner')
            ->where('practitioner_id', $practitioner->id)
            ->where('author_user_id', $userId);

        $recentObservations = (clone $observationQuery)
            ->latest('updated_at')
            ->limit(5)
            ->get([
                'id',
                'title',
                'status',
                'submitted_at',
                'updated_at',
            ])
            ->map(fn (Testimonial $observation): array => [
                'id' => $observation->id,
                'title' => $observation->title ?: "Observation #{$observation->id}",
                'status' => $observation->status,
                'status_label' => $this->statusLabel($observation->status),
                'submitted_at' => $observation->submitted_at?->toIso8601String(),
                'updated_at' => $observation->updated_at?->toIso8601String(),
                'url' => "/practitioner/observations/{$observation->id}/edit",
            ])
            ->values();

        return [
            'practitionerDashboard' => [
                'exists' => true,
                'approved' => $practitioner->verification_status === 'approved',
                'status' => $practitioner->verification_status,
                'status_label' => $this->statusLabel($practitioner->verification_status),
                'professional_title' => $practitioner->professional_title,
                'specialty' => $practitioner->specialty,
                'organization_name' => $practitioner->organization_name,

                'kpis' => [
                    'total_patients' => Client::query()
                        ->where('practitioner_id', $practitioner->id)
                        ->count(),

                    'active_patients' => Client::query()
                        ->where('practitioner_id', $practitioner->id)
                        ->where('status', 'active')
                        ->count(),

                    'draft_observations' => (clone $observationQuery)
                        ->where('status', 'draft')
                        ->count(),

                    'pending_reviews' => (clone $observationQuery)
                        ->where('status', 'pending_review')
                        ->count(),

                    'changes_requested' => (clone $observationQuery)
                        ->where('status', 'changes_requested')
                        ->count(),

                    'approved_observations' => (clone $observationQuery)
                        ->where('status', 'approved')
                        ->count(),
                ],

                'recentObservations' => $recentObservations,
            ],
        ];
    }

    private function userDashboardData(int $userId): array
    {
        $user = User::query()
            ->select([
                'id',
                'name',
                'email',
                'email_verified_at',
                'created_at',
            ])
            ->findOrFail($userId);

        $practitioner = Practitioner::query()
            ->where('user_id', $userId)
            ->first([
                'id',
                'verification_status',
            ]);

        return [
            'userDashboard' => [
                'account' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                ],

                'practitionerApplication' => [
                    'exists' => $practitioner !== null,
                    'status' => $practitioner?->verification_status,
                    'status_label' => $practitioner
                        ? $this->statusLabel($practitioner->verification_status)
                        : 'Not Started',
                ],
            ],
        ];
    }

    private function adminTestimonialStatuses(): array
    {
        $counts = Testimonial::query()
            ->where('submission_type', 'practitioner')
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect([
            'draft',
            'pending_review',
            'changes_requested',
            'approved',
            'published',
            'rejected',
            'archived',
        ])
            ->map(fn (string $status): array => [
                'status' => $status,
                'label' => $this->statusLabel($status),
                'total' => (int) ($counts[$status] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function adminPendingWork(): array
    {
        $pendingVerifications = PractitionerVerification::query()
            ->where('status', 'pending_verification')
            ->with([
                'practitioner:id,user_id,professional_title',
                'practitioner.user:id,name,email',
            ])
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn (PractitionerVerification $verification): array => [
                'type' => 'practitioner_verification',
                'id' => $verification->id,
                'title' => $verification->practitioner?->user?->name
                    ?: "Verification #{$verification->id}",
                'description' => $verification->practitioner?->professional_title,
                'status' => $verification->status,
                'status_label' => $this->statusLabel($verification->status),
                'date' => $verification->submitted_at?->toIso8601String(),
                'sort_timestamp' => $verification->submitted_at?->timestamp ?? 0,
                'url' => "/admin/practitioner-verifications/{$verification->id}",
            ]);

        $pendingObservations = Testimonial::query()
            ->where('submission_type', 'practitioner')
            ->where('status', 'pending_review')
            ->with([
                'practitioner:id,user_id',
                'practitioner.user:id,name,email',
            ])
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn (Testimonial $observation): array => [
                'type' => 'practitioner_observation',
                'id' => $observation->id,
                'title' => $observation->title ?: "Observation #{$observation->id}",
                'description' => $observation->practitioner?->user?->name,
                'status' => $observation->status,
                'status_label' => $this->statusLabel($observation->status),
                'date' => $observation->submitted_at?->toIso8601String(),
                'sort_timestamp' => $observation->submitted_at?->timestamp ?? 0,
                'url' => "/admin/review-practitioner-observations/{$observation->id}",
            ]);

        return $pendingVerifications
            ->concat($pendingObservations)
            ->sortByDesc('sort_timestamp')
            ->take(5)
            ->map(function (array $item): array {
                unset($item['sort_timestamp']);

                return $item;
            })
            ->values()
            ->all();
    }

    private function adminRecentActivity(): array
    {
        return AuditLog::query()
            ->with('actor:id,name,email')
            ->where(function ($query): void {
                $query
                    ->where('action', 'like', 'practitioner_verification.%')
                    ->orWhere('action', 'like', 'practitioner_observation.%');
            })
            ->latest('occurred_at')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (AuditLog $log): array => [
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

                'subject_label' => $this->subjectLabel(
                    $log->subject_type,
                    $log->subject_id
                ),

                'subject_url' => $this->subjectUrl(
                    $log->subject_type,
                    $log->subject_id
                ),

                'occurred_at' => $log->occurred_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    private function statusLabel(?string $status): string
    {
        if (! $status) {
            return 'Unknown';
        }

        return Str::headline(
            str_replace('_', ' ', $status)
        );
    }

    private function actionLabel(string $action): string
    {
        return Str::headline(
            str_replace('.', ' ', $action)
        );
    }

    private function subjectLabel(string $subjectType, ?int $subjectId): string
    {
        $name = Str::headline(class_basename($subjectType));

        return $subjectId
            ? "{$name} #{$subjectId}"
            : $name;
    }

    private function subjectUrl(string $subjectType, ?int $subjectId): ?string
    {
        if (! $subjectId) {
            return null;
        }

        if ($subjectType === PractitionerVerification::class) {
            return "/admin/practitioner-verifications/{$subjectId}";
        }

        if ($subjectType === Testimonial::class) {
            return "/admin/review-practitioner-observations/{$subjectId}";
        }

        return null;
    }
}
