<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render(
            'frontend/help/index'
        );
    }
}
