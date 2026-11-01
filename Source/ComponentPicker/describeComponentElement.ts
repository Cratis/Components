// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    componentAttribute,
    componentIdAttribute,
} from '../configuration/identity/componentIdentityAttributes';
import { registeredComponentFor } from '../configuration/identity/componentInstances';
import { nearestComponent, parentComponent } from './componentElements';
import type { ComponentResolver } from './ComponentResolver';
import type { PickedAncestor } from './PickedAncestor';
import type { PickedComponent } from './PickedComponent';
import type { PickedPresentationProperty } from './PickedPresentationProperty';
import type { PickedRect } from './PickedRect';

const snapshot = (rect: DOMRect): PickedRect => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
});

const isPlain = (value: unknown): value is string | number | boolean | undefined =>
    value === undefined || ['string', 'number', 'boolean'].includes(typeof value);

const propertiesOf = (root: Element): PickedPresentationProperty[] => {
    const registered = registeredComponentFor(root);
    if (!registered) return [];
    return registered.descriptor.properties.map((property) => {
        const value = registered.props[property.name];
        return {
            name: property.name,
            label: property.label,
            type: property.type,
            values: property.type === 'enum' ? property.values : undefined,
            description: property.description,
            defaultValue: property.defaultValue,
            value: isPlain(value) ? value : undefined,
            editable: isPlain(value),
        };
    });
};

const ancestorsOf = (root: Element): PickedAncestor[] => {
    const ancestors: PickedAncestor[] = [];
    for (let parent = parentComponent(root); parent; parent = parentComponent(parent)) {
        ancestors.push({
            component: parent.getAttribute(componentAttribute) ?? '',
            id: parent.getAttribute(componentIdAttribute) ?? undefined,
            element: parent,
        });
    }
    return ancestors;
};

/**
 * Describes a component root as a {@link PickedComponent}.
 * @param root - The component root element (an element carrying `data-cratis-component`).
 * @param target - The element the pointer or focus was on, to report the part.
 * @param resolve - The host's context resolver.
 * @returns The description.
 */
export const describeComponentElement = (
    root: Element,
    target?: Element | null,
    resolve?: ComponentResolver,
): PickedComponent => {
    const partElement = target && root.contains(target) ? target.closest('[data-cratis-part]') : null;
    const part =
        partElement && root.contains(partElement) && nearestComponent(partElement) === root
            ? (partElement.getAttribute('data-cratis-part') ?? undefined)
            : undefined;
    return {
        component: root.getAttribute(componentAttribute) ?? '',
        id: root.getAttribute(componentIdAttribute) ?? undefined,
        part,
        element: root,
        rect: snapshot(root.getBoundingClientRect()),
        presentationProperties: propertiesOf(root),
        ancestors: ancestorsOf(root),
        context: resolve?.(root) ?? {},
    };
};
