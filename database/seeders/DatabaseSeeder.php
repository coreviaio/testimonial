<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Replace database/seeders/DatabaseSeeder.php with this file.
 * Run against your development database: php artisan migrate:fresh --seed
 * All generated people, observations, consents and reviews are fictional fixtures.
 * The original role/permission definitions and grants are preserved verbatim.
 * The existing storage/app/h2research.sqlite reference cache is read, never reset.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const ADMINS = 10;
    private const PRACTITIONERS = 100;
    private const USERS = 200;
    private const PATIENTS_PER_PRACTITIONER = 20;
    private const OBSERVATIONS = 10000;

    private Carbon $start;
    private Carbon $end;
    private string $passwordHash;
    private array $admins = [];
    private array $practitioners = [];
    private array $users = [];
    private array $roleIds = [];

    private const ACKNOWLEDGEMENTS = [
        'information_accurate' => 'I confirm that the information provided is accurate.',
        'deidentified_observations' => 'I will submit only de-identified client observations.',
        'not_medical_claims' => 'I understand that my observations are not medical claims, proof of efficacy or clinical evidence.',
        'review_before_publication' => 'I understand that my submissions must be reviewed before publication.',
        'changes_may_be_requested' => 'I understand that Moderators may request changes to a submission.',
    ];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('This sample dataset is for APP_ENV=local or testing only.');
        }
        if (DB::table('users')->exists() || DB::table('roles')->exists()) {
            throw new RuntimeException('This is a fresh-database seeder. Use php artisan migrate:fresh --seed on your development database.');
        }
        foreach ([self::ADMINS, self::PRACTITIONERS, self::USERS, self::PATIENTS_PER_PRACTITIONER, self::OBSERVATIONS] as $count) {
            if ($count < 1) {
                throw new RuntimeException('All seeder counts must be positive.');
            }
        }
        $this->end = Carbon::now()->subMinute();
        $this->start = $this->end->copy()->subMonthsNoOverflow(6)->startOfDay();
        $this->passwordHash = Hash::make('password');
        $scenarios = $this->scenarios();
        $references = $this->referenceMappings($scenarios);
        DB::connection()->disableQueryLog();
        DB::transaction(function (): void {
            $now = $this->start;

            /*
             |--------------------------------------------------------------------------
             | Roles
             |--------------------------------------------------------------------------
             */

            $roles = [
                [
                    'name' => 'Administrator',
                    'slug' => 'admin',
                    'description' => 'Full administrative access.',
                ],
                [
                    'name' => 'User',
                    'slug' => 'user',
                    'description' => 'Standard registered user.',
                ],
                [
                    'name' => 'Practitioner',
                    'slug' => 'practitioner',
                    'description' => 'Approved practitioner with access to practitioner features.',
                ],
            ];

            foreach ($roles as $role) {
                DB::table('roles')->insert([
                    ...$role,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            /*
             |--------------------------------------------------------------------------
             | Permissions
             |--------------------------------------------------------------------------
             */

            $permissions = [
                [
                    'name' => 'Manage users',
                    'slug' => 'users.manage',
                    'description' => 'Create, view, update, delete, and assign roles to users.',
                ],
                [
                    'name' => 'Manage roles',
                    'slug' => 'roles.manage',
                    'description' => 'Create, view, update, and delete roles.',
                ],
                [
                    'name' => 'Manage permissions',
                    'slug' => 'permissions.manage',
                    'description' => 'Create, view, update, and delete permissions.',
                ],
                [
                    'name' => 'Manage practitioner verifications',
                    'slug' => 'practitioner_verifications.manage',
                    'description' => 'View, approve, request changes, and reject practitioner applications.',
                ],
                [
                    'name' => 'Manage practitioner patients',
                    'slug' => 'practitioner_clients.manage',
                    'description' => 'Create, view, update, archive, and restore owned practitioner patients.',
                ],
                [
                    'name' => 'Manage patient consents',
                    'slug' => 'practitioner_consents.manage',
                    'description' => 'Confirm, withdraw, and view consent history for owned practitioner patients.',
                ],
                [
                    'name' => 'Manage practitioner observations',
                    'slug' => 'practitioner_observations.manage',
                    'description' => 'Create, update, archive, restore, and manage owned practitioner observations.',
                ],
                [
                    'name' => 'Review practitioner observations',
                    'slug' => 'practitioner_observations.review',
                    'description' => 'View, edit, review, and approve practitioner observations.',
                ],
                [
                    'name' => 'View audit logs',
                    'slug' => 'audit_logs.view',
                    'description' => 'View administrative and workflow audit history.',
                ],
                [
                    'name' => 'Sync H2Research data',
                    'slug' => 'h2research_data.sync',
                    'description' => 'Synchronize H2Research reference data used for testimonial mappings.',
                ],
            ];

            foreach ($permissions as $permission) {
                DB::table('permissions')->insert([
                    ...$permission,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            /*
             |--------------------------------------------------------------------------
             | Role IDs
             |--------------------------------------------------------------------------
             */

            $adminRoleId = DB::table('roles')
                ->where('slug', 'admin')
                ->value('id');

            $userRoleId = DB::table('roles')
                ->where('slug', 'user')
                ->value('id');

            $practitionerRoleId = DB::table('roles')
                ->where('slug', 'practitioner')
                ->value('id');

            /*
             |--------------------------------------------------------------------------
             | Admin Permissions
             |--------------------------------------------------------------------------
             */

            $adminPermissionIds = DB::table('permissions')
                ->pluck('id');

            foreach ($adminPermissionIds as $permissionId) {
                DB::table('role_permissions')->insert([
                    'role_id' => $adminRoleId,
                    'permission_id' => $permissionId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            /*
             |--------------------------------------------------------------------------
             | Practitioner Permissions
             |--------------------------------------------------------------------------
             */

            $practitionerPermissionIds = DB::table('permissions')
                ->whereIn('slug', [
                    'practitioner_clients.manage',
                    'practitioner_consents.manage',
                    'practitioner_observations.manage',
                ])
                ->pluck('id');

            foreach ($practitionerPermissionIds as $permissionId) {
                DB::table('role_permissions')->insert([
                    'role_id' => $practitionerRoleId,
                    'permission_id' => $permissionId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->roleIds = [
                'admin' => (int) $adminRoleId,
                'user' => (int) $userRoleId,
                'practitioner' => (int) $practitionerRoleId,
            ];
        });

        for ($number = 1; $number <= self::ADMINS; $number++) {
            $this->admins[] = DB::transaction(fn () => $this->account($number, 'admin', $this->start->copy()));
        }
        for ($number = 1; $number <= self::PRACTITIONERS; $number++) {
            $this->practitioners[] = DB::transaction(fn () => $this->practitioner($number));
        }
        for ($number = 1; $number <= self::USERS; $number++) {
            $joinedAt = $this->start->copy()->addDays($this->pick("user-join-{$number}", 1, 115))
                ->addMinutes($this->pick("user-time-{$number}", 0, 1439));
            $this->users[] = DB::transaction(fn () => $this->account($number, 'user', $joinedAt));
        }
        for ($number = 1; $number <= self::OBSERVATIONS; $number++) {
            DB::transaction(fn () => $this->observation($number, $scenarios, $references));
            if ($number % 500 === 0) {
                $this->command?->info("Created {$number} / ".self::OBSERVATIONS.' observations.');
            }
        }
        $this->command?->info('Finished: '.self::ADMINS.' admins, '.self::PRACTITIONERS.' practitioners, '.self::USERS.' regular users, '.(self::PRACTITIONERS * self::PATIENTS_PER_PRACTITIONER).' patients.');
        $this->command?->info('Every account password: password');
        $this->command?->info('Login examples: admin001@example.test | practitioner001@example.test | user001@example.test');
        $this->command?->info('Activity range: '.$this->start->toDateTimeString().' to '.$this->end->toDateTimeString());
        foreach (DB::table('testimonials')->selectRaw('status, COUNT(*) AS total')->groupBy('status')->get() as $row) {
            $this->command?->info("{$row->status}: {$row->total}");
        }
    }

    private function account(int $number, string $kind, Carbon $joinedAt): array
    {
        $offset = match ($kind) { 'admin' => 0, 'practitioner' => 10, default => 110 };
        $name = $this->personName($number + $offset);
        $email = sprintf('%s%03d@example.test', $kind, $number);
        $userId = DB::table('users')->insertGetId([
            'name' => $name, 'email' => $email, 'password' => $this->passwordHash,
            'email_verified_at' => $joinedAt, 'created_at' => $joinedAt, 'updated_at' => $joinedAt,
        ]);
        $places = [['BD', 'Dhaka'], ['BD', 'Chattogram'], ['GB', 'Bristol'], ['AU', 'Melbourne'], ['CA', 'Ottawa'], ['US', 'Seattle']];
        [$country, $city] = $places[($number - 1) % count($places)];
        DB::table('user_profiles')->insert([
            'user_id' => $userId, 'display_name' => $name, 'country_code' => $country, 'city' => $city,
            'short_bio' => $kind === 'practitioner' ? 'Recording everyday patient experiences and follow-up observations.' : 'Interested in shared experiences, health research and everyday wellbeing.',
            'is_public' => $number % 4 !== 0, 'created_at' => $joinedAt, 'updated_at' => $joinedAt,
        ]);
        $roleSlugs = match ($kind) { 'admin' => ['admin'], 'practitioner' => ['user', 'practitioner'], default => ['user'] };
        $assignedBy = $this->admins === [] ? $userId : $this->admins[($number - 1) % count($this->admins)]['id'];
        foreach ($roleSlugs as $slug) {
            DB::table('user_roles')->insert([
                'user_id' => $userId, 'role_id' => $this->roleIds[$slug], 'assigned_by_user_id' => $assignedBy,
                'created_at' => $joinedAt, 'updated_at' => $joinedAt,
            ]);
        }
        return ['id' => (int) $userId, 'name' => $name, 'email' => $email, 'country' => $country, 'joined_at' => $joinedAt];
    }

    private function practitioner(int $number): array
    {
        // Gradual onboarding across the first four months, with some early contributors.
        $joinedAt = $this->start->copy()->addDays($number <= 10 ? $number - 1 : $this->pick("practitioner-join-{$number}", 1, 110))
            ->addMinutes($this->pick("practitioner-time-{$number}", 60, 1200));
        $account = $this->account($number, 'practitioner', $joinedAt);
        $submittedAt = $joinedAt->copy()->addHours($this->pick("application-{$number}", 2, 12));
        $approvedAt = $submittedAt->copy()->addHours($this->pick("verification-{$number}", 12, 48));
        $adminId = $this->admins[($number - 1) % count($this->admins)]['id'];
        $practitionerId = DB::table('practitioners')->insertGetId([
            'user_id' => $account['id'], 'practitioner_type' => 'Doctor', 'professional_title' => 'Dr.',
            'specialty' => ['General Medicine', 'Family Medicine', 'Sports Medicine', 'Community Health'][($number - 1) % 4],
            'professional_bio' => 'Interested in patient-reported experiences, careful follow-up and clear documentation of everyday health routines.',
            'organization_name' => ['Riverside Medical Centre', 'Greenfield Family Practice', 'Northside Wellness Clinic', 'Harbour Community Clinic', 'Meadow Primary Care'][($number - 1) % 5],
            'years_of_experience' => $this->pick("experience-{$number}", 3, 24),
            'license_number' => sprintf('SAMPLE-LIC-%05d', $number), 'issuing_authority' => 'Sample credential for development',
            'registration_jurisdiction' => $account['country'], 'show_identity_publicly' => $number % 4 !== 0,
            'public_display_name' => 'Dr. '.$account['name'],
            'public_professional_description' => 'Practitioner sharing de-identified observations from routine follow-up.',
            'verification_status' => 'approved', 'created_at' => $joinedAt, 'updated_at' => $approvedAt,
        ]);
        $profile = DB::table('user_profiles')->where('user_id', $account['id'])->first();
        $practitioner = DB::table('practitioners')->where('id', $practitionerId)->first();
        $verificationId = DB::table('practitioner_verifications')->insertGetId([
            'practitioner_id' => $practitionerId, 'attempt_number' => 1, 'status' => 'approved',
            'application_snapshot' => $this->json(['account' => ['name' => $account['name'], 'email' => $account['email']], 'profile' => $profile, 'practitioner' => $practitioner]),
            'submitted_at' => $submittedAt, 'reviewed_by_user_id' => $adminId, 'reviewed_at' => $approvedAt,
            'review_comment' => 'Application reviewed and approved.', 'internal_note' => 'Fictional development fixture.',
            'created_at' => $submittedAt, 'updated_at' => $approvedAt,
        ]);
        $this->seedPractitionerAcknowledgements($account['id'], (int) $verificationId, $submittedAt);
        $this->seedPractitionerDocuments($account['id'], (int) $verificationId, $submittedAt);
        $this->audit($adminId, 'practitioner_verification.approved', 'App\\Models\\PractitionerVerification', (int) $verificationId, 'pending_verification', 'approved', $approvedAt);
        $patients = [];
        for ($patientNumber = 1; $patientNumber <= self::PATIENTS_PER_PRACTITIONER; $patientNumber++) {
            $createdAt = $approvedAt->copy()->addDays($this->pick("patient-join-{$number}-{$patientNumber}", 0, 10))->addHours(2);
            $consentedAt = $createdAt->copy()->addHours(1);
            $reference = sprintf('PAT-%03d-%03d', $number, $patientNumber);
            $patientId = DB::table('clients')->insertGetId([
                'practitioner_id' => $practitionerId, 'client_reference' => $reference,
                'name' => $this->personName($number * 20 + $patientNumber),
                'email' => sprintf('patient%03d.%03d@example.test', $number, $patientNumber),
                'age_years' => $this->pick("age-{$reference}", 21, 78), 'age_recorded_on' => $createdAt->toDateString(),
                'gender' => $patientNumber % 2 === 0 ? 'Female' : 'Male', 'country_code' => $account['country'],
                'private_notes' => 'Fictional patient record generated for development.', 'status' => 'active',
                'created_by_user_id' => $account['id'], 'created_at' => $createdAt, 'updated_at' => $createdAt,
            ]);
            $consentId = DB::table('client_consents')->insertGetId([
                'client_id' => $patientId, 'recorded_by_user_id' => $account['id'], 'action' => 'confirmed',
                'statement_version' => '1.0', 'statement_text' => 'Permission to share a de-identified observation was recorded.',
                'note' => 'Fictional consent fixture; not actual patient consent.', 'occurred_at' => $consentedAt, 'created_at' => $consentedAt,
            ]);
            $patients[] = ['id' => (int) $patientId, 'reference' => $reference, 'consent_id' => (int) $consentId, 'ready_at' => $consentedAt];
        }
        return ['id' => (int) $practitionerId, 'user_id' => $account['id'], 'patients' => $patients];
    }

    private function observation(int $number, array $scenarios, array $references): void
    {
        $isPractitioner = $number % 4 !== 0;
        $ordinal = $isPractitioner ? $number - intdiv($number, 4) - 1 : intdiv($number, 4) - 1;
        $practitioner = $this->practitioners[$ordinal % count($this->practitioners)];
        $patient = $practitioner['patients'][intdiv($ordinal, count($this->practitioners)) % self::PATIENTS_PER_PRACTITIONER];
        $contributor = $this->users[$ordinal % count($this->users)];
        $authorId = $isPractitioner ? $practitioner['user_id'] : $contributor['id'];
        $readyAt = $isPractitioner ? $patient['ready_at'] : $contributor['joined_at'];
        $scenarioIndex = $this->pick("scenario-{$number}", 0, count($scenarios) - 1);
        $scenario = $scenarios[$scenarioIndex];
        $adminId = $this->admins[$this->pick("reviewer-{$number}", 0, count($this->admins) - 1)]['id'];
        $weeks = [2, 3, 4, 6][$this->pick("weeks-{$number}", 0, 3)];
        $earliest = $readyAt->copy()->addWeeks($weeks)->addDay();
        $latest = $this->end->copy()->subDays(8);
        if ($earliest->greaterThan($latest)) {
            throw new RuntimeException('The activity window is too short for the configured onboarding and observation durations.');
        }
        // Independent dates/times; skew toward recent activity to resemble a growing website.
        $fraction = pow($this->pick("submitted-date-{$number}", 0, 1000000) / 1000000, 0.72);
        $submittedAt = Carbon::createFromTimestamp($earliest->getTimestamp() + (int) round(($latest->getTimestamp() - $earliest->getTimestamp()) * $fraction), $this->end->timezone);
        $createdAt = $submittedAt->copy()->subWeeks($weeks);
        $reviewedAt = $submittedAt->copy()->addHours($this->pick("review-delay-{$number}", 4, 96));
        $bucket = $this->pick("status-{$number}", 0, 99);
        $status = match (true) {
            $bucket < 70 => 'published', $bucket < 80 => 'draft', $bucket < 88 => 'pending_review',
            $bucket < 93 => 'changes_requested', $bucket < 97 => 'rejected', default => 'archived',
        };
        // Open work is concentrated in the last week; archives follow a draft lifecycle.
        if (in_array($status, ['draft', 'pending_review', 'changes_requested', 'rejected', 'archived'], true)) {
            $submittedAt = $this->end->copy()->subHours($this->pick("open-date-{$number}", 100, 240));
            $createdAt = $submittedAt->copy()->subWeeks($weeks);
            $reviewedAt = $submittedAt->copy()->addHours($this->pick("open-delay-{$number}", 4, 72));
        }
        $isPublic = $status === 'published';
        $hasSubmission = ! in_array($status, ['draft', 'archived'], true);
        $method = $scenario['topic'] === 'Dermatological Diseases' ? 'Topical applications'
            : ($scenario['topic'] === 'Exercise' && $number % 2 === 0 ? 'Inhalation' : 'Oral Hydrogen Water');
        $snapshot = $this->content($number, $scenario, $weeks, $isPractitioner, $method);
        $snapshot += [
            'submission_type' => $isPractitioner ? 'practitioner' : 'contributor',
            'practitioner_id' => $isPractitioner ? $practitioner['id'] : null,
            'client_id' => $isPractitioner ? $patient['id'] : null,
            'client_reference' => $isPractitioner ? $patient['reference'] : null,
        ];
        $row = $snapshot;
        unset($row['client_reference']);
        $testimonialId = (int) DB::table('testimonials')->insertGetId([
            ...$row, 'author_user_id' => $authorId, 'slug' => Str::slug($snapshot['title']).'-'.$number,
            'status' => $status, 'submitted_at' => $hasSubmission ? $submittedAt : null,
            'published_at' => $isPublic ? $reviewedAt : null, 'published_by_user_id' => $isPublic ? $adminId : null,
            'flagged_for_admin' => false, 'public_display_note' => 'Sample observation generated for website testing.',
            'internal_tags' => $this->json(['six-month-seed', 'fictional', $scenario['topic']]),
            'archived_by_user_id' => $status === 'archived' ? $authorId : null,
            'archived_at' => $status === 'archived' ? $reviewedAt : null,
            'created_at' => $createdAt, 'updated_at' => $status === 'draft' ? $submittedAt : ($status === 'pending_review' ? $submittedAt : $reviewedAt),
        ]);
        if ($hasSubmission) {
            // A portion of published work has a request-changes / resubmission history.
            $revised = $isPublic && $this->pick("revision-{$number}", 0, 4) === 0;
            $versionId = $this->version($testimonialId, 1, $snapshot, $authorId, $isPractitioner ? $patient['consent_id'] : null, $submittedAt, $isPublic && ! $revised ? $adminId : null, $reviewedAt);
            $this->review($testimonialId, $versionId, $authorId, 'submitted', 'draft', 'pending_review', 'Submitted for review.', $submittedAt);
            if ($revised) {
                $requestedAt = $submittedAt->copy()->addHours(6);
                $resubmittedAt = $submittedAt->copy()->addHours(30);
                $reviewedAt = $resubmittedAt->copy()->addHours($this->pick("second-review-{$number}", 6, 48));
                $this->review($testimonialId, $versionId, $adminId, 'changes_requested', 'pending_review', 'changes_requested', 'Please clarify the follow-up timeline and other changes in the routine.', $requestedAt);
                $snapshot['timeline_text'] .= ' The follow-up timeline was clarified after review.';
                $versionId = $this->version($testimonialId, 2, $snapshot, $authorId, $isPractitioner ? $patient['consent_id'] : null, $resubmittedAt, $adminId, $reviewedAt);
                $this->review($testimonialId, $versionId, $authorId, 'resubmitted', 'changes_requested', 'pending_review', 'Timeline clarified and resubmitted.', $resubmittedAt);
                DB::table('testimonials')->where('id', $testimonialId)->update([
                    'timeline_text' => $snapshot['timeline_text'], 'submitted_at' => $resubmittedAt,
                    'published_at' => $reviewedAt, 'updated_at' => $reviewedAt,
                ]);
            }
            DB::table('testimonials')->where('id', $testimonialId)->update(['latest_version_id' => $versionId]);
            if ($status !== 'pending_review') {
                $comment = match ($status) {
                    'changes_requested' => 'Please clarify the diary gaps and separate reported experience from causal claims.',
                    'rejected' => 'The account does not include enough follow-up detail for publication.',
                    default => 'Reviewed for consent, de-identification and observational language. Approved for publication.',
                };
                $this->review($testimonialId, $versionId, $adminId, $isPublic ? 'approved' : $status, 'pending_review', $status, $comment, $reviewedAt);
            }
        } elseif ($status === 'archived') {
            $this->review($testimonialId, null, $authorId, 'archived', 'draft', 'archived', 'Draft archived by its author.', $reviewedAt);
        }
        // External mappings represent the admin's publication review.
        if ($isPublic) {
            $mappings = $references[$scenarioIndex];
            $mappings[] = ['testimonial_administration_methods', 'administration_method_id', $references['methods'][$method]];
            foreach ($mappings as [$table, $column, $externalId]) {
                DB::table($table)->insert([
                    'testimonial_id' => $testimonialId, $column => $externalId, 'created_by_user_id' => $adminId,
                    'created_at' => $reviewedAt, 'updated_at' => $reviewedAt,
                ]);
            }
        }
    }

    private function content(int $number, array $scenario, int $weeks, bool $practitioner, string $method): array
    {
        $contexts = [
            ['after a change in work hours', 'Work hours and bedtime changed during the same period.'],
            ['during a regular walking routine', 'Walking frequency varied, especially during the final week.'],
            ['alongside an existing care routine', 'Usual care continued throughout the diary period.'],
            ['during a busy month', 'Several busy days interrupted the routine and some diary entries were missed.'],
            ['with weekly follow-up notes', 'Weekly notes were used to compare the experience with the starting point.'],
            ['after returning to a daily routine', 'Meal times, sleep and activity were not kept constant.'],
            ['during a period of travel', 'Travel and different daily schedules made comparisons difficult.'],
            ['with an evening diary', 'Entries were recorded in the evening and reflected the experience of that day.'],
        ];
        [$titleContext, $context] = $contexts[$this->pick("context-{$number}", 0, count($contexts) - 1)];
        $outcomes = [
            'Some days felt more comfortable, although the pattern was not consistent throughout the period.',
            'There was no clear change compared with the first week.',
            'Early notes described a small improvement, but later entries were similar to the starting point.',
            'The experience varied from day to day, with both easier and more difficult days recorded.',
            'Discomfort increased toward the end of the period and the recorded routine was stopped.',
            'Several entries were missing, leaving too little detail to identify a consistent pattern.',
            'The final notes described better day-to-day comfort, alongside changes in sleep and activity.',
        ];
        $outcome = $outcomes[$this->pick("outcome-{$number}", 0, count($outcomes) - 1)];
        $opening = $practitioner
            ? "An adult patient described {$scenario['symptom']}. We followed the reported experience over {$weeks} weeks using short diary entries and routine follow-up."
            : "I kept notes about {$scenario['symptom']} for {$weeks} weeks to see whether there was a consistent pattern in my everyday experience.";
        $methodText = match ($method) {
            'Inhalation' => 'The recorded routine included hydrogen inhalation sessions. Session details were not standardized in this account.',
            'Topical applications' => 'The diary included a topical application routine. Other skin-care habits continued during the same period.',
            default => 'Hydrogen water was part of the recorded routine. Other food, fluid and activity habits were not controlled.',
        };
        return [
            'title' => $scenario['title'].' '.$titleContext,
            'observation' => "{$opening}\n\n{$methodText} {$context}\n\n{$outcome}\n\nThis account describes a personal experience. It cannot establish whether any change was caused by the recorded routine.",
            'condition_symptom_text' => $scenario['symptom'], 'duration_text' => "{$weeks} weeks",
            'frequency_text' => ['Daily diary with weekly follow-up', 'Notes on three days each week', 'Weekly follow-up with occasional daily notes'][$this->pick("frequency-{$number}", 0, 2)],
            'timeline_text' => "Week 1: the starting experience was recorded. Middle weeks: diary entries and routine follow-up continued. Week {$weeks}: the final notes were compared with the first week. {$outcome}",
            'practitioner_note' => $practitioner ? $context.' Patient-reported experience; no causal conclusion was drawn.' : null,
        ];
    }

    private function version(int $testimonialId, int $versionNumber, array $snapshot, int $authorId, ?int $consentId, Carbon $submittedAt, ?int $approverId, Carbon $approvedAt): int
    {
        $versionId = (int) DB::table('testimonial_versions')->insertGetId([
            'testimonial_id' => $testimonialId, 'version_number' => $versionNumber,
            'submitted_snapshot' => $this->json($snapshot), 'approved_snapshot' => $approverId ? $this->json($snapshot) : null,
            'submitted_by_user_id' => $authorId, 'submitted_at' => $submittedAt, 'client_consent_id' => $consentId,
            'approved_by_user_id' => $approverId, 'approved_at' => $approverId ? $approvedAt : null,
            'created_at' => $submittedAt, 'updated_at' => $approverId ? $approvedAt : $submittedAt,
        ]);
        foreach (self::ACKNOWLEDGEMENTS as $code => $text) {
            DB::table('testimonial_consents')->insert([
                'version_id' => $versionId, 'accepted_by_user_id' => $authorId,
                'statement_code' => $code, 'statement_version' => '1.0', 'statement_text' => $text,
                'accepted_at' => $submittedAt, 'created_at' => $submittedAt,
            ]);
        }
        return $versionId;
    }

    private function review(int $testimonialId, ?int $versionId, int $actorId, string $action, string $from, string $to, string $comment, Carbon $at): void
    {
        $passed = $action === 'approved' ? 'passed' : null;
        DB::table('testimonial_reviews')->insert([
            'testimonial_id' => $testimonialId, 'version_id' => $versionId, 'actor_user_id' => $actorId,
            'action' => $action, 'from_status' => $from, 'to_status' => $to,
            'review_comment' => $comment, 'internal_note' => 'Fictional development fixture.',
            'condition_check' => $passed, 'observation_language_check' => $passed,
            'deidentification_check' => $passed, 'consent_check' => $passed, 'publication_check' => $passed,
            'acted_at' => $at, 'created_at' => $at,
        ]);
        $this->audit($actorId, 'practitioner_observation.'.$action, 'App\\Models\\Testimonial', $testimonialId, $from, $to, $at);
    }

    private function audit(int $actorId, string $action, string $subjectType, int $subjectId, string $from, string $to, Carbon $at): void
    {
        DB::table('audit_logs')->insert([
            'actor_user_id' => $actorId, 'action' => $action, 'subject_type' => $subjectType, 'subject_id' => $subjectId,
            'old_values' => $this->json(['status' => $from]), 'new_values' => $this->json(['status' => $to]),
            'metadata' => $this->json(['source' => 'six-month-seed', 'synthetic' => true]),
            'request_id' => (string) Str::uuid(), 'occurred_at' => $at, 'created_at' => $at,
        ]);
    }

    private function pick(string $key, int $minimum, int $maximum): int
    {
        // Stable independent choices without changing Faker/global random state.
        return $minimum + (int) (hexdec(substr(hash('sha256', $key), 0, 7)) % ($maximum - $minimum + 1));
    }

    private function seedPractitionerAcknowledgements(
        int $userId,
        int $verificationId,
            $acceptedAt
    ): void {
        $acknowledgementSetId = (string) Str::uuid();

        $acknowledgements = [
            'information_accurate' => 'I confirm that the information provided is accurate.',
            'manual_verification' => 'I understand that MHI must manually verify my practitioner credentials.',
            'deidentified_observations' => 'I will submit only de-identified client observations.',
            'not_medical_claims' => 'I understand that my observations are not medical claims, proof of efficacy or clinical evidence.',
            'review_before_publication' => 'I understand that my submissions must be reviewed before publication.',
            'changes_may_be_requested' => 'I understand that Moderators may request changes to a submission.',
        ];

        foreach ($acknowledgements as $code => $text) {
            DB::table('user_consents')->insert([
                'user_id' => $userId,
                'context' => 'practitioner_verification',
                'verification_id' => $verificationId,
                'acknowledgement_set_id' => $acknowledgementSetId,
                'statement_code' => $code,
                'statement_version' => '1.0',
                'statement_text' => $text,
                'accepted_at' => $acceptedAt,
                'created_at' => $acceptedAt,
            ]);
        }
    }

    private function seedPractitionerDocuments(
        int $userId,
        int $verificationId,
            $createdAt
    ): void {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZgZ0AAAAASUVORK5CYII=',
            true
        );

        if ($png === false) {
            return;
        }

        $documents = [
            [
                'type' => 'primary_credential',
                'name' => 'demo-primary-credential.png',
            ],
            [
                'type' => 'license_registration',
                'name' => 'demo-license-registration.png',
            ],
        ];

        foreach ($documents as $document) {
            $path = "practitioner-verifications/{$verificationId}/{$document['name']}";

            Storage::disk('local')->put($path, $png);

            DB::table('practitioner_documents')->insert([
                'verification_id' => $verificationId,
                'uploaded_by_user_id' => $userId,
                'document_type' => $document['type'],
                'storage_disk' => 'local',
                'file_path' => $path,
                'original_filename' => $document['name'],
                'mime_type' => 'image/png',
                'size_bytes' => strlen($png),
                'sha256' => hash('sha256', $png),
                'expires_at' => null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }

    private function referenceMappings(array $scenarios): array
    {
        try {
            if (! Schema::connection('h2research_cache')->hasTable('h2_reference_items')) {
                throw new RuntimeException('Reference cache table is missing.');
            }
            $items = DB::connection('h2research_cache')->table('h2_reference_items')->get(['source', 'external_id', 'name']);
        } catch (\Throwable $exception) {
            throw new RuntimeException('Your existing reference cache is required. Keep storage/app/h2research.sqlite from your project, or run your existing reference-data sync before seeding.', 0, $exception);
        }
        $lookup = [];
        foreach ($items as $item) {
            if (ctype_digit((string) $item->external_id) && (int) $item->external_id > 0) {
                $lookup[$item->source][mb_strtolower(trim($item->name))] = (int) $item->external_id;
            }
        }
        $resolve = function (string $source, string $name) use ($lookup): int {
            $id = $lookup[$source][mb_strtolower($name)] ?? null;
            if (! $id) {
                throw new RuntimeException("Missing reference: {$source} / {$name}. Sync reference data or adjust this scenario label before seeding.");
            }
            return $id;
        };
        $mappings = [];
        foreach ($scenarios as $index => $scenario) {
            $mappings[$index] = [
                ['testimonial_research_topics', 'research_topic_id', $resolve('research_topic', $scenario['topic'])],
                ['testimonial_organs', 'organ_id', $resolve('organ', $scenario['organ'])],
            ];
            if ($scenario['disease'] !== null) {
                $mappings[$index][] = ['testimonial_diseases', 'disease_id', $resolve('disease', $scenario['disease'])];
            }
        }
        foreach (['Oral Hydrogen Water', 'Inhalation', 'Topical applications'] as $method) {
            $mappings['methods'][$method] = $resolve('administration_method', $method);
        }
        return $mappings;
    }

    private function scenarios(): array
    {
        // Labels checked against the reference cache included in the supplied project.
        return [
            ['title' => 'Sleep and morning rest diary', 'symptom' => 'interrupted sleep and morning tiredness', 'topic' => 'Sleep', 'organ' => 'Brain', 'disease' => null],
            ['title' => 'Afternoon energy diary', 'symptom' => 'afternoon fatigue during ordinary daily activities', 'topic' => 'Fatigue', 'organ' => 'Muscle', 'disease' => 'Fatigue'],
            ['title' => 'Post-exercise recovery notes', 'symptom' => 'muscle tiredness after familiar exercise sessions', 'topic' => 'Exercise', 'organ' => 'Muscle', 'disease' => 'Exercise-induced oxidative stress and fatigue'],
            ['title' => 'Digestive comfort diary', 'symptom' => 'intermittent bloating and digestive discomfort', 'topic' => 'Digestive health', 'organ' => 'Stomach', 'disease' => null],
            ['title' => 'Skin comfort follow-up', 'symptom' => 'dryness and variable skin comfort', 'topic' => 'Dermatological Diseases', 'organ' => 'Skin', 'disease' => null],
            ['title' => 'Everyday concentration notes', 'symptom' => 'difficulty maintaining concentration during routine tasks', 'topic' => 'Cognitive function', 'organ' => 'Brain', 'disease' => null],
            ['title' => 'Joint comfort and mobility diary', 'symptom' => 'stiffness and joint discomfort during everyday movement', 'topic' => 'Musculoskeletal Disorders', 'organ' => 'Cartilage', 'disease' => null],
            ['title' => 'Daily wellbeing check-in', 'symptom' => 'variable energy and general wellbeing', 'topic' => 'Health & Wellness / Prevention', 'organ' => 'General', 'disease' => null],
            ['title' => 'Blood pressure follow-up diary', 'symptom' => 'day-to-day wellbeing during routine hypertension follow-up', 'topic' => 'Hypertension', 'organ' => 'Blood Vessels', 'disease' => 'Hypertension'],
            ['title' => 'Oral comfort follow-up', 'symptom' => 'gum discomfort during routine periodontal follow-up', 'topic' => 'Oral health', 'organ' => 'Periodontal Tissue', 'disease' => 'Periodontal diseases (periodontitis, peri-implantitis, gingivitis)'],
            ['title' => 'Metabolic health routine diary', 'symptom' => 'energy fluctuations during existing metabolic syndrome follow-up', 'topic' => 'Metabolic Syndrome', 'organ' => 'General', 'disease' => 'Metabolic syndrome (human subjects)'],
            ['title' => 'Healthy aging activity notes', 'symptom' => 'variable comfort and energy during usual daily activities', 'topic' => 'Aging', 'organ' => 'General', 'disease' => null],
        ];
    }

    private function personName(int $number): string
    {
        $firstNames = ['Amina', 'Daniel', 'Farhana', 'Omar', 'Maya', 'Arif', 'Nadia', 'James', 'Sara', 'Rafi', 'Leila', 'Adam', 'Nora', 'Imran', 'Sofia', 'Hasan', 'Eva', 'Karim', 'Zara', 'David'];
        $lastNames = ['Rahman', 'Ahmed', 'Khan', 'Morgan', 'Patel', 'Wilson', 'Hassan', 'Taylor', 'Ali', 'Clarke', 'Islam', 'Brown', 'Chowdhury', 'Martin', 'Begum', 'Reed', 'Akter', 'Lewis', 'Hossain', 'Scott'];
        return $firstNames[($number - 1) % count($firstNames)].' '.$lastNames[intdiv($number - 1, count($firstNames)) % count($lastNames)];
    }

    private function json(array $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
