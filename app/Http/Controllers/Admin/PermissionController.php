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
