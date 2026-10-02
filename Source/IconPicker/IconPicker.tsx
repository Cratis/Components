// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useMemo, useState } from 'react';
import { DialogTrigger } from 'react-aria-components/Dialog';
import { Modal, ModalOverlay } from 'react-aria-components/Modal';
import { Popover } from 'react-aria-components/Popover';
import { UNSAFE_PortalProvider } from 'react-aria';
import { classNames } from '../ClassNames/classNames';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import type { IconPickerAllowed } from './IconPickerAllowed';
import type { IconPickerCatalog } from './IconPickerCatalog';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerLabels } from './IconPickerLabels';
import type { IconPickerParts } from './IconPickerParts';
import type { IconPickerPlacement } from './IconPickerPlacement';
import { IconPickerPopout } from './IconPickerPopout';
import { IconPickerTrigger } from './IconPickerTrigger';
import type { IconPickerValue } from './IconPickerValue';
import { defaultIconPickerLabels } from './defaultIconPickerLabels';
import { formatIconPickerIdentity } from './formatIconPickerIdentity';
import { iconPickerIdentity } from './iconPickerIdentity';
import { isIconPickerAllowed } from './isIconPickerAllowed';
import { toIconPickerValue } from './toIconPickerValue';
import { useNarrowViewport } from './useNarrowViewport';

const iconPickerPartsMatchManifest: ExactPartKeys<IconPickerParts, PartsOf<'IconPicker'>> = true;
void iconPickerPartsMatchManifest;

/** How many icons a compact category group lists before offering to show them all. */
const defaultCompactGroupSize = 12;

/** Props for {@link IconPicker}. */
export interface IconPickerProps {
    /** The selected icon's qualified identity, or nothing when none is selected. */
    value: IconPickerValue | null | undefined;

    /**
     * Called with the qualified identity of the icon picked. Never called while the picker is
     * read-only or disabled, or for an icon outside {@link IconPickerProps.allowed}.
     * @param value The picked icon's `library`, `key` and `variant` - never its name, markup or position.
     */
    onChange: (value: IconPickerValue) => void;

    /** The icons on offer, supplied by the host. */
    catalog: IconPickerCatalog;

    /** Restricts what can be picked. Icons outside it are listed but cannot be selected. */
    allowed?: IconPickerAllowed;

    /** Shows the selection without letting it change. */
    readOnly?: boolean;

    /** Disables the picker. */
    disabled?: boolean;

    /** Marks the selection as invalid. Also implied by a `validationMessage`. */
    invalid?: boolean;

    /** A validation message shown beneath the trigger; it marks the picker invalid. */
    validationMessage?: string;

    /** Where the popout opens relative to the trigger. Defaults to `'bottom start'`. */
    placement?: IconPickerPlacement;

    /** How many icons a compact category group lists before offering to show them all. Defaults to 12. */
    compactGroupSize?: number;

    /** Overrides for the picker's labels. Unset fields fall back to English. */
    labels?: IconPickerLabels;

    /** The trigger's element id, for a `<label htmlFor>`. */
    id?: string;

    /** The trigger's accessible name. The selected icon's name is appended. Defaults to the `trigger` label. */
    'aria-label'?: string;

    /** The id of the element naming the trigger. The selected icon's name is appended. */
    'aria-labelledby'?: string;

    /** The id of the element describing the trigger. */
    'aria-describedby'?: string;

    /** Extra class name on the picker's root. */
    className?: string;

    /** Pass-through attributes for the picker's stable parts. */
    pt?: IconPickerParts;
}

/**
 * An icon property control: a closed trigger showing the selected glyph and name, which opens a
 * searchable, categorized popout of the host's icon catalog.
 *
 * The picker is controlled and library-neutral. It browses exactly the catalog it is given, emits only
 * a qualified `library`/`key`/`variant` identity, and never substitutes a same-named icon from another
 * library for a selection it cannot find. On a narrow viewport the popout becomes a contained sheet.
 */
