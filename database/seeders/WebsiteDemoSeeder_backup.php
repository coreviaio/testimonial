<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Put this file at database/seeders/WebsiteDemoSeeder.php.
 * Run: php artisan db:seed --class=WebsiteDemoSeeder
 * Existing DatabaseSeeder must already have created roles and an admin.
 * Local/testing databases only. Does not call migrate:fresh, truncate, or delete.
 * Increase OBSERVATIONS and rerun to add records. Existing demo rows are skipped.
 * Keep the namespace, account counts and scenario order unchanged between reruns.
 * All stories, identities, consents and review decisions below are synthetic.
 */
class WebsiteDemoSeeder_backup extends Seeder
{
    private const OBSERVATIONS = 5000;
    private const PRACTITIONERS = 50;
    private const CONTRIBUTORS = 150;
    private const PATIENTS_PER_PRACTITIONER = 10;
    private const PREFIX = 'website-demo-v1';
    private const PASSWORD = 'DemoWebsite123!';

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
            throw new RuntimeException('WebsiteDemoSeeder only runs with APP_ENV=local or testing. Use a development database.');
        }

        if (self::OBSERVATIONS < 1 || self::PRACTITIONERS < 1 || self::CONTRIBUTORS < 1 || self::PATIENTS_PER_PRACTITIONER < 1) {
            throw new RuntimeException('All demo counts must be positive integers.');
        }

        $roles = DB::table('roles')->pluck('id', 'slug')->all();
        foreach (['admin', 'user', 'practitioner'] as $role) {
            if (! isset($roles[$role])) {
                throw new RuntimeException('Missing base roles. Run your original DatabaseSeeder only on an empty database first.');
            }
        }

        $adminId = DB::table('user_roles')->where('role_id', $roles['admin'])->orderBy('user_id')->value('user_id');
        if (! $adminId) {
            throw new RuntimeException('An existing administrator account is required.');
        }

        // Resolve names from the actual cache before any writes. No invented external IDs.
        $scenarios = $this->scenarios();
        $references = $this->referenceMappings($scenarios);
        $passwordHash = Hash::make(self::PASSWORD); // Hash once, not thousands of times.
        $accountsCreatedAt = now()->startOfDay()->subYears(2);
        $practitioners = [];
        $contributors = [];

        for ($number = 1; $number <= self::PRACTITIONERS; $number++) {
            $practitioners[] = DB::transaction(function () use ($number, $roles, $adminId, $passwordHash, $accountsCreatedAt): array {
                $userId = $this->account($number, 'practitioner', $roles, (int) $adminId, $passwordHash, $accountsCreatedAt);
                $practitionerId = DB::table('practitioners')->where('user_id', $userId)->value('id');
                if (! $practitionerId) {
                    $practitionerId = DB::table('practitioners')->insertGetId([
                        'user_id' => $userId,
                        'practitioner_type' => 'Doctor',
                        'professional_title' => 'Dr.',
                        'specialty' => ['General Medicine', 'Family Medicine', 'Sports Medicine', 'Community Health'][($number - 1) % 4],
                        'professional_bio' => 'Fictional practitioner profile created for website testing.',
                        'organization_name' => 'Demo Community Clinic '.(intdiv($number - 1, 5) + 1),
                        'years_of_experience' => 3 + ($number % 20),
                        'license_number' => 'DEMO-ONLY-'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
                        'issuing_authority' => 'Synthetic testing authority',
                        'registration_jurisdiction' => 'Demo environment',
                        'show_identity_publicly' => $number % 4 !== 0,
                        'public_display_name' => 'Dr. '.$this->personName($number).' (Demo)',
                        'public_professional_description' => 'Fictional profile for testing practitioner contributions.',
                        'verification_status' => 'approved',
                        'created_at' => $accountsCreatedAt,
                        'updated_at' => $accountsCreatedAt,
                    ]);
                    $this->verification((int) $practitionerId, $userId, (int) $adminId, $accountsCreatedAt);
                }

                $patients = [];
                for ($patientNumber = 1; $patientNumber <= self::PATIENTS_PER_PRACTITIONER; $patientNumber++) {
                    $reference = sprintf('WEBDEMO-V1-%04d-%03d', $number, $patientNumber);
                    $patient = DB::table('clients')->where('client_reference', $reference)->first();
                    if ($patient && ((int) $patient->practitioner_id !== (int) $practitionerId)) {
                        throw new RuntimeException("Demo patient reference collision: {$reference}");
                    }
                    $patientId = $patient?->id;
                    if (! $patientId) {
                        $patientId = DB::table('clients')->insertGetId([
                            'practitioner_id' => $practitionerId,
                            'client_reference' => $reference,
                            'name' => $this->personName($number * 17 + $patientNumber).' (Demo patient)',
                            'email' => strtolower($reference).'@example.test',
                            'age_years' => 21 + (($number * 7 + $patientNumber * 3) % 55),
                            'age_recorded_on' => $accountsCreatedAt->toDateString(),
                            'gender' => $patientNumber % 2 === 0 ? 'Female' : 'Male',
                            'country_code' => ['BD', 'GB', 'AU', 'CA', 'US'][($number - 1) % 5],
                            'private_notes' => 'Synthetic person. No real patient information.',
                            'status' => 'active',
                            'created_by_user_id' => $userId,
                            'created_at' => $accountsCreatedAt,
                            'updated_at' => $accountsCreatedAt,
                        ]);
                        DB::table('client_consents')->insert([
                            'client_id' => $patientId,
                            'recorded_by_user_id' => $userId,
                            'action' => 'confirmed',
                            'statement_version' => '1.0',
                            'statement_text' => 'Synthetic consent receipt for a fictional patient and development-only observations.',
                            'note' => 'Generated fixture; not evidence of real consent.',
                            'occurred_at' => $accountsCreatedAt->copy()->addDay(),
                            'created_at' => $accountsCreatedAt->copy()->addDay(),
                        ]);
                    }
                    // Do not restore withdrawn consent or overwrite manual edits on rerun.
                    $consentId = DB::table('client_consents')->where('client_id', $patientId)
                        ->orderByDesc('occurred_at')->orderByDesc('id')->value('id');
                    $patients[] = ['id' => (int) $patientId, 'reference' => $reference, 'consent_id' => $consentId];
                }
                return ['user_id' => $userId, 'id' => (int) $practitionerId, 'patients' => $patients];
            });
        }

        for ($number = 1; $number <= self::CONTRIBUTORS; $number++) {
            $contributors[] = DB::transaction(fn () => $this->account(
                $number, 'contributor', $roles, (int) $adminId, $passwordHash, $accountsCreatedAt
            ));
        }

        $created = 0;
        $skipped = 0;
        DB::connection()->disableQueryLog();
        // A small transaction per observation keeps memory bounded and makes reruns resumable.
        for ($number = 1; $number <= self::OBSERVATIONS; $number++) {
            $slug = self::PREFIX.'-'.str_pad((string) $number, 7, '0', STR_PAD_LEFT);
            if (DB::table('testimonials')->where('slug', $slug)->exists()) {
                $skipped++;
                continue;
            }
            DB::transaction(function () use ($number, $slug, $scenarios, $references, $practitioners, $contributors, $adminId): void {
                $this->observation($number, $slug, $scenarios, $references, $practitioners, $contributors, (int) $adminId);
            });
            $created++;
            if ($created % 500 === 0) {
                $this->command?->info("Created {$created} observations...");
            }
        }

        $this->command?->info("Finished: {$created} new observations; {$skipped} existing observations skipped.");
        $this->command?->info('Demo logins: practitioner001@example.test or contributor001@example.test');
        $this->command?->info('Password for newly created demo accounts: '.self::PASSWORD);
        $this->command?->warn('All demo content is fictional and labelled DEMO. Do not publish it as real observations.');
    }

    private function account(int $number, string $kind, array $roles, int $adminId, string $passwordHash, $createdAt): int
    {
        $email = sprintf('%s%03d@example.test', $kind, $number);
        $existing = DB::table('users')->where('email', $email)->first();
        if ($existing) {
            $profile = DB::table('user_profiles')->where('user_id', $existing->id)->value('short_bio');
            if ($profile !== self::PREFIX) {
                throw new RuntimeException("Email {$email} already belongs to a non-demo account. No changes made to that account.");
            }
            return (int) $existing->id;
        }
        $name = $this->personName($number + ($kind === 'contributor' ? 300 : 0)).' (Demo)';
        $userId = DB::table('users')->insertGetId([
            'name' => $name, 'email' => $email, 'password' => $passwordHash,
            'email_verified_at' => $createdAt, 'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
        $places = [['BD', 'Dhaka'], ['GB', 'Bristol'], ['AU', 'Melbourne'], ['CA', 'Ottawa'], ['US', 'Seattle']];
        [$country, $city] = $places[($number - 1) % count($places)];
        DB::table('user_profiles')->insert([
            'user_id' => $userId, 'display_name' => $name, 'country_code' => $country,
            'city' => $city, 'short_bio' => self::PREFIX, 'is_public' => $number % 4 !== 0,
            'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
        $roleSlugs = $kind === 'practitioner' ? ['user', 'practitioner'] : ['user'];
        foreach ($roleSlugs as $roleSlug) {
            DB::table('user_roles')->insert([
                'user_id' => $userId, 'role_id' => $roles[$roleSlug], 'assigned_by_user_id' => $adminId,
                'created_at' => $createdAt, 'updated_at' => $createdAt,
            ]);
        }
        return (int) $userId;
    }

    private function verification(int $practitionerId, int $userId, int $adminId, $createdAt): void
    {
        $account = DB::table('users')->where('id', $userId)->first(['name', 'email']);
        $profile = DB::table('user_profiles')->where('user_id', $userId)->first();
        $practitioner = DB::table('practitioners')->where('id', $practitionerId)->first();
        DB::table('practitioner_verifications')->insert([
            'practitioner_id' => $practitionerId, 'attempt_number' => 1, 'status' => 'approved',
            'application_snapshot' => $this->json(['account' => $account, 'profile' => $profile, 'practitioner' => $practitioner]),
            'submitted_at' => $createdAt, 'reviewed_by_user_id' => $adminId, 'reviewed_at' => $createdAt,
            'review_comment' => 'Synthetic approval for website testing.',
            'internal_note' => 'Demo fixture; no real professional credentials were verified.',
            'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
    }

    private function observation(int $number, string $slug, array $scenarios, array $references, array $practitioners, array $contributors, int $adminId): void
    {
        $scenarioIndex = ($number - 1) % count($scenarios);
        $scenario = $scenarios[$scenarioIndex];
        $cycle = intdiv($number - 1, count($scenarios));
        $isPractitioner = ($number + $cycle) % 4 !== 0;
        $practitioner = $practitioners[($number * 7 + $cycle) % count($practitioners)];
        $patient = $practitioner['patients'][($number + intdiv($cycle, 3)) % count($practitioner['patients'])];
        $authorId = $isPractitioner ? $practitioner['user_id'] : $contributors[($number + $cycle) % count($contributors)];
        // About 70% published; 10% draft; 8% pending; 5% changes; 4% rejected; 3% archived.
        $bucket = ($number * 37 + $cycle * 11) % 100;
        $status = match (true) {
            $bucket < 70 => 'published', $bucket < 80 => 'draft', $bucket < 88 => 'pending_review',
            $bucket < 93 => 'changes_requested', $bucket < 97 => 'rejected', default => 'archived',
        };
        $isPublic = $status === 'published';
        $weeks = [2, 4, 6, 8, 12][$cycle % 5];
        $followUp = now()->startOfDay()->subDays(3 + (($number * 17 + $cycle * 3) % 540));
        $createdAt = $followUp->copy()->subWeeks($weeks);
        $submittedAt = $followUp->copy()->addDay();
        $reviewedAt = $submittedAt->copy()->addDay();
        $method = $scenario['topic'] === 'Dermatological Diseases'
            ? 'Topical applications'
            : ($scenario['topic'] === 'Exercise' && $cycle % 2 === 0 ? 'Inhalation' : 'Oral Hydrogen Water');
        $outcome = [
            'The diary described a small improvement on some days, with no consistent pattern across the whole period.',
            'The diary showed no noticeable change from the starting pattern.',
            'Some entries described improvement, while others described the same symptoms as before.',
            'The participant reported more discomfort during the final week and stopped the recorded routine.',
            'Several follow-up entries were missing, so the account was incomplete.',
        ][$cycle % 5];
        $context = [
            'Work hours and bedtime also changed during the observation period.',
            'Usual care continued, and activity levels varied between weeks.',
            'Meal timing and fluid intake were not kept constant.',
            'A busy travel week interrupted the diary and follow-up schedule.',
            'The participant used a simple daily diary without objective measurements.',
        ][intdiv($cycle, 5) % 5];
        $subject = $isPractitioner ? 'A fictional adult participant' : 'In this fictional first-person account, an adult contributor';
        $snapshot = [
            'title' => sprintf('DEMO: %s over %d weeks — case %05d', $scenario['title'], $weeks, $number),
            'observation' => "SYNTHETIC WEBSITE TEST DATA — this is not a real clinical account.\n\n{$subject} recorded {$scenario['symptom']} over {$weeks} weeks. The recorded administration category was {$method}; this fixture provides no dosing or treatment instructions.\n\n{$outcome}\n\n{$context} These self-reported entries cannot establish the cause of any change. This fictional record exists to test searching, filtering, review workflows, and page layouts.",
            'condition_symptom_text' => $scenario['symptom'],
            'duration_text' => "{$weeks} weeks",
            'frequency_text' => ['Daily diary; weekly follow-up', 'Diary three times weekly', 'Weekly follow-up notes'][$cycle % 3],
            'timeline_text' => "Week 1: baseline diary recorded. Middle weeks: entries collected alongside usual routines. Week {$weeks}: follow-up summary recorded. {$outcome}",
            'practitioner_note' => $isPractitioner ? 'Synthetic de-identified example. Confounding factors and incomplete entries are retained for review.' : null,
            'submission_type' => $isPractitioner ? 'practitioner' : 'contributor',
            'practitioner_id' => $isPractitioner ? $practitioner['id'] : null,
            'client_id' => $isPractitioner ? $patient['id'] : null,
            'client_reference' => $isPractitioner ? $patient['reference'] : null,
        ];
        $row = $snapshot;
        unset($row['client_reference']);
        $testimonialId = DB::table('testimonials')->insertGetId([
            ...$row, 'author_user_id' => $authorId, 'slug' => $slug, 'status' => $status,
            'submitted_at' => $status === 'draft' ? null : $submittedAt,
            'published_at' => $isPublic ? $reviewedAt : null,
            'published_by_user_id' => $isPublic ? $adminId : null,
            'flagged_for_admin' => false,
            'public_display_note' => 'Fictional demonstration data. Not a real patient experience or medical evidence.',
            'internal_tags' => $this->json([self::PREFIX, 'synthetic', $scenario['topic']]),
            'archived_by_user_id' => $status === 'archived' ? $authorId : null,
            'archived_at' => $status === 'archived' ? $reviewedAt : null,
            'created_at' => $createdAt, 'updated_at' => $status === 'draft' ? $createdAt : $reviewedAt,
        ]);

        if ($status !== 'draft') {
            $versionId = DB::table('testimonial_versions')->insertGetId([
                'testimonial_id' => $testimonialId, 'version_number' => 1,
                'submitted_snapshot' => $this->json($snapshot),
                'approved_snapshot' => $isPublic ? $this->json($snapshot) : null,
                'submitted_by_user_id' => $authorId, 'submitted_at' => $submittedAt,
                'client_consent_id' => $isPractitioner ? $patient['consent_id'] : null,
                'approved_by_user_id' => $isPublic ? $adminId : null,
                'approved_at' => $isPublic ? $reviewedAt : null,
                'created_at' => $submittedAt, 'updated_at' => $isPublic ? $reviewedAt : $submittedAt,
            ]);
            DB::table('testimonials')->where('id', $testimonialId)->update(['latest_version_id' => $versionId]);
            foreach (self::ACKNOWLEDGEMENTS as $code => $text) {
                DB::table('testimonial_consents')->insert([
                    'version_id' => $versionId, 'accepted_by_user_id' => $authorId,
                    'statement_code' => $code, 'statement_version' => '1.0',
                    'statement_text' => $text, 'accepted_at' => $submittedAt, 'created_at' => $submittedAt,
                ]);
            }
            $this->review((int) $testimonialId, (int) $versionId, $authorId, 'submitted', 'draft', 'pending_review', 'Synthetic submission.', $submittedAt);
            if ($status !== 'pending_review') {
                $action = $isPublic ? 'approved' : $status;
                $comment = match ($status) {
                    'changes_requested' => 'Please clarify diary gaps and distinguish the reported experience from causal claims.',
                    'rejected' => 'Synthetic review decision: the account does not include enough follow-up detail.',
                    'archived' => 'Synthetic record archived for testing the restore workflow.',
                    default => 'Synthetic record approved for local demonstration only.',
                };
                $this->review((int) $testimonialId, (int) $versionId, $status === 'archived' ? $authorId : $adminId, $action, 'pending_review', $status, $comment, $reviewedAt);
            }
        }

        // Map the curated scenario only to matching reference labels.
        $mappings = $references[$scenarioIndex];
        $mappings[] = ['testimonial_administration_methods', 'administration_method_id', $references['methods'][$method]];
        foreach ($mappings as [$table, $column, $externalId]) {
            DB::table($table)->insert([
                'testimonial_id' => $testimonialId, $column => $externalId,
                'created_by_user_id' => $adminId, 'created_at' => $reviewedAt, 'updated_at' => $reviewedAt,
            ]);
        }
    }

    private function review(int $testimonialId, int $versionId, int $actorId, string $action, string $from, string $to, string $comment, $at): void
    {
        $passed = $action === 'approved' ? 'passed' : null;
        DB::table('testimonial_reviews')->insert([
            'testimonial_id' => $testimonialId, 'version_id' => $versionId, 'actor_user_id' => $actorId,
            'action' => $action, 'from_status' => $from, 'to_status' => $to,
            'review_comment' => $comment, 'internal_note' => 'Synthetic review fixture.',
            'condition_check' => $passed, 'observation_language_check' => $passed,
            'deidentification_check' => $passed, 'consent_check' => $passed, 'publication_check' => $passed,
            'acted_at' => $at, 'created_at' => $at,
        ]);
    }

    private function referenceMappings(array $scenarios): array
    {
        try {
            if (! Schema::connection('h2research_cache')->hasTable('h2_reference_items')) {
                throw new RuntimeException('Reference cache table is missing.');
            }
            $items = DB::connection('h2research_cache')->table('h2_reference_items')->get(['source', 'external_id', 'name']);
        } catch (\Throwable $exception) {
            throw new RuntimeException('Your existing reference cache is required. Complete the reference-data sync in the admin area, then rerun this seeder.', 0, $exception);
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
