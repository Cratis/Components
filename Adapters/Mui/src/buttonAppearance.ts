// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonProps, ButtonSeverity, ButtonTone } from '@cratis/components/Common';

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

const toneForSeverity: Readonly<Record<ButtonSeverity, ButtonTone>> = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

const severityForTone: Readonly<Record<ButtonTone, ButtonSeverity>> = {
    neutral: 'secondary',
    accent: 'info',
    positive: 'success',
    caution: 'warn',
    critical: 'danger',
};

const colorForTone: Readonly<Record<ButtonTone, 'primary' | 'secondary' | 'success' | 'warning' | 'error'>> = {
    neutral: 'secondary',
    positive: 'success',
    caution: 'warning',
    critical: 'error',
    accent: 'primary',
};

const variantForButtonVariant: Readonly<Record<ButtonVariant, 'contained' | 'outlined' | 'text'>> = {
    solid: 'contained',
    outline: 'outlined',
    ghost: 'text',
    link: 'text',
};

export const muiColorForTone = (tone: ButtonTone | undefined) =>
    (tone && colorForTone[tone]) ?? 'primary';

export const muiVariant = (variant: ButtonVariant) => {
    const muiVariantName = variantForButtonVariant[variant];
    if (!muiVariantName)
        throw new Error(`Unsupported Button variant '${String(variant)}'.`);
    return muiVariantName;
};

export const muiSize = (size: 'small' | 'normal' | 'large'): 'small' | 'medium' | 'large' =>
    size === 'normal' ? 'medium' : size;

type DeprecatedButtonProp = 'severity' | 'text' | 'link' | 'outlined' | 'rounded';
const deprecatedButtonProps: readonly DeprecatedButtonProp[] = [
    'text',
    'link',
    'outlined',
    'rounded',
    'severity',
];
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

export interface ResolvedButtonAppearance {
    readonly variant: ButtonVariant;
    readonly tone: ButtonTone | undefined;
    readonly shape: 'default' | 'pill';
    readonly severity: ButtonSeverity | undefined;
}

interface ButtonAppearanceOptions {
    readonly variant: ButtonProps['variant'];
    readonly tone: ButtonProps['tone'];
    readonly shape: ButtonProps['shape'];
    readonly text: ButtonProps['text'];
    readonly link: ButtonProps['link'];
    readonly outlined: ButtonProps['outlined'];
    readonly rounded: ButtonProps['rounded'];
    readonly severity: ButtonProps['severity'];
}

const resolveButtonVariant = ({
    variant,
    link,
    text,
    outlined,
}: ButtonAppearanceOptions): ButtonVariant => {
    if (variant) return variant;
    if (link) return 'link';
    if (text) return 'ghost';
    if (outlined) return 'outline';
    return 'solid';
};

const warnForDeprecatedProps = (options: ButtonAppearanceOptions) => {
    for (const prop of deprecatedButtonProps)
        if (options[prop] !== undefined) warnForDeprecatedProp(prop);
};

export const resolveButtonAppearance = (
    options: ButtonAppearanceOptions,
): ResolvedButtonAppearance => {
    const { tone, shape, rounded, severity } = options;
    warnForDeprecatedProps(options);
    return {
        variant: resolveButtonVariant(options),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};
