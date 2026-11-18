// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonProps, ButtonSeverity, ButtonTone } from '@cratis/components/Common';

/** Cratis button variants, as resolved from the current and deprecated props. */
export type CratisButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

/** Designsystemet button variants. */
export type DesignsystemetButtonVariant = 'primary' | 'secondary' | 'tertiary';

/** Designsystemet size modes. `undefined` leaves the inherited size mode in force. */
export type DesignsystemetSize = 'sm' | 'lg' | undefined;

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

const colorForTone: Readonly<Record<ButtonTone, string>> = {
    neutral: 'neutral',
    accent: 'accent',
    positive: 'success',
    caution: 'warning',
    critical: 'danger',
};

const variantForCratis: Readonly<Record<CratisButtonVariant, DesignsystemetButtonVariant>> = {
    solid: 'primary',
    outline: 'secondary',
    ghost: 'tertiary',
    link: 'tertiary',
};

/**
 * Maps a Cratis button size to a Designsystemet size mode. `normal` is left unset on purpose so a
 * `data-size` on an enclosing container (a form, a toolbar) keeps governing the button.
 */
export const sizeMode = (size: 'small' | 'normal' | 'large' | undefined): DesignsystemetSize => {
    if (size === 'small') return 'sm';
    if (size === 'large') return 'lg';
    return undefined;
};

/** Maps a Cratis tone to a Designsystemet `data-color` value; `undefined` keeps the inherited color. */
export const colorForCratisTone = (tone: ButtonTone | undefined) =>
    tone ? colorForTone[tone] : undefined;

/** Maps a Cratis variant to the Designsystemet variant. */
export const designsystemetVariant = (variant: CratisButtonVariant) => variantForCratis[variant];

/** The button appearance resolved from the current and deprecated Cratis props. */
export interface ResolvedButtonAppearance {
    readonly variant: CratisButtonVariant;
    readonly tone: ButtonTone | undefined;
    readonly shape: 'default' | 'pill';
    readonly severity: ButtonSeverity | undefined;
}

type AppearanceOptions = Pick<
    ButtonProps,
    'variant' | 'tone' | 'shape' | 'text' | 'link' | 'outlined' | 'rounded' | 'severity'
>;

const resolveVariant = ({ variant, link, text, outlined }: AppearanceOptions): CratisButtonVariant => {
    if (variant) return variant;
    if (link) return 'link';
    if (text) return 'ghost';
    if (outlined) return 'outline';
    return 'solid';
};

/** Resolves the Cratis variant, tone and shape, honouring the deprecated boolean props. */
export const resolveButtonAppearance = (options: AppearanceOptions): ResolvedButtonAppearance => {
    const { tone, shape, rounded, severity } = options;
    return {
        variant: resolveVariant(options),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};
