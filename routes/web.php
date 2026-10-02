<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\H2ResearchReferenceController;
use App\Http\Controllers\Admin\H2ResearchSyncController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\PractitionerObservationController as AdminPractitionerObservationController;
use App\Http\Controllers\Admin\PractitionerObservationHistoryController;
use App\Http\Controllers\Admin\PractitionerVerificationController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Frontend\ForPractitionersController;
use App\Http\Controllers\Frontend\HelpController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\HowItWorksController;
use App\Http\Controllers\Frontend\InsightController;
use App\Http\Controllers\Frontend\ObservationController;
use App\Http\Controllers\Frontend\TopicController;
use App\Http\Controllers\MyObservationController;
use App\Http\Controllers\PractitionerApplicationController;
use App\Http\Controllers\PractitionerObservationController;
use App\Http\Controllers\PractitionerPatientConsentController;
use App\Http\Controllers\PractitionerPatientController;
use Illuminate\Support\Facades\Route;

// Route::inertia('/', 'welcome')->name('home');
Route::get(
    '/',
    HomeController::class
)->name('frontend.home');

Route::get(
    '/observations',
    [ObservationController::class, 'index']
)->name('frontend.observations.index');

Route::get(
    '/observations/{observation}',
    [ObservationController::class, 'show']
)
    ->where('observation', '[A-Za-z0-9\-_]+')
    ->name('frontend.observations.show');

Route::get(
    '/topics',
    [TopicController::class, 'index']
)->name('frontend.topics.index');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');
});

Route::get(
    '/topics/{type}/{topic}',
    [TopicController::class, 'show']
)
    ->whereIn('type', [
        'condition',
        'organ',
        'method',
        'research-topic',
        'biomarker',
    ])
    ->whereNumber('topic')
    ->name('frontend.topics.show');

Route::get(
    '/insights',
    [InsightController::class, 'index']
)->name('frontend.insights.index');

Route::get(
    '/how-it-works',
    HowItWorksController::class
)->name('frontend.how-it-works');

Route::get(
    '/for-practitioners',
    ForPractitionersController::class
)->name('frontend.for-practitioners');

Route::get(
    '/help',
    HelpController::class
)->name('frontend.help');

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function (): void {

        Route::post(
            'h2research-sync',
            [H2ResearchSyncController::class, 'store']
        )
            ->middleware('permission:h2research_data.sync')
            ->name('h2research-sync.store');

        Route::middleware(['auth', 'verified'])->group(function (): void {
            Route::get('dashboard', [DashboardController::class, 'index'])
                ->name('dashboard');
        });

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
        Route::middleware('permission:practitioner_observations.review')
            ->group(function (): void {
                Route::get(
                    'h2research-options',
                    [H2ResearchReferenceController::class, 'index']
                )->name('h2research-options.index');

                Route::get(
                    'review-practitioner-observations',
                    [AdminPractitionerObservationController::class, 'index']
                )->name('review-practitioner-observations.index');

                Route::get(
                    'review-practitioner-observations/{observation}/history',
                    [PractitionerObservationHistoryController::class, 'show']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.history');

                Route::get(
                    'review-practitioner-observations/{observation}',
                    [AdminPractitionerObservationController::class, 'show']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.show');

                Route::put(
                    'review-practitioner-observations/{observation}',
                    [AdminPractitionerObservationController::class, 'update']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.update');

                Route::patch(
                    'review-practitioner-observations/{observation}/review',
                    [AdminPractitionerObservationController::class, 'review']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.review');

                Route::patch(
                    'review-practitioner-observations/{observation}/flag',
                    [AdminPractitionerObservationController::class, 'flag']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.flag');

                Route::patch(
                    'review-practitioner-observations/{observation}/resolve-flag',
                    [AdminPractitionerObservationController::class, 'resolveFlag']
                )
                    ->whereNumber('observation')
                    ->name('review-practitioner-observations.resolve-flag');
            });

        Route::middleware('permission:audit_logs.view')
            ->group(function (): void {
                Route::get(
                    'audit-logs',
                    [AuditLogController::class, 'index']
                )->name('audit-logs.index');

                Route::get(
                    'audit-logs/{auditLog}',
                    [AuditLogController::class, 'show']
                )
                    ->whereNumber('auditLog')
                    ->name('audit-logs.show');
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
        Route::patch(
            '/{observation}/submit',
            [MyObservationController::class, 'submit']
        )
            ->whereNumber('observation')
            ->name('submit');
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
        Route::get(
            '/',
            [PractitionerObservationController::class, 'index']
        )->name('index');

        Route::get(
            '/create',
            [PractitionerObservationController::class, 'create']
        )->name('create');

        Route::get(
            '/patients/search',
            [PractitionerObservationController::class, 'searchPatients']
        )->name('patients.search');

        Route::post(
            '/',
            [PractitionerObservationController::class, 'store']
        )->name('store');

        Route::get(
            '/{observation}/edit',
            [PractitionerObservationController::class, 'edit']
        )
            ->whereNumber('observation')
            ->name('edit');

        Route::put(
            '/{observation}',
            [PractitionerObservationController::class, 'update']
        )
            ->whereNumber('observation')
            ->name('update');

        Route::patch(
            '/{observation}/submit',
            [PractitionerObservationController::class, 'submit']
        )
            ->whereNumber('observation')
            ->name('submit');

        Route::patch(
            '/{observation}/archive',
            [PractitionerObservationController::class, 'archive']
        )
            ->whereNumber('observation')
            ->name('archive');

        Route::patch(
            '/{observation}/restore',
            [PractitionerObservationController::class, 'restore']
        )
            ->whereNumber('observation')
            ->name('restore');
    });

require __DIR__.'/settings.php';
