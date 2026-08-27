// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ReactNode } from 'react';
import type {
    ButtonProps,
    ButtonSeverity,
    ButtonTone,
} from './Button';
import { TooltipImplementation } from './TooltipImplementation';

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
        if (text !== undefined) warnForDeprecatedProp('text');
        if (link !== undefined) warnForDeprecatedProp('link');
        if (outlined !== undefined) warnForDeprecatedProp('outlined');
        if (rounded !== undefined) warnForDeprecatedProp('rounded');
        if (severity !== undefined) warnForDeprecatedProp('severity');

        const selectedVariant =
            variant ??
            (link ? 'link' : text ? 'ghost' : outlined ? 'outline' : 'solid');
        const selectedTone = tone ?? (severity ? toneForSeverity[severity] : undefined);
        const selectedShape = shape ?? (rounded ? 'pill' : 'default');
        const legacySeverity = tone ? severityForTone[tone] : severity;
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
                        className={[
                            'cratis-button__spinner',
                            pt?.spinner?.className,
                        ]
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
    },
);
