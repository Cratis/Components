// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ReactNode } from 'react';
import type { ButtonProps } from './Button';
import type { TooltipProps } from './Tooltip';
import { resolveButtonPresentation, warnForDeprecatedProps } from './buttonPresentation';
import { TooltipImplementation } from './TooltipImplementation';

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const joinClassNames = (...classNames: (string | undefined)[]) => classNames.filter(Boolean).join(' ');

type ButtonParts = NonNullable<ButtonProps['pt']>;

const noButtonParts: ButtonParts = Object.freeze({});

const renderSpinner = ({ spinner }: ButtonParts) => (
    <span
        {...spinner}
        className={joinClassNames('cratis-button__spinner', spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const renderIconPart = (icon: ReactNode, { icon: iconPart }: ButtonParts) => (
    <span
        {...iconPart}
        className={joinClassNames('cratis-button__icon', iconPart?.className)}
        data-cratis-part='icon'
        aria-hidden={iconPart?.['aria-hidden'] ?? true}
    >
        {renderIcon(icon)}
    </span>
);

const renderLeading = (loading: boolean | undefined, icon: ReactNode, parts: ButtonParts) => {
    if (loading) return renderSpinner(parts);
    return icon ? renderIconPart(icon, parts) : null;
};

const buttonState = ({ disabled, loading, icon, label, children }: Pick<ButtonProps, 'disabled' | 'loading' | 'icon' | 'label' | 'children'>) => ({
    effectiveDisabled: Boolean(disabled || loading),
    iconOnly: Boolean(icon) && label === undefined && !children,
});

const renderLabel = ({ label, children }: Pick<ButtonProps, 'label' | 'children'>, { label: labelPart }: ButtonParts) =>
    (label !== undefined || children) && (
        <span
            {...labelPart}
            className={joinClassNames('cratis-button__label', labelPart?.className)}
            data-cratis-part='label'
        >
            {label}
            {children}
        </span>
    );

const withTooltip = (button: TooltipProps['children'], { tooltip, tooltipOptions }: Pick<ButtonProps, 'tooltip' | 'tooltipOptions'>) =>
    tooltip ? (
        <TooltipImplementation
            content={tooltip}
            position={tooltipOptions?.position}
            className={tooltipOptions?.className}
        >
            {button}
        </TooltipImplementation>
    ) : (
        button
    );

/** Core implementation for the button presentation slot. */
export const ButtonImplementation = forwardRef<HTMLButtonElement, ButtonProps>(
    function ButtonImplementation(
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
        const presentationProps = { variant, tone, shape, text, link, outlined, rounded, severity };
        warnForDeprecatedProps(presentationProps);

        const presentation = resolveButtonPresentation(presentationProps);
        const { effectiveDisabled, iconOnly } = buttonState({ disabled, loading, icon, label, children });
        const parts = pt ?? noButtonParts;
        const rootPart = parts.root;

        const button = (
            <button
                {...rootPart}
                {...nativeProps}
                ref={ref}
                type={type}
                title={title}
                autoFocus={autoFocus}
                disabled={effectiveDisabled}
                onClick={onClick}
                className={joinClassNames('cratis-button', rootPart?.className, className)}
                style={{ ...rootPart?.style, ...style }}
                aria-label={ariaLabel}
                aria-busy={loading || undefined}
                data-cratis-part='root'
                data-variant={presentation.variant}
                data-tone={presentation.tone}
                data-severity={presentation.severity}
                data-shape={presentation.shape}
                data-size={size}
                data-disabled={effectiveDisabled || undefined}
                data-loading={loading || undefined}
                data-icon-only={iconOnly || undefined}
            >
                {renderLeading(loading, icon, parts)}
                {renderLabel({ label, children }, parts)}
            </button>
        );

        return withTooltip(button, { tooltip, tooltipOptions });
    },
);
