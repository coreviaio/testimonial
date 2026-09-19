# H2Stories Simple Users, Roles, and Permissions CRUD

Updated for Laravel 13, Inertia React 3, React 19, TypeScript, Tailwind CSS 4, and the default Laravel React dashboard.

## 1. Fixed project rules

- Do not change the default Laravel `users` table.
- Do not create an `add_fields_to_users_table` migration.
- Do not change `app/Models/User.php`.
- Do not recreate any existing role or permission table.
- Do not recreate the existing `Role` or `Permission` model.
- Do not create models for pivot tables.
- Do not install a role/permission package.
- Use the existing prefix-free table names exactly as created earlier.
- Keep RBAC simple with only three management permissions.
- Follow the default Laravel dashboard layout, colors, components, spacing, and dark mode.

## 2. Backend and frontend folder rule

All project instructions will use two main groups:

```text
backend/
├── app/
├── bootstrap/
├── database/
└── routes/

frontend/
├── components/
├── pages/
└── types/
```

Destination rule:

| README path | Real Laravel project location |
| --- | --- |
| `backend/app/...` | `<laravel-project>/app/...` |
| `backend/bootstrap/...` | `<laravel-project>/bootstrap/...` |
| `backend/database/...` | `<laravel-project>/database/...` |
| `backend/routes/...` | `<laravel-project>/routes/...` |
| `frontend/components/...` | `<laravel-project>/resources/js/components/...` |
| `frontend/pages/...` | `<laravel-project>/resources/js/pages/...` |
| `frontend/types/...` | `<laravel-project>/resources/js/types/...` |

This is still one Laravel Inertia application. Do not create another React application or another `package.json` inside `frontend`.

## 3. Existing database and model checklist

The following already exists and must not be generated again:

- Default Laravel `users` table and `App\Models\User`.
- `roles` table and `App\Models\Role`.
- `permissions` table and `App\Models\Permission`.
- `user_roles` pivot table.
- `role_permissions` pivot table.

No table or model code is included in this README because no change is required.

The controller code expects these existing columns:

| Table | Required columns |
| --- | --- |
| `users` | Default Laravel columns: `id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, timestamps |
| `roles` | `id`, `name`, `slug`, `description`, timestamps |
| `permissions` | `id`, `name`, `slug`, `description`, timestamps |
| `user_roles` | `id`, `user_id`, `role_id`, nullable `assigned_by_user_id`, timestamps |
| `role_permissions` | `id`, `role_id`, `permission_id`, timestamps |

## 4. Only run these generation commands

Run from the Laravel project root:

```bash
php artisan make:controller Admin/UserController --resource
php artisan make:controller Admin/RoleController --resource
php artisan make:controller Admin/PermissionController --resource
php artisan make:middleware EnsurePermission
php artisan make:seeder RbacSeeder

mkdir -p app/Support
mkdir -p resources/js/components/admin
mkdir -p resources/js/pages/admin/users
mkdir -p resources/js/pages/admin/roles
mkdir -p resources/js/pages/admin/permissions
```

Do not run any `make:model` or `make:migration` command for this update.

# Backend

## 5. Simple RBAC helper

### File: `backend/app/Support/Rbac.php`

Real destination: `app/Support/Rbac.php`

```php
<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class Rbac
{
    public static function isAdmin(int $userId): bool
    {
        return DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $userId)
            ->where('roles.slug', 'admin')
            ->exists();
    }

    public static function hasPermission(int $userId, string $permission): bool
    {
        if (self::isAdmin($userId)) {
            return true;
        }

        return DB::table('user_roles')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'user_roles.role_id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('user_roles.user_id', $userId)
            ->where('permissions.slug', $permission)
            ->exists();
    }

    /**
     * @return array<int, string>
     */
    public static function permissions(int $userId): array
    {
        if (self::isAdmin($userId)) {
            return DB::table('permissions')
                ->orderBy('slug')
                ->pluck('slug')
                ->all();
        }

        return DB::table('user_roles')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'user_roles.role_id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('user_roles.user_id', $userId)
            ->distinct()
            ->orderBy('permissions.slug')
            ->pluck('permissions.slug')
            ->all();
    }
}
```

This helper keeps all role and permission queries outside the default `User` model.

## 6. Permission middleware

### File: `backend/app/Http/Middleware/EnsurePermission.php`

Real destination: `app/Http/Middleware/EnsurePermission.php`

```php
<?php

