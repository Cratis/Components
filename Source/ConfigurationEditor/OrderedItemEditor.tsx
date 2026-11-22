// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { IconPickerAllowed } from '../IconPicker/IconPickerAllowed';
import type { IconPickerCatalog } from '../IconPicker/IconPickerCatalog';
import type { IconPickerLabels } from '../IconPicker/IconPickerLabels';
import type { ConfigurationDestination } from './ConfigurationDestination';
import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemIconFieldProps } from './OrderedItemIconFieldProps';
import type { OrderedItemLabels } from './OrderedItemLabels';
import type { OrderedItemProposal } from './OrderedItemProposal';
import type { OrderedItemValidation } from './OrderedItemValidation';
import { OrderedItemRow } from './OrderedItemRow';
import { useOrderedItemEditor, type OrderedItemEditorState } from './useOrderedItemEditor';
import { renderOrderedItemFixedSection, renderOrderedItemLocalSection, renderOrderedItemStatus } from './OrderedItemEditorSections';

/** Props for the {@link OrderedItemEditor} component. */
export interface OrderedItemEditorProps<TItem extends OrderedItem = OrderedItem> {
    /** The configurable items, in order. The editor is controlled: it shows exactly these. */
    items: ReadonlyArray<TItem>;

    /** Fixed (inherited) items. Shown separately and locked: they have no controls and are never part of a proposal. */
    fixedItems?: ReadonlyArray<TItem>;

    /** What the host allows. Restricted controls are not offered and restricted proposals are never emitted. */
    capabilities: OrderedItemCapabilities;

    /**
     * Receives a validated, permitted proposal. Apply it by passing new `items`; ignore it to cancel.
     * The host remains responsible for authoritative permission checks and persistence.
     */
    onChange: (proposal: OrderedItemProposal<TItem>) => void;

    /** The destinations offered by the destination field. */
    destinations?: ReadonlyArray<ConfigurationDestination>;

    /** Creates the item an add proposal carries. The host assigns its stable id. Without it, adding is unavailable. */
    createItem?: () => TItem;

    /**
     * The icons the host offers, as an {@link IconPicker} catalog. When supplied, the icon field is the
     * Components icon picker; there is no separate icon grid. Icon references are qualified
     * `{ library, key, variant? }` identities, never names or markup.
     */
    iconCatalog?: IconPickerCatalog;

    /** Restricts which catalog icons can be chosen. Other icons are listed but cannot be selected. */
    allowedIcons?: IconPickerAllowed;

    /** Overrides for the icon picker's own labels. */
    iconPickerLabels?: IconPickerLabels;

    /**
     * Overrides the icon field with the host's own chooser, taking precedence over `iconCatalog`.
     * Without it and without an `iconCatalog`, the icon is shown as text.
     */
    renderIconField?: (props: OrderedItemIconFieldProps<TItem>) => ReactNode;

    /** Tells whether the host's catalog can still supply an icon. An unavailable icon is flagged in text. */
    isIconAvailable?: (icon: ConfigurationIconReference) => boolean;

    /** The host's validation rules, run on the item as it would be. A message blocks the proposal. */
    validate?: (item: TItem, items: ReadonlyArray<TItem>) => OrderedItemValidation | undefined;

    /** Validation feedback from the host, by item id, for example from a server-side check. */
    validation?: Readonly<Record<string, OrderedItemValidation>>;

    /** Overrides for the editor's strings. Unset fields fall back to English. */
    labels?: OrderedItemLabels;

    /** The editor's accessible name. */
    'aria-label'?: string;

    /** The id of the element naming the editor. */
    'aria-labelledby'?: string;

    /** Extra class name on the editor's root. */
    className?: string;

    /** Pass-through attributes for the editor's stable parts. */
    pt?: OrderedItemEditorParts;
}

const mergedValidation = <TItem extends OrderedItem>({ localValidation, validation }: OrderedItemEditorState<TItem>, item: TItem): OrderedItemValidation | undefined => {
    const local = localValidation[item.id];
    const supplied = validation?.[item.id];
    return local || supplied ? { ...supplied, ...local } : undefined;
};

const rowValidation = <TItem extends OrderedItem>(state: OrderedItemEditorState<TItem>, item: TItem, locked: boolean) =>
    locked ? state.validation?.[item.id] : mergedValidation(state, item);

const dropPosition = <TItem extends OrderedItem>({ drag }: OrderedItemEditorState<TItem>, item: TItem) =>
    drag?.overId === item.id && drag.id !== item.id ? drag.position : undefined;

const rowRenderer = <TItem extends OrderedItem>(state: OrderedItemEditorState<TItem>) => (item: TItem, index: number, count: number, locked: boolean) => (
    <OrderedItemRow
        key={item.id}
        item={item}
        index={index}
        count={count}
        locked={locked}
        capabilities={state.capabilities}
        labels={state.labels}
        destinations={state.destinations}
        validation={rowValidation(state, item, locked)}
        baseId={state.baseId}
        parts={state.pt}
        renderIconField={state.renderIconField}
        isIconAvailable={state.isIconAvailable}
        iconCatalog={state.iconCatalog}
        allowedIcons={state.allowedIcons}
        iconPickerLabels={state.iconPickerLabels}
        dragging={state.drag?.id === item.id}
        dropPosition={dropPosition(state, item)}
        onField={state.handleField}
        onFieldBlur={state.handleFieldBlur}
        onMove={state.handleMove}
        onRemove={state.handleRemove}
        onDragStart={state.handleDragStart}
        onDragOver={state.handleDragOver}
        onDrop={state.handleDrop}
        onDragEnd={() => state.setDrag(null)}
    />
);

const accessibleName = <TItem extends OrderedItem>(state: OrderedItemEditorState<TItem>) =>
    state['aria-labelledby'] ? undefined : state['aria-label'] ?? state.labels.localItems;

const renderEditor = <TItem extends OrderedItem>(state: OrderedItemEditorState<TItem>) => {
    const { pt, rootRef, pending, restoring, className, announcement } = state;
    const sections = { ...state, renderRow: rowRenderer(state) };
    return (
        <div
            {...pt?.root}
            ref={rootRef}
            role='group'
            aria-label={accessibleName(state)}
            aria-labelledby={state['aria-labelledby']}
            className={['cratis-ordered-item-editor', pt?.root?.className, className].filter(Boolean).join(' ')}
            onKeyDownCapture={() => { pending.current = null; }}
            onPointerDownCapture={() => { pending.current = null; }}
            onFocusCapture={() => { if (!restoring.current) pending.current = null; }}
            data-cratis-part='root'
            data-cratis-component='OrderedItemEditor'
        >
            {renderOrderedItemFixedSection(sections)}
            {renderOrderedItemLocalSection(sections)}
            {renderOrderedItemStatus(pt, announcement)}
        </div>
    );
};

/**
 * An ordered collection editor for configuring a component such as a navigation: labeled items with
 * an icon and a destination, that can be added, removed and reordered.
 *
 * The editor is controlled and policy-free. The host says what is allowed through `capabilities`,
 * supplies the destinations and the icon chooser, and receives validated proposals through
 * `onChange`. Fixed items are listed separately and locked, in text as well as in state, so the
 * difference never rests on opacity. Reordering works by dragging the handle, with the handle's
 * arrow keys, and with labeled move-up and move-down buttons; focus follows the item that moved.
 */
export const OrderedItemEditor = <TItem extends OrderedItem = OrderedItem>(props: OrderedItemEditorProps<TItem>) => {
    const state = useOrderedItemEditor(props);
    return renderEditor(state);
};
