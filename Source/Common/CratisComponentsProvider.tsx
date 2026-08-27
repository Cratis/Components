// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import { merge } from 'ts-deepmerge';
import { Toaster, type ToasterProps } from '../Notifications/Toaster';
import { unstable_RendererRoot } from '../renderer/RendererContext';
import type { unstable_UiLibrary } from '../renderer/manifest';
import type { unstable_CratisOverlayEnvironment } from '../renderer/overlayEnvironment';
import { CratisComponentsContext } from './CratisComponentsContext';
import { cratisDefaults } from './CratisComponentsDefaults';

const RendererRoot = unstable_RendererRoot;

export { cratisDefaults } from './CratisComponentsDefaults';
export { useCratisComponentsConfig } from './CratisComponentsContext';

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
    /**
     * Accessible name for the segmented date input when neither an explicit
     * `aria-label` nor a `placeholder` is supplied. Previously an orphaned
     * `'Date'` literal with no override path.
     */
    label?: string;
}

/** Localizable labels owned by the Cratis {@link Dropdown} composition. */
export interface CratisDropdownMessages {
    /** Accessible name for the options-popover trigger. */
    showOptions?: string;
    /** Accessible name for the clear-selection action. */
    clearSelection?: string;
}

/**
 * Localizable action and dismissal labels shared by every Cratis-owned dialog
 * surface — {@link Dialog}, {@link CommandDialog}, and {@link StepperCommandDialog}.
 */
export interface CratisDialogMessages {
    /** Primary confirmation label (the `Ok` action in `DialogButtons.Ok*`). */
    ok?: string;
    /** Cancellation label (the `Cancel` action, and the Stepper footer Cancel). */
    cancel?: string;
    /** Affirmative label (the `Yes` action in `DialogButtons.YesNo*`). */
    yes?: string;
    /** Negative label (the `No` action in `DialogButtons.YesNo*`). */
    no?: string;
    /** Accessible name for the header close (×) action. */
    close?: string;
}

/** Localizable navigation labels owned by {@link CommandStepper} / {@link StepperCommandDialog}. */
export interface CratisStepperMessages {
    /** Advance-to-next-step action label. */
    next?: string;
    /** Return-to-previous-step action label. */
    previous?: string;
    /** Final-step submit action label. */
    submit?: string;
}

/** Localizable labels owned by the Cratis {@link Toaster}. */
export interface CratisNotificationsMessages {
    /** Accessible name for a toast's dismiss action. */
    dismiss?: string;
    /** Accessible name for the toast region landmark. */
    region?: string;
}

/** Localizable labels owned by the Cratis {@link DataTableCore} composition. */
export interface CratisDataTableMessages {
    /** Accessible name for a single-selection row control. */
    selectRow?: string;
    /** Placeholder for the loaded-page search input. */
    search?: string;
    /** Accessible name for the loaded-page search input. */
    searchAriaLabel?: string;
}

/** Localizable labels owned by the Cratis column-filter popup. */
export interface CratisColumnFilterMessages {
    /** Builds the filter-trigger accessible name from the effective field. */
    filterTriggerAriaLabel?: (field: string) => string;
    /** Builds the value-control accessible name from the effective field. */
    valueAriaLabel?: (field: string) => string;
    /** Accessible name for the match-mode selector. */
    matchModeAriaLabel?: string;
    /** Localizes a match mode while retaining its default label as fallback input. */
    matchModeLabel?: (mode: string, defaultLabel: string) => string;
    /** Clear action label. */
    clear?: string;
    /** Apply action label. */
    apply?: string;
    /** Boolean true option label. */
    true?: string;
    /** Boolean false option label. */
    false?: string;
}

/** Components-owned message groups. */
export interface CratisComponentsMessages {
    /** Paginator labels. */
    paginator?: CratisPaginatorMessages;
    /** Date-picker labels. */
    datePicker?: CratisDatePickerMessages;
    /** Dropdown labels. */
    dropdown?: CratisDropdownMessages;
    /** Dialog action/dismissal labels shared by Dialog, CommandDialog, and StepperCommandDialog. */
    dialog?: CratisDialogMessages;
    /** Stepper navigation labels shared by CommandStepper and StepperCommandDialog. */
    stepper?: CratisStepperMessages;
    /** Toaster labels. */
    notifications?: CratisNotificationsMessages;
    /** DataTable search/selection labels. */
    dataTable?: CratisDataTableMessages;
    /** Column-filter popup labels and match-mode copy. */
    columnFilter?: CratisColumnFilterMessages;
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
     * @deprecated Use {@link messages}; React Aria supplies its own locale data.
     */
    locales?: Record<string, LegacyLocaleMessages>;
}

/** Props for the application-root Components provider. */
export interface CratisComponentsProviderProps {
    /** Locale and Components-owned messages. */
    value?: CratisComponentsConfig;
    /** Mounts the global toaster with defaults or explicit options. */
    toaster?: boolean | ToasterProps;
    /** Experimental renderer library or ordered, last-wins library composition. */
    library?: unstable_UiLibrary | readonly unstable_UiLibrary[];
    /** Experimental profile-promise behavior. Defaults to strict. */
    libraryMode?: 'strict' | 'degrade';
    /** Experimental terminal slot fallback behavior. Defaults to Core. */
    rendererFallback?: 'core' | 'throw';
    /** Experimental host environment for overlay portal containers. */
    overlayEnvironment?: unstable_CratisOverlayEnvironment;
    /** Application content. */
    children: ReactNode;
}

/** Deep-merges consumer configuration over {@link cratisDefaults}. */
export const mergeCratisComponentsConfig = (
    value: CratisComponentsConfig | undefined,
): CratisComponentsConfig => merge(cratisDefaults, value ?? {}) as CratisComponentsConfig;

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
                ...config.messages?.datePicker,
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
    library,
    libraryMode,
    rendererFallback,
    overlayEnvironment,
    children,
}: CratisComponentsProviderProps) => {
    const resolved = useMemo(
        () =>
            withLegacyLocaleMessages(mergeCratisComponentsConfig(value), value?.messages),
        [value],
    );

    return (
        <RendererRoot
            library={library}
            libraryMode={libraryMode}
            rendererFallback={rendererFallback}
            overlayEnvironment={overlayEnvironment}
        >
            <CratisComponentsContext.Provider value={resolved}>
                <I18nProvider locale={validLocale(resolved.locale)}>
                    {children}
                    {toaster && <Toaster {...(typeof toaster === 'object' ? toaster : {})} />}
                </I18nProvider>
            </CratisComponentsContext.Provider>
        </RendererRoot>
    );
};
