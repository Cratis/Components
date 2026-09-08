// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type Rule } from 'postcss';
import { describe, it } from 'vitest';

const source = readFileSync(new URL('../Dropdown.css', import.meta.url), 'utf8');
const root = postcss.parse(source);

const isWithinForcedColors = (rule: Rule) =>
    rule.parent?.type === 'atrule' &&
    'name' in rule.parent &&
    rule.parent.name === 'media' &&
    'params' in rule.parent &&
    typeof rule.parent.params === 'string' &&
    rule.parent.params.includes('forced-colors');

/**
 * Finds every rule matching `selector` in the requested (forced-colors or normal-color)
 * context, together with its position among rules in that same context. Returning every
 * match - instead of silently keeping only the last one seen - lets callers assert there
 * is exactly one, so an accidental duplicate selector fails loudly instead of the test
 * quietly grading whichever rule happened to be declared last.
 */
const rulesMatching = (selector: string, insideForcedColors: boolean) => {
    const matches: { rule: Rule; order: number }[] = [];
    let order = 0;
    root.walkRules((rule: Rule) => {
        if (isWithinForcedColors(rule) === insideForcedColors && rule.selectors.includes(selector)) {
            matches.push({ rule, order });
        }
        order += 1;
    });
    return matches;
};

const theOneRuleFor = (selector: string, insideForcedColors: boolean) => {
    const matches = rulesMatching(selector, insideForcedColors);
    expect(
        matches,
        `expected exactly one '${selector}' rule ${insideForcedColors ? 'inside' : 'outside'} @media (forced-colors: active)`,
    ).to.have.lengthOf(1);
    return matches[0];
};

const declarationsFor = (selector: string, insideForcedColors: boolean) =>
    theOneRuleFor(selector, insideForcedColors)
        .rule.nodes.filter((node) => node.type === 'decl')
        .map((node) => `${node.prop}:${node.value}`);

describe('when styling Dropdown option focus', () => {
    it('should_order_the_focus_visible_rule_after_the_selected_rule_so_both_apply_together', () => {
        // Cascade order, not exact declarations: [data-focus-visible] must lose no ground to
        // [data-selected] on a focused-and-selected option, or the ring would be overridden.
        const selected = theOneRuleFor('.cratis-dropdown__option[data-selected]', false);
        const focusVisible = theOneRuleFor('.cratis-dropdown__option[data-focus-visible]', false);
        expect(focusVisible.order).to.be.greaterThan(selected.order);
    });

    it('should_declare_a_focus_visible_box_shadow_consuming_the_shared_focus_ring_token', () => {
        // Deliberately not asserting the exact declaration byte-for-byte (e.g. `inset` or
        // spacing) - only that focus-visible paints via the public, themeable token rather
        // than a hardcoded color, so the ring stays correct if the token's own value changes.
        const declarations = declarationsFor('.cratis-dropdown__option[data-focus-visible]', false);
        const boxShadow = declarations.find((declaration) => declaration.startsWith('box-shadow:'));
        expect(boxShadow, 'expected a box-shadow declaration for the focus-visible state').to.exist;
        expect(boxShadow).to.include('var(--cratis-focus-ring)');
    });

    it('should_keep_the_forced_colors_highlight_outline_for_focused_and_selected_options', () => {
        // Forced-colors system keywords are an exact OS contract, not a themeable token, so
        // pinning the literal value here is intentional rather than brittle.
        const focused = declarationsFor('.cratis-dropdown__option[data-focused]', true);
        const selected = declarationsFor('.cratis-dropdown__option[data-selected]', true);
        expect(focused).to.include('outline:2px solid Highlight');
        expect(selected).to.include('outline:2px solid Highlight');
    });
});
