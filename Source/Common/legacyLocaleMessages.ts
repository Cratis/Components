// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    CratisComponentsConfig,
    CratisComponentsMessages,
    CratisDatePickerMessages,
    CratisPaginatorMessages,
} from './CratisComponentsProvider';

type LegacyLocale = NonNullable<NonNullable<CratisComponentsConfig['locales']>[string]>;
type LegacySource = (legacy: LegacyLocale) => string | undefined;
type LegacySources<TMessages> = { [Key in keyof TMessages]: LegacySource };

const noLegacy: LegacySource = () => undefined;

const paginatorSources: Partial<LegacySources<CratisPaginatorMessages>> = {
    navigation: legacy => legacy.aria?.navigation,
    first: legacy => legacy.aria?.firstPageLabel,
    previous: legacy => legacy.aria?.prevPageLabel,
    next: legacy => legacy.aria?.nextPageLabel,
    last: legacy => legacy.aria?.lastPageLabel,
};

const datePickerSources: Partial<LegacySources<CratisDatePickerMessages>> = {
    today: legacy => legacy.today,
    clear: legacy => legacy.clear,
    openCalendar: noLegacy,
    previousMonth: noLegacy,
    nextMonth: noLegacy,
};

// Explicit message first, then the legacy entry, then the already merged message. Every key is
// written, even when all three are missing, so the merged object keeps its own `undefined` keys.
const mergeMessages = <TMessages extends object>(
    current: TMessages | undefined,
    explicit: TMessages | undefined,
    sources: Partial<Record<keyof TMessages, LegacySource>>,
    legacy: LegacyLocale,
): TMessages => {
    const merged: Record<string, unknown> = { ...current };
    for (const [key, source] of Object.entries<LegacySource>(sources as Record<string, LegacySource>)) {
        const candidates = [
            (explicit as Record<string, unknown> | undefined)?.[key],
            source(legacy),
            (current as Record<string, unknown> | undefined)?.[key],
        ];
        merged[key] = candidates.find(candidate => candidate !== undefined && candidate !== null) ?? candidates[2];
    }
    return merged as TMessages;
};

/**
 * Folds the deprecated `locales` entry for the active locale into `messages`; an explicitly supplied
 * message wins over the legacy entry, which wins over the already merged message.
 */
export const withLegacyLocaleMessages = (
    config: CratisComponentsConfig,
    explicitMessages: CratisComponentsMessages | undefined,
): CratisComponentsConfig => {
    const legacy = config.locale ? config.locales?.[config.locale] : undefined;
    if (!legacy) return config;
    return {
        ...config,
        messages: {
            ...config.messages,
            paginator: mergeMessages(config.messages?.paginator, explicitMessages?.paginator, paginatorSources, legacy),
            datePicker: mergeMessages(
                config.messages?.datePicker,
                explicitMessages?.datePicker,
                datePickerSources,
                legacy,
            ),
        },
    };
};
