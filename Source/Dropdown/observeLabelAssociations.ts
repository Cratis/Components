// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const observers = new WeakMap<Node, { observer: MutationObserver; listeners: Set<() => void> }>();
const associationElements = 'label, button, input, select';

const containsAssociationElement = (node: Node): boolean => {
    if (node.nodeType !== 1) return false;
    const element = node as Element;
    return element.matches(associationElements) || element.querySelector(associationElements) !== null;
};

const changesAssociations = (record: MutationRecord): boolean => record.type === 'attributes'
    ? record.target.nodeType === 1 && (record.target as Element).matches(associationElements)
    : [...record.addedNodes, ...record.removedNodes].some(containsAssociationElement);

/**
 * Shares one label-association observer per document or shadow root. Ignores style, class, and
 * text changes; the browser already updates the name of a referenced label when its text changes.
 * @param element - Mounted control whose native labels must remain current.
 * @param listener - Callback invoked when native label associations may have changed.
 * @returns Cleanup that disconnects the observer when its last control unmounts.
 */
export function observeLabelAssociations(element: Element, listener: () => void): () => void {
    const root = element.getRootNode();
    let subscription = observers.get(root);
    if (!subscription) {
        const Observer = element.ownerDocument.defaultView?.MutationObserver;
        if (!Observer) return () => undefined;
        const listeners = new Set<() => void>();
        const observer = new Observer(records => {
            if (records.some(changesAssociations)) {
                for (const notify of [...listeners]) notify();
            }
        });
        observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['for', 'id'] });
        subscription = { observer, listeners };
        observers.set(root, subscription);
    }
    const current = subscription;
    current.listeners.add(listener);
    return () => {
        if (!current.listeners.delete(listener)) return;
        if (current.listeners.size === 0) {
            current.observer.disconnect();
            observers.delete(root);
        }
    };
}
