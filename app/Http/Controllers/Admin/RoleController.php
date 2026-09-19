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
