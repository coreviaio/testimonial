<?php

namespace App\Http\Middleware;

use App\Models\Practitioner;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprovedPractitioner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 401);

        $practitioner = Practitioner::query()
            ->where('user_id', $user->id)
            ->first();

        if (! $practitioner || $practitioner->verification_status !== 'approved') {
            return redirect()
                ->route('practitioner.application.show')
                ->with('error', 'Your practitioner application must be approved before you can access this section.');
        }

        $request->attributes->set('practitioner', $practitioner);

        return $next($request);
    }
}
