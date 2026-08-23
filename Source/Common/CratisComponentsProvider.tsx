// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import { merge } from 'ts-deepmerge';
import { Toaster, type ToasterProps } from '../Notifications';

/** Localizable labels owned by the Cratis paginator. */
export interface CratisPaginatorMessages {
    /** Pagination navigation-region name. */
    navigation?: string;
    /** First-page action label. */
    first?: string;
    /** Previous-page action label. */
    previous?: string;
    /** Next-page action label. */
    next?: string;
    /** Last-page action label. */
    last?: string;
}

/** Localizable labels owned by the Cratis date picker composition. */
export interface CratisDatePickerMessages {
    /** Today action label. */
    today?: string;
    /** Clear action label. */
    clear?: string;
    /** Calendar-trigger label. */
    openCalendar?: string;
    /** Previous-month action label. */
    previousMonth?: string;
    /** Next-month action label. */
    nextMonth?: string;
}

/** Components-owned message groups. */
export interface CratisComponentsMessages {
    /** Paginator labels. */
    paginator?: CratisPaginatorMessages;
    /** Date-picker labels. */
    datePicker?: CratisDatePickerMessages;
}

interface LegacyLocaleMessages {
    today?: string;
    clear?: string;
    aria?: {
        navigation?: string;
        firstPageLabel?: string;
        prevPageLabel?: string;
        nextPageLabel?: string;
        lastPageLabel?: string;
    };
    [message: string]: unknown;
}

/** Renderer-independent application configuration for Components. */
export interface CratisComponentsConfig {
    /** BCP 47 locale used by React Aria for dates, numbers, and interaction announcements. */
    locale?: string;
    /** Cratis-owned labels not supplied by the platform's internationalization APIs. */
    messages?: CratisComponentsMessages;
    /**
     * Legacy locale map retained for source compatibility during the major migration.
     * New code should use {@link messages}; React Aria supplies its own locale data.
     */
    locales?: Record<string, LegacyLocaleMessages>;
    /** Legacy renderer options are accepted during migration but have no effect. */
    [legacyRendererOption: string]: unknown;
}

/** Props for the application-root Components provider. */
export interface CratisComponentsProviderProps {
    /** Locale and Components-owned messages. */
    value?: CratisComponentsConfig;
    /** Mounts the global toaster with defaults or explicit options. */
    toaster?: boolean | ToasterProps;
    /** Application content. */
    children: ReactNode;
}

/** Default locale and English Components messages. */
export const cratisDefaults: CratisComponentsConfig = {
    locale: 'en-US',
    messages: {
        paginator: {
            navigation: 'Pagination',
            first: 'First page',
            previous: 'Previous page',
            next: 'Next page',
            last: 'Last page',
        },
        datePicker: {
            today: 'Today',
            clear: 'Clear',
            openCalendar: 'Open calendar',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
        },
    },
};

/** Deep-merges consumer configuration over {@link cratisDefaults}. */
export const mergeCratisComponentsConfig = (
    value: CratisComponentsConfig | undefined,
): CratisComponentsConfig => merge(cratisDefaults, value ?? {}) as CratisComponentsConfig;

const CratisComponentsContext = createContext<CratisComponentsConfig>(cratisDefaults);

/** Returns the resolved renderer-independent Components configuration. */
export const useCratisComponentsConfig = (): CratisComponentsConfig =>
    useContext(CratisComponentsContext);

const withLegacyLocaleMessages = (
    config: CratisComponentsConfig,
    explicitMessages: CratisComponentsMessages | undefined,
): CratisComponentsConfig => {
    const legacy = config.locale ? config.locales?.[config.locale] : undefined;
    if (!legacy) return config;
    return {
        ...config,
        messages: {
            ...config.messages,
            paginator: {
                navigation:
                    explicitMessages?.paginator?.navigation ??
                    legacy.aria?.navigation ??
                    config.messages?.paginator?.navigation,
                first:
                    explicitMessages?.paginator?.first ??
                    legacy.aria?.firstPageLabel ??
                    config.messages?.paginator?.first,
                previous:
                    explicitMessages?.paginator?.previous ??
                    legacy.aria?.prevPageLabel ??
                    config.messages?.paginator?.previous,
                next:
                    explicitMessages?.paginator?.next ??
                    legacy.aria?.nextPageLabel ??
                    config.messages?.paginator?.next,
                last:
                    explicitMessages?.paginator?.last ??
                    legacy.aria?.lastPageLabel ??
                    config.messages?.paginator?.last,
            },
            datePicker: {
                today:
                    explicitMessages?.datePicker?.today ??
                    legacy.today ??
                    config.messages?.datePicker?.today,
                clear:
                    explicitMessages?.datePicker?.clear ??
                    legacy.clear ??
                    config.messages?.datePicker?.clear,
                openCalendar:
                    explicitMessages?.datePicker?.openCalendar ??
                    config.messages?.datePicker?.openCalendar,
                previousMonth:
                    explicitMessages?.datePicker?.previousMonth ??
                    config.messages?.datePicker?.previousMonth,
                nextMonth:
                    explicitMessages?.datePicker?.nextMonth ??
                    config.messages?.datePicker?.nextMonth,
            },
        },
    };
};

const validLocale = (locale: string | undefined) => {
    if (!locale) return 'en-US';
    try {
        return new Intl.Locale(locale).toString();
    } catch {
        return 'en-US';
    }
};

/** Application root for locale, labels, and the optional app-wide toaster. */
export const CratisComponentsProvider = ({
    value,
    toaster,
    children,
}: CratisComponentsProviderProps) => {
    const resolved = useMemo(
        () =>
            withLegacyLocaleMessages(mergeCratisComponentsConfig(value), value?.messages),
        [value],
    );

    return (
        <CratisComponentsContext.Provider value={resolved}>
            <I18nProvider locale={validLocale(resolved.locale)}>
                {children}
                {toaster && <Toaster {...(typeof toaster === 'object' ? toaster : {})} />}
            </I18nProvider>
        </CratisComponentsContext.Provider>
    );
};
