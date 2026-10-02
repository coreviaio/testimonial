<?php

namespace App\Jobs;

use App\Services\H2ResearchSyncService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncH2ResearchReferenceData implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 900;

    public int $uniqueFor = 1800;

    public function uniqueId(): string
    {
        return 'h2research-reference-sync';
    }

    public function handle(
        H2ResearchSyncService $syncService
    ): void {
        $syncService->syncAll();
    }
}
