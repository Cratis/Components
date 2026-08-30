// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import type { TooltipPosition } from './Tooltip';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { ButtonImplementation } from './ButtonImplementation';

/** Visual treatment of a {@link Button}. */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

/** Semantic color of a {@link Button}. */
export type ButtonTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical';

/** Border shape of a {@link Button}. */
export type ButtonShape = 'default' | 'pill';

/**
 * Severity tone of a {@link Button}.
 *
 * @deprecated Use {@link ButtonTone} instead. Removed in 5.0.
 */
export type ButtonSeverity =
    'secondary' | 'info' | 'success' | 'warn' | 'help' | 'danger' | 'contrast';

/** Stable Cratis-owned parts for styling a {@link Button}. */
export interface ButtonParts {
    /** Native button element. */
    root?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Icon wrapper. */
    icon?: HTMLAttributes<HTMLSpanElement>;
    /** Label/content wrapper. */
    label?: HTMLAttributes<HTMLSpanElement>;
    /** Loading spinner. */
    spinner?: HTMLAttributes<HTMLSpanElement>;
}

const buttonPartsMatchManifest: ExactPartKeys<ButtonParts, PartsOf<'Button'>> = true;
void buttonPartsMatchManifest;

/** Props for {@link Button}. */
export interface ButtonProps extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'className' | 'disabled' | 'size' | 'style' | 'type'
> {
    /** The button's text. */
    label?: ReactNode;
    /** The button's icon, rendered before the label. */
    icon?: ReactNode;
    /** Replaces the icon with a spinner and disables the button. */
    loading?: boolean;
    /** Text shown on hover and keyboard focus. */
    tooltip?: string;
    /** Placement of the tooltip. */
    tooltipOptions?: { position?: TooltipPosition; className?: string };
    /** Cratis-owned per-part attributes. */
    pt?: ButtonParts;
    /** Visual treatment. Defaults to `solid`. */
    variant?: ButtonVariant;
    /** Semantic color. Omit for the familiar primary action. */
    tone?: ButtonTone;
    /** Border shape. Defaults to `default`. */
    shape?: ButtonShape;
    /**
     * Renders the button borderless.
     *
     * @deprecated Use `variant='ghost'` instead. Removed in 5.0.
     */
    text?: boolean;
    /**
     * Renders the button as an inline link.
     *
     * @deprecated Use `variant='link'` instead. Removed in 5.0.
     */
    link?: boolean;
    /**
     * Renders the button with an outline instead of a fill.
     *
     * @deprecated Use `variant='outline'` instead. Removed in 5.0.
     */
    outlined?: boolean;
    /**
     * Renders the button fully rounded.
     *
     * @deprecated Use `shape='pill'` instead. Removed in 5.0.
     */
    rounded?: boolean;
    /**
     * Controls the button's coloring. Omit for the familiar primary action.
     *
     * @deprecated Use `tone` instead. Removed in 5.0.
     */
    severity?: ButtonSeverity;
    /** Sizes the button. */
    size?: 'small' | 'normal' | 'large';
    /** Whether the button is disabled. */
    disabled?: boolean;
    /** Native button type. */
    type?: 'button' | 'submit' | 'reset';
    /** Native title attribute. */
    title?: string;
    /** Focuses the button when it mounts. */
    autoFocus?: boolean;
    /** Applied to the button element. */
    className?: string;
    /** Applied to the button element. */
    style?: CSSProperties;
    /** Accessible name, required for an icon-only button. */
    'aria-label'?: string;
    /** Rendered inside the button, after the icon and label. */
    children?: ReactNode;
}

const coreButtonDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: ButtonImplementation,
}) satisfies unstable_SlotDeclaration<'common.button'>;

/** A Cratis-owned button with stable parts and renderer-independent styling. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    props,
    ref,
) {
    const declaration = unstable_useSlot('common.button', coreButtonDeclaration);
    return renderSlot(declaration, props, ref);
});
