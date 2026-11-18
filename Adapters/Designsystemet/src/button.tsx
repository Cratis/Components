// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ReactNode, type SVGAttributes } from 'react';
import { Button as DsButton, Spinner as DsSpinner } from '@digdir/designsystemet-react';
import type { ButtonProps, IconButtonProps } from '@cratis/components/Common';
import {
    colorForCratisTone,
    designsystemetVariant,
    resolveButtonAppearance,
    sizeMode,
} from './appearance.js';
import { classNames } from './classNames.js';

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const warnedDeprecatedProps = new Set<string>();

const warnForDeprecatedProps = (props: Readonly<Record<string, unknown>>) => {
    const environment = (
        globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }
    ).process?.env?.NODE_ENV;
    if (environment === 'production') return;
    for (const prop of ['text', 'link', 'outlined', 'rounded', 'severity']) {
        if (props[prop] === undefined || warnedDeprecatedProps.has(prop)) continue;
        warnedDeprecatedProps.add(prop);
        console.warn(
            `Button prop "${prop}" is deprecated and will be removed in 5.0. Use variant, tone, or shape instead.`,
        );
    }
};

const spinnerFor = (pt: ButtonProps['pt']) => (
    <DsSpinner
        {...(pt?.spinner as SVGAttributes<SVGSVGElement> | undefined)}
        className={classNames('cratis-designsystemet-button__spinner', pt?.spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const iconFor = (icon: ReactNode, pt: ButtonProps['pt']) => (
    <span
        {...pt?.icon}
        className={classNames('cratis-designsystemet-button__icon', pt?.icon?.className)}
        data-cratis-part='icon'
        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
    >
        {renderIcon(icon)}
    </span>
);

const labelFor = (label: ReactNode, children: ReactNode, pt: ButtonProps['pt']) =>
    label !== undefined || children !== undefined ? (
        <span
            {...pt?.label}
            className={classNames('cratis-designsystemet-button__label', pt?.label?.className)}
            data-cratis-part='label'
        >
            {label}
            {children}
        </span>
    ) : null;

/**
 * Tooltip text is exposed through the native `title` attribute, never through the upstream
 * `data-tooltip` script, which rewrites `aria-label` after mount and would replace the caller's
 * accessible name. `tooltipOptions` has no counterpart (no tooltip element is rendered).
 *
 * Designsystemet owns `data-size` as an inherited size mode and `data-variant`/`data-color` as its
 * own appearance vocabulary. The Cratis values for those attributes (`normal`, `solid`, ...) are
 * therefore never forwarded; they are translated by {@link sizeMode} and friends.
 */
const MappedButton = forwardRef<
    HTMLButtonElement,
    ButtonProps & { readonly iconOnly: boolean; readonly rootClassName: string }
>(function MappedButton(props, ref) {
    const {
        label,
        icon,
        loading = false,
        tooltip,
        pt,
        variant,
        tone,
        shape,
        text,
        link,
        outlined,
        rounded,
        severity,
        size,
        disabled,
        type = 'button',
        className,
        style,
        children,
        iconOnly,
        rootClassName,
        ...nativeProps
    } = props;
    warnForDeprecatedProps({ text, link, outlined, rounded, severity });
    const appearance = resolveButtonAppearance({ variant, tone, shape, text, link, outlined, rounded, severity });
    const effectiveDisabled = Boolean(disabled || loading);
    return (
        <DsButton
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            title={tooltip ?? pt?.root?.title ?? nativeProps.title}
            disabled={effectiveDisabled}
            className={classNames(rootClassName, pt?.root?.className, className)}
            style={{
                ...pt?.root?.style,
                ...style,
                ...(appearance.shape === 'pill' ? { borderRadius: '9999px' } : undefined),
            }}
            variant={designsystemetVariant(appearance.variant)}
            icon={iconOnly}
            loading={loading ? spinnerFor(pt) : false}
            data-size={sizeMode(size)}
            data-color={colorForCratisTone(appearance.tone)}
            data-cratis-part='root'
            data-cratis-variant={appearance.variant}
            data-tone={appearance.tone}
            data-severity={appearance.severity}
            data-shape={appearance.shape}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            data-icon-only={iconOnly || undefined}
        >
            {icon && !loading ? iconFor(icon, pt) : null}
            {labelFor(label, children, pt)}
        </DsButton>
    );
});

/** Designsystemet implementation of `common.button`. */
export const DesignsystemetButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(
    function DesignsystemetButtonSlot(props, ref) {
        const iconOnly = Boolean(props.icon) && props.label === undefined && !props.children;
        return (
            <MappedButton
                {...props}
                ref={ref}
                iconOnly={iconOnly}
                rootClassName='cratis-designsystemet-button'
            />
        );
    },
);

/** Designsystemet implementation of `common.iconButton`. */
export const DesignsystemetIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function DesignsystemetIconButtonSlot(props, ref) {
        return (
            <MappedButton
                {...props}
                ref={ref}
                shape={props.shape ?? 'pill'}
                label={undefined}
                iconOnly
                rootClassName='cratis-designsystemet-icon-button'
            />
        );
    },
);
