<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class H2ResearchReferenceController extends Controller
{
    private const SOURCES = [
        'disease',
        'organ',
        'administration_method',
        'research_topic',
        'biomarker',
        'article',
    ];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['required', Rule::in(self::SOURCES)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        if (! Schema::connection('h2research_cache')
            ->hasTable('h2_reference_items')) {
            return response()->json([
                'data' => [],
            ]);
        }

        $search = trim(
            (string) ($validated['search'] ?? '')
        );

        $items = DB::connection('h2research_cache')
            ->table('h2_reference_items')
            ->where(
                'source',
                $validated['source']
            )
            ->where(function ($query): void {
                $query
                    ->whereNull('source_status')
                    ->orWhereRaw(
                        'LOWER(source_status) <> ?',
                        ['deleted']
                    );
            })
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(
                        'name',
                        'like',
                        "%{$search}%"
                    );
                }
            )
            ->orderBy('name')
            ->limit(20)
            ->get([
                'external_id',
                'name',
            ])
            ->map(fn ($item): array => [
                'id' => (int) $item->external_id,
                'name' => $item->name,
            ])
            ->values();

        return response()->json([
            'data' => $items,
        ]);
    }
}
