// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useMemo, type KeyboardEvent } from 'react';
import { useLocale } from 'react-aria-components/I18nProvider';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputProps } from './NumberInputProps';
import { useControlledNumberValue } from './useControlledNumberValue';

const validLocale = (candidate: string | undefined, fallback: string): string => {
    if (!candidate) return fallback;
    try {
        return new Intl.Locale(candidate).toString();
    } catch {
        return fallback;
    }
};

const descriptionIds = (inputId: string, props: NumberInputProps) => {
    const { prefix, suffix, description, invalid = false, errorMessage, 'aria-describedby': ariaDescribedBy } = props;
    const prefixId = prefix !== null && prefix !== undefined ? `${inputId}-prefix` : undefined;
    const suffixId = suffix !== null && suffix !== undefined ? `${inputId}-suffix` : undefined;
    const descriptionId = description !== null && description !== undefined ? `${inputId}-description` : undefined;
    const errorId = invalid && errorMessage !== null && errorMessage !== undefined ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, prefixId, suffixId, descriptionId, errorId].filter(Boolean).join(' ') || undefined;
    return { prefixId, suffixId, descriptionId, errorId, describedBy };
};

export const useNumberInputState = (props: NumberInputProps) => {
    const generatedId = useId();
    const { locale: providerLocale } = useLocale();
    const { locale, id, useGrouping = true, minimumFractionDigits, maximumFractionDigits, onCommit } = props;
    const resolvedLocale = validLocale(locale, providerLocale);
    const inputId = id ?? `cratis-number-input-${generatedId}`;
    const formatOptions = useMemo(
        () => ({ useGrouping, minimumFractionDigits, maximumFractionDigits }),
        [useGrouping, minimumFractionDigits, maximumFractionDigits],
    );
    const resolvedMaximumFractionDigits = useMemo(
        () => new Intl.NumberFormat(resolvedLocale, formatOptions).resolvedOptions().maximumFractionDigits ?? 3,
        [resolvedLocale, formatOptions],
    );
    const controlled = useControlledNumberValue(props, resolvedMaximumFractionDigits);
    const displayedFormatOptions = controlled.normalizationPending
        ? { useGrouping, minimumFractionDigits: 0, maximumFractionDigits: 20 }
        : formatOptions;
    const scheduleCommit = (reason: NumberInputCommitReason) => {
        queueMicrotask(() => onCommit?.(controlled.latestValue.current, reason));
    };
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') scheduleCommit(NumberInputCommitReason.Enter);
        else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') scheduleCommit(NumberInputCommitReason.Step);
    };
    return {
        ...controlled,
        ...descriptionIds(inputId, props),
        inputId,
        resolvedLocale,
        providerLocale,
        displayedFormatOptions,
        scheduleCommit,
        handleKeyDown,
    };
};
