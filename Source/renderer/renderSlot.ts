// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    createElement,
    type ComponentType,
    type ForwardedRef,
    type ReactElement,
    type RefAttributes,
} from 'react';

interface RenderDeclaration<Props> {
    readonly render: ComponentType<Props>;
}

export function renderSlot<Props extends object>(
    declaration: RenderDeclaration<Props>,
    props: Props,
): ReactElement;
export function renderSlot<Props extends object, Element>(
    declaration: RenderDeclaration<Props>,
    props: Props,
    ref: ForwardedRef<Element>,
): ReactElement;
export function renderSlot<Props extends object, Element>(
    declaration: RenderDeclaration<Props>,
    props: Props,
    ref?: ForwardedRef<Element>,
): ReactElement {
    if (arguments.length < 3) return createElement(declaration.render, props);

    // SAFETY: Slot declarations intentionally expose exact public props without widening every
    // adapter with Core ref types. Facades alone bridge their already-public forwarded ref to the
    // selected implementation, and conformance tests prove that it lands on the real native root.
    const RefCapableSlot = declaration.render as ComponentType<
        Props & RefAttributes<Element>
    >;
    const slotProps = { ...props, ref } as Props & RefAttributes<Element>;
    return createElement(RefCapableSlot, slotProps);
}
