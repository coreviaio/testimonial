<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncH2ResearchReferenceData;
use Illuminate\Http\RedirectResponse;

class H2ResearchSyncController extends Controller
{
    public function store(): RedirectResponse
    {
        SyncH2ResearchReferenceData::dispatch();

        return back()->with(
            'success',
            'H2Research sync requested in background.'
        );
    }
}
