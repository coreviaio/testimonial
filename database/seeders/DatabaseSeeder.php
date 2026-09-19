<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        DB::transaction(function (): void {
            $now = now();

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

            /*
             |--------------------------------------------------------------------------
             | Passwords
             |--------------------------------------------------------------------------
             |
             | These are the exact password hashes from the SQL you shared.
             |
             */

            $adminPasswordHash = '$2y$12$PSQi8D3rarvXD8FA3r4yxOVQnAJ5BaGxNrwmTWwMMdY5HVWw9CiKK';
            $userPasswordHash = '$2y$12$PSQi8D3rarvXD8FA3r4yxOVQnAJ5BaGxNrwmTWwMMdY5HVWw9CiKK';

            /*
             |--------------------------------------------------------------------------
             | Users
             |--------------------------------------------------------------------------
             */

            $adminUserId = $this->createUser(
                'Admin',
                'admin@gmail.com',
                $adminPasswordHash,
                $now
            );

            $practitionerUserId = $this->createUser(
                'User',
                'user@gmail.com',
                $userPasswordHash,
                $now
            );

            $normalUserOneId = $this->createUser(
                'Normal User One',
                'normal1@gmail.com',
                $userPasswordHash,
                $now
            );

            $normalUserTwoId = $this->createUser(
                'Normal User Two',
                'normal2@gmail.com',
                $userPasswordHash,
                $now
            );

            $normalUserThreeId = $this->createUser(
                'Normal User Three',
                'normal3@gmail.com',
                $userPasswordHash,
                $now
            );

            /*
             |--------------------------------------------------------------------------
             | User Roles
             |--------------------------------------------------------------------------
             */

            DB::table('user_roles')->insert([
                $this->userRoleRow(
                    $adminUserId,
                    $adminRoleId,
                    $adminUserId,
                    $now
                ),

                $this->userRoleRow(
                    $practitionerUserId,
                    $userRoleId,
                    $adminUserId,
                    $now
                ),

                $this->userRoleRow(
                    $practitionerUserId,
                    $practitionerRoleId,
                    $adminUserId,
                    $now
                ),

                $this->userRoleRow(
                    $normalUserOneId,
                    $userRoleId,
                    $adminUserId,
                    $now
                ),

                $this->userRoleRow(
                    $normalUserTwoId,
                    $userRoleId,
                    $adminUserId,
                    $now
                ),

                $this->userRoleRow(
                    $normalUserThreeId,
                    $userRoleId,
                    $adminUserId,
                    $now
                ),
            ]);

            /*
             |--------------------------------------------------------------------------
             | User Profiles
             |--------------------------------------------------------------------------
             */

            DB::table('user_profiles')->insert([
                $this->profileRow(
                    $adminUserId,
                    'Admin',
                    null,
                    'BD',
                    'Dhaka',
                    $now
                ),

                $this->profileRow(
                    $practitionerUserId,
                    'User',
                    '0111112222',
                    'BD',
                    'Barishal',
                    $now
                ),

                $this->profileRow(
                    $normalUserOneId,
                    'Normal User One',
                    '01700000001',
                    'BD',
                    'Dhaka',
                    $now
                ),

                $this->profileRow(
                    $normalUserTwoId,
                    'Normal User Two',
                    null,
                    'BD',
                    'Dhaka',
                    $now
                ),

                $this->profileRow(
                    $normalUserThreeId,
                    'Normal User Three',
                    null,
                    'BD',
                    'Dhaka',
                    $now
                ),
            ]);

            /*
             |--------------------------------------------------------------------------
             | Approved Practitioner: user@gmail.com
             |--------------------------------------------------------------------------
             */

            $approvedPractitionerId = DB::table('practitioners')
                ->insertGetId([
                    'user_id' => $practitionerUserId,
                    'practitioner_type' => 'Doctor',
                    'professional_title' => 'Dr.',
                    'specialty' => 'General Medicine',
                    'professional_bio' => 'Approved practitioner account for local development and testing.',
                    'organization_name' => 'Demo Medical Centre',
                    'years_of_experience' => 5.0,
                    'license_number' => 'DEMO-LIC-1001',
                    'issuing_authority' => 'Demo Medical Council',
                    'registration_jurisdiction' => 'Bangladesh',
                    'professional_website' => null,
                    'verification_notes' => null,
                    'show_identity_publicly' => false,
                    'public_display_name' => 'Demo Practitioner',
                    'public_professional_description' => 'Approved practitioner demo profile.',
                    'verification_status' => 'approved',
                    'created_at' => $now->copy()->subDay(),
                    'updated_at' => $now,
                ]);

            /*
             |--------------------------------------------------------------------------
             | Approved Application Snapshot
             |--------------------------------------------------------------------------
             */

            $approvedSnapshot = [
                'account' => [
                    'name' => 'User',
                    'email' => 'user@gmail.com',
                ],
                'profile' => [
                    'phone' => '0111112222',
                    'country_code' => 'BD',
                    'city' => 'Barishal',
                    'profile_photo_path' => null,
                ],
                'practitioner' => [
                    'practitioner_type' => 'Doctor',
                    'professional_title' => 'Dr.',
                    'specialty' => 'General Medicine',
                    'professional_bio' => 'Approved practitioner account for local development and testing.',
                    'organization_name' => 'Demo Medical Centre',
                    'years_of_experience' => 5.0,
                    'license_number' => 'DEMO-LIC-1001',
                    'issuing_authority' => 'Demo Medical Council',
                    'registration_jurisdiction' => 'Bangladesh',
                    'professional_website' => null,
                    'verification_notes' => null,
                    'show_identity_publicly' => false,
                    'public_display_name' => 'Demo Practitioner',
                    'public_professional_description' => 'Approved practitioner demo profile.',
                ],
            ];

            /*
             |--------------------------------------------------------------------------
             | Approved Verification
             |--------------------------------------------------------------------------
             */

            $approvedVerificationId = DB::table('practitioner_verifications')
                ->insertGetId([
                    'practitioner_id' => $approvedPractitionerId,
                    'attempt_number' => 1,
                    'status' => 'approved',
                    'application_snapshot' => json_encode($approvedSnapshot),
                    'applicant_note' => null,
                    'submitted_at' => $now->copy()->subDay(),
                    'reviewed_by_user_id' => $adminUserId,
                    'reviewed_at' => $now,
                    'review_comment' => 'Approved demo practitioner application.',
                    'internal_note' => 'Seeded development record.',
                    'created_at' => $now->copy()->subDay(),
                    'updated_at' => $now,
                ]);

            /*
             |--------------------------------------------------------------------------
             | Approved Practitioner Acknowledgements
             |--------------------------------------------------------------------------
             */

            $this->seedPractitionerAcknowledgements(
                $practitionerUserId,
                $approvedVerificationId,
                $now->copy()->subDay()
            );

            /*
             |--------------------------------------------------------------------------
             | Approved Practitioner Required Documents
             |--------------------------------------------------------------------------
             */

            $this->seedPractitionerDocuments(
                $practitionerUserId,
                $approvedVerificationId,
                $now->copy()->subDay()
            );

            /*
             |--------------------------------------------------------------------------
             | Approval Audit Log
             |--------------------------------------------------------------------------
             */

            DB::table('audit_logs')->insert([
                'actor_user_id' => $adminUserId,
                'action' => 'practitioner_verification.approved',
                'subject_type' => 'App\\Models\\PractitionerVerification',
                'subject_id' => $approvedVerificationId,
                'old_values' => json_encode([
                    'verification_status' => 'pending_verification',
                    'practitioner_status' => 'pending_verification',
                ]),
                'new_values' => json_encode([
                    'verification_status' => 'approved',
                    'practitioner_status' => 'approved',
                ]),
                'metadata' => json_encode([
                    'practitioner_id' => $approvedPractitionerId,
                    'attempt_number' => 1,
                    'source' => 'database_seeder',
                ]),
                'request_id' => (string) Str::uuid(),
                'occurred_at' => $now,
                'created_at' => $now,
            ]);

            /*
             |--------------------------------------------------------------------------
             | Draft Practitioner Application: normal1@gmail.com
             |--------------------------------------------------------------------------
             |
             | This user is NOT given the practitioner role.
             |
             */

            $draftPractitionerId = DB::table('practitioners')
                ->insertGetId([
                    'user_id' => $normalUserOneId,
                    'practitioner_type' => 'Nurse',
                    'professional_title' => 'Registered Nurse',
                    'specialty' => null,
                    'professional_bio' => null,
                    'organization_name' => null,
                    'years_of_experience' => null,
                    'license_number' => null,
                    'issuing_authority' => null,
                    'registration_jurisdiction' => null,
                    'professional_website' => null,
                    'verification_notes' => 'Draft application for testing.',
                    'show_identity_publicly' => false,
                    'public_display_name' => null,
                    'public_professional_description' => null,
                    'verification_status' => 'draft',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            DB::table('practitioner_verifications')->insert([
                'practitioner_id' => $draftPractitionerId,
                'attempt_number' => 1,
                'status' => 'draft',
                'application_snapshot' => null,
                'applicant_note' => 'Draft application for testing.',
                'submitted_at' => null,
                'reviewed_by_user_id' => null,
                'reviewed_at' => null,
                'review_comment' => null,
                'internal_note' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            /*
             |--------------------------------------------------------------------------
             | Demo Patients For Approved Practitioner
             |--------------------------------------------------------------------------
             */

            DB::table('clients')->insert([
                [
                    'practitioner_id' => $approvedPractitionerId,
                    'client_reference' => 'PAT-DEMO-001',
                    'name' => 'Demo Patient One',
                    'email' => 'patient1@example.com',
                    'phone' => '01710000001',
                    'date_of_birth' => '1995-05-15',
                    'age_years' => null,
                    'age_recorded_on' => null,
                    'gender' => 'Female',
                    'country_code' => 'BD',
                    'private_notes' => 'Active demo patient for My Patients testing.',
                    'status' => 'active',
                    'created_by_user_id' => $practitionerUserId,
                    'archived_by_user_id' => null,
                    'archived_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'practitioner_id' => $approvedPractitionerId,
                    'client_reference' => 'PAT-DEMO-002',
                    'name' => 'Demo Archived Patient',
                    'email' => null,
                    'phone' => '01710000002',
                    'date_of_birth' => null,
                    'age_years' => 42,
                    'age_recorded_on' => $now->toDateString(),
                    'gender' => 'Male',
                    'country_code' => 'BD',
                    'private_notes' => 'Archived demo patient for restore testing.',
                    'status' => 'archived',
                    'created_by_user_id' => $practitionerUserId,
                    'archived_by_user_id' => $practitionerUserId,
                    'archived_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        });
    }

    private function createUser(
        string $name,
        string $email,
        string $passwordHash,
               $now
    ): int {
        return DB::table('users')->insertGetId([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => $now,
            'password' => $passwordHash,
            'remember_token' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function userRoleRow(
        int $userId,
        int $roleId,
        ?int $assignedByUserId,
        $now
    ): array {
        return [
            'user_id' => $userId,
            'role_id' => $roleId,
            'assigned_by_user_id' => $assignedByUserId,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function profileRow(
        int $userId,
        string $displayName,
        ?string $phone,
        string $countryCode,
        string $city,
        $now
    ): array {
        return [
            'user_id' => $userId,
            'display_name' => $displayName,
            'phone' => $phone,
            'country_code' => $countryCode,
            'city' => $city,
            'profile_photo_path' => null,
            'short_bio' => null,
            'is_public' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ];
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
}
