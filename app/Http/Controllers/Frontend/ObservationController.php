<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Services\Frontend\PublicContentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ObservationController extends Controller
{
    public function index(
        Request $request,
        PublicContentService $publicContentService
    ): Response {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:150',
            ],

            'condition' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'method' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'topic' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'contributors' => [
                'nullable',
                'array',
            ],

            'contributors.*' => [
                'string',

                Rule::in([
                    'community',
                    'practitioner',
                ]),
            ],

            'sort' => [
                'nullable',

                Rule::in([
                    'newest',
                    'oldest',
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $filters = [
            'search' => trim(
                (string) (
                    $validated['search']
                    ?? ''
                )
            ),

            'condition' => $validated['condition']
                ?? null,

            'method' => $validated['method']
                ?? null,

            'topic' => $validated['topic']
                ?? null,

            'contributors' => array_values(
                array_unique(
                    $validated['contributors']
                    ?? []
                )
            ),

            'sort' => $validated['sort']
                ?? 'newest',
        ];

        return Inertia::render(
            'frontend/observations/index',

            $publicContentService
                ->observationsData(
                    $filters
                )
        );
    }

    public function show(
        string $observation,
        PublicContentService $publicContentService
    ): Response {
        return Inertia::render(
            'frontend/observations/show',
            [
                'observation' => $publicContentService
                    ->observationDetail(
                        $observation
                    ),
            ]
        );
    }
}
