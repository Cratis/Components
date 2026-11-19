// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, useCallback } from 'react';
import {
    Button as PrimeButton,
    type ButtonPassThroughOptions,
} from 'primereact/button/button.cjs.js';
import type { ButtonProps, IconButtonProps } from '@cratis/components/Common';
import {
    primeSeverity,
    resolveButtonAppearance,
    type ButtonAppearanceOptions,
    type ResolvedButtonAppearance,
} from './buttonAppearance.js';
import { assignRef, classNames, renderIcon } from './shared.js';

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
    options: {
        variant,
        tone,
        shape,
        text,
        link,
        outlined,
        rounded,
        severity,
    } satisfies ButtonAppearanceOptions,
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
    state: {
        readonly disabled: boolean;
        readonly loading: boolean;
        readonly iconOnly: boolean;
    },
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

const buttonState = ({
    disabled,
    loading,
    icon,
    label,
    children,
}: Pick<ButtonProps, 'disabled' | 'loading' | 'icon' | 'label' | 'children'>) => ({
    disabled: Boolean(disabled || loading),
    loading: loading ?? false,
    iconOnly: Boolean(icon) && label === undefined && !children,
});

// SAFETY: PrimeReact accepts either span or SVG attributes for its loading icon. The
// portable spinner part contains only attributes valid on both verified destinations.
const buttonPassThrough = (parts: ButtonParts | undefined) =>
    ({
        loadingIcon: {
            ...parts?.spinner,
            className: classNames(
                'cratis-primereact10-button__spinner',
                parts?.spinner?.className,
            ),
            'data-cratis-part': 'spinner',
            'aria-hidden': true,
        },
    }) as unknown as ButtonPassThroughOptions;

const ButtonIcon = ({
    loading,
    icon,
    parts,
}: {
    readonly loading: boolean;
    readonly icon: ButtonProps['icon'];
    readonly parts: ButtonParts | undefined;
}) =>
    !loading && icon ? (
        <span
            {...parts?.icon}
            className={classNames(
                'cratis-primereact10-button__icon',
                parts?.icon?.className,
            )}
            data-cratis-part='icon'
            aria-hidden={parts?.icon?.['aria-hidden'] ?? true}
        >
            {renderIcon(icon)}
        </span>
    ) : null;

const ButtonLabel = ({
    label,
    children,
    parts,
}: Pick<ButtonProps, 'label' | 'children'> & {
    readonly parts: ButtonParts | undefined;
}) => {
    if (label === undefined && children === undefined) return null;
    return (
        <span
            {...parts?.label}
            className={classNames(
                'cratis-primereact10-button__label',
                parts?.label?.className,
            )}
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
        const nativeButtonRef = useCallback(
            (value: unknown) => {
                // SAFETY: PrimeReact 10.9.9's Button runtime forwards its ref to the native
                // button although its legacy declaration still describes a class component.
                // Only that verified native node crosses the Cratis ref boundary.
                const button =
                    typeof HTMLButtonElement !== 'undefined' &&
                    value instanceof HTMLButtonElement
                        ? value
                        : null;
                assignRef(ref, button);
            },
            [ref],
        );
        return (
            <PrimeButton
                {...pt?.root}
                {...nativeProps}
                ref={nativeButtonRef}
                type={type}
                disabled={state.disabled}
                loading={state.loading}
                text={appearance.variant === 'ghost'}
                link={appearance.variant === 'link'}
                outlined={appearance.variant === 'outline'}
                severity={primeSeverity(appearance.severity)}
                rounded={appearance.shape === 'pill'}
                size={size === 'normal' ? undefined : size}
                className={classNames(
                    'cratis-primereact10-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                {...rootState(
                    state.loading,
                    { 'aria-busy': nativeProps['aria-busy'], title },
                    pt?.root,
                    tooltip,
                )}
                data-cratis-part='root'
                {...buttonDataAttributes(appearance, size, state)}
                pt={buttonPassThrough(pt)}
            >
                <ButtonIcon loading={state.loading} icon={icon} parts={pt} />
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
