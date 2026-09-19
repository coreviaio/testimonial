<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientConsent;
use App\Models\Practitioner;
use App\Models\Testimonial;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerObservationController extends Controller
{
    private const PERMISSION = 'practitioner_observations.manage';

    public function index(Request $request): Response
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in([
                'all',
                'draft',
                'pending_review',
                'resubmitted',
                'changes_requested',
                'approved',
                'published',
                'rejected',
                'archived',
            ])],
        ]);

        $practitioner = $this->practitioner($request);
        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? 'all';

        $observations = $this->ownedObservations($request, $practitioner)
            ->with('client:id,client_reference,name,status')
            ->select('testimonials.*')
            ->selectSub($this->latestConsentValueQuery('action'), 'current_consent_state')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $query) use ($search): void {
                            $query->where('client_reference', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== 'all', fn (Builder $query) => $query->where('status', $status))
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString()
            ->through(function (Testimonial $observation): array {
                $status = (string) $observation->status;
                $consentState = $observation->getAttribute('current_consent_state') ?: 'missing';

                return [
                    'id' => $observation->id,
                    'title' => $observation->title,
                    'status' => $status,
                    'status_label' => $this->statusLabel($status),
                    'updated_at' => $observation->updated_at?->toIso8601String(),
                    'patient' => $observation->client ? [
                        'id' => $observation->client->id,
                        'client_reference' => $observation->client->client_reference,
                        'name' => $observation->client->name,
                        'status' => $observation->client->status,
                    ] : null,
                    'consent_state' => $consentState,
                    'consent_state_label' => $this->consentLabel($consentState),
                    'can_edit' => in_array($status, ['draft', 'changes_requested'], true),
                    'can_archive' => $status === 'draft',
                    'can_restore' => $status === 'archived',
                ];
            });

        return Inertia::render('practitioner/observations/index', [
            'observations' => $observations,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensurePermission($request);
        $this->practitioner($request);

        return Inertia::render('practitioner/observations/form', [
            'observation' => null,
        ]);
    }

    public function searchPatients(Request $request): JsonResponse
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $practitioner = $this->practitioner($request);
        $search = trim((string) ($validated['search'] ?? ''));

        $patients = Client::query()
            ->where('practitioner_id', $practitioner->id)
            ->where('status', 'active')
            ->select('clients.*')
            ->selectSub($this->latestPatientConsentValueQuery('action'), 'current_consent_state')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('client_reference', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(function (Client $client): array {
                $consentState = $client->getAttribute('current_consent_state') ?: 'missing';

                return [
                    'id' => $client->id,
                    'client_reference' => $client->client_reference,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'consent_state' => $consentState,
                    'consent_state_label' => $this->consentLabel($consentState),
                ];
            })
            ->values();

        return response()->json([
            'patients' => $patients,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $validated = $this->validateObservation($request, $practitioner);

        $observation = Testimonial::query()->create([
            'author_user_id' => $request->user()->id,
            'submission_type' => 'practitioner',
            'practitioner_id' => $practitioner->id,
            'client_id' => (int) $validated['client_id'],
            'title' => $validated['title'] ?? null,
            'observation' => $validated['observation'] ?? null,
            'condition_symptom_text' => $validated['condition_symptom_text'] ?? null,
            'duration_text' => $validated['duration_text'] ?? null,
            'frequency_text' => $validated['frequency_text'] ?? null,
            'timeline_text' => $validated['timeline_text'] ?? null,
            'practitioner_note' => $validated['practitioner_note'] ?? null,
            'status' => 'draft',
        ]);

        return to_route('practitioner.observations.edit', $observation->id)
            ->with('success', 'Practitioner observation draft saved successfully.');
    }

    public function edit(Request $request, int $observation): Response
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $observationRecord = $this->findOwnedObservation($request, $practitioner, $observation);

        $observationRecord->load(
            'client:id,client_reference,name,email,phone,status'
        );

        return Inertia::render('practitioner/observations/form', [
            'observation' => $this->formObservation($observationRecord),
        ]);
    }

    public function update(Request $request, int $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $observationRecord = $this->findOwnedObservation($request, $practitioner, $observation);
        $status = (string) $observationRecord->status;

        abort_unless(
            in_array($status, ['draft', 'changes_requested'], true),
            409,
            'This observation cannot be edited in its current status.'
        );

        $validated = $this->validateObservation(
            $request,
            $practitioner,
            $observationRecord
        );

        $patientLocked = $observationRecord->versions()->exists();

        $observationRecord->update([
            'client_id' => $patientLocked
                ? $observationRecord->client_id
                : (int) $validated['client_id'],
            'title' => $validated['title'] ?? null,
            'observation' => $validated['observation'] ?? null,
            'condition_symptom_text' => $validated['condition_symptom_text'] ?? null,
            'duration_text' => $validated['duration_text'] ?? null,
            'frequency_text' => $validated['frequency_text'] ?? null,
            'timeline_text' => $validated['timeline_text'] ?? null,
            'practitioner_note' => $validated['practitioner_note'] ?? null,
        ]);

        return back()->with(
            'success',
            'Practitioner observation draft updated successfully.'
        );
    }

    public function archive(Request $request, int $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $observationRecord = $this->findOwnedObservation(
            $request,
            $practitioner,
            $observation
        );

        abort_unless(
            $observationRecord->status === 'draft',
            409,
            'Only a draft practitioner observation can be archived.'
        );

        $observationRecord->update([
            'status' => 'archived',
            'archived_by_user_id' => $request->user()->id,
            'archived_at' => now(),
        ]);

        return back()->with(
            'success',
            'Practitioner observation archived successfully.'
        );
    }

    public function restore(Request $request, int $observation): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $observationRecord = $this->findOwnedObservation(
            $request,
            $practitioner,
            $observation
        );

        abort_unless(
            $observationRecord->status === 'archived',
            409,
            'Only an archived practitioner observation can be restored.'
        );

        $observationRecord->update([
            'status' => 'draft',
            'archived_by_user_id' => null,
            'archived_at' => null,
        ]);

        return back()->with(
            'success',
            'Practitioner observation restored successfully.'
        );
    }

    private function validateObservation(
        Request $request,
        Practitioner $practitioner,
        ?Testimonial $observation = null
    ): array {
        $validated = $request->validate([
            'client_id' => ['required', 'integer'],
            'title' => ['nullable', 'string', 'max:255'],
            'observation' => ['nullable', 'string'],
            'condition_symptom_text' => ['nullable', 'string', 'max:500'],
            'duration_text' => ['nullable', 'string', 'max:255'],
            'frequency_text' => ['nullable', 'string', 'max:255'],
            'timeline_text' => ['nullable', 'string'],
            'practitioner_note' => ['nullable', 'string'],
        ]);

        $patientLocked = $observation?->versions()->exists() ?? false;

        if ($patientLocked) {
            if ((int) $validated['client_id'] !== (int) $observation->client_id) {
                throw ValidationException::withMessages([
                    'client_id' => 'The patient cannot be changed after this observation has been submitted.',
                ]);
            }

            return $validated;
        }

        $patientExists = Client::query()
            ->where('practitioner_id', $practitioner->id)
            ->where('status', 'active')
            ->whereKey((int) $validated['client_id'])
            ->exists();

        if (! $patientExists) {
            throw ValidationException::withMessages([
                'client_id' => 'Select an active patient that belongs to you.',
            ]);
        }

        return $validated;
    }

    private function ownedObservations(
        Request $request,
        Practitioner $practitioner
    ): Builder {
        return Testimonial::query()
            ->where('author_user_id', $request->user()->id)
            ->where('submission_type', 'practitioner')
            ->where('practitioner_id', $practitioner->id);
    }

    private function findOwnedObservation(
        Request $request,
        Practitioner $practitioner,
        int $observation
    ): Testimonial {
        return $this->ownedObservations($request, $practitioner)
            ->whereKey($observation)
            ->firstOrFail();
    }

    private function practitioner(Request $request): Practitioner
    {
        $practitioner = $request->attributes->get('practitioner');

        abort_unless(
            $practitioner instanceof Practitioner,
            403
        );

        return $practitioner;
    }

    private function formObservation(Testimonial $observation): array
    {
        $status = (string) $observation->status;
        $patientLocked = $observation->versions()->exists();

        return [
            'id' => $observation->id,
            'client_id' => $observation->client_id,
            'title' => $observation->title,
            'observation' => $observation->observation,
            'condition_symptom_text' => $observation->condition_symptom_text,
            'duration_text' => $observation->duration_text,
            'frequency_text' => $observation->frequency_text,
            'timeline_text' => $observation->timeline_text,
            'practitioner_note' => $observation->practitioner_note,
            'status' => $status,
            'status_label' => $this->statusLabel($status),
            'updated_at' => $observation->updated_at?->toIso8601String(),
            'can_edit' => in_array($status, ['draft', 'changes_requested'], true),
            'patient_locked' => $patientLocked,
            'patient' => $observation->client
                ? $this->patientOption($observation->client)
                : null,
        ];
    }

    private function patientOption(Client $patient): array
    {
        $latestConsent = ClientConsent::query()
            ->where('client_id', $patient->id)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->first([
                'id',
                'action',
                'occurred_at',
            ]);

        $consentState = $latestConsent?->action ?: 'missing';

        return [
            'id' => $patient->id,
            'client_reference' => $patient->client_reference,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'status' => $patient->status,
            'consent_state' => $consentState,
            'consent_state_label' => $this->consentLabel($consentState),
        ];
    }

    private function latestConsentValueQuery(string $column): Builder
    {
        return ClientConsent::query()
            ->select($column)
            ->whereColumn(
                'client_consents.client_id',
                'testimonials.client_id'
            )
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(1);
    }

    private function latestPatientConsentValueQuery(string $column): Builder
    {
        return ClientConsent::query()
            ->select($column)
            ->whereColumn(
                'client_consents.client_id',
                'clients.id'
            )
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(1);
    }

    private function ensurePermission(Request $request): void
    {
        abort_unless(
            $request->user()
            && Rbac::hasPermission(
                $request->user()->id,
                self::PERMISSION
            ),
            403
        );
    }

    private function statusLabel(string $status): string
    {
        return ucwords(
            str_replace('_', ' ', $status)
        );
    }

    private function consentLabel(string $state): string
    {
        return match ($state) {
            'confirmed' => 'Confirmed',
            'withdrawn' => 'Withdrawn',
            default => 'Missing',
        };
    }
}
