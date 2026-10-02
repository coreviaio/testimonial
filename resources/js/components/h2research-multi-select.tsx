import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    LoaderCircle,
    Search,
    X,
} from 'lucide-react';

export type H2ResearchOption = {
    id: number;
    name: string;
};

type H2ResearchSource =
    | 'disease'
    | 'organ'
    | 'administration_method'
    | 'research_topic'
    | 'biomarker'
    | 'article';

type Props = {
    source: H2ResearchSource;

    value: H2ResearchOption[];

    onChange: (
        items: H2ResearchOption[],
    ) => void;

    placeholder?: string;

    disabled?: boolean;

    /*
     * When options are supplied, use them directly.
     * No API request is made.
     *
     * Admin does not supply this prop, so Admin keeps
     * using /admin/h2research-options as before.
     */
    options?: H2ResearchOption[];
};

export function H2ResearchMultiSelect({
                                          source,
                                          value,
                                          onChange,
                                          placeholder = 'Search...',
                                          disabled = false,
                                          options: suppliedOptions,
                                      }: Props) {
    const wrapperRef =
        useRef<HTMLDivElement>(null);

    const [search, setSearch] =
        useState('');

    const [
        remoteOptions,
        setRemoteOptions,
    ] = useState<H2ResearchOption[]>([]);

    const [open, setOpen] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const usingSuppliedOptions =
        suppliedOptions !== undefined;

    useEffect(() => {
        const close = (
            event: MouseEvent,
        ) => {
            if (
                wrapperRef.current
                && !wrapperRef.current.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            close,
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                close,
            );
    }, []);

    /*
     * Existing Admin behavior.
     *
     * Only fetch when options were NOT supplied.
     */
    useEffect(() => {
        if (
            usingSuppliedOptions
            || !open
            || disabled
        ) {
            return;
        }

        const controller =
            new AbortController();

        const timer =
            window.setTimeout(
                async () => {
                    setLoading(true);
                    setError('');

                    try {
                        const params =
                            new URLSearchParams({
                                source,
                                search,
                            });

                        const response =
                            await fetch(
                                `/admin/h2research-options?${params.toString()}`,
                                {
                                    signal:
                                    controller.signal,

                                    headers: {
                                        Accept:
                                            'application/json',
                                    },
                                },
                            );

                        if (!response.ok) {
                            throw new Error(
                                'Unable to load options.',
                            );
                        }

                        const result =
                            await response.json();

                        setRemoteOptions(
                            result.data ?? [],
                        );
                    } catch (
                        requestError
                        ) {
                        if (
                            (
                                requestError as Error
                            ).name !==
                            'AbortError'
                        ) {
                            setError(
                                'Unable to load options.',
                            );
                        }
                    } finally {
                        if (
                            !controller.signal
                                .aborted
                        ) {
                            setLoading(
                                false,
                            );
                        }
                    }
                },
                300,
            );

        return () => {
            window.clearTimeout(
                timer,
            );

            controller.abort();
        };
    }, [
        search,
        open,
        source,
        disabled,
        usingSuppliedOptions,
    ]);

    const normalizedSearch =
        search
            .trim()
            .toLowerCase();

    /*
     * Practitioner:
     * search locally through options passed by Inertia.
     *
     * Admin:
     * continue using remote results.
     */
    const options =
        usingSuppliedOptions
            ? (
                suppliedOptions ?? []
            ).filter(
                (item) =>
                    normalizedSearch === ''
                    || item.name
                        .toLowerCase()
                        .includes(
                            normalizedSearch,
                        ),
            )
            : remoteOptions;

    const selectedIds =
        new Set(
            value.map(
                (item) => item.id,
            ),
        );

    const availableOptions =
        options.filter(
            (item) =>
                !selectedIds.has(
                    item.id,
                ),
        );

    const addItem = (
        item: H2ResearchOption,
    ) => {
        onChange([
            ...value,
            item,
        ]);

        setSearch('');
        setOpen(true);
    };

    const removeItem = (
        id: number,
    ) => {
        onChange(
            value.filter(
                (item) =>
                    item.id !== id,
            ),
        );
    };

    return (
        <div
            ref={wrapperRef}
            className="relative"
        >
            <div
                className={`border-input bg-background flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring ${
                    disabled
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                }`}
            >
                {value.map(
                    (item) => (
                        <span
                            key={item.id}
                            className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
                        >
                            <span className="break-words">
                                {
                                    item.name
                                }
                            </span>

                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeItem(
                                            item.id,
                                        )
                                    }
                                    className="shrink-0 cursor-pointer rounded-sm p-0.5 hover:bg-background"
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </span>
                    ),
                )}

                <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
                    <Search className="size-4 shrink-0 text-muted-foreground" />

                    <input
                        type="text"
                        value={search}
                        disabled={disabled}
                        placeholder={
                            value.length ===
                            0
                                ? placeholder
                                : 'Search more...'
                        }
                        onFocus={() =>
                            setOpen(true)
                        }
                        onChange={(
                            event,
                        ) => {
                            setSearch(
                                event.target
                                    .value,
                            );

                            setOpen(true);
                        }}
                        onKeyDown={(
                            event,
                        ) => {
                            if (
                                event.key ===
                                'Backspace'
                                && search ===
                                ''
                                && value.length >
                                0
                            ) {
                                removeItem(
                                    value[
                                    value.length -
                                    1
                                        ].id,
                                );
                            }
                        }}
                        className="h-7 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {open && !disabled && (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {!usingSuppliedOptions
                        && loading
                        && (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <LoaderCircle className="size-4 animate-spin" />

                                Searching...
                            </div>
                        )}

                    {!usingSuppliedOptions
                        && !loading
                        && error
                        && (
                            <div className="px-3 py-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                    {(
                            usingSuppliedOptions
                            || (
                                !loading
                                && !error
                            )
                        )
                        && availableOptions
                            .length === 0
                        && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                No matching
                                items found.
                            </div>
                        )}

                    {(
                            usingSuppliedOptions
                            || (
                                !loading
                                && !error
                            )
                        )
                        && availableOptions.map(
                            (item) => (
                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        addItem(
                                            item,
                                        )
                                    }
                                    className="flex w-full cursor-pointer items-start rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                    {
                                        item.name
                                    }
                                </button>
                            ),
                        )}
                </div>
            )}
        </div>
    );
}
