import {
    Info,
} from 'lucide-react';

import type {
    ObservationFilterOptions,
    ObservationFilters,
    PublicContributorType,
} from '@/types/frontend';

type Props = {
    filters:
        ObservationFilters;

    options:
        ObservationFilterOptions;

    onChange: (
        filters: ObservationFilters,
    ) => void;

    onClear: () => void;

    showApply?: boolean;

    onApply?: () => void;
};

export default function ObservationFiltersPanel({
                                                    filters,
                                                    options,
                                                    onChange,
                                                    onClear,
                                                    showApply = false,
                                                    onApply,
                                                }: Props) {
    const toggleContributor = (
        contributor:
        PublicContributorType,
    ) => {
        const exists =
            filters.contributors.includes(
                contributor,
            );

        onChange({
            ...filters,

            contributors: exists
                ? filters.contributors.filter(
                    (item) =>
                        item !==
                        contributor,
                )
                : [
                    ...filters.contributors,
                    contributor,
                ],
        });
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-[#112C40]">
                    Filter observations
                </h2>

                <button
                    type="button"
                    onClick={onClear}
                    className="text-sm font-medium text-[#087A75] underline-offset-2 hover:underline"
                >
                    Clear all
                </button>
            </div>

            <div className="space-y-6">
                {/* Condition */}
                <div>
                    <label
                        htmlFor="observation-condition"
                        className="mb-2 block text-sm font-semibold text-[#112C40]"
                    >
                        Condition
                    </label>

                    <select
                        id="observation-condition"
                        value={
                            filters.condition
                        }
                        onChange={(
                            event,
                        ) =>
                            onChange({
                                ...filters,

                                condition:
                                event
                                    .target
                                    .value,
                            })
                        }
                        className="h-11 w-full rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none transition focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                    >
                        <option value="">
                            All conditions
                        </option>

                        {options.conditions.map(
                            (
                                option,
                            ) => (
                                <option
                                    key={
                                        option.id
                                    }
                                    value={
                                        option.id
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* Method */}
                <div>
                    <label
                        htmlFor="observation-method"
                        className="mb-2 block text-sm font-semibold text-[#112C40]"
                    >
                        Administration
                        method
                    </label>

                    <select
                        id="observation-method"
                        value={
                            filters.method
                        }
                        onChange={(
                            event,
                        ) =>
                            onChange({
                                ...filters,

                                method:
                                event
                                    .target
                                    .value,
                            })
                        }
                        className="h-11 w-full rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none transition focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                    >
                        <option value="">
                            All methods
                        </option>

                        {options.methods.map(
                            (
                                option,
                            ) => (
                                <option
                                    key={
                                        option.id
                                    }
                                    value={
                                        option.id
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* Research topic */}
                <div>
                    <label
                        htmlFor="observation-topic"
                        className="mb-2 block text-sm font-semibold text-[#112C40]"
                    >
                        Research topic
                    </label>

                    <select
                        id="observation-topic"
                        value={
                            filters.topic
                        }
                        onChange={(
                            event,
                        ) =>
                            onChange({
                                ...filters,

                                topic:
                                event
                                    .target
                                    .value,
                            })
                        }
                        className="h-11 w-full rounded-md border border-[#D6E0E2] bg-white px-3 text-sm text-[#405864] outline-none transition focus:border-[#138A83] focus:ring-2 focus:ring-[#138A83]/15"
                    >
                        <option value="">
                            All topics
                        </option>

                        {options.topics.map(
                            (
                                option,
                            ) => (
                                <option
                                    key={
                                        option.id
                                    }
                                    value={
                                        option.id
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* Contributor */}
                <div>
                    <p className="mb-3 text-sm font-semibold text-[#112C40]">
                        Contributor type
                    </p>

                    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#596A75]">
                        <input
                            type="checkbox"
                            checked={filters.contributors.includes(
                                'community',
                            )}
                            onChange={() =>
                                toggleContributor(
                                    'community',
                                )
                            }
                            className="h-5 w-5 rounded border-[#C9D5D8] accent-[#087A75]"
                        />

                        Community
                        contribution
                    </label>

                    <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-[#596A75]">
                        <input
                            type="checkbox"
                            checked={filters.contributors.includes(
                                'practitioner',
                            )}
                            onChange={() =>
                                toggleContributor(
                                    'practitioner',
                                )
                            }
                            className="h-5 w-5 rounded border-[#C9D5D8] accent-[#087A75]"
                        />

                        Practitioner
                        contribution
                    </label>
                </div>
            </div>

            {showApply && (
                <button
                    type="button"
                    onClick={onApply}
                    className="mt-7 flex h-11 w-full items-center justify-center rounded-md bg-[#087A75] px-5 text-sm font-semibold text-white transition hover:bg-[#06665F]"
                >
                    Apply filters
                </button>
            )}

            <div className="mt-8 border-t border-[#E0E8E9] pt-6">
                <div className="rounded-lg bg-[#EDF6F3] p-4">
                    <div className="flex items-start gap-3">
                        <Info
                            size={20}
                            className="mt-0.5 shrink-0 text-[#138A83]"
                        />

                        <div>
                            <h3 className="text-sm font-bold text-[#112C40]">
                                How observations
                                are reviewed
                            </h3>

                            <p className="mt-2 text-xs leading-5 text-[#596A75]">
                                Public
                                observations
                                use the
                                approved
                                version of the
                                submitted
                                content.
                                Practitioner
                                observations
                                also require
                                approved
                                practitioner
                                status and
                                current patient
                                consent.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
