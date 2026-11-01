// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { componentAttribute } from '../configuration/identity/componentIdentityAttributes';

/** The nearest component root at or above an element, or `null`. */
export const nearestComponent = (element: Element | null): Element | null =>
    element?.closest(`[${componentAttribute}]`) ?? null;

/** The component root enclosing another component root, or `null`. */
export const parentComponent = (component: Element): Element | null =>
    nearestComponent(component.parentElement);

/** The component roots whose nearest enclosing component is `parent`, in document order. */
export const childComponents = (parent: Element): Element[] =>
    Array.from(parent.querySelectorAll(`[${componentAttribute}]`)).filter(
        (candidate) => parentComponent(candidate) === parent,
    );

/** The component roots sharing `component`'s parent (or, for a top-level one, the top-level roots in `scope`). */
export const siblingComponents = (component: Element, scope: ParentNode): Element[] => {
    const parent = parentComponent(component);
    return parent
        ? childComponents(parent)
        : Array.from(scope.querySelectorAll(`[${componentAttribute}]`)).filter(
              (candidate) => parentComponent(candidate) === null,
          );
};

/**
 * The element keyboard navigation moves within: the topmost open dialog when there is one, so
 * picking never leaves a modal, otherwise the document.
 */
export const navigationScope = (document: Document): ParentNode => {
    const dialogs = document.querySelectorAll(`[${componentAttribute}="Dialog"]`);
    return dialogs.length > 0 ? dialogs[dialogs.length - 1].parentElement ?? document : document;
};
