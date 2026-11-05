// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type AtRule, type Rule } from 'postcss';
import { beforeEach, describe, it } from 'vitest';

const theme = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');
const topicList = readFileSync(new URL('../Chat/ChatTopicList.css', import.meta.url), 'utf8');

// WCAG 2.x AA minimum for normal-size text.
const minimumContrast = 4.5;

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

// A scheme overrides the light defaults, so resolve against the scheme first and then the light base.
function resolve(rules: Rule[], value: string): string {
    const reference = /^var\((--[\w-]+)\)$/.exec(value);
    if (!reference) return value;
    for (const rule of rules) {
        const resolved = declaration(rule, reference[1]);
        if (resolved !== undefined) return resolve(rules, resolved);
    }
    throw new Error(`${reference[1]} is not declared for ${value}`);
}

function isForcedColors(rule: Rule): boolean {
    return rule.parent?.type === 'atrule' && (rule.parent as AtRule).params === '(forced-colors: active)';
}

describe('when hovering the new topic button', () => {
    let normal: Rule;
    let hover: Rule;
    let disabled: Rule;
    let forcedTheme: Rule | undefined;
    let schemes: Map<string, Rule[]>;

    beforeEach(() => {
        postcss.parse(topicList).walkRules(rule => {
            if (rule.selectors.includes('.cratis-chat-topics__start:hover:not(:disabled)')) hover = rule;
            else if (rule.selectors.includes('.cratis-chat-topics__start:disabled')) disabled = rule;
            else if (rule.selectors.includes('.cratis-chat-topics__start')) normal = rule;
        });

        let light: Rule | undefined;
        let dark: Rule | undefined;
        let systemDark: Rule | undefined;
        postcss.parse(theme).walkRules(rule => {
            if (isForcedColors(rule)) {
                if (rule.selectors.includes(':root') && declaration(rule, '--cratis-primary-600') !== undefined) forcedTheme = rule;
                return;
            }
            if (rule.selectors.includes('.cratis-theme') && declaration(rule, '--cratis-primary-600') !== undefined) light = rule;
            if (rule.selectors.includes(':root.cratis-dark') && declaration(rule, '--cratis-primary-color') !== undefined) dark = rule;
            if (rule.selectors.includes(':root:not(.cratis-light)') && declaration(rule, '--cratis-primary-color') !== undefined) systemDark = rule;
        });
        schemes = new Map([
            ['light', [light!]],
            ['explicit dark', [dark!, light!]],
            ['system dark', [systemDark!, light!]],
        ]);
    });

    it('should_find_the_new_topic_rules_and_every_color_scheme', () => {
        expect(normal).not.to.be.undefined;
        expect(hover).not.to.be.undefined;
        expect(schemes.get('light')![0]).not.to.be.undefined;
        expect(schemes.get('explicit dark')![0]).not.to.be.undefined;
        expect(schemes.get('system dark')![0]).not.to.be.undefined;
    });

    it('should_pair_the_hover_foreground_with_the_hover_background', () => {
        expect(declaration(hover, 'background')).to.equal('var(--cratis-primary-600)');
        expect(declaration(hover, 'color')).to.equal('var(--cratis-primary-600-text)');
    });

    it('should_reach_the_minimum_contrast_in_the_normal_state_in_every_scheme', () => {
        for (const [scheme, rules] of schemes) {
            const foreground = resolve(rules, declaration(normal, 'color')!);
            const background = resolve(rules, declaration(normal, 'background')!);
            expect(contrast(foreground, background), `${scheme} normal`).to.be.at.least(minimumContrast);
        }
    });

    it('should_reach_the_minimum_contrast_in_the_hover_state_in_every_scheme', () => {
        for (const [scheme, rules] of schemes) {
            const foreground = resolve(rules, declaration(hover, 'color') ?? declaration(normal, 'color')!);
            const background = resolve(rules, declaration(hover, 'background')!);
            expect(contrast(foreground, background), `${scheme} hover`).to.be.at.least(minimumContrast);
        }
    });

    it('should_map_the_hover_pair_to_system_colors_when_forced_colors_are_active', () => {
        expect(forcedTheme).not.to.be.undefined;
        expect(declaration(forcedTheme!, '--cratis-primary-600')).to.equal('Highlight');
        expect(declaration(forcedTheme!, '--cratis-primary-600-text')).to.equal('HighlightText');
    });

    it('should_leave_the_disabled_button_unaffected_by_the_hover_pair', () => {
        expect(hover.selectors).to.deep.equal(['.cratis-chat-topics__start:hover:not(:disabled)']);
        expect(declaration(disabled, 'opacity')).to.equal('0.35');
        expect(declaration(disabled, 'color')).to.be.undefined;
        expect(declaration(disabled, 'background')).to.be.undefined;
    });
});