export const IconPicker = (props: IconPickerProps) => {
    const { value, onChange, catalog, allowed, readOnly = false, disabled = false, placement = 'bottom start' } = props;
    const labels = { ...defaultIconPickerLabels, ...props.labels };
    const [open, setOpen] = useState(false);
    const baseId = useId();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const isNarrow = useNarrowViewport();
    const editable = !disabled && !readOnly;
    const invalid = props.invalid ?? props.validationMessage !== undefined;
    const status = catalog.status ?? 'ready';
    const zIndex =
        nearestDialogZIndex === null ? 'var(--cratis-z-index-overlay)' : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

    const entry = useMemo(() => {
        if (!value) return undefined;
        const identity = iconPickerIdentity(value);
        return catalog.icons.find(candidate => iconPickerIdentity(candidate) === identity);
    }, [catalog.icons, value]);
    const missing = value != null && entry === undefined && status === 'ready';
    const hasSeveralLibraries = catalog.libraries.length > 1;
    const providerName =
        entry && hasSeveralLibraries
            ? (catalog.libraries.find(library => library.id === entry.library)?.name ?? entry.library)
            : undefined;
    const missingMessage = missing && value ? labels.missingSelection(formatIconPickerIdentity(value)) : undefined;

    const messageId = `${baseId}-message`;
    const hasMessage = missingMessage !== undefined || props.validationMessage !== undefined;
    const describedBy = [props['aria-describedby'], hasMessage ? messageId : undefined].filter(Boolean).join(' ') || undefined;

    const choose = (picked: IconPickerEntry) => {
        if (!editable || !isIconPickerAllowed(picked, allowed)) return;
        onChange(toIconPickerValue(picked));
        setOpen(false);
    };

    const popout = (
        <IconPickerPopout
            catalog={catalog}
            value={value}
            allowed={allowed}
            labels={labels}
            compactGroupSize={props.compactGroupSize ?? defaultCompactGroupSize}
            onChoose={choose}
            onClose={() => setOpen(false)}
            parts={props.pt}
        />
    );

    return (
        <div
            {...props.pt?.root}
            className={classNames('cratis-icon-picker', props.className, props.pt?.root?.className)}
            data-cratis-part='root'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-open={open || undefined}
        >
            <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
                <DialogTrigger isOpen={open} onOpenChange={next => setOpen(next && editable)}>
                    <IconPickerTrigger
                        entry={entry}
                        fallbackName={value ? formatIconPickerIdentity(value) : labels.placeholder}
                        providerName={providerName}
                        missing={missing}
                        open={open}
                        disabled={disabled}
                        readOnly={readOnly}
                        invalid={invalid}
                        id={props.id}
                        nameId={`${baseId}-name`}
                        label={props['aria-label'] ?? labels.trigger}
                        labelledBy={props['aria-labelledby']}
                        describedBy={describedBy}
                        parts={props.pt}
                    />
                    {isNarrow ? (
                        <ModalOverlay isDismissable className='cratis-icon-picker__overlay' style={{ zIndex }}>
                            <Modal
                                {...props.pt?.popover}
                                className={classNames('cratis-icon-picker__sheet', props.pt?.popover?.className)}
                                data-cratis-part='popover'
                                data-open
                            >
                                {popout}
                            </Modal>
                        </ModalOverlay>
                    ) : (
                        <Popover
                            {...props.pt?.popover}
                            placement={placement}
                            className={classNames('cratis-icon-picker__popover', props.pt?.popover?.className)}
                            style={{ zIndex, ...props.pt?.popover?.style }}
                            data-cratis-part='popover'
                            data-open
                        >
                            {popout}
                        </Popover>
                    )}
                </DialogTrigger>
            </UNSAFE_PortalProvider>
            {hasMessage && (
                <div id={messageId} className='cratis-icon-picker__messages'>
                    {missingMessage !== undefined && (
                        <p
                            {...props.pt?.message}
                            className={classNames('cratis-icon-picker__message', props.pt?.message?.className)}
                            data-cratis-part='message'
                        >
                            {missingMessage}
                        </p>
                    )}
                    {props.validationMessage !== undefined && (
                        <p
                            {...props.pt?.message}
                            className={classNames('cratis-icon-picker__message', props.pt?.message?.className)}
                            data-cratis-part='message'
                        >
                            {props.validationMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
