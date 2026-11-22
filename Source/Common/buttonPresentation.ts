// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonProps, ButtonSeverity, ButtonTone } from './Button';

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

/** The new and deprecated props that decide a button's presentation. */
export type ButtonPresentationProps = Pick<
    ButtonProps,
    'variant' | 'tone' | 'shape' | 'text' | 'link' | 'outlined' | 'rounded' | 'severity'
>;

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

const deprecatedPropOrder: readonly DeprecatedButtonProp[] = ['text', 'link', 'outlined', 'rounded', 'severity'];

/** Warns once per module session for each deprecated prop that was supplied. */
export const warnForDeprecatedProps = (props: ButtonPresentationProps) => {
    deprecatedPropOrder.forEach((prop) => {
        if (props[prop] !== undefined) warnForDeprecatedProp(prop);
    });
};

const legacyVariant = ({ link, text, outlined }: ButtonPresentationProps) => {
    if (link) return 'link';
    if (text) return 'ghost';
    return outlined ? 'outline' : 'solid';
};

/** Resolves the emitted variant, tone, legacy severity and shape, preferring the new props. */
export const resolveButtonPresentation = (props: ButtonPresentationProps) => {
    const { variant, tone, shape, rounded, severity } = props;
    return {
        variant: variant ?? legacyVariant(props),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};
