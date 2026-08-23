// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    HTMLAttributes,
    MouseEventHandler,
    ReactNode,
} from 'react';
import { Tooltip, type TooltipPosition } from './Tooltip';

/** Severity tone of a {@link Button}. */
export type ButtonSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'help' | 'danger' | 'contrast';

/** Stable Cratis-owned parts for styling a {@link Button}. */
export interface ButtonParts {
    root?: ButtonHTMLAttributes<HTMLButtonElement>;
    icon?: HTMLAttributes<HTMLSpanElement>;
    label?: HTMLAttributes<HTMLSpanElement>;
    spinner?: HTMLAttributes<HTMLSpanElement>;
}

/** Props for {@link Button}. */
export interface ButtonProps {
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
    /** Renders the button borderless. */
    text?: boolean;
    /** Renders the button as an inline link. */
    link?: boolean;
    /** Renders the button with an outline instead of a fill. */
    outlined?: boolean;
    /** Renders the button fully rounded. */
    rounded?: boolean;
    /** Controls the button's coloring. */
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
    /** Called when the button is activated. */
    onClick?: MouseEventHandler<HTMLButtonElement>;
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

/** A Cratis-owned button with stable parts and renderer-independent styling. */
export const Button = ({
    label,
    icon,
    loading,
    tooltip,
    tooltipOptions,
    pt,
    text,
    link,
    outlined,
    rounded,
    severity = 'secondary',
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
}: ButtonProps) => {
    const variant = link ? 'link' : text ? 'text' : outlined ? 'outlined' : 'filled';
    const iconOnly = Boolean(icon) && label === undefined && !children;
    const rootClassName = ['cratis-button', pt?.root?.className, className]
        .filter(Boolean)
        .join(' ');

    const button = (
        <button
            {...pt?.root}
            type={type}
            title={title}
            autoFocus={autoFocus}
            disabled={disabled || loading}
            onClick={onClick}
            className={rootClassName}
            style={{ ...pt?.root?.style, ...style }}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
            data-cratis-part='root'
            data-variant={variant}
            data-severity={severity}
            data-size={size}
            data-rounded={rounded || undefined}
            data-icon-only={iconOnly || undefined}
        >
            {loading ? (
                <span
                    {...pt?.spinner}
                    className={['cratis-button__spinner', pt?.spinner?.className].filter(Boolean).join(' ')}
                    data-cratis-part='spinner'
                    aria-hidden='true'
                />
            ) : icon ? (
                <span
                    {...pt?.icon}
                    className={['cratis-button__icon', pt?.icon?.className].filter(Boolean).join(' ')}
                    data-cratis-part='icon'
                    aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                >
                    {renderIcon(icon)}
                </span>
            ) : null}
            {(label !== undefined || children) && (
                <span
                    {...pt?.label}
                    className={['cratis-button__label', pt?.label?.className].filter(Boolean).join(' ')}
                    data-cratis-part='label'
                >
                    {label}
                    {children}
                </span>
            )}
        </button>
    );

    return tooltip ? (
        <Tooltip content={tooltip} position={tooltipOptions?.position} className={tooltipOptions?.className}>
            {button}
        </Tooltip>
    ) : button;
};
