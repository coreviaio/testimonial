<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyObservationController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $observations = $this->ownedObservations($request)
            ->select([
                'id',
                'title',
                'status',
                'updated_at',
            ])
            ->when(
                $search !== '',
                function (Builder $query) use ($search): void {
                    $query->where(
                        'title',
                        'like',
                        "%{$search}%",
                    );
                },
            )
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(
                function (Testimonial $observation): array {
                    $status = (string) $observation->status;

                    return [
                        'id' => $observation->id,
                        'title' => $observation->title,
                        'status_label' => $this->statusLabel(
                            $status,
                        ),
                        'updated_at' => $observation
                            ->updated_at
                            ?->toIso8601String(),

                        'can_edit' => in_array(
                            $status,
                            [
                                'draft',
                                'changes_requested',
                            ],
                            true,
                        ),

                        'can_archive' => $status === 'draft',

                        'can_restore' => $status === 'archived',
                    ];
                },
            );

        return Inertia::render(
            'observations/index',
            [
                'observations' => $observations,
                'filters' => [
                    'search' => $search,
                ],
            ],
        );
    }

    public function create(): Response
    {
        return Inertia::render('observations/form', [
            'observation' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateObservation($request);

        $observation = Testimonial::query()->create([
            ...$validated,
            'author_user_id' => $request->user()->id,
            'submission_type' => 'contributor',
            'status' => 'draft',
        ]);

        return to_route('my.observations.edit', $observation->id)
            ->with('success', 'Draft saved successfully.');
    }

    public function edit(Request $request, int $observation): Response
    {
        $observationRecord = $this->findOwnedObservation(
            $request,
            $observation,
        );

        return Inertia::render('observations/form', [
            'observation' => $this->formObservation($observationRecord),
        ]);
    }

    public function update(
        Request $request,
        int $observation,
    ): RedirectResponse {
        $observationRecord = $this->findOwnedObservation(
            $request,
            $observation,
        );

        $status = (string) $observationRecord->status;

        abort_unless(
            in_array(
                $status,
                ['draft', 'changes_requested'],
                true,
            ),
            409,
            'This observation cannot be edited in its current status.',
        );

        $observationRecord->update(
            $this->validateObservation($request),
        );

        return back()->with(
            'success',
            'Draft updated successfully.',
        );
    }

    public function archive(
        Request $request,
        int $observation,
    ): RedirectResponse {
        $observationRecord = $this->findOwnedObservation(
            $request,
            $observation,
        );

        abort_unless(
            $observationRecord->status === 'draft',
            409,
            'Only a draft observation can be archived.',
        );

        $observationRecord->update([
            'status' => 'archived',
            'archived_by_user_id' => $request->user()->id,
            'archived_at' => now(),
        ]);

        return to_route('my.observations.index')
            ->with(
                'success',
                'Observation archived successfully.',
            );
    }

    private function ownedObservations(Request $request): Builder
    {
        return Testimonial::query()
            ->where(
                'author_user_id',
                $request->user()->id,
            )
            ->where(
                'submission_type',
                'contributor',
            );
    }

    private function findOwnedObservation(
        Request $request,
        int $observation,
    ): Testimonial {
        return $this->ownedObservations($request)
            ->whereKey($observation)
            ->firstOrFail();
    }

    private function validateObservation(Request $request): array
    {
        return $request->validate([
            'title' => [
                'nullable',
                'string',
                'max:255',
            ],
            'observation' => [
                'nullable',
                'string',
            ],
            'condition_symptom_text' => [
                'nullable',
                'string',
                'max:500',
            ],
            'duration_text' => [
                'nullable',
                'string',
                'max:255',
            ],
            'frequency_text' => [
                'nullable',
                'string',
                'max:255',
            ],
            'timeline_text' => [
                'nullable',
                'string',
            ],
        ]);
    }

    private function formObservation(
        Testimonial $observation,
    ): array {
        $status = (string) $observation->status;

        return [
            'id' => $observation->id,
            'title' => $observation->title,
            'observation' => $observation->observation,
            'condition_symptom_text' => $observation->condition_symptom_text,
            'duration_text' => $observation->duration_text,
            'frequency_text' => $observation->frequency_text,
            'timeline_text' => $observation->timeline_text,
            'status_label' => $this->statusLabel($status),
            'updated_at' => $observation->updated_at?->toIso8601String(),
            'can_edit' => in_array(
                $status,
                ['draft', 'changes_requested'],
                true,
            ),
        ];
    }

    private function statusLabel(string $status): string
    {
        return ucwords(
            str_replace('_', ' ', $status),
        );
    }

    public function restore(
        Request $request,
        int $observation,
    ): RedirectResponse {
        $observationRecord = $this->findOwnedObservation(
            $request,
            $observation,
        );

        abort_unless(
            $observationRecord->status === 'archived',
            409,
            'Only an archived observation can be restored.',
        );

        $observationRecord->update([
            'status' => 'draft',
            'archived_by_user_id' => null,
            'archived_at' => null,
        ]);

        return to_route('my.observations.index')
            ->with(
                'success',
                'Observation restored successfully.',
            );
    }
}
