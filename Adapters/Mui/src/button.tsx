// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ReactElement, type ReactNode } from 'react';
import MuiButton from '@mui/material/Button';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import type { ButtonProps, IconButtonProps } from '@cratis/components/Common';
import { muiColorForTone, muiSize, muiVariant, resolveButtonAppearance, type ResolvedButtonAppearance } from './buttonAppearance.js';
import { classNames, renderIcon } from './shared.js';

interface MuiButtonContentProps {
    readonly icon: ReactNode;
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly pt: ButtonProps['pt'];
}

const MuiButtonContent = ({ icon, label, children, pt }: MuiButtonContentProps) => (
    <>
        {icon ? (
            <span
                {...pt?.icon}
                className={classNames('cratis-mui-button__icon', pt?.icon?.className)}
                data-cratis-part='icon'
                aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
            >
                {renderIcon(icon)}
            </span>
        ) : null}
        {label !== undefined || children !== undefined ? (
            <span
                {...pt?.label}
                className={classNames('cratis-mui-button__label', pt?.label?.className)}
                data-cratis-part='label'
            >
                {label}
                {children}
            </span>
        ) : null}
    </>
);

const muiButtonStyles = (appearance: ResolvedButtonAppearance) => ({
    borderRadius: appearance.shape === 'pill' ? 9999 : undefined,
    textTransform: appearance.variant === 'link' ? 'none' : undefined,
    padding: appearance.variant === 'link' ? 0 : undefined,
    minWidth: appearance.variant === 'link' ? 0 : undefined,
});

const muiLoadingIndicator = (pt: ButtonProps['pt']) => (
    <span
        {...pt?.spinner}
        className={classNames('cratis-mui-button__spinner', pt?.spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const withMuiTooltip = (
    element: ReactElement,
    tooltip: string | undefined,
    options: ButtonProps['tooltipOptions'],
) => {
    if (!tooltip) return element;
    return (
        <MuiTooltip
            title={tooltip}
            placement={options?.position}
            classes={{ tooltip: options?.className ?? '' }}
        >
            {element}
        </MuiTooltip>
    );
};

/**
 * Root attributes where an explicit value must beat the part: a loading button is always busy,
 * otherwise an explicit `aria-busy` (a busy but focusable button) wins over `pt.root`, and the
 * title falls back to `pt.root`.
 */
const rootState = (
    loading: boolean,
    props: { 'aria-busy'?: ButtonProps['aria-busy']; title?: string },
    root: NonNullable<ButtonProps['pt']>['root'],
    fallbackTitle?: string,
) => ({
    'aria-busy': loading ? true : (props['aria-busy'] ?? root?.['aria-busy']),
    title: props.title ?? fallbackTitle ?? root?.title,
});

export const MuiButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(function MuiButtonSlot(
    {
        label,
        icon,
        loading = false,
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
        children,
        ...nativeProps
    },
    ref,
) {
    const appearance = resolveButtonAppearance({
        variant,
        tone,
        shape,
        text,
        link,
        outlined,
        rounded,
        severity,
    });
    const effectiveDisabled = Boolean(disabled || loading);
    const iconOnly = Boolean(icon) && label === undefined && !children;
    const button = (
        <MuiButton
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            autoFocus={autoFocus}
            disabled={effectiveDisabled}
            onClick={onClick}
            className={classNames('cratis-mui-button', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            variant={muiVariant(appearance.variant)}
            color={muiColorForTone(appearance.tone)}
            size={muiSize(size)}
            loading={loading}
            loadingIndicator={muiLoadingIndicator(pt)}
            sx={muiButtonStyles(appearance)}
            {...rootState(loading, { 'aria-busy': nativeProps['aria-busy'], title }, pt?.root)}
            data-cratis-part='root'
            data-variant={appearance.variant}
            data-tone={appearance.tone}
            data-severity={appearance.severity}
            data-shape={appearance.shape}
            data-size={size}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            data-icon-only={iconOnly || undefined}
        >
            <MuiButtonContent icon={loading ? undefined : icon} label={label} pt={pt}>
                {children}
            </MuiButtonContent>
        </MuiButton>
    );
    return withMuiTooltip(button, tooltip, tooltipOptions);
});

export const MuiIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function MuiIconButtonSlot(
        {
            icon,
            loading = false,
            tooltip,
            tooltipOptions,
            pt,
            variant,
            tone,
            shape = 'pill',
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
            ...nativeProps
        },
        ref,
    ) {
        const appearance = resolveButtonAppearance({
            variant,
            tone,
            shape,
            text,
            link,
            outlined,
            rounded,
            severity,
        });
        const effectiveDisabled = Boolean(disabled || loading);
        const button = (
            <MuiIconButton
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                type={type}
                title={title}
                autoFocus={autoFocus}
                disabled={effectiveDisabled}
                onClick={onClick}
                className={classNames(
                    'cratis-mui-icon-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                color={muiColorForTone(appearance.tone)}
                size={muiSize(size)}
                loading={loading}
                loadingIndicator={muiLoadingIndicator(pt)}
                sx={{ borderRadius: appearance.shape === 'pill' ? '50%' : 1 }}
                aria-label={ariaLabel}
                aria-busy={loading || undefined}
                data-cratis-part='root'
                data-variant={appearance.variant}
                data-tone={appearance.tone}
                data-severity={appearance.severity}
                data-shape={appearance.shape}
                data-size={size}
                data-disabled={effectiveDisabled || undefined}
                data-loading={loading || undefined}
                data-icon-only='true'
            >
                {!loading && (
                    <span
                        {...pt?.icon}
                        className={classNames(
                            'cratis-mui-button__icon',
                            pt?.icon?.className,
                        )}
                        data-cratis-part='icon'
                        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                    >
                        {renderIcon(icon)}
                    </span>
                )}
            </MuiIconButton>
        );
        return withMuiTooltip(button, tooltip, tooltipOptions);
    },
);
