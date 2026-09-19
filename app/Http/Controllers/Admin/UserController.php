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
