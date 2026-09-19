<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Practitioner;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PractitionerPatientController extends Controller
{
    private const PERMISSION = 'practitioner_clients.manage';

    public function index(Request $request): Response
    {
        $this->ensurePermission($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['all', 'active', 'archived'])],
        ]);

        $practitioner = $this->practitioner($request);
        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? 'active';

        $patients = $this->ownedPatients($practitioner)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('client_reference', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'all', function (Builder $query) use ($status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Client $client): array => [
                'id' => $client->id,
                'client_reference' => $client->client_reference,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'date_of_birth' => $client->date_of_birth?->format('Y-m-d'),
                'age_years' => $client->age_years,
                'gender' => $client->gender,
                'country_code' => $client->country_code,
                'status' => $client->status,
                'status_label' => $this->statusLabel($client->status),
                'created_at' => $client->created_at?->toIso8601String(),
                'archived_at' => $client->archived_at?->toIso8601String(),
                'can_edit' => $client->status === 'active',
                'can_archive' => $client->status === 'active',
                'can_restore' => $client->status === 'archived',
            ]);

        return Inertia::render('practitioner/patients/index', [
            'patients' => $patients,
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

        return Inertia::render('practitioner/patients/form', [
            'patient' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $validated = $this->validatePatient($request);

        $patient = Client::query()->create([
            'practitioner_id' => $practitioner->id,
            'client_reference' => $this->generateClientReference($practitioner),
            ...$this->patientData($validated),
            'status' => 'active',
            'created_by_user_id' => $request->user()->id,
        ]);

        return to_route('practitioner.patients.edit', $patient->id)
            ->with('success', 'Patient created successfully.');
    }

    public function edit(Request $request, int $client): Response
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $patient = $this->findOwnedPatient($practitioner, $client);

        abort_unless(
            $patient->status === 'active',
            409,
            'Restore this patient before editing.'
        );

        return Inertia::render('practitioner/patients/form', [
            'patient' => $this->formPatient($patient),
        ]);
    }

    public function update(Request $request, int $client): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $patient = $this->findOwnedPatient($practitioner, $client);

        abort_unless(
            $patient->status === 'active',
            409,
            'Restore this patient before editing.'
        );

        $patient->update(
            $this->patientData($this->validatePatient($request))
        );

        return back()->with('success', 'Patient updated successfully.');
    }

    public function archive(Request $request, int $client): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $patient = $this->findOwnedPatient($practitioner, $client);

        abort_unless(
            $patient->status === 'active',
            409,
            'Only an active patient can be archived.'
        );

        $patient->update([
            'status' => 'archived',
            'archived_by_user_id' => $request->user()->id,
            'archived_at' => now(),
        ]);

        return back()->with('success', 'Patient archived successfully.');
    }

    public function restore(Request $request, int $client): RedirectResponse
    {
        $this->ensurePermission($request);

        $practitioner = $this->practitioner($request);
        $patient = $this->findOwnedPatient($practitioner, $client);

        abort_unless(
            $patient->status === 'archived',
            409,
            'Only an archived patient can be restored.'
        );

        $patient->update([
            'status' => 'active',
            'archived_by_user_id' => null,
            'archived_at' => null,
        ]);

        return back()->with('success', 'Patient restored successfully.');
    }

    private function validatePatient(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'email' => ['nullable', 'email:rfc', 'max:254'],
            'phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'age_years' => ['nullable', 'integer', 'min:0', 'max:130'],
            'age_recorded_on' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', 'string', 'max:32'],
            'country_code' => ['nullable', 'string', 'size:2', 'alpha'],
            'private_notes' => ['nullable', 'string'],
        ]);
    }

    private function patientData(array $validated): array
    {
        $dateOfBirth = $validated['date_of_birth'] ?? null;
        $ageYears = $validated['age_years'] ?? null;
        $ageRecordedOn = $validated['age_recorded_on'] ?? null;

        if ($dateOfBirth) {
            $ageYears = null;
            $ageRecordedOn = null;
        } elseif ($ageYears !== null) {
            $ageRecordedOn = $ageRecordedOn ?: now()->toDateString();
        } else {
            $ageRecordedOn = null;
        }

        return [
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'date_of_birth' => $dateOfBirth,
            'age_years' => $ageYears,
            'age_recorded_on' => $ageRecordedOn,
            'gender' => $validated['gender'] ?? null,
            'country_code' => filled($validated['country_code'] ?? null)
                ? strtoupper($validated['country_code'])
                : null,
            'private_notes' => $validated['private_notes'] ?? null,
        ];
    }

    private function practitioner(Request $request): Practitioner
    {
        $practitioner = $request->attributes->get('practitioner');

        abort_unless($practitioner instanceof Practitioner, 403);

        return $practitioner;
    }

    private function ownedPatients(Practitioner $practitioner): Builder
    {
        return Client::query()
            ->where('practitioner_id', $practitioner->id);
    }

    private function findOwnedPatient(Practitioner $practitioner, int $client): Client
    {
        return $this->ownedPatients($practitioner)
            ->whereKey($client)
            ->firstOrFail();
    }

    private function generateClientReference(Practitioner $practitioner): string
    {
        do {
            $reference = 'PAT-'.$practitioner->id.'-'.Str::upper(Str::random(8));
        } while (Client::query()->where('client_reference', $reference)->exists());

        return $reference;
    }

    private function formPatient(Client $client): array
    {
        return [
            'id' => $client->id,
            'client_reference' => $client->client_reference,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'date_of_birth' => $client->date_of_birth?->format('Y-m-d'),
            'age_years' => $client->age_years,
            'age_recorded_on' => $client->age_recorded_on?->format('Y-m-d'),
            'gender' => $client->gender,
            'country_code' => $client->country_code,
            'private_notes' => $client->private_notes,
            'status' => $client->status,
        ];
    }

    private function ensurePermission(Request $request): void
    {
        abort_unless(
            $request->user()
            && Rbac::hasPermission($request->user()->id, self::PERMISSION),
            403
        );
    }

    private function statusLabel(string $status): string
    {
        return ucwords(str_replace('_', ' ', $status));
    }
}
