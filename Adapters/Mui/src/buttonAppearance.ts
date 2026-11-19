// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonProps, ButtonSeverity, ButtonTone } from '@cratis/components/Common';

export const toneForSeverity: Readonly<Record<ButtonSeverity, ButtonTone>> = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

export const severityForTone: Readonly<Record<ButtonTone, ButtonSeverity>> = {
    neutral: 'secondary',
    accent: 'info',
    positive: 'success',
    caution: 'warn',
    critical: 'danger',
};

export const muiColorForTone = (tone: ButtonTone | undefined) => {
    switch (tone) {
        case 'neutral':
            return 'secondary';
        case 'positive':
            return 'success';
        case 'caution':
            return 'warning';
        case 'critical':
            return 'error';
        case 'accent':
        default:
            return 'primary';
    }
};

export const muiVariant = (variant: 'solid' | 'outline' | 'ghost' | 'link') => {
    switch (variant) {
        case 'solid':
            return 'contained';
        case 'outline':
            return 'outlined';
        case 'ghost':
        case 'link':
            return 'text';
        default:
            throw new Error(`Unsupported Button variant '${String(variant)}'.`);
    }
};

export const muiSize = (size: 'small' | 'normal' | 'large') =>
    size === 'normal' ? 'medium' : size;

export type DeprecatedButtonProp = 'severity' | 'text' | 'link' | 'outlined' | 'rounded';
export const warnedDeprecatedProps = new Set<DeprecatedButtonProp>();

export const warnForDeprecatedProp = (prop: DeprecatedButtonProp) => {
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
    readonly variant: 'solid' | 'outline' | 'ghost' | 'link';
    readonly tone: ButtonTone | undefined;
    readonly shape: 'default' | 'pill';
    readonly severity: ButtonSeverity | undefined;
}

export interface ButtonAppearanceOptions {
    readonly variant: ButtonProps['variant'];
    readonly tone: ButtonProps['tone'];
    readonly shape: ButtonProps['shape'];
    readonly text: ButtonProps['text'];
    readonly link: ButtonProps['link'];
    readonly outlined: ButtonProps['outlined'];
    readonly rounded: ButtonProps['rounded'];
    readonly severity: ButtonProps['severity'];
}

export const resolveButtonVariant = ({
    variant,
    link,
    text,
    outlined,
}: ButtonAppearanceOptions): ResolvedButtonAppearance['variant'] => {
    if (variant) return variant;
    if (link) return 'link';
    if (text) return 'ghost';
    if (outlined) return 'outline';
    return 'solid';
};

export const resolveButtonAppearance = (
    options: ButtonAppearanceOptions,
): ResolvedButtonAppearance => {
    const { tone, shape, text, link, outlined, rounded, severity } = options;
    if (text !== undefined) warnForDeprecatedProp('text');
    if (link !== undefined) warnForDeprecatedProp('link');
    if (outlined !== undefined) warnForDeprecatedProp('outlined');
    if (rounded !== undefined) warnForDeprecatedProp('rounded');
    if (severity !== undefined) warnForDeprecatedProp('severity');
    return {
        variant: resolveButtonVariant(options),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};

