// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type AtRule, type Rule } from 'postcss';
import { beforeEach, describe, it } from 'vitest';

const theme = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');

// WCAG 2.x AA minimum for normal-size text.
const minimumContrast = 4.5;

// Surfaces a field's validation message is drawn on.
const textSurfaces = [
    '--cratis-surface-ground',
    '--cratis-surface-section',
    '--cratis-surface-card',
    '--cratis-surface-overlay',
    '--cratis-control-background',
];

function declaration(rule: Rule, property: string): string | undefined {
    return rule.nodes.findLast(node => node.type === 'decl' && node.prop === property)?.value;
}

function channel(hex: string, start: number): number {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
    const hex = color.trim().replace('#', '');
    const full = hex.length === 3 ? [...hex].map(character => character + character).join('') : hex;
    return 0.2126 * channel(full, 0) + 0.7152 * channel(full, 2) + 0.0722 * channel(full, 4);
}

function contrast(foreground: string, background: string): number {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
}

function resolve(rule: Rule, value: string): string {
    const reference = /^var\((--[\w-]+)\)$/.exec(value);
    if (!reference) return value;
    const resolved = declaration(rule, reference[1]);
    if (resolved === undefined) throw new Error(`${reference[1]} is not declared next to ${value}`);
    return resolve(rule, resolved);
}

describe('when using the error color on dark surfaces', () => {
    let darkRules: Rule[];
    let lightSubtreeRules: Rule[];

    beforeEach(() => {
        darkRules = [];
        lightSubtreeRules = [];
        postcss.parse(theme).walkRules(rule => {
            // Forced colors replace the palette with system colors, so contrast is the user's own.
            if (rule.parent?.type === 'atrule' && (rule.parent as AtRule).params === '(forced-colors: active)') return;
            if (rule.selectors.includes(':root.cratis-dark') || rule.selectors.includes(':root:not(.cratis-light)')) {
                if (declaration(rule, '--cratis-surface-card') !== undefined) darkRules.push(rule);
            } else if (rule.selectors.includes('.cratis-dark .cratis-theme.cratis-light')) {
                lightSubtreeRules.push(rule);
            }
        });
    });

    it('should_find_both_the_explicit_and_the_system_dark_scheme', () => {
        expect(darkRules).to.have.lengthOf(2);
    });

    it('should_map_the_error_color_in_every_dark_scheme', () => {
        for (const rule of darkRules) {
            expect(declaration(rule, '--color-error'), rule.selectors.join(', ')).not.to.be.undefined;
        }
    });

    it('should_reach_the_minimum_contrast_on_every_dark_text_surface', () => {
        for (const rule of darkRules) {
            const error = resolve(rule, declaration(rule, '--color-error')!);
            for (const surface of textSurfaces) {
                const background = resolve(rule, declaration(rule, surface)!);
                expect(contrast(error, background), `${rule.selectors[0]} on ${surface}`).to.be.at.least(minimumContrast);
            }
        }
    });

    it('should_give_a_light_subtree_inside_a_dark_root_its_own_error_color', () => {
        const restored = lightSubtreeRules.find(rule => declaration(rule, '--color-error') !== undefined);
        expect(restored).not.to.be.undefined;
        expect(contrast(resolve(restored!, declaration(restored!, '--color-error')!), '#ffffff')).to.be.at.least(minimumContrast);
    });
});
