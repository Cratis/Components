// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useCallback,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
    type ReactNode,
} from 'react';
import type { ConfigurationDestination } from './ConfigurationDestination';
import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemField } from './OrderedItemField';
import type { OrderedItemIconFieldProps } from './OrderedItemIconFieldProps';
import type { OrderedItemLabels } from './OrderedItemLabels';
import type { OrderedItemProposal } from './OrderedItemProposal';
import type { OrderedItemValidation } from './OrderedItemValidation';
import { OrderedItemRow } from './OrderedItemRow';
import { moveOrderedItem } from './moveOrderedItem';
import { resolveOrderedItemFieldAccess } from './resolveOrderedItemFieldAccess';
import { resolveOrderedItemDropIndex } from './resolveOrderedItemDropIndex';
import { resolveOrderedItemLabels } from './resolveOrderedItemLabels';
import { hasOrderedItemValidation, validateOrderedItem } from './validateOrderedItem';

const dragType = 'application/x-cratis-ordered-item';

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

    /** Renders the host's icon chooser for the icon field. Without it the icon is shown as text. */
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

interface PendingFocus {
    itemId: string | undefined;
    control: string;
    announce: boolean;
}

interface DragState {
    id: string;
    overId?: string;
    position?: 'before' | 'after';
}

const sameIcon = (left: ConfigurationIconReference | undefined, right: ConfigurationIconReference | undefined) =>
    left === right ||
    (left !== undefined && right !== undefined && left.library === right.library && left.key === right.key && left.variant === right.variant);

