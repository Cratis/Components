// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import { Button as PrimeButton } from '@primereact/ui/button';
import type { ButtonProps, IconButtonProps } from '@cratis/components/Common';
import {
    primeVariant,
    resolveButtonAppearance,
    type ButtonAppearanceOptions,
    type ResolvedButtonAppearance,
} from './buttonAppearance.js';
import { classNames, renderIcon } from './shared.js';

type ButtonParts = NonNullable<ButtonProps['pt']>;

const splitAppearance = <Props extends ButtonProps>({
    variant,
    tone,
    shape,
    text,
    link,
    outlined,
    rounded,
    severity,
    ...rest
}: Props) => ({
    options: { variant, tone, shape, text, link, outlined, rounded, severity } satisfies ButtonAppearanceOptions,
    rest,
});

/**
 * Root attributes where an explicit value must beat the part: a loading button is always busy,
 * otherwise an explicit `aria-busy` (a busy but focusable button) wins over `pt.root`, and the
 * title falls back to `pt.root`.
 */
const rootState = (
    loading: boolean,
    props: { 'aria-busy'?: ButtonProps['aria-busy']; title?: string },
    root: ButtonParts['root'],
    fallbackTitle?: string,
) => ({
    'aria-busy': loading ? true : (props['aria-busy'] ?? root?.['aria-busy']),
    title: props.title ?? fallbackTitle ?? root?.title,
});

const buttonDataAttributes = (
    appearance: ResolvedButtonAppearance,
    size: string,
    state: { readonly disabled: boolean; readonly loading: boolean; readonly iconOnly: boolean },
) => ({
    'data-variant': appearance.variant,
    'data-tone': appearance.tone,
    'data-severity': appearance.severity,
    'data-shape': appearance.shape,
    'data-size': size,
    'data-disabled': state.disabled || undefined,
    'data-loading': state.loading || undefined,
    'data-icon-only': state.iconOnly || undefined,
});

const ButtonSpinner = ({ parts }: { readonly parts: ButtonParts | undefined }) => (
    <span
        {...parts?.spinner}
        className={classNames('cratis-primereact-button__spinner', parts?.spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const ButtonIcon = ({
    icon,
    parts,
}: {
    readonly icon: ButtonProps['icon'];
    readonly parts: ButtonParts | undefined;
}) => (
    <span
        {...parts?.icon}
        className={classNames('cratis-primereact-button__icon', parts?.icon?.className)}
        data-cratis-part='icon'
        aria-hidden={parts?.icon?.['aria-hidden'] ?? true}
    >
        {renderIcon(icon)}
    </span>
);

const ButtonAdornment = ({
    loading,
    icon,
    parts,
}: {
    readonly loading: boolean;
    readonly icon: ButtonProps['icon'];
    readonly parts: ButtonParts | undefined;
}) => {
    if (loading) return <ButtonSpinner parts={parts} />;
    return icon ? <ButtonIcon icon={icon} parts={parts} /> : null;
};

const buttonState = (
    { disabled, loading, icon, label, children }: Pick<ButtonProps, 'disabled' | 'loading' | 'icon' | 'label' | 'children'>,
) => ({
    disabled: Boolean(disabled || loading),
    loading: loading ?? false,
    iconOnly: Boolean(icon) && label === undefined && !children,
});

const ButtonLabel = ({
    label,
    children,
    parts,
}: Pick<ButtonProps, 'label' | 'children'> & { readonly parts: ButtonParts | undefined }) => {
    if (label === undefined && children === undefined) return null;
    return (
        <span
            {...parts?.label}
            className={classNames('cratis-primereact-button__label', parts?.label?.className)}
            data-cratis-part='label'
        >
            {label}
            {children}
        </span>
    );
};

export const PrimeButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(
    function PrimeButtonSlot(props, ref) {
        const { options, rest } = splitAppearance(props);
        const {
            label,
            icon,
            loading,
            tooltip,
            tooltipOptions: _tooltipOptions,
            pt,
            size = 'normal',
            disabled,
            type = 'button',
            title,
            className,
            style,
            children,
            ...nativeProps
        } = rest;
        const appearance = resolveButtonAppearance(options);
        const state = buttonState({ disabled, loading, icon, label, children });
        return (
            <PrimeButton
                {...pt?.root}
                {...nativeProps}
                as='button'
                ref={ref}
                type={type}
                disabled={state.disabled}
                className={classNames(
                    'cratis-primereact-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                variant={primeVariant(appearance.variant)}
                severity={appearance.severity}
                rounded={appearance.shape === 'pill'}
                size={size}
                iconOnly={state.iconOnly}
                {...rootState(state.loading, { 'aria-busy': nativeProps['aria-busy'], title }, pt?.root, tooltip)}
                data-cratis-part='root'
                {...buttonDataAttributes(appearance, size, state)}
            >
                <ButtonAdornment loading={state.loading} icon={icon} parts={pt} />
                <ButtonLabel label={label} parts={pt}>
                    {children}
                </ButtonLabel>
            </PrimeButton>
        );
    },
);

export const PrimeIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function PrimeIconButtonSlot(props, ref) {
        return (
            <PrimeButtonSlot
                {...props}
                ref={ref}
                shape={props.shape ?? 'pill'}
                label={undefined}
            />
        );
    },
);
