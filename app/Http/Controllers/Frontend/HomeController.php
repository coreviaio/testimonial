<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Services\Frontend\PublicContentService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(
        PublicContentService $publicContentService
    ): Response {
        return Inertia::render(
            'frontend/home',
            $publicContentService->homeData()
        );
    }
}
