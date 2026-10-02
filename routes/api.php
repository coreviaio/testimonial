<?php

use App\Http\Controllers\Api\ReferenceObservationController;
use Illuminate\Support\Facades\Route;

Route::get(
    '/references/{type}/{reference}/observations',
    [
        ReferenceObservationController::class,
        'index',
    ]
)
    ->whereIn(
        'type',
        [
            'disease',
            'organ',
            'administration-method',
            'research-topic',
            'biomarker',
            'article',
        ]
    )
    ->whereNumber(
        'reference'
    );
