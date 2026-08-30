// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type LabelHTMLAttributes,
    type ReactNode,
} from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { SwitchImplementation } from './SwitchImplementation';

/** Stable Cratis-owned parts for styling a {@link Switch}. */
export interface SwitchParts {
    /** Wrapping native label. */
    root?: LabelHTMLAttributes<HTMLLabelElement>;
    /** Native checkbox input with switch semantics. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual switch track. */
    control?: HTMLAttributes<HTMLSpanElement>;
    /** Visual switch handle. */
    handle?: HTMLAttributes<HTMLSpanElement>;
    /** Visible label content. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

const switchPartsMatchManifest: ExactPartKeys<SwitchParts, PartsOf<'Switch'>> = true;
void switchPartsMatchManifest;

/** Props for {@link Switch}. */
export interface SwitchProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'children' | 'className' | 'onChange' | 'readOnly' | 'style' | 'type'
> {
    /** Visible label content. Supply `aria-label` when no visible label is rendered. */
    label?: ReactNode;
    /** Prevents user changes without removing the checked value from form submission. */
    readOnly?: boolean;
    /** Marks the switch invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next checked value and native user-event metadata. */
    onChange?: ChangeHandler<boolean>;
    /** Class name applied to the wrapping label. */
    className?: string;
    /** Inline style applied to the wrapping label. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: SwitchParts;
}

const coreSwitchDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: SwitchImplementation,
}) satisfies unstable_SlotDeclaration<'common.switch'>;

/** A native checkbox with switch semantics, semantic changes, and stable visual parts. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
    props,
    ref,
) {
    const declaration = unstable_useSlot('common.switch', coreSwitchDeclaration);
    return renderSlot(declaration, props, ref);
});
