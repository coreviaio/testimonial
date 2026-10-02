<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Services\Frontend\PublicContentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InsightController extends Controller
{
    public function index(
        Request $request,
        PublicContentService $publicContentService
    ): Response {
        $validated = $request->validate([
            'range' => [
                'nullable',

                Rule::in([
                    'all',
                    '6m',
                    '12m',
                    'year',
                ]),
            ],
        ]);

        return Inertia::render(
            'frontend/insights/index',

            $publicContentService->insightsData(
                $validated['range']
                ?? 'all'
            )
        );
    }
}