namespace App\Http\Middleware;

use App\Support\Rbac;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        abort_unless(
            $user !== null && Rbac::hasPermission($user->id, $permission),
            403
        );

        return $next($request);
    }
}
```

## 7. Register middleware alias

### File: `backend/bootstrap/app.php`

Real destination: `bootstrap/app.php`

Add the import:

```php
use App\Http\Middleware\EnsurePermission;
```

Inside the existing `withMiddleware` callback, add the alias:

```php
->withMiddleware(function (Middleware $middleware): void {
    // Keep every existing middleware configuration here.

    $middleware->alias([
        'permission' => EnsurePermission::class,
    ]);
})
```

Do not add a second `withMiddleware` callback. Merge the alias into the callback already present in the starter kit.

## 8. User controller

### File: `backend/app/Http/Controllers/Admin/UserController.php`

Real destination: `app/Http/Controllers/Admin/UserController.php`

This controller uses only the default Laravel user fields: `name`, `email`, and `password`.

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $users = User::query()
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roleMap = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->whereIn('user_roles.user_id', $users->getCollection()->pluck('id'))
            ->orderBy('roles.name')
            ->get([
                'user_roles.user_id',
                'roles.id',
                'roles.name',
                'roles.slug',
            ])
            ->groupBy('user_id');

        $users->getCollection()->transform(function (User $user) use ($roleMap): array {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'roles' => $roleMap->get($user->id, collect())->values(),
            ];
        });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $validated['search'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/form', [
            'user' => null,
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'distinct', Rule::exists('roles', 'id')],
        ]);

        DB::transaction(function () use ($request, $validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $this->syncRoles(
                $user->id,
                $validated['role_ids'],
                $request->user()->id
            );
        });

        return to_route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_ids' => DB::table('user_roles')
                    ->where('user_id', $user->id)
                    ->pluck('role_id')
                    ->all(),
            ],
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'distinct', Rule::exists('roles', 'id')],
        ]);

        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $removingLastAdmin = Rbac::isAdmin($user->id)
            && ! in_array((int) $adminRoleId, array_map('intval', $validated['role_ids']), true)
            && $this->adminCount() <= 1;

        if ($removingLastAdmin) {
            return back()->with('error', 'The last administrator cannot lose the admin role.');
        }

        DB::transaction(function () use ($request, $user, $validated): void {
            $data = [
                'name' => $validated['name'],
                'email' => $validated['email'],
            ];

            if (filled($validated['password'] ?? null)) {
                $data['password'] = Hash::make($validated['password']);
            }

            $user->update($data);

            $this->syncRoles(
                $user->id,
                $validated['role_ids'],
                $request->user()->id
            );
        });

        return to_route('admin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if (Rbac::isAdmin($user->id) && $this->adminCount() <= 1) {
            return back()->with('error', 'The last administrator cannot be deleted.');
        }

        try {
            DB::transaction(function () use ($user): void {
                DB::table('user_roles')->where('user_id', $user->id)->delete();
                $user->delete();
            });
        } catch (QueryException) {
            return back()->with(
                'error',
                'This user is connected to other records and cannot be deleted.'
            );
        }

        return to_route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * @param array<int, int|string> $roleIds
     */
    private function syncRoles(int $userId, array $roleIds, int $assignedBy): void
    {
        DB::table('user_roles')->where('user_id', $userId)->delete();

        $now = now();
        $rows = collect($roleIds)->map(fn ($roleId): array => [
            'user_id' => $userId,
            'role_id' => (int) $roleId,
            'assigned_by_user_id' => $assignedBy,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('user_roles')->insert($rows);
    }

    private function adminCount(): int
    {
        return DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('roles.slug', 'admin')
            ->distinct()
            ->count('user_roles.user_id');
    }
}
```

## 9. Role controller

### File: `backend/app/Http/Controllers/Admin/RoleController.php`

