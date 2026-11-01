// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import {
    componentAttribute,
    componentIdAttribute,
} from '../configuration/identity/componentIdentityAttributes';
import {
    childComponents,
    navigationScope,
    nearestComponent,
    parentComponent,
    siblingComponents,
} from './componentElements';
import { describeComponentElement } from './describeComponentElement';
import type { ComponentResolver } from './ComponentResolver';
import { HighlightFrame } from './HighlightFrame';
import type { PickedComponent } from './PickedComponent';

/** Props for {@link ComponentPicker}. */
export interface ComponentPickerProps {
    /** Whether picking is on. While it is off the picker listens to nothing and draws nothing. */
    active: boolean;
    /** Called with the component the user confirmed with a click or Enter. */
    onPick: (picked: PickedComponent) => void;
    /** Called when the user pressed Escape. */
    onCancel: () => void;
    /** Adds context from outside the library to each picked component. */
    resolve?: ComponentResolver;
}

const insidePicker = (target: EventTarget | null) =>
    target instanceof Element && target.closest('[data-cratis-picker-ignore]') !== null;

const nameOf = (component: Element | null) => {
    if (!component) return undefined;
    const name = component.getAttribute(componentAttribute);
    const id = component.getAttribute(componentIdAttribute);
    return id ? `${name} ${id}` : (name ?? undefined);
};

/**
 * An overlay that lets the user point at a component. It highlights the component root under the
 * pointer or the keyboard cursor and names it in a tooltip; a click or Enter confirms and Escape
 * cancels. Arrow Up moves to the enclosing component, Arrow Down to its first child component and
 * Arrow Left and Right to the neighbouring component. Inside an open dialog the keyboard stays in
 * the topmost dialog, and the overlay stacks above it.
 *
 * Prefer {@link useComponentPicker}, which starts and stops picking imperatively.
 */
export const ComponentPicker = ({ active, onPick, onCancel, resolve }: ComponentPickerProps) => {
    const [current, setCurrent] = useState<Element | null>(null);
    const latest = useRef({ current, onPick, onCancel, resolve });
    latest.current = { current, onPick, onCancel, resolve };

    useEffect(() => {
        if (!active) {
            setCurrent(null);
            return;
        }
        setCurrent(nearestComponent(document.activeElement));

        const hover = (event: Event) => {
            if (insidePicker(event.target)) return;
            const target = event.target instanceof Element ? event.target : null;
            setCurrent(nearestComponent(target));
        };

        const swallow = (event: Event) => {
            if (insidePicker(event.target)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        const confirm = (component: Element | null, target: Element | null) => {
            if (!component) return;
            latest.current.onPick(describeComponentElement(component, target, latest.current.resolve));
        };

        const click = (event: MouseEvent) => {
            if (insidePicker(event.target)) return;
            swallow(event);
            const target = event.target instanceof Element ? event.target : null;
            confirm(nearestComponent(target), target);
        };

        const key = (event: KeyboardEvent) => {
            const handled = () => {
                event.preventDefault();
                event.stopImmediatePropagation();
            };
            const here = latest.current.current;
            const scope = navigationScope(document);
            const move = (next: Element | null | undefined) => {
                handled();
                if (next) setCurrent(next);
            };
            const first = () => scope.querySelector(`[${componentAttribute}]`);
            switch (event.key) {
                case 'Escape':
                    handled();
                    latest.current.onCancel();
                    break;
                case 'Enter':
                    handled();
                    confirm(here, document.activeElement);
                    break;
                case 'ArrowUp':
                    move(here ? (parentComponent(here) ?? here) : first());
                    break;
                case 'ArrowDown':
                    move(here ? (childComponents(here)[0] ?? here) : first());
                    break;
                case 'ArrowLeft':
                case 'ArrowRight': {
                    if (!here) {
                        move(first());
                        break;
                    }
                    const siblings = siblingComponents(here, scope);
                    const index = siblings.indexOf(here);
                    const step = event.key === 'ArrowRight' ? 1 : -1;
                    move(siblings[(index + step + siblings.length) % siblings.length]);
                    break;
                }
                default:
                    break;
            }
        };

        const swallowed = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'contextmenu'];
        const hovering = ['pointermove', 'mousemove', 'focusin'];
        for (const type of swallowed) window.addEventListener(type, swallow, true);
        for (const type of hovering) window.addEventListener(type, hover, true);
        window.addEventListener('click', click, true);
        window.addEventListener('keydown', key, true);
        return () => {
            for (const type of swallowed) window.removeEventListener(type, swallow, true);
            for (const type of hovering) window.removeEventListener(type, hover, true);
            window.removeEventListener('click', click, true);
            window.removeEventListener('keydown', key, true);
        };
    }, [active]);

    if (!active) return null;
    const name = nameOf(current);
    return (
        <HighlightFrame
            element={current}
            label={name}
            kind='picker'
            announcement={name ? `${name}. Press Enter to pick, Escape to cancel.` : 'Move to a component, then press Enter to pick it or Escape to cancel.'}
        />
    );
};
