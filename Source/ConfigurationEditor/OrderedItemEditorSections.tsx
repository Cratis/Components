// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemEditorProps } from './OrderedItemEditor';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemLabels } from './OrderedItemLabels';

type SectionContext<TItem extends OrderedItem> = Pick<OrderedItemEditorProps<TItem>, 'items' | 'capabilities' | 'createItem' | 'pt'> & {
    fixedItems: ReadonlyArray<TItem>;
    labels: Required<OrderedItemLabels>;
    baseId: string;
    renderRow: (item: TItem, index: number, count: number, locked: boolean) => ReactNode;
    restrictions: string[];
    canAdd: boolean;
    atMaximum: boolean;
    handleAdd: () => void;
};

const renderTitle = (pt: OrderedItemEditorParts | undefined, id: string, title: string) => (
    <h3 {...pt?.sectionTitle} id={id} className={`cratis-ordered-item-editor__title ${pt?.sectionTitle?.className ?? ''}`} data-cratis-part='sectionTitle'>
        {title}
    </h3>
);

const renderList = <TItem extends OrderedItem>({ pt, renderRow }: SectionContext<TItem>, items: ReadonlyArray<TItem>, locked: boolean) => (
    <ul {...pt?.list} className={`cratis-ordered-item-editor__list ${pt?.list?.className ?? ''}`} data-cratis-part='list'>
        {items.map((item, index) => renderRow(item, index, items.length, locked))}
    </ul>
);

/** Direct rendering retains the fixed section's position in the editor's child tree. */
export const renderOrderedItemFixedSection = <TItem extends OrderedItem>(context: SectionContext<TItem>) => {
    const { fixedItems, pt, labels, baseId } = context;
    if (fixedItems.length === 0) return null;
    const titleId = `${baseId}-fixed`;
    return (
        <section
            {...pt?.section}
            aria-labelledby={titleId}
            className={`cratis-ordered-item-editor__section ${pt?.section?.className ?? ''}`}
            data-cratis-part='section'
            data-section='fixed'
        >
            {renderTitle(pt, titleId, labels.fixedItems)}
            {renderList(context, fixedItems, true)}
        </section>
    );
};

const renderLocalItems = <TItem extends OrderedItem>(context: SectionContext<TItem>) => {
    const { items, pt, labels } = context;
    return items.length === 0 ? (
        <p {...pt?.empty} className={`cratis-ordered-item-editor__empty ${pt?.empty?.className ?? ''}`} data-cratis-part='empty'>
            {labels.empty}
        </p>
    ) : renderList(context, items, false);
};

const renderMaximumMessage = <TItem extends OrderedItem>({ atMaximum, pt, capabilities, labels }: SectionContext<TItem>) => atMaximum && (
    <p {...pt?.message} className={`cratis-ordered-item__message cratis-ordered-item__message--note ${pt?.message?.className ?? ''}`} data-cratis-part='message'>
        {capabilities.reasons?.add ?? labels.maxItemsReached}
    </p>
);

const renderAdd = <TItem extends OrderedItem>(context: SectionContext<TItem>) => {
    const { capabilities, createItem, pt, canAdd, handleAdd, labels } = context;
    if (!capabilities.add || !createItem) return null;
    return (
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
            {renderMaximumMessage(context)}
        </>
    );
};

/** Keeps the list, restriction messages and add fragment in their original child slots. */
export const renderOrderedItemLocalSection = <TItem extends OrderedItem>(context: SectionContext<TItem>) => {
    const { pt, baseId, labels, restrictions } = context;
    const titleId = `${baseId}-local`;
    return (
        <section
            {...pt?.section}
            aria-labelledby={titleId}
            className={`cratis-ordered-item-editor__section ${pt?.section?.className ?? ''}`}
            data-cratis-part='section'
            data-section='local'
        >
            {renderTitle(pt, titleId, labels.localItems)}
            {renderLocalItems(context)}
            {restrictions.map((reason) => (
                <p key={reason} {...pt?.message} className={`cratis-ordered-item__message cratis-ordered-item__message--note ${pt?.message?.className ?? ''}`} data-cratis-part='message'>
                    {reason}
                </p>
            ))}
            {renderAdd(context)}
        </section>
    );
};

/** The polite live region is always present, including before the first move. */
export const renderOrderedItemStatus = (pt: OrderedItemEditorParts | undefined, announcement: string) => (
    <div
        {...pt?.status}
        role='status'
        aria-live='polite'
        className={`cratis-ordered-item__hidden ${pt?.status?.className ?? ''}`}
        data-cratis-part='status'
    >
        {announcement}
    </div>
);
