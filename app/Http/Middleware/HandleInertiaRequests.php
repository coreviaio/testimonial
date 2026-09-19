<?php

namespace App\Http\Middleware;

use App\Models\Practitioner;
use App\Support\Rbac;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $practitioner = $user
            ? Practitioner::query()
                ->where('user_id', $user->id)
                ->first(['id', 'verification_status'])
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'permissions' => fn (): array => $user
                    ? Rbac::permissions($user->id)
                    : [],
                'practitioner' => $practitioner
                    ? [
                        'exists' => true,
                        'status' => $practitioner->verification_status,
                        'approved' => $practitioner->verification_status === 'approved',
                    ]
                    : [
                        'exists' => false,
                        'status' => null,
                        'approved' => false,
                    ],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
