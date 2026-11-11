// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import { classNames } from '../ClassNames/classNames';
import type { DropdownProps } from './Dropdown';
import type { CommittableComboBox } from './ComboBoxCommitBridge';
import { firstDefined } from './dropdownAttributes';
import { conventionalField, resolveOptions, type ResolvedOption } from './resolveOptions';
import { useExternalLabel } from './useExternalLabel';

const isInvalidToken = (token: unknown): boolean =>
    token === true || token === 'true' || token === 'grammar' || token === 'spelling';

const popoverZIndex = (nearestDialogZIndex: string | null): string =>
    nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

const resolveShowOptionsLabel = (pt: DropdownProps['pt'], showOptions: string | undefined) =>
    firstDefined(pt?.trigger?.['aria-label'], pt?.select?.['aria-label'], showOptions, 'Show options')!;

const resolveClearSelectionLabel = (pt: DropdownProps['pt'], clearSelection: string | undefined) =>
    firstDefined(pt?.clear?.['aria-label'], clearSelection, 'Clear selection')!;

const useDropdownLabels = <T,>({ pt }: DropdownProps<T>) => {
    const nearestDialogZIndex = useNearestDialogZIndex();
    const dropdownMessages = useCratisComponentsConfig().messages?.dropdown;
    const icon = useCratisIcon();
    return {
        resolvedPopoverZIndex: popoverZIndex(nearestDialogZIndex),
        showOptionsLabel: resolveShowOptionsLabel(pt, dropdownMessages?.showOptions),
        clearSelectionLabel: resolveClearSelectionLabel(pt, dropdownMessages?.clearSelection),
        expandIcon: icon('expand', '⌄'),
        clearIcon: icon('clear', '×'),
    };
};

// React Aria decides that a selection happened - and only then closes the overlay and syncs the
// filter text - by watching the key handed to it change. Deriving that key from `value` alone
// means a consumer that does not feed the emitted value straight back gets a committed selection
// the Dropdown never acts on: the popup stays open over an unchanged filter. Remembering what the
// user just committed keeps the commit whole on its own, while an incoming `value` still wins and
// still drops the memory the moment the consumer answers.
const useDropdownSelection = (resolvedOptions: ResolvedOption[], value: unknown) => {
    const [committed, setCommitted] = useState<{
        key: string | null;
        observedValue: unknown;
    } | null>(null);
    const remembered =
        committed !== null && Object.is(committed.observedValue, value)
            ? committed
            : null;
    const remember = (key: string | null) => setCommitted({ key, observedValue: value });
    const selectedOption =
        resolvedOptions.find((option) => Object.is(option.value, value)) ??
        (remembered?.key == null
            ? undefined
            : resolvedOptions.find((option) => option.key === remembered.key));
    return { remember, selectedOption, selectedKey: selectedOption?.key ?? null };
};

const controlPartOf = <T,>({ pt, filter, multiple }: DropdownProps<T>) =>
    filter ? pt?.filter : multiple ? pt?.multiple : pt?.trigger;

const resolveAriaLabel = <T,>(props: DropdownProps<T>) =>
    firstDefined(
        props['aria-label'],
        props.ariaLabel,
        props.pt?.input?.['aria-label'],
        props.pt?.select?.['aria-label'],
        controlPartOf(props)?.['aria-label'],
    );

const resolveAriaLabelledby = <T,>(props: DropdownProps<T>, ariaLabel: string | undefined, externalLabelledBy: string | undefined) =>
    firstDefined(
        props['aria-labelledby'],
        props.ariaLabelledBy,
        props.pt?.input?.['aria-labelledby'],
        props.pt?.select?.['aria-labelledby'],
        controlPartOf(props)?.['aria-labelledby'],
        ariaLabel ? undefined : externalLabelledBy,
    );

const resolveAriaDescribedby = <T,>(props: DropdownProps<T>) =>
    firstDefined(
        props['aria-describedby'],
        props.ariaDescribedBy,
        props.pt?.input?.['aria-describedby'],
        props.pt?.select?.['aria-describedby'],
    );

const resolveInvalid = <T,>({ invalid, ariaInvalid, pt }: DropdownProps<T>): boolean =>
    firstDefined(
        invalid,
        ariaInvalid,
        isInvalidToken(firstDefined(pt?.input?.['aria-invalid'], pt?.select?.['aria-invalid'])),
    )!;

const resolveTriggerId = <T,>({ id, inputId, pt }: DropdownProps<T>) =>
    firstDefined(id, inputId, pt?.trigger?.id, pt?.input?.id, pt?.select?.id);

const useDropdownAria = <T,>(props: DropdownProps<T>, externalLabelledBy: string | undefined) => {
    const effectiveAriaLabel = resolveAriaLabel(props);
    return {
        effectiveAriaLabel,
        effectiveAriaLabelledby: resolveAriaLabelledby(props, effectiveAriaLabel, externalLabelledBy),
        effectiveAriaDescribedby: resolveAriaDescribedby(props),
        effectiveInvalid: resolveInvalid(props),
        triggerId: resolveTriggerId(props),
    };
};

/** Derives everything the dropdown variants render from props, pass-through parts and provider messages. */
export const useDropdownState = <T,>(props: DropdownProps<T>) => {
    const { options, value, className, pt } = props;
    const optionLabel = props.optionLabel ?? conventionalField(options, 'label');
    const optionValue = props.optionValue ?? conventionalField(options, 'value');
    const [isOpen, setIsOpen] = useState(false);
    const comboBox = useRef<CommittableComboBox | null>(null);
    const { ref: attachExternalLabel, labelledBy: externalLabelledBy } = useExternalLabel();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const labels = useDropdownLabels(props);
    const resolvedOptions = resolveOptions(options, optionLabel, optionValue);
    const selection = useDropdownSelection(resolvedOptions, value);
    const aria = useDropdownAria(props, externalLabelledBy);
    return {
        isOpen,
        setIsOpen,
        comboBox,
        attachExternalLabel,
        overlayEnvironment,
        ...labels,
        resolvedOptions,
        ...selection,
        ...aria,
        rootClassName: classNames('cratis-dropdown', pt?.root?.className, pt?.select?.className, className),
    };
};

export type DropdownState = ReturnType<typeof useDropdownState>;
