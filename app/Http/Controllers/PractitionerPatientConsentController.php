<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientConsent;
use App\Models\Practitioner;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerPatientConsentController extends Controller
{
    private const PERMISSION = 'practitioner_consents.manage';
    private const STATEMENT_VERSION = '1.0';
    private const CONFIRMED_STATEMENT = 'The patient has consented to the use of their de-identified observation in the H2Stories practitioner submission workflow.';
    private const WITHDRAWN_STATEMENT = 'The patient has withdrawn consent for future use of their de-identified observation in the H2Stories practitioner submission workflow.';

    public function index(Request $request): Response
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'patient_status' => ['nullable', Rule::in(['all', 'active', 'archived'])],
            'consent_state' => ['nullable', Rule::in(['all', 'confirmed', 'withdrawn', 'missing'])],
        ]);

        $practitioner = $this->practitioner($request);
        $search = trim((string) ($validated['search'] ?? ''));
        $patientStatus = $validated['patient_status'] ?? 'active';
        $consentState = $validated['consent_state'] ?? 'all';

        $patients = $this->ownedPatients($practitioner)
            ->select('clients.*')
            ->selectSub($this->latestConsentValueQuery('action'), 'current_consent_state')
            ->selectSub($this->latestConsentValueQuery('occurred_at'), 'latest_consent_at')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('client_reference', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($patientStatus !== 'all', function (Builder $query) use ($patientStatus): void {
                $query->where('status', $patientStatus);
            })
            ->when($consentState === 'missing', function (Builder $query): void {
                $query->whereDoesntHave('consents');
            })
            ->when(in_array($consentState, ['confirmed', 'withdrawn'], true), function (Builder $query) use ($consentState): void {
                $query->where(
                    $this->latestConsentValueQuery('action'),
                    '=',
                    $consentState
                );
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(function (Client $client): array {
                $consentState = $client->getAttribute('current_consent_state') ?: 'missing';
                $latestConsentAt = $client->getAttribute('latest_consent_at');

                return [
                    'id' => $client->id,
                    'client_reference' => $client->client_reference,
                    'name' => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'status' => $client->status,
                    'status_label' => $this->statusLabel($client->status),
                    'consent_state' => $consentState,
                    'consent_state_label' => $this->consentLabel($consentState),
                    'latest_consent_at' => $latestConsentAt
                        ? Carbon::parse($latestConsentAt)->toIso8601String()
                        : null,
                ];
            });

        return Inertia::render('practitioner/patient-consents/index', [
            'patients' => $patients,
            'filters' => [
                'search' => $search,
                'patient_status' => $patientStatus,
                'consent_state' => $consentState,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensurePermission($request);
        $this->practitioner($request);

        return Inertia::render('practitioner/patient-consents/form', [
            'patient' => null,
            'currentConsent' => null,
            'history' => [],
            'statements' => $this->statements(),
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

        $patients = $this->ownedPatients($practitioner)
            ->select('clients.*')
            ->selectSub($this->latestConsentValueQuery('action'), 'current_consent_state')
            ->where('status', 'active')
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

    public function show(Request $request, int $client): Response
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $patient = $this->findOwnedPatient($practitioner, $client);

        $history = $patient->consents()
            ->with('recordedBy:id,name')
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (ClientConsent $consent): array => $this->consentData($consent))
            ->values();

        return Inertia::render('practitioner/patient-consents/form', [
            'patient' => $this->patientData($patient),
            'currentConsent' => $history->first(),
            'history' => $history,
            'statements' => $this->statements(),
        ]);
    }

    public function confirm(Request $request, int $client): RedirectResponse
    {
        return $this->recordConsent($request, $client, 'confirmed');
    }

    public function withdraw(Request $request, int $client): RedirectResponse
    {
        return $this->recordConsent($request, $client, 'withdrawn');
    }

    private function recordConsent(
        Request $request,
        int $client,
        string $action
    ): RedirectResponse {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $practitioner = $this->practitioner($request);

        DB::transaction(function () use (
            $request,
            $practitioner,
            $client,
            $action,
            $validated
        ): void {
            $patient = Client::query()
                ->where('practitioner_id', $practitioner->id)
                ->whereKey($client)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $patient->status === 'active',
                409,
                'Consent can only be changed for an active patient.'
            );

            $latestConsent = ClientConsent::query()
                ->where('client_id', $patient->id)
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->first();

            if (
                $action === 'confirmed'
                && $latestConsent?->action === 'confirmed'
            ) {
                throw ValidationException::withMessages([
                    'consent' => 'This patient already has confirmed consent.',
                ]);
            }

            if (
                $action === 'withdrawn'
                && $latestConsent?->action !== 'confirmed'
            ) {
                throw ValidationException::withMessages([
                    'consent' => 'Only a currently confirmed consent can be withdrawn.',
                ]);
            }

            ClientConsent::query()->create([
                'client_id' => $patient->id,
                'recorded_by_user_id' => $request->user()->id,
                'action' => $action,
                'statement_version' => self::STATEMENT_VERSION,
                'statement_text' => $action === 'confirmed'
                    ? self::CONFIRMED_STATEMENT
                    : self::WITHDRAWN_STATEMENT,
                'occurred_at' => now(),
                'note' => filled($validated['note'] ?? null)
                    ? trim($validated['note'])
                    : null,
            ]);
        });

        return to_route(
            'practitioner.patient-consents.show',
            $client
        )->with(
            'success',
            $action === 'confirmed'
                ? 'Patient consent confirmed successfully.'
                : 'Patient consent withdrawn successfully.'
        );
    }

    private function latestConsentValueQuery(string $column): Builder
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

    private function practitioner(Request $request): Practitioner
    {
        $practitioner = $request->attributes->get('practitioner');

        abort_unless(
            $practitioner instanceof Practitioner,
            403
        );

        return $practitioner;
    }

    private function ownedPatients(
        Practitioner $practitioner
    ): Builder {
        return Client::query()
            ->where(
                'practitioner_id',
                $practitioner->id
            );
    }

    private function findOwnedPatient(
        Practitioner $practitioner,
        int $client
    ): Client {
        return $this->ownedPatients($practitioner)
            ->whereKey($client)
            ->firstOrFail();
    }

    private function patientData(Client $patient): array
    {
        return [
            'id' => $patient->id,
            'client_reference' => $patient->client_reference,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'date_of_birth' => $patient->date_of_birth?->format('Y-m-d'),
            'age_years' => $patient->age_years,
            'gender' => $patient->gender,
            'country_code' => $patient->country_code,
            'status' => $patient->status,
            'status_label' => $this->statusLabel($patient->status),
            'can_manage_consent' => $patient->status === 'active',
        ];
    }

    private function consentData(
        ClientConsent $consent
    ): array {
        return [
            'id' => $consent->id,
            'action' => $consent->action,
            'action_label' => $this->consentLabel($consent->action),
            'statement_version' => $consent->statement_version,
            'statement_text' => $consent->statement_text,
            'occurred_at' => $consent->occurred_at?->toIso8601String(),
            'note' => $consent->note,
            'recorded_by' => $consent->recordedBy?->name,
        ];
    }

    private function statements(): array
    {
        return [
            'version' => self::STATEMENT_VERSION,
            'confirmed' => self::CONFIRMED_STATEMENT,
            'withdrawn' => self::WITHDRAWN_STATEMENT,
        ];
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
