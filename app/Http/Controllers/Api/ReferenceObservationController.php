<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Frontend\PublicContentService;
use Illuminate\Http\JsonResponse;

class ReferenceObservationController extends Controller
{
    public function index(
        string $type,
        int $reference,
        PublicContentService $publicContentService
    ): JsonResponse {
        return response()->json(
            $publicContentService->referenceApprovedObservationsData(
                $type,
                $reference
            )
        );
    }
}
