<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

//        return User::create([
//            'name' => $input['name'],
//            'email' => $input['email'],
//            'password' => $input['password'],
//        ]);

        return DB::transaction(function () use ($input): User {
            $userRole = Role::query()
                ->where('slug', 'user')
                ->firstOrFail();

            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $userRole->users()->attach($user->id, [
                'assigned_by_user_id' => null,
            ]);

            return $user;
        });
    }
}
