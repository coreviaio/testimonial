<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)
                ->nullable()
                ->after('id');

            $table->string('last_name', 100)
                ->nullable()
                ->after('first_name');

            $table->string('status', 20)
                ->default('active')
                ->after('remember_token');

            $table->dateTime('last_login_at', 6)
                ->nullable()
                ->after('status');

            $table->dateTime('archived_at', 6)
                ->nullable()
                ->after('last_login_at');

            $table->index(
                ['status', 'created_at'],
                'users_status_created_at_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_status_created_at_index');

            $table->dropColumn([
                'first_name',
                'last_name',
                'status',
                'last_login_at',
                'archived_at',
            ]);
        });
    }
};
