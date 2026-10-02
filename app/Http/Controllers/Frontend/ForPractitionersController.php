<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Practitioner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForPractitionersController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $practitioner = $user
            ? Practitioner::query()
                ->where('user_id', $user->id)
                ->first([
                    'id',
                    'verification_status',
                ])
            : null;

        $status = $practitioner?->verification_status;

        $actionLabel = match ($status) {
            'draft' => 'Continue practitioner application',

            'pending_verification' => 'View application status',

            'changes_requested' => 'Update practitioner application',

            'approved' => 'View practitioner application',

            'rejected' => 'View practitioner application',

            default => 'Apply as a practitioner',
        };

        return Inertia::render(
            'frontend/for-practitioners/index',
            [
                'application' => [
                    'url' => route(
                        'practitioner.application.show'
                    ),

                    'label' => $actionLabel,

                    'status' => $status,

                    'statusLabel' => $status
                        ? ucwords(
                            str_replace(
                                '_',
                                ' ',
                                $status
                            )
                        )
                        : null,

                    'isAuthenticated' => $user !== null,
                ],
            ]
        );
    }
}
