<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\PractitionerVerificationController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\MyObservationController;
use App\Http\Controllers\PractitionerApplicationController;
use App\Http\Controllers\PractitionerObservationController;
use App\Http\Controllers\PractitionerPatientConsentController;
use App\Http\Controllers\PractitionerPatientController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function (): void {
        Route::resource('users', UserController::class)
            ->except(['show'])
            ->middleware('permission:users.manage');

        Route::resource('roles', RoleController::class)
            ->except(['show'])
            ->middleware('permission:roles.manage');

        Route::resource('permissions', PermissionController::class)
            ->except(['show'])
            ->middleware('permission:permissions.manage');

        Route::middleware('permission:practitioner_verifications.manage')
            ->group(function (): void {
                Route::get(
                    'practitioner-verifications',
                    [PractitionerVerificationController::class, 'index']
                )->name('practitioner-verifications.index');

                Route::get(
                    'practitioner-verifications/{verification}',
                    [PractitionerVerificationController::class, 'show']
                )->name('practitioner-verifications.show');

                Route::patch(
                    'practitioner-verifications/{verification}/review',
                    [PractitionerVerificationController::class, 'review']
                )->name('practitioner-verifications.review');

                Route::get(
                    'practitioner-documents/{document}/download',
                    [PractitionerVerificationController::class, 'downloadDocument']
                )->name('practitioner-documents.download');
            });
    });

Route::middleware('auth')
    ->prefix('my/observations')
    ->name('my.observations.')
    ->group(function (): void {
        Route::get('/', [MyObservationController::class, 'index'])->name('index');
        Route::get('/create', [MyObservationController::class, 'create'])->name('create');
        Route::post('/', [MyObservationController::class, 'store'])->name('store');
        Route::get('/{observation}/edit', [MyObservationController::class, 'edit'])->name('edit');
        Route::put('/{observation}', [MyObservationController::class, 'update'])->name('update');
        Route::patch('/{observation}/archive', [MyObservationController::class, 'archive'])->name('archive');
        Route::patch('/{observation}/restore', [MyObservationController::class, 'restore'])->name('restore');
    });

Route::middleware('auth')
    ->prefix('practitioner/application')
    ->name('practitioner.application.')
    ->group(function (): void {
        Route::get('/', [PractitionerApplicationController::class, 'show'])->name('show');
        Route::post('/draft', [PractitionerApplicationController::class, 'saveDraft'])->name('draft');
        Route::post('/submit', [PractitionerApplicationController::class, 'submit'])->middleware('verified')->name('submit');
    });

Route::middleware([
    'auth',
    'verified',
    'approved.practitioner',
    'permission:practitioner_clients.manage',
])
    ->prefix('practitioner/patients')
    ->name('practitioner.patients.')
    ->group(function (): void {
        Route::get('/', [PractitionerPatientController::class, 'index'])->name('index');
        Route::get('/create', [PractitionerPatientController::class, 'create'])->name('create');
        Route::post('/', [PractitionerPatientController::class, 'store'])->name('store');
        Route::get('/{client}/edit', [PractitionerPatientController::class, 'edit'])->name('edit');
        Route::put('/{client}', [PractitionerPatientController::class, 'update'])->name('update');
        Route::patch('/{client}/archive', [PractitionerPatientController::class, 'archive'])->name('archive');
        Route::patch('/{client}/restore', [PractitionerPatientController::class, 'restore'])->name('restore');
    });

Route::middleware([
    'auth',
    'verified',
    'approved.practitioner',
    'permission:practitioner_consents.manage',
])
    ->prefix('practitioner/patient-consents')
    ->name('practitioner.patient-consents.')
    ->group(function (): void {
        Route::get('/', [PractitionerPatientConsentController::class, 'index'])
            ->name('index');

        Route::get('/create', [PractitionerPatientConsentController::class, 'create'])
            ->name('create');

        Route::get('/patients/search', [PractitionerPatientConsentController::class, 'searchPatients'])
            ->name('patients.search');

        Route::get('/{client}', [PractitionerPatientConsentController::class, 'show'])
            ->whereNumber('client')
            ->name('show');

        Route::post('/{client}/confirm', [PractitionerPatientConsentController::class, 'confirm'])
            ->whereNumber('client')
            ->name('confirm');

        Route::post('/{client}/withdraw', [PractitionerPatientConsentController::class, 'withdraw'])
            ->whereNumber('client')
            ->name('withdraw');
    });

Route::middleware([
    'auth',
    'verified',
    'approved.practitioner',
    'permission:practitioner_observations.manage',
])
    ->prefix('practitioner/observations')
    ->name('practitioner.observations.')
    ->group(function (): void {
        Route::get('/', [PractitionerObservationController::class, 'index'])
            ->name('index');

        Route::get('/create', [PractitionerObservationController::class, 'create'])
            ->name('create');

        Route::get('/patients/search', [PractitionerObservationController::class, 'searchPatients'])
            ->name('patients.search');

        Route::post('/', [PractitionerObservationController::class, 'store'])
            ->name('store');

        Route::get('/{observation}/edit', [PractitionerObservationController::class, 'edit'])
            ->whereNumber('observation')
            ->name('edit');

        Route::put('/{observation}', [PractitionerObservationController::class, 'update'])
            ->whereNumber('observation')
            ->name('update');

        Route::patch('/{observation}/archive', [PractitionerObservationController::class, 'archive'])
            ->whereNumber('observation')
            ->name('archive');

        Route::patch('/{observation}/restore', [PractitionerObservationController::class, 'restore'])
            ->whereNumber('observation')
            ->name('restore');
    });

require __DIR__.'/settings.php';