Real destination: `app/Http/Controllers/Admin/RoleController.php`

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $roles = Role::query()
            ->select('roles.*')
            ->selectSub(
                DB::table('user_roles')
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('user_roles.role_id', 'roles.id'),
                'users_count'
            )
            ->selectSub(
                DB::table('role_permissions')
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('role_permissions.role_id', 'roles.id'),
                'permissions_count'
            )
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $validated['search'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/roles/form', [
            'role' => null,
            'permissions' => Permission::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRole($request);

        DB::transaction(function () use ($validated): void {
            $role = Role::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
            ]);

            $this->syncPermissions($role->id, $validated['permission_ids']);
        });

        return to_route('admin.roles.index')->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('admin/roles/form', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'permission_ids' => DB::table('role_permissions')
                    ->where('role_id', $role->id)
                    ->pluck('permission_id')
                    ->all(),
            ],
            'permissions' => Permission::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $this->validateRole($request, $role);

        if ($role->slug === 'admin') {
            $validated['slug'] = 'admin';
        }

        DB::transaction(function () use ($role, $validated): void {
            $role->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
            ]);

            $this->syncPermissions($role->id, $validated['permission_ids']);
        });

        return to_route('admin.roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->slug === 'admin') {
            return back()->with('error', 'The administrator role cannot be deleted.');
        }

        if (DB::table('user_roles')->where('role_id', $role->id)->exists()) {
            return back()->with('error', 'Remove users from this role before deleting it.');
        }

        DB::transaction(function () use ($role): void {
            DB::table('role_permissions')->where('role_id', $role->id)->delete();
            $role->delete();
        });

        return to_route('admin.roles.index')->with('success', 'Role deleted successfully.');
    }

    private function validateRole(Request $request, ?Role $role = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'required',
                'string',
                'max:50',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('roles', 'slug')->ignore($role?->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['present', 'array'],
            'permission_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('permissions', 'id'),
            ],
        ]);
    }

    /**
     * @param array<int, int|string> $permissionIds
     */
    private function syncPermissions(int $roleId, array $permissionIds): void
    {
        DB::table('role_permissions')->where('role_id', $roleId)->delete();

        if ($permissionIds === []) {
            return;
        }

        $now = now();
        $rows = collect($permissionIds)->map(fn ($permissionId): array => [
            'role_id' => $roleId,
            'permission_id' => (int) $permissionId,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('role_permissions')->insert($rows);
    }
}
```

## 10. Permission controller

### File: `backend/app/Http/Controllers/Admin/PermissionController.php`

Real destination: `app/Http/Controllers/Admin/PermissionController.php`

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    private const PROTECTED_PERMISSIONS = [
        'users.manage',
        'roles.manage',
        'permissions.manage',
    ];

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $permissions = Permission::query()
            ->select('permissions.*')
            ->selectSub(
                DB::table('role_permissions')
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('role_permissions.permission_id', 'permissions.id'),
                'roles_count'
            )
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/permissions/index', [
            'permissions' => $permissions,
            'protectedPermissions' => self::PROTECTED_PERMISSIONS,
            'filters' => [
                'search' => $validated['search'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/permissions/form', [
            'permission' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Permission::create($this->validatePermission($request));

        return to_route('admin.permissions.index')
            ->with('success', 'Permission created successfully.');
    }

    public function edit(Permission $permission): Response
    {
        return Inertia::render('admin/permissions/form', [
            'permission' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug,
                'description' => $permission->description,
                'protected' => in_array(
                    $permission->slug,
                    self::PROTECTED_PERMISSIONS,
                    true
                ),
            ],
        ]);
    }

    public function update(Request $request, Permission $permission): RedirectResponse
    {
        $validated = $this->validatePermission($request, $permission);

        if (in_array($permission->slug, self::PROTECTED_PERMISSIONS, true)) {
            $validated['slug'] = $permission->slug;
        }

        $permission->update($validated);

        return to_route('admin.permissions.index')
            ->with('success', 'Permission updated successfully.');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        if (in_array($permission->slug, self::PROTECTED_PERMISSIONS, true)) {
            return back()->with('error', 'This permission is required by the admin panel.');
        }

        if (DB::table('role_permissions')->where('permission_id', $permission->id)->exists()) {
            return back()->with('error', 'Remove this permission from all roles before deleting it.');
        }

        $permission->delete();

        return to_route('admin.permissions.index')
            ->with('success', 'Permission deleted successfully.');
    }

    private function validatePermission(
        Request $request,
        ?Permission $permission = null
    ): array {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9._-]+$/',
                Rule::unique('permissions', 'slug')->ignore($permission?->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
```

## 11. Routes

### File: `backend/routes/web.php`

Real destination: `routes/web.php`

Keep all existing starter-kit routes. Add these imports:

```php
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
```

Add this route group:

```php
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
    });
```

This creates 18 routes: six routes for each CRUD resource.

## 12. Seeder

### File: `backend/database/seeders/RbacSeeder.php`

Real destination: `database/seeders/RbacSeeder.php`

Only two starter roles and three permissions are seeded. Additional roles and permissions can be created from the admin pages.

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('roles')->updateOrInsert(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full administrative access.',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('roles')->updateOrInsert(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Standard registered user.',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

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
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [
                    'name' => $permission['name'],
                    'description' => $permission['description'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', [
                'users.manage',
                'roles.manage',
                'permissions.manage',
            ])
            ->pluck('id');

        DB::table('role_permissions')->where('role_id', $adminRoleId)->delete();

        $rows = $permissionIds->map(fn ($permissionId): array => [
            'role_id' => $adminRoleId,
            'permission_id' => $permissionId,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('role_permissions')->insert($rows);
    }
}
```

### File: `backend/database/seeders/DatabaseSeeder.php`

Real destination: `database/seeders/DatabaseSeeder.php`

Add `RbacSeeder::class` to the existing seeder list. Keep any other project seeders.

```php
$this->call([
    RbacSeeder::class,
]);
```

## 13. Share permissions and flash messages with Inertia

### File: `backend/app/Http/Middleware/HandleInertiaRequests.php`

Real destination: `app/Http/Middleware/HandleInertiaRequests.php`

Add this import:

```php
use App\Support\Rbac;
```

Replace only the existing `share` method with this method. Keep the rest of the middleware file.

```php
public function share(Request $request): array
{
    $user = $request->user();

    return [
        ...parent::share($request),
        'auth' => [
            'user' => $user,
            'permissions' => fn (): array => $user
                ? Rbac::permissions($user->id)
                : [],
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
        ],
    ];
}
```

## 14. Grant the first administrator role

First run the seeder. Then assign the existing `admin` role to one existing Laravel user.

```bash
php artisan db:seed --class=RbacSeeder
php artisan tinker
```

Run this inside Tinker and replace the email:

```php
$user = App\Models\User::where('email', 'admin@example.com')->firstOrFail();
$adminRoleId = App\Models\Role::where('slug', 'admin')->value('id');

DB::table('user_roles')->updateOrInsert(
    ['user_id' => $user->id, 'role_id' => $adminRoleId],
    [
        'assigned_by_user_id' => $user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]
);
```

Exit Tinker:

```php
exit
```

# Frontend

## 15. Shared frontend types

### File: `frontend/types/rbac.ts`

Real destination: `resources/js/types/rbac.ts`

```ts
export type RoleOption = {
    id: number;
    name: string;
    slug: string;
};

export type PermissionOption = {
    id: number;
    name: string;
    slug: string;
};

export type UserRecord = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: RoleOption[];
    role_ids?: number[];
};

export type RoleRecord = RoleOption & {
    description: string | null;
    users_count?: number;
    permissions_count?: number;
    permission_ids?: number[];
};

export type PermissionRecord = PermissionOption & {
    description: string | null;
    roles_count?: number;
    protected?: boolean;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export type RbacPageProps = {
    [key: string]: unknown;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
        permissions: string[];
    };
    flash: {
        success?: string;
        error?: string;
    };
};
```

## 16. Shared frontend components

### File: `frontend/components/admin/field-error.tsx`

Real destination: `resources/js/components/admin/field-error.tsx`

```tsx
type Props = {
    message?: string;
};

export default function FieldError({ message }: Props) {
    return message ? <p className="text-sm text-destructive">{message}</p> : null;
}
```

### File: `frontend/components/admin/flash-messages.tsx`

Real destination: `resources/js/components/admin/flash-messages.tsx`

```tsx
import { usePage } from '@inertiajs/react';
import type { RbacPageProps } from '@/types/rbac';

export default function FlashMessages() {
    const { flash } = usePage<RbacPageProps>().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div className="space-y-2">
            {flash.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                    {flash.success}
                </div>
            )}

            {flash.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {flash.error}
                </div>
            )}
        </div>
    );
}
```

### File: `frontend/components/admin/pagination.tsx`

Real destination: `resources/js/components/admin/pagination.tsx`

```tsx
import { Link } from '@inertiajs/react';
import type { Paginated } from '@/types/rbac';

