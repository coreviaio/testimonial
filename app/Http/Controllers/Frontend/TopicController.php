<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Services\Frontend\PublicContentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    public function index(
        Request $request,
        PublicContentService $publicContentService
    ): Response {
        $validated = $request->validate([
            'category' => [
                'nullable',

                Rule::in([
                    'condition',
                    'organ',
                    'method',
                    'research-topic',
                    'biomarker',
                ]),
            ],

            'search' => [
                'nullable',
                'string',
                'max:150',
            ],

            'letter' => [
                'nullable',
                'string',
                'size:1',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        return Inertia::render(
            'frontend/topics/index',

            $publicContentService->topicsData([
                'category' =>
                    $validated['category']
                    ?? 'condition',

                'search' =>
                    trim(
                        (string) (
                            $validated['search']
                            ?? ''
                        )
                    ),

                'letter' =>
                    strtoupper(
                        trim(
                            (string) (
                                $validated['letter']
                                ?? ''
                            )
                        )
                    ),

                'page' =>
                    (int) (
                        $validated['page']
                        ?? 1
                    ),
            ])
        );
    }

    public function show(
        Request $request,
        string $type,
        int $topic,
        PublicContentService $publicContentService
    ): Response {
        $validated = $request->validate([
            'method' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'contributor' => [
                'nullable',

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

            'view' => [
                'nullable',

                Rule::in([
                    'preview',
                    'all',
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        return Inertia::render(
            'frontend/topics/show',

            $publicContentService->topicDetailData(
                $type,
                $topic,
                [
                    'method' =>
                        $validated['method']
                        ?? null,

                    'contributor' =>
                        $validated['contributor']
                        ?? null,

                    'sort' =>
                        $validated['sort']
                        ?? 'newest',

                    'view' =>
                        $validated['view']
                        ?? 'preview',

                    'page' =>
                        (int) (
                            $validated['page']
                            ?? 1
                        ),
                ]
            )
        );
    }
}
