// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import MuiButton from '@mui/material/Button';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import type { ButtonProps, IconButtonProps } from '@cratis/components/Common';
import {
    muiColorForTone,
    muiSize,
    muiVariant,
    resolveButtonAppearance,
    type ResolvedButtonAppearance,
} from './buttonAppearance.js';
import { classNames, renderIcon } from './shared.js';

type ButtonParts = ButtonProps['pt'];

const buttonIcon = (icon: ReactNode, pt: ButtonParts) => (
    <span
        {...pt?.icon}
        className={classNames('cratis-mui-button__icon', pt?.icon?.className)}
        data-cratis-part='icon'
        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
    >
        {renderIcon(icon)}
    </span>
);

const buttonLabel = (label: ReactNode, children: ReactNode, pt: ButtonParts) => (
    <span
        {...pt?.label}
        className={classNames('cratis-mui-button__label', pt?.label?.className)}
        data-cratis-part='label'
    >
        {label}
        {children}
    </span>
);

interface MuiButtonContentProps {
    readonly icon: ReactNode;
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly pt: ButtonParts;
}

const MuiButtonContent = ({ icon, label, children, pt }: MuiButtonContentProps) => {
    const hasLabel = label !== undefined || children !== undefined;
    return (
        <>
            {icon ? buttonIcon(icon, pt) : null}
            {hasLabel ? buttonLabel(label, children, pt) : null}
        </>
    );
};

const muiButtonStyles = (appearance: ResolvedButtonAppearance) => {
    const link = appearance.variant === 'link';
    return {
        borderRadius: appearance.shape === 'pill' ? 9999 : undefined,
        textTransform: link ? 'none' : undefined,
        padding: link ? 0 : undefined,
        minWidth: link ? 0 : undefined,
    };
};

const muiLoadingIndicator = (pt: ButtonParts) => (
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
    root: NonNullable<ButtonParts>['root'],
    fallbackTitle?: string,
) => ({
    'aria-busy': loading ? true : (props['aria-busy'] ?? root?.['aria-busy']),
    title: props.title ?? fallbackTitle ?? root?.title,
});

interface ButtonChrome {
    readonly baseClassName: string;
    readonly pt: ButtonParts;
    readonly className: string | undefined;
    readonly style: CSSProperties | undefined;
    readonly appearance: ResolvedButtonAppearance;
    readonly size: 'small' | 'normal' | 'large';
    readonly loading: boolean;
}

/** Class, style, color, size and loading props shared by the button and icon button roots. */
const chromeProps = ({
    baseClassName,
    pt,
    className,
    style,
    appearance,
    size,
    loading,
}: ButtonChrome) => ({
    className: classNames(baseClassName, pt?.root?.className, className),
    style: { ...pt?.root?.style, ...style },
    color: muiColorForTone(appearance.tone),
    size: muiSize(size),
    loading,
    loadingIndicator: muiLoadingIndicator(pt),
});

/** The canonical state data attributes both button roots expose. */
const stateAttributes = (
    appearance: ResolvedButtonAppearance,
    size: string,
    disabled: boolean,
    loading: boolean,
) => ({
    'data-variant': appearance.variant,
    'data-tone': appearance.tone,
    'data-severity': appearance.severity,
    'data-shape': appearance.shape,
    'data-size': size,
    'data-disabled': disabled || undefined,
    'data-loading': loading || undefined,
});

const isDisabled = (disabled: boolean | undefined, loading: boolean) =>
    Boolean(disabled || loading);

const isIconOnly = (icon: ReactNode, label: ReactNode, children: ReactNode) =>
    Boolean(icon) && label === undefined && !children;

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
    const effectiveDisabled = isDisabled(disabled, loading);
    const button = (
        <MuiButton
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            autoFocus={autoFocus}
            disabled={effectiveDisabled}
            onClick={onClick}
            {...chromeProps({
                baseClassName: 'cratis-mui-button',
                pt,
                className,
                style,
                appearance,
                size,
                loading,
            })}
            variant={muiVariant(appearance.variant)}
            sx={muiButtonStyles(appearance)}
            {...rootState(loading, { 'aria-busy': nativeProps['aria-busy'], title }, pt?.root)}
            data-cratis-part='root'
            {...stateAttributes(appearance, size, effectiveDisabled, loading)}
            data-icon-only={isIconOnly(icon, label, children) || undefined}
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
        const effectiveDisabled = isDisabled(disabled, loading);
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
                {...chromeProps({
                    baseClassName: 'cratis-mui-icon-button',
                    pt,
                    className,
                    style,
                    appearance,
                    size,
                    loading,
                })}
                sx={{ borderRadius: appearance.shape === 'pill' ? '50%' : 1 }}
                aria-label={ariaLabel}
                aria-busy={loading || undefined}
                data-cratis-part='root'
                {...stateAttributes(appearance, size, effectiveDisabled, loading)}
                data-icon-only='true'
            >
                {!loading && buttonIcon(icon, pt)}
            </MuiIconButton>
        );
        return withMuiTooltip(button, tooltip, tooltipOptions);
    },
);
