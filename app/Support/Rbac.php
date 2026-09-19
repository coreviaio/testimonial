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