type Props = Pick<Paginated<unknown>, 'links' | 'from' | 'to' | 'total'>;

function cleanLabel(label: string): string {
    return label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next');
}

export default function Pagination({ links, from, to, total }: Props) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from ?? 0}–{to ?? 0} of {total}
            </p>

            <div className="flex flex-wrap gap-1">
                {links.map((link, index) => {
                    const classes = [
                        'rounded-md border px-3 py-1.5 text-sm',
                        link.active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted',
                        link.url ? '' : 'pointer-events-none opacity-50',
                    ].join(' ');

                    return link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={classes}
                        >
                            {cleanLabel(link.label)}
                        </Link>
                    ) : (
                        <span key={`${link.label}-${index}`} className={classes}>
                            {cleanLabel(link.label)}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
```

## 17. Users list page

### File: `frontend/pages/admin/users/index.tsx`

Real destination: `resources/js/pages/admin/users/index.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Paginated, UserRecord } from '@/types/rbac';

type Props = {
    users: Paginated<UserRecord>;
    filters: {
        search: string;
    };
};

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    function filter(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/users', { search }, { preserveState: true, replace: true });
    }

    function remove(user: UserRecord) {
        if (!window.confirm(`Delete ${user.name}?`)) {
            return;
        }

        router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: '/admin/users' }]}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage Laravel users and their roles.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/users/create">
                            <Plus className="size-4" />
                            Add user
                        </Link>
                    </Button>
                </div>

                <FlashMessages />

                <form onSubmit={filter} className="flex gap-2 rounded-xl border bg-card p-4 shadow-sm">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or email"
                        className="max-w-md"
                    />
                    <Button type="submit">Search</Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setSearch('');
                            router.get('/admin/users', {}, { replace: true });
                        }}
                    >
                        Clear
                    </Button>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Roles</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{user.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <span
                                                        key={role.id}
                                                        className="rounded-md bg-muted px-2 py-1 text-xs"
                                                    >
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/users/${user.id}/edit`}>
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => remove(user)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={users.links}
                        from={users.from}
                        to={users.to}
                        total={users.total}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
```

## 18. User create/edit page

### File: `frontend/pages/admin/users/form.tsx`

Real destination: `resources/js/pages/admin/users/form.tsx`

```tsx
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import FieldError from '@/components/admin/field-error';
import FlashMessages from '@/components/admin/flash-messages';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoleOption } from '@/types/rbac';

type UserFormRecord = {
    id: number;
    name: string;
    email: string;
    role_ids: number[];
};

type Props = {
    user: UserFormRecord | null;
    roles: RoleOption[];
};

export default function UserForm({ user, roles }: Props) {
    const editing = user !== null;
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        role_ids: user?.role_ids ?? ([] as number[]),
    });

    function toggleRole(roleId: number, checked: boolean) {
        form.setData(
            'role_ids',
            checked
                ? [...form.data.role_ids, roleId]
                : form.data.role_ids.filter((id) => id !== roleId),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (editing) {
            form.put(`/admin/users/${user.id}`);
            return;
        }

        form.post('/admin/users');
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Users', href: '/admin/users' },
                {
                    title: editing ? 'Edit user' : 'Add user',
                    href: editing ? `/admin/users/${user.id}/edit` : '/admin/users/create',
                },
            ]}
        >
            <Head title={editing ? 'Edit user' : 'Add user'} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {editing ? 'Edit user' : 'Add user'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Use the default Laravel user fields and assign at least one role.
                    </p>
                </div>

                <FlashMessages />

                <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            autoComplete="name"
                        />
                        <FieldError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                            autoComplete="email"
                        />
                        <FieldError message={form.errors.email} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password {editing ? '(optional)' : ''}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                autoComplete="new-password"
                            />
                            <FieldError message={form.errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData('password_confirmation', event.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium">Roles</legend>
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            {roles.map((role) => (
                                <label key={role.id} className="flex items-start gap-3">
                                    <Checkbox
                                        checked={form.data.role_ids.includes(role.id)}
                                        onCheckedChange={(value) =>
                                            toggleRole(role.id, value === true)
                                        }
                                    />
                                    <span>
                                        <span className="block text-sm font-medium">{role.name}</span>
                                        <span className="block font-mono text-xs text-muted-foreground">
                                            {role.slug}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <FieldError message={form.errors.role_ids} />
                    </fieldset>

                    <div className="flex justify-end gap-2 border-t pt-5">
                        <Button asChild variant="outline">
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : editing ? 'Update user' : 'Create user'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
```

## 19. Roles list page

### File: `frontend/pages/admin/roles/index.tsx`

Real destination: `resources/js/pages/admin/roles/index.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Paginated, RoleRecord } from '@/types/rbac';

type Props = {
    roles: Paginated<RoleRecord>;
    filters: {
        search: string;
    };
};

export default function RolesIndex({ roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    function filter(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/roles', { search }, { preserveState: true, replace: true });
    }

    function remove(role: RoleRecord) {
        if (!window.confirm(`Delete role “${role.name}”?`)) {
            return;
        }

        router.delete(`/admin/roles/${role.id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Roles', href: '/admin/roles' }]}>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
                        <p className="text-sm text-muted-foreground">
                            Create roles and select their permissions.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/roles/create">
                            <Plus className="size-4" />
                            Add role
                        </Link>
                    </Button>
                </div>

                <FlashMessages />

                <form onSubmit={filter} className="flex gap-2 rounded-xl border bg-card p-4 shadow-sm">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or slug"
                        className="max-w-md"
                    />
                    <Button type="submit">Search</Button>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Users</th>
                                    <th className="px-4 py-3 font-medium">Permissions</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {roles.data.map((role) => (
                                    <tr key={role.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{role.name}</div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {role.slug}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{role.users_count ?? 0}</td>
                                        <td className="px-4 py-3">{role.permissions_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/roles/${role.id}/edit`}>
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                {role.slug !== 'admin' && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => remove(role)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {roles.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={roles.links}
                        from={roles.from}
                        to={roles.to}
                        total={roles.total}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
```

## 20. Role create/edit page

### File: `frontend/pages/admin/roles/form.tsx`

Real destination: `resources/js/pages/admin/roles/form.tsx`

```tsx
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import FieldError from '@/components/admin/field-error';
import FlashMessages from '@/components/admin/flash-messages';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PermissionOption } from '@/types/rbac';

type RoleFormRecord = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    permission_ids: number[];
};

type Props = {
    role: RoleFormRecord | null;
    permissions: PermissionOption[];
};

export default function RoleForm({ role, permissions }: Props) {
    const editing = role !== null;
    const form = useForm({
        name: role?.name ?? '',
        slug: role?.slug ?? '',
        description: role?.description ?? '',
        permission_ids: role?.permission_ids ?? ([] as number[]),
    });

    function togglePermission(permissionId: number, checked: boolean) {
        form.setData(
            'permission_ids',
            checked
                ? [...form.data.permission_ids, permissionId]
                : form.data.permission_ids.filter((id) => id !== permissionId),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (editing) {
            form.put(`/admin/roles/${role.id}`);
            return;
        }

        form.post('/admin/roles');
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Roles', href: '/admin/roles' },
                {
                    title: editing ? 'Edit role' : 'Add role',
                    href: editing ? `/admin/roles/${role.id}/edit` : '/admin/roles/create',
                },
            ]}
        >
            <Head title={editing ? 'Edit role' : 'Add role'} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {editing ? 'Edit role' : 'Add role'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create a role and choose what it can manage.
                    </p>
                </div>

                <FlashMessages />

                <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        <FieldError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={form.data.slug}
                            onChange={(event) => form.setData('slug', event.target.value)}
                            placeholder="moderator"
                            disabled={role?.slug === 'admin'}
                            className="font-mono"
                        />
                        <FieldError message={form.errors.slug} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            rows={3}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <FieldError message={form.errors.description} />
                    </div>

                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium">Permissions</legend>
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            {permissions.map((permission) => (
                                <label key={permission.id} className="flex items-start gap-3">
                                    <Checkbox
                                        checked={form.data.permission_ids.includes(permission.id)}
                                        onCheckedChange={(value) =>
                                            togglePermission(permission.id, value === true)
                                        }
                                    />
                                    <span>
                                        <span className="block text-sm font-medium">
                                            {permission.name}
                                        </span>
                                        <span className="block font-mono text-xs text-muted-foreground">
                                            {permission.slug}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <FieldError message={form.errors.permission_ids} />
                    </fieldset>

                    <div className="flex justify-end gap-2 border-t pt-5">
                        <Button asChild variant="outline">
                            <Link href="/admin/roles">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : editing ? 'Update role' : 'Create role'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
```

## 21. Permissions list page

### File: `frontend/pages/admin/permissions/index.tsx`

Real destination: `resources/js/pages/admin/permissions/index.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/admin/flash-messages';
import Pagination from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Paginated, PermissionRecord } from '@/types/rbac';

type Props = {
    permissions: Paginated<PermissionRecord>;
    protectedPermissions: string[];
    filters: {
        search: string;
    };
};

export default function PermissionsIndex({
    permissions,
    protectedPermissions,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);

    function filter(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/permissions', { search }, { preserveState: true, replace: true });
    }

    function remove(permission: PermissionRecord) {
        if (!window.confirm(`Delete permission “${permission.name}”?`)) {
            return;
        }

        router.delete(`/admin/permissions/${permission.id}`, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Permissions', href: '/admin/permissions' }]}>
            <Head title="Permissions" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
                        <p className="text-sm text-muted-foreground">
                            Keep permissions small and action-based.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/permissions/create">
                            <Plus className="size-4" />
                            Add permission
                        </Link>
                    </Button>
                </div>

                <FlashMessages />

                <form onSubmit={filter} className="flex gap-2 rounded-xl border bg-card p-4 shadow-sm">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or slug"
                        className="max-w-md"
                    />
                    <Button type="submit">Search</Button>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Permission</th>
                                    <th className="px-4 py-3 font-medium">Roles</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {permissions.data.map((permission) => {
                                    const protectedPermission = protectedPermissions.includes(
                                        permission.slug,
                                    );

                                    return (
                                        <tr key={permission.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{permission.name}</span>
                                                    {protectedPermission && (
                                                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-mono text-xs text-muted-foreground">
                                                    {permission.slug}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{permission.roles_count ?? 0}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={`/admin/permissions/${permission.id}/edit`}>
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    {!protectedPermission && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => remove(permission)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {permissions.data.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                            No permissions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={permissions.links}
                        from={permissions.from}
                        to={permissions.to}
                        total={permissions.total}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
```

## 22. Permission create/edit page

### File: `frontend/pages/admin/permissions/form.tsx`

Real destination: `resources/js/pages/admin/permissions/form.tsx`

```tsx
import type { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import FieldError from '@/components/admin/field-error';
import FlashMessages from '@/components/admin/flash-messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PermissionFormRecord = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    protected: boolean;
};

type Props = {
    permission: PermissionFormRecord | null;
};

export default function PermissionForm({ permission }: Props) {
    const editing = permission !== null;
    const form = useForm({
        name: permission?.name ?? '',
        slug: permission?.slug ?? '',
        description: permission?.description ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (editing) {
            form.put(`/admin/permissions/${permission.id}`);
            return;
        }

        form.post('/admin/permissions');
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Permissions', href: '/admin/permissions' },
                {
                    title: editing ? 'Edit permission' : 'Add permission',
                    href: editing
                        ? `/admin/permissions/${permission.id}/edit`
                        : '/admin/permissions/create',
                },
            ]}
        >
            <Head title={editing ? 'Edit permission' : 'Add permission'} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {editing ? 'Edit permission' : 'Add permission'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Use a short resource.action slug.
                    </p>
                </div>

                <FlashMessages />

                <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        <FieldError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={form.data.slug}
                            onChange={(event) => form.setData('slug', event.target.value)}
                            placeholder="stories.manage"
                            disabled={permission?.protected === true}
                            className="font-mono"
                        />
                        <FieldError message={form.errors.slug} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            rows={3}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <FieldError message={form.errors.description} />
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-5">
                        <Button asChild variant="outline">
                            <Link href="/admin/permissions">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving…'
                                : editing
                                  ? 'Update permission'
                                  : 'Create permission'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
```

## 23. Dashboard sidebar

### File: `frontend/components/app-sidebar.tsx`

Real destination: `resources/js/components/app-sidebar.tsx`

Do not replace the whole starter-kit sidebar. Add these imports:

```tsx
import { usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck, Users } from 'lucide-react';
import type { NavItem } from '@/types';
import type { RbacPageProps } from '@/types/rbac';
```

Inside `AppSidebar`, add:

```tsx
const { auth } = usePage<RbacPageProps>().props;
const permissions = new Set(auth.permissions ?? []);

const rbacNavItems = [
    permissions.has('users.manage')
        ? { title: 'Users', href: '/admin/users', icon: Users }
        : null,
    permissions.has('roles.manage')
        ? { title: 'Roles', href: '/admin/roles', icon: ShieldCheck }
        : null,
    permissions.has('permissions.manage')
        ? { title: 'Permissions', href: '/admin/permissions', icon: KeyRound }
        : null,
].filter((item): item is NavItem => item !== null);
```

Where the existing sidebar renders the main navigation, append the new items:

```tsx
<NavMain items={[...mainNavItems, ...rbacNavItems]} />
```

## 24. Page count and form fields

There are six pages.

| Page | URL | Content |
| --- | --- | --- |
| Users list | `/admin/users` | Search, name, email, roles, edit, delete |
| User form | `/admin/users/create` and `/admin/users/{user}/edit` | Name, email, password, password confirmation, roles |
| Roles list | `/admin/roles` | Search, name, slug, user count, permission count, edit, delete |
| Role form | `/admin/roles/create` and `/admin/roles/{role}/edit` | Name, slug, description, permission checkboxes |
| Permissions list | `/admin/permissions` | Search, name, slug, role count, edit, delete |
| Permission form | `/admin/permissions/create` and `/admin/permissions/{permission}/edit` | Name, slug, description |

## 25. Laravel dashboard design rules

- Always use the existing `AppLayout`.
- Use existing dashboard components from `@/components/ui`.
- Use theme tokens such as `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border`, `primary`, and `destructive`.
- Do not add hard-coded brand colors for normal page elements.
- Keep the starter-kit border radius: `rounded-lg` and `rounded-xl`.
- Keep cards simple with `border bg-card shadow-sm`.
- Use Lucide icons already installed in the project.
- Keep list-page padding at `p-4 md:p-6`.
- Use responsive forms: one column on mobile and two columns only where useful.
- Keep tables horizontally scrollable on small displays.
- Use the existing light and dark theme automatically.
- Do not install a separate admin template, Bootstrap, Material UI, or another design package.

## 26. Removed from the previous README

Do not use these previous instructions:

- `php artisan make:migration add_fields_to_users_table --table=users`
- Any custom users-table fields such as `first_name`, `last_name`, `status`, `last_login_at`, or `archived_at`
- Any replacement code for `app/Models/User.php`
- Any repeated role, permission, or pivot migration
- Any repeated `Role` or `Permission` model code
- Separate Store and Update Form Request files
- Thirteen separate CRUD permission slugs
- The custom `GrantAdmin` console command

## 27. Final run order

1. Confirm the five existing tables from section 3.
2. Run only the generation commands from section 4.
3. Add `backend/app/Support/Rbac.php`.
4. Add the permission middleware and register its alias.
5. Replace the three generated controllers with the controller code in this README.
6. Add the resource routes.
7. Add and run `RbacSeeder`.
8. Grant the first administrator role through Tinker.
9. Update `HandleInertiaRequests.php`.
10. Add the files under the `frontend` section.
11. Add the three sidebar items.
12. Run all verification commands.

## 28. Commands to run after adding the files

```bash
composer dump-autoload
php artisan optimize:clear
php artisan db:seed --class=RbacSeeder
php artisan route:list --path=admin
npm run check:fix
npm run types:check
npm run build
php artisan test
```

No migration command is required for this update because the tables already exist and the default users table must not change.

Start development:

```bash
composer run dev
```

## 29. Required manual checks

1. The default Laravel registration and login still work.
2. No users-table column has been added or removed.
3. No change exists in `app/Models/User.php`.
4. A guest cannot open `/admin/users`.
5. A user without `users.manage` receives HTTP 403 on user CRUD routes.
6. A user without `roles.manage` receives HTTP 403 on role CRUD routes.
7. A user without `permissions.manage` receives HTTP 403 on permission CRUD routes.
8. An administrator can access all three sections.
9. A user can be created with name, email, password, and at least one role.
10. Leaving password blank during editing keeps the current password.
11. The signed-in user cannot delete their own account.
12. The final administrator cannot be deleted or lose the admin role.
13. The `admin` role cannot be deleted or have its slug changed.
14. The three required permission slugs cannot be deleted or renamed.
15. The pages match the existing Laravel dashboard in both light and dark mode.

## 30. Official references

- [Laravel 13 controllers and resource routes](https://laravel.com/framework/docs/13.x/controllers)
- [Laravel 13 middleware](https://laravel.com/framework/docs/13.x/middleware)
- [Inertia 3 forms](https://inertiajs.com/docs/v3/the-basics/forms)
- [Official Laravel React starter kit](https://github.com/laravel/react-starter-kit)
