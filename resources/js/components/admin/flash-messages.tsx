import { usePage } from '@inertiajs/react';

type FlashProps = {
    [key: string]: unknown;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export default function FlashMessages() {
    const { flash } = usePage<FlashProps>().props;

    if (!flash?.success && !flash?.error) return null;

    return (
        <div className="space-y-3">
            {flash.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}
        </div>
    );
}