const withField = <TItem extends OrderedItem>(
    item: TItem,
    field: OrderedItemField,
    value: string | ConfigurationIconReference | undefined,
): TItem => {
    const next = { ...item, [field]: value };
    if (value === undefined) delete (next as Record<string, unknown>)[field];
    return next;
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
export const OrderedItemEditor = <TItem extends OrderedItem = OrderedItem>({
    items,
    fixedItems = [],
    capabilities,
    onChange,
    destinations = [],
    createItem,
    renderIconField,
    isIconAvailable,
    validate,
    validation,
    labels: suppliedLabels,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className,
    pt,
}: OrderedItemEditorProps<TItem>) => {
    const labels = useMemo(() => resolveOrderedItemLabels(suppliedLabels), [suppliedLabels]);
    const baseId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const pending = useRef<PendingFocus | null>(null);
    const restoring = useRef(false);
    const [localValidation, setLocalValidation] = useState<Record<string, OrderedItemValidation>>({});
    const [drag, setDrag] = useState<DragState | null>(null);
    const [announcement, setAnnouncement] = useState('');

    const canAdd =
        capabilities.add &&
        createItem !== undefined &&
        (capabilities.maxItems === undefined || items.length < capabilities.maxItems);
    const atMaximum = capabilities.add && capabilities.maxItems !== undefined && items.length >= capabilities.maxItems;

    useLayoutEffect(() => {
        const target = pending.current;
        const root = rootRef.current;
        if (!target || !root) return;
        const row = target.itemId === undefined
            ? root
            : Array.from(root.querySelectorAll<HTMLElement>('[data-item-id]')).find((element) => element.dataset.itemId === target.itemId);
        if (!row) return;
        const control = Array.from(row.querySelectorAll<HTMLElement>('[data-control]')).find(
            (element) => element.dataset.control === target.control,
        );
        const focusable = control ?? (target.itemId === undefined ? undefined : row);
        if (!focusable) return;
        restoring.current = true;
        focusable.focus();
        restoring.current = false;
        pending.current = null;
        if (target.announce && target.itemId !== undefined) {
            const index = items.findIndex((item) => item.id === target.itemId);
            if (index >= 0) setAnnouncement(labels.moved(items[index].label || labels.untitled, index + 1, items.length));
        }
    });

    const move = useCallback((item: TItem, toIndex: number, control: string) => {
        if (!capabilities.reorder) return;
        const fromIndex = items.findIndex((candidate) => candidate.id === item.id);
        if (fromIndex < 0 || toIndex < 0 || toIndex >= items.length || toIndex === fromIndex) return;
        pending.current = { itemId: item.id, control, announce: true };
        onChange({ kind: 'move', item: items[fromIndex], fromIndex, toIndex, items: moveOrderedItem(items, fromIndex, toIndex) });
    }, [capabilities.reorder, items, onChange]);

    const handleMove = (item: TItem, delta: -1 | 1, control: string) => {
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index >= 0) move(item, index + delta, control);
    };

    const handleField = (item: TItem, field: OrderedItemField, value: string | ConfigurationIconReference | undefined) => {
        if (resolveOrderedItemFieldAccess(capabilities, field) !== 'editable') return;
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index < 0) return;
        const previous = items[index];
        const unchanged = field === 'icon'
            ? sameIcon(previous.icon, value as ConfigurationIconReference | undefined)
            : previous[field] === value;
        if (unchanged) return;
        const next = withField(previous, field, value);
        const nextItems = items.map((candidate, position) => (position === index ? next : candidate));
        const messages = validateOrderedItem(next, nextItems, capabilities, labels, validate);
        if (hasOrderedItemValidation(messages)) {
            setLocalValidation((current) => ({ ...current, [item.id]: messages }));
            return;
        }
        setLocalValidation((current) => {
            if (!(item.id in current)) return current;
            const { [item.id]: _cleared, ...rest } = current;
            return rest;
        });
        onChange({ kind: 'update', item: next, previous, field, items: nextItems });
    };

    const handleFieldBlur = (item: TItem) => {
        setLocalValidation((current) => {
            if (!(item.id in current)) return current;
            const { [item.id]: _cleared, ...rest } = current;
            return rest;
        });
    };

    const handleRemove = (item: TItem) => {
        if (!capabilities.remove) return;
        const index = items.findIndex((candidate) => candidate.id === item.id);
        if (index < 0) return;
        const neighbor = items[index + 1] ?? items[index - 1];
        pending.current = neighbor
            ? { itemId: neighbor.id, control: 'remove', announce: false }
            : { itemId: undefined, control: 'add', announce: false };
        onChange({ kind: 'remove', item: items[index], index, items: items.filter((_, position) => position !== index) });
    };

    const handleAdd = () => {
        if (!canAdd || !createItem) return;
        const item = createItem();
        pending.current = { itemId: item.id, control: 'label', announce: false };
        onChange({ kind: 'add', item, index: items.length, items: [...items, item] });
    };

    const handleDragStart = (item: TItem, event: DragEvent<HTMLButtonElement>) => {
        if (!capabilities.reorder) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData(dragType, item.id);
        event.dataTransfer.effectAllowed = 'move';
        const row = event.currentTarget.closest('li');
        if (row && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(row, 0, 0);
        setDrag({ id: item.id });
    };

    const handleDragOver = (item: TItem, event: DragEvent<HTMLLIElement>) => {
        if (!drag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rectangle = event.currentTarget.getBoundingClientRect();
        const position = event.clientY < rectangle.top + rectangle.height / 2 ? 'before' : 'after';
        setDrag((current) =>
            current && (current.overId !== item.id || current.position !== position)
                ? { ...current, overId: item.id, position }
                : current,
        );
    };

    const handleDrop = (item: TItem, event: DragEvent<HTMLLIElement>) => {
        if (!drag) return;
        event.preventDefault();
        const rectangle = event.currentTarget.getBoundingClientRect();
        const position = event.clientY < rectangle.top + rectangle.height / 2 ? 'before' : 'after';
        const fromIndex = items.findIndex((candidate) => candidate.id === drag.id);
        const overIndex = items.findIndex((candidate) => candidate.id === item.id);
        setDrag(null);
        if (fromIndex < 0 || overIndex < 0) return;
        move(items[fromIndex], resolveOrderedItemDropIndex(fromIndex, overIndex, position), 'handle');
    };

    const restrictions = (
        [
            ['add', capabilities.add],
            ['remove', capabilities.remove],
            ['reorder', capabilities.reorder],
            ['label', resolveOrderedItemFieldAccess(capabilities, 'label') === 'editable'],
            ['icon', resolveOrderedItemFieldAccess(capabilities, 'icon') === 'editable'],
            ['destination', resolveOrderedItemFieldAccess(capabilities, 'destination') === 'editable'],
        ] as const
    ).flatMap(([key, allowed]) => (!allowed && capabilities.reasons?.[key] ? [capabilities.reasons[key] as string] : []));

    const mergedValidation = (item: TItem): OrderedItemValidation | undefined => {
        const local = localValidation[item.id];
        const supplied = validation?.[item.id];
        return local || supplied ? { ...supplied, ...local } : undefined;
    };

    const renderRow = (item: TItem, index: number, count: number, locked: boolean) => (
        <OrderedItemRow
            key={item.id}
            item={item}
            index={index}
            count={count}
            locked={locked}
            capabilities={capabilities}
            labels={labels}
            destinations={destinations}
            validation={locked ? validation?.[item.id] : mergedValidation(item)}
            baseId={baseId}
            parts={pt}
            renderIconField={renderIconField}
            isIconAvailable={isIconAvailable}
            dragging={drag?.id === item.id}
            dropPosition={drag?.overId === item.id && drag.id !== item.id ? drag.position : undefined}
            onField={handleField}
            onFieldBlur={handleFieldBlur}
            onMove={handleMove}
            onRemove={handleRemove}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={() => setDrag(null)}
        />
    );

    const fixedTitleId = `${baseId}-fixed`;
    const localTitleId = `${baseId}-local`;

    return (
        <div
            {...pt?.root}
            ref={rootRef}
            role='group'
            aria-label={ariaLabelledBy ? undefined : ariaLabel ?? labels.localItems}
            aria-labelledby={ariaLabelledBy}
            className={['cratis-ordered-item-editor', pt?.root?.className, className].filter(Boolean).join(' ')}
            onKeyDownCapture={() => { pending.current = null; }}
            onPointerDownCapture={() => { pending.current = null; }}
            onFocusCapture={() => { if (!restoring.current) pending.current = null; }}
            data-cratis-part='root'
        >
            {fixedItems.length > 0 && (
                <section
                    {...pt?.section}
                    aria-labelledby={fixedTitleId}
                    className={`cratis-ordered-item-editor__section ${pt?.section?.className ?? ''}`}
                    data-cratis-part='section'
                    data-section='fixed'
                >
                    <h3 {...pt?.sectionTitle} id={fixedTitleId} className={`cratis-ordered-item-editor__title ${pt?.sectionTitle?.className ?? ''}`} data-cratis-part='sectionTitle'>
                        {labels.fixedItems}
                    </h3>
                    <ul {...pt?.list} className={`cratis-ordered-item-editor__list ${pt?.list?.className ?? ''}`} data-cratis-part='list'>
                        {fixedItems.map((item, index) => renderRow(item, index, fixedItems.length, true))}
                    </ul>
                </section>
            )}
            <section
                {...pt?.section}
                aria-labelledby={localTitleId}
                className={`cratis-ordered-item-editor__section ${pt?.section?.className ?? ''}`}
                data-cratis-part='section'
                data-section='local'
            >
                <h3 {...pt?.sectionTitle} id={localTitleId} className={`cratis-ordered-item-editor__title ${pt?.sectionTitle?.className ?? ''}`} data-cratis-part='sectionTitle'>
                    {labels.localItems}
                </h3>
                {items.length === 0 ? (
                    <p {...pt?.empty} className={`cratis-ordered-item-editor__empty ${pt?.empty?.className ?? ''}`} data-cratis-part='empty'>
                        {labels.empty}
                    </p>
                ) : (
                    <ul {...pt?.list} className={`cratis-ordered-item-editor__list ${pt?.list?.className ?? ''}`} data-cratis-part='list'>
                        {items.map((item, index) => renderRow(item, index, items.length, false))}
                    </ul>
                )}
                {restrictions.map((reason) => (
                    <p key={reason} {...pt?.message} className={`cratis-ordered-item__message cratis-ordered-item__message--note ${pt?.message?.className ?? ''}`} data-cratis-part='message'>
                        {reason}
                    </p>
                ))}
                {capabilities.add && createItem && (
                    <>
                        <button
                            {...pt?.add}
                            type='button'
                            aria-disabled={!canAdd || undefined}
                            onClick={handleAdd}
                            className={`cratis-ordered-item__button cratis-ordered-item-editor__add ${pt?.add?.className ?? ''}`}
                            data-cratis-part='add'
                            data-control='add'
                        >
                            {labels.add}
                        </button>
                        {atMaximum && (
                            <p {...pt?.message} className={`cratis-ordered-item__message cratis-ordered-item__message--note ${pt?.message?.className ?? ''}`} data-cratis-part='message'>
                                {capabilities.reasons?.add ?? labels.maxItemsReached}
                            </p>
                        )}
                    </>
                )}
            </section>
            <div
                {...pt?.status}
                role='status'
                aria-live='polite'
                className={`cratis-ordered-item__hidden ${pt?.status?.className ?? ''}`}
                data-cratis-part='status'
            >
                {announcement}
            </div>
        </div>
    );
};
