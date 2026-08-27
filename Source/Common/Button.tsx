// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { Tooltip, type TooltipPosition } from './Tooltip';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

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

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const toneForSeverity: Record<ButtonSeverity, ButtonTone> = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

const severityForTone: Record<ButtonTone, ButtonSeverity> = {
    neutral: 'secondary',
    accent: 'info',
    positive: 'success',
    caution: 'warn',
    critical: 'danger',
};

type DeprecatedButtonProp = 'severity' | 'text' | 'link' | 'outlined' | 'rounded';

const warnedDeprecatedProps = new Set<DeprecatedButtonProp>();

const warnForDeprecatedProp = (prop: DeprecatedButtonProp) => {
    const environment = (
        globalThis as typeof globalThis & {
            process?: { env?: { NODE_ENV?: string } };
        }
    ).process?.env?.NODE_ENV;

    if (environment === 'production' || warnedDeprecatedProps.has(prop)) return;

    warnedDeprecatedProps.add(prop);
    console.warn(
        `Button prop "${prop}" is deprecated and will be removed in 5.0. Use variant, tone, or shape instead.`,
    );
};

/** A Cratis-owned button with stable parts and renderer-independent styling. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        label,
        icon,
        loading,
        tooltip,
        tooltipOptions,
        pt,
        variant,
        tone,
        shape,
        text,
        link,
        outlined,
        rounded,
        severity,
        size = 'normal',
        disabled,
        type = 'button',
        title,
        autoFocus,
        onClick,
        className,
        style,
        'aria-label': ariaLabel,
        children,
        ...nativeProps
    },
    ref,
) {
    if (text !== undefined) warnForDeprecatedProp('text');
    if (link !== undefined) warnForDeprecatedProp('link');
    if (outlined !== undefined) warnForDeprecatedProp('outlined');
    if (rounded !== undefined) warnForDeprecatedProp('rounded');
    if (severity !== undefined) warnForDeprecatedProp('severity');

    const selectedVariant =
        variant ?? (link ? 'link' : text ? 'ghost' : outlined ? 'outline' : 'solid');
    const selectedTone = tone ?? (severity ? toneForSeverity[severity] : undefined);
    const selectedShape = shape ?? (rounded ? 'pill' : 'default');
    const legacySeverity = severity ?? (tone ? severityForTone[tone] : undefined);
    const effectiveDisabled = Boolean(disabled || loading);
    const iconOnly = Boolean(icon) && label === undefined && !children;
    const rootClassName = ['cratis-button', pt?.root?.className, className]
        .filter(Boolean)
        .join(' ');

    const button = (
        <button
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            title={title}
            autoFocus={autoFocus}
            disabled={effectiveDisabled}
            onClick={onClick}
            className={rootClassName}
            style={{ ...pt?.root?.style, ...style }}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
            data-cratis-part='root'
            data-variant={selectedVariant}
            data-tone={selectedTone}
            data-severity={legacySeverity}
            data-shape={selectedShape}
            data-size={size}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            data-icon-only={iconOnly || undefined}
        >
            {loading ? (
                <span
                    {...pt?.spinner}
                    className={['cratis-button__spinner', pt?.spinner?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='spinner'
                    aria-hidden='true'
                />
            ) : icon ? (
                <span
                    {...pt?.icon}
                    className={['cratis-button__icon', pt?.icon?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='icon'
                    aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                >
                    {renderIcon(icon)}
                </span>
            ) : null}
            {(label !== undefined || children) && (
                <span
                    {...pt?.label}
                    className={['cratis-button__label', pt?.label?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='label'
                >
                    {label}
                    {children}
                </span>
            )}
        </button>
    );

    return tooltip ? (
        <Tooltip
            content={tooltip}
            position={tooltipOptions?.position}
            className={tooltipOptions?.className}
        >
            {button}
        </Tooltip>
    ) : (
        button
    );
});
