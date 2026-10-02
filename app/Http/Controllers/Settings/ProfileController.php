<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\UserProfile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $profile = UserProfile::query()
            ->where('user_id', $request->user()->id)
            ->first();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,

            'status' => $request->session()->get('status'),

            'profile' => [
                'phone' => $profile?->phone ?? '',

                'country_code' => $profile?->country_code ?? '',

                'city' => $profile?->city ?? '',

                'short_bio' => $profile?->short_bio ?? '',

                'is_public' => (bool) ($profile?->is_public ?? false),

                'profile_photo_url' => $profile?->profile_photo_path
                    ? Storage::disk('public')->url(
                        $profile->profile_photo_path
                    )
                    : null,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        /*
         * Laravel default user fields.
         */
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        /*
         * Extra profile fields.
         */
        $profile = UserProfile::query()
            ->firstOrNew([
                'user_id' => $user->id,
            ]);

        $profile->fill([
            'phone' => $validated['phone'] ?? null,

            'country_code' => ! empty($validated['country_code'])
                ? strtoupper(
                    trim(
                        (string) $validated['country_code']
                    )
                )
                : null,

            'city' => $validated['city'] ?? null,

            'short_bio' => $validated['short_bio'] ?? null,

            'is_public' => $request->boolean('is_public'),
        ]);

        /*
         * Remove current photo.
         */
        if (
            $request->boolean('remove_profile_photo')
            && $profile->profile_photo_path
        ) {
            Storage::disk('public')->delete(
                $profile->profile_photo_path
            );

            $profile->profile_photo_path = null;
        }

        /*
         * Upload new photo.
         */
        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $request
                ->file('profile_photo')
                ->store(
                    'profile-photos',
                    'public'
                );

            if ($profile->profile_photo_path) {
                Storage::disk('public')->delete(
                    $profile->profile_photo_path
                );
            }

            $profile->profile_photo_path = $newPhotoPath;
        }

        $profile->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile updated.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        $profile = UserProfile::query()
            ->where('user_id', $user->id)
            ->first();

        /*
         * user_profiles currently uses restrictOnDelete(),
         * so delete profile first.
         */
        if ($profile) {
            if ($profile->profile_photo_path) {
                Storage::disk('public')->delete(
                    $profile->profile_photo_path
                );
            }

            $profile->delete();
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
