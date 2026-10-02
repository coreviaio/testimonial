<?php

namespace App\Services;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

class H2ResearchSyncService
{
    private const SOURCES = [
        'disease' => [
            'endpoint' => '/api/get-disease',
            'key' => 'diseases',
        ],

        'organ' => [
            'endpoint' => '/api/get-organs',
            'key' => 'organs',
        ],

        'research_topic' => [
            'endpoint' => '/api/get-research-topic',
            'key' => 'researchTopics',
        ],

        'administration_method' => [
            'endpoint' => '/api/get-methods',
            'key' => 'methods',
        ],

        'biomarker' => [
            'endpoint' => '/api/manage-main-sub-categories',
            'key' => 'biomarkers',
        ],

        'article' => [
            'endpoint' => '/api/all-article',
            'key' => 'articles',
        ],
    ];

    public function syncAll(): void
    {
        $this->ensureDatabase();

        foreach (self::SOURCES as $source => $config) {
            try {
                $this->syncSource(
                    $source,
                    $config['endpoint'],
                    $config['key']
                );
            } catch (Throwable $exception) {
                $this->markFailed(
                    $source,
                    $exception->getMessage()
                );

                Log::error('H2Research sync failed', [
                    'source' => $source,
                    'message' => $exception->getMessage(),
                ]);
            }
        }
    }

    private function syncSource(
        string $source,
        string $endpoint,
        string $responseKey
    ): void {
        $baseUrl = config('services.h2research.base_url');

        if (!$baseUrl) {
            throw new RuntimeException(
                'H2RESEARCH_BASE_URL is not configured.'
            );
        }

        $response = Http::baseUrl($baseUrl)
            ->acceptJson()
            ->timeout(
                config('services.h2research.timeout', 180)
            )
            ->retry(2, 1000)
            ->get($endpoint)
            ->throw();

        $payload = $response->json();

        $items = data_get($payload, $responseKey);

        if (!is_array($items)) {
            throw new RuntimeException(
                "Invalid H2Research response for {$source}."
            );
        }

        $normalized = $this->normalize(
            $source,
            $items
        );

        $newHash = $this->generateHash($normalized);

        $connection = DB::connection('h2research_cache');

        $oldHash = $connection
            ->table('h2_sync_states')
            ->where('source', $source)
            ->value('data_hash');

        if ($oldHash === $newHash) {
            $connection
                ->table('h2_sync_states')
                ->where('source', $source)
                ->update([
                    'item_count' => count($normalized),
                    'last_synced_at' => now(),
                    'last_error' => null,
                    'updated_at' => now(),
                ]);

            return;
        }

        $connection->transaction(function () use (
            $connection,
            $source,
            $normalized,
            $newHash
        ): void {
            $connection
                ->table('h2_reference_items')
                ->where('source', $source)
                ->delete();

            foreach (array_chunk($normalized, 500) as $chunk) {
                $rows = array_map(
                    fn (array $item): array => [
                        'source' => $source,
                        'external_id' => $item['external_id'],
                        'name' => $item['name'],
                        'source_status' => $item['source_status'],
                        'source_updated_at' => $item['source_updated_at'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    $chunk
                );

                $connection
                    ->table('h2_reference_items')
                    ->insert($rows);
            }

            $connection
                ->table('h2_sync_states')
                ->updateOrInsert(
                    [
                        'source' => $source,
                    ],
                    [
                        'data_hash' => $newHash,
                        'item_count' => count($normalized),
                        'last_synced_at' => now(),
                        'last_changed_at' => now(),
                        'last_error' => null,
                        'updated_at' => now(),
                    ]
                );
        });
    }

    private function normalize(
        string $source,
        array $items
    ): array {
        $normalized = [];

        foreach ($items as $item) {
            $externalId = data_get($item, 'id');

            $name = $source === 'article'
                ? data_get($item, 'publicData.title.name')
                : data_get($item, 'name');

            if (
                $externalId === null
                || !$name
            ) {
                continue;
            }

            $normalized[] = [
                'external_id' => (string) $externalId,
                'name' => trim((string) $name),
                'source_status' => data_get(
                    $item,
                    'status'
                ),
                'source_updated_at' => data_get(
                    $item,
                    'updated_at'
                ),
            ];
        }

        usort(
            $normalized,
            fn (array $first, array $second): int =>
            strnatcasecmp(
                $first['external_id'],
                $second['external_id']
            )
        );

        return $normalized;
    }

    private function generateHash(array $items): string
    {
        $context = hash_init('sha256');

        foreach ($items as $item) {
            hash_update(
                $context,
                json_encode(
                    [
                        $item['external_id'],
                        $item['name'],
                        $item['source_status'],
                    ],
                    JSON_UNESCAPED_UNICODE
                    | JSON_UNESCAPED_SLASHES
                )
            );

            hash_update($context, "\n");
        }

        return hash_final($context);
    }

    private function ensureDatabase(): void
    {
        $database = config(
            'database.connections.h2research_cache.database'
        );

        if (!$database) {
            throw new RuntimeException(
                'H2Research cache database path is missing.'
            );
        }

        if (!File::exists($database)) {
            File::ensureDirectoryExists(
                dirname($database)
            );

            File::put($database, '');
        }

        $schema = Schema::connection(
            'h2research_cache'
        );

        if (!$schema->hasTable('h2_reference_items')) {
            $schema->create(
                'h2_reference_items',
                function (Blueprint $table): void {
                    $table->id();

                    $table->string('source', 50);
                    $table->string('external_id', 100);
                    $table->text('name');

                    $table->string(
                        'source_status',
                        50
                    )->nullable();

                    $table->string(
                        'source_updated_at'
                    )->nullable();

                    $table->timestamps();

                    $table->unique([
                        'source',
                        'external_id',
                    ]);

                    $table->index('source');
                }
            );
        }

        if (!$schema->hasTable('h2_sync_states')) {
            $schema->create(
                'h2_sync_states',
                function (Blueprint $table): void {
                    $table->id();

                    $table
                        ->string('source', 50)
                        ->unique();

                    $table
                        ->char('data_hash', 64)
                        ->nullable();

                    $table
                        ->unsignedInteger('item_count')
                        ->default(0);

                    $table
                        ->timestamp('last_synced_at')
                        ->nullable();

                    $table
                        ->timestamp('last_changed_at')
                        ->nullable();

                    $table
                        ->text('last_error')
                        ->nullable();

                    $table->timestamps();
                }
            );
        }
    }

    private function markFailed(
        string $source,
        string $message
    ): void {
        try {
            DB::connection('h2research_cache')
                ->table('h2_sync_states')
                ->updateOrInsert(
                    [
                        'source' => $source,
                    ],
                    [
                        'last_error' => $message,
                        'updated_at' => now(),
                    ]
                );
        } catch (Throwable) {
            //
        }
    }
}
