// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useMemo, useState, type ReactNode } from 'react';
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

const pickerFlags = ({ readOnly = false, disabled = false, invalid, validationMessage }: IconPickerProps) => ({
    readOnly,
    disabled,
    editable: !disabled && !readOnly,
    invalid: invalid ?? validationMessage !== undefined,
});

const overlayZIndex = (nearestDialogZIndex: string | null) =>
    nearestDialogZIndex === null ? 'var(--cratis-z-index-overlay)' : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

const findSelectedEntry = (icons: IconPickerCatalog['icons'], value: IconPickerProps['value']) => {
    if (!value) return undefined;
    const identity = iconPickerIdentity(value);
    return icons.find(candidate => iconPickerIdentity(candidate) === identity);
};

const providerNameOf = (entry: IconPickerEntry | undefined, libraries: IconPickerCatalog['libraries']) =>
    entry && libraries.length > 1
        ? (libraries.find(library => library.id === entry.library)?.name ?? entry.library)
        : undefined;

interface SelectionOptions {
    value: IconPickerProps['value'];
    entry: IconPickerEntry | undefined;
    catalog: IconPickerCatalog;
    labels: Required<IconPickerLabels>;
}

/** Whether the selection is missing from a ready catalog, who provides it, and what to say when it is missing. */
const describeSelection = ({ value, entry, catalog, labels }: SelectionOptions) => {
    const status = catalog.status ?? 'ready';
    const missing = value != null && entry === undefined && status === 'ready';
    const providerName = providerNameOf(entry, catalog.libraries);
    const missingMessage = missing && value ? labels.missingSelection(formatIconPickerIdentity(value)) : undefined;
    return { missing, providerName, missingMessage };
};

interface MessagesOptions {
    props: IconPickerProps;
    missingMessage: string | undefined;
    baseId: string;
}

/** The element id of the messages, whether there are any, and what describes the trigger. */
const describeMessages = ({ props, missingMessage, baseId }: MessagesOptions) => {
    const messageId = `${baseId}-message`;
    const hasMessage = missingMessage !== undefined || props.validationMessage !== undefined;
    const describedBy = [props['aria-describedby'], hasMessage ? messageId : undefined].filter(Boolean).join(' ') || undefined;
    return { messageId, hasMessage, describedBy };
};

/** What the picker's trigger, overlay and messages render from. */
interface PickerView {
    props: IconPickerProps;
    labels: Required<IconPickerLabels>;
    flags: ReturnType<typeof pickerFlags>;
    open: boolean;
    baseId: string;
    entry: IconPickerEntry | undefined;
    selection: ReturnType<typeof describeSelection>;
    messages: ReturnType<typeof describeMessages>;
    isNarrow: boolean;
    zIndex: ReturnType<typeof overlayZIndex>;
}

const renderTrigger = ({ props, labels, flags, open, baseId, entry, selection, messages }: PickerView) => (
    <IconPickerTrigger
        entry={entry}
        fallbackName={props.value ? formatIconPickerIdentity(props.value) : labels.placeholder}
        providerName={selection.providerName}
        missing={selection.missing}
        open={open}
        disabled={flags.disabled}
        readOnly={flags.readOnly}
        invalid={flags.invalid}
        id={props.id}
        nameId={`${baseId}-name`}
        label={props['aria-label'] ?? labels.trigger}
        labelledBy={props['aria-labelledby']}
        describedBy={messages.describedBy}
        parts={props.pt}
    />
);

const renderOverlay = ({ props, isNarrow, zIndex }: PickerView, popout: ReactNode) => {
    const { placement = 'bottom start' } = props;
    const popoverParts = props.pt?.popover;
    return isNarrow ? (
        <ModalOverlay isDismissable className='cratis-icon-picker__overlay' style={{ zIndex }}>
            <Modal
                {...popoverParts}
                className={classNames('cratis-icon-picker__sheet', popoverParts?.className)}
                data-cratis-part='popover'
                data-open
            >
                {popout}
            </Modal>
        </ModalOverlay>
    ) : (
        <Popover
            {...popoverParts}
            placement={placement}
            className={classNames('cratis-icon-picker__popover', popoverParts?.className)}
            style={{ zIndex, ...popoverParts?.style }}
            data-cratis-part='popover'
            data-open
        >
            {popout}
        </Popover>
    );
};

const renderMessage = (props: IconPickerProps, message: string) => (
    <p
        {...props.pt?.message}
        className={classNames('cratis-icon-picker__message', props.pt?.message?.className)}
        data-cratis-part='message'
    >
        {message}
    </p>
);

const renderMessages = ({ props, selection, messages }: PickerView) =>
    messages.hasMessage && (
        <div id={messages.messageId} className='cratis-icon-picker__messages'>
            {selection.missingMessage !== undefined && renderMessage(props, selection.missingMessage)}
            {props.validationMessage !== undefined && renderMessage(props, props.validationMessage)}
        </div>
    );

/**
 * An icon property control: a closed trigger showing the selected glyph and name, which opens a
 * searchable, categorized popout of the host's icon catalog.
 *
 * The picker is controlled and library-neutral. It browses exactly the catalog it is given, emits only
 * a qualified `library`/`key`/`variant` identity, and never substitutes a same-named icon from another
 * library for a selection it cannot find. On a narrow viewport the popout becomes a contained sheet.
 */
export const IconPicker = (props: IconPickerProps) => {
    const { value, onChange, catalog, allowed } = props;
    const flags = pickerFlags(props);
    const { readOnly, disabled, editable, invalid } = flags;
    const labels = { ...defaultIconPickerLabels, ...props.labels };
    const [open, setOpen] = useState(false);
    const baseId = useId();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const isNarrow = useNarrowViewport();
    const zIndex = overlayZIndex(nearestDialogZIndex);

    const entry = useMemo(() => findSelectedEntry(catalog.icons, value), [catalog.icons, value]);
    const selection = describeSelection({ value, entry, catalog, labels });
    const messages = describeMessages({ props, missingMessage: selection.missingMessage, baseId });
    const view: PickerView = { props, labels, flags, open, baseId, entry, selection, messages, isNarrow, zIndex };

    const changeOpen = (next: boolean) => setOpen(next && editable);

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

    const rootParts = props.pt?.root;

    return (
        <div
            {...rootParts}
            className={classNames('cratis-icon-picker', props.className, rootParts?.className)}
            data-cratis-part='root'
            data-cratis-component='IconPicker'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-open={open || undefined}
        >
            <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
                <DialogTrigger isOpen={open} onOpenChange={changeOpen}>
                    {renderTrigger(view)}
                    {renderOverlay(view, popout)}
                </DialogTrigger>
            </UNSAFE_PortalProvider>
            {renderMessages(view)}
        </div>
    );
};
