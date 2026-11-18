// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss';
import { describe, it } from 'vitest';

const sourceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(sourceDirectory, path), 'utf8');

const valueOf = (css: string, selectorPattern: RegExp, property: string): string | undefined => {
    let value: string | undefined;
    postcss.parse(css).walkRules((rule) => {
        if (!rule.selectors.some((selector) => selectorPattern.test(selector))) return;
        rule.walkDecls(property, (decl) => {
            value = decl.value;
        });
    });
    return value;
};

// Stage 2 of Cratis/Components#529 adds the outline hook to every component rule that draws the focus
// ring. Until that lands (the component stylesheets are shared with other lanes), the cross-file check
// below stays pending; the token and bridge checks run now.
const componentRulesAreConverted = false;
const itForComponentRules = componentRulesAreConverted ? it : it.skip;

// Rules that intentionally do not take the outline hook. Each needs a reason.
const ALLOWED_WITHOUT_OUTLINE_HOOK: Record<string, string> = {
    'Dropdown/Dropdown.css|.cratis-dropdown__option:focus-visible':
        'inset option ring inside a scrolling list: an outline would be clipped by the panel',
};

const importedStylesheets = (): string[] =>
    [...read('styles.css').matchAll(/@import\s+(?:url\()?['"]([^'"]+\.css)['"]/g)].map(
        (match) => match[1],
    );

const insideForcedColors = (rule: Rule): boolean => {
    let parent = rule.parent;
    while (parent) {
        if (parent.type === 'atrule' && (parent as AtRule).params.includes('forced-colors')) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
};

describe('when providing a focus outline hook', () => {
    it('should_default_the_outline_hook_to_none_in_tokens', () => {
        const tokens = read('tokens.css');

        expect(valueOf(tokens, /^:root$/, '--cratis-focus-outline')).to.equal('none');
        expect(valueOf(tokens, /^:root$/, '--cratis-focus-outline-offset')).to.equal('0');
    });

    it('should_keep_the_outline_hook_in_the_scoped_light_block_of_the_theme', () => {
        const theme = read('theme.css');

        expect(valueOf(theme, /^\.cratis-theme$/, '--cratis-focus-outline')).to.equal('none');
        expect(valueOf(theme, /^\.cratis-theme$/, '--cratis-focus-outline-offset')).to.equal('0');
    });

    it('should_map_the_hook_to_the_designsystemet_outer_focus_colour_in_the_bridge', () => {
        const bridge = read('themes/designsystemet.css');

        expect(valueOf(bridge, /^:root$/, '--cratis-focus-outline')).to.equal(
            'var(--ds-color-focus-outer) solid var(--ds-border-width-focus)',
        );
        expect(valueOf(bridge, /^:root$/, '--cratis-focus-outline-offset')).to.equal(
            'var(--ds-border-width-focus)',
        );
    });

    itForComponentRules('should_let_every_focus_ring_rule_declare_the_outline_hook', () => {
        const offenders: string[] = [];
        for (const file of importedStylesheets()) {
            postcss.parse(read(file)).walkRules((rule) => {
                if (insideForcedColors(rule)) return;
                const declarations: Declaration[] = [];
                rule.each((node) => {
                    if (node.type === 'decl') declarations.push(node);
                });
                const drawsRing = declarations.some(
                    (decl) =>
                        decl.prop === 'box-shadow' && decl.value.includes('var(--cratis-focus-ring)'),
                );
                if (!drawsRing) return;
                const hasOutline = declarations.some(
                    (decl) => decl.prop === 'outline' && decl.value.includes('--cratis-focus-outline'),
                );
                const hasOffset = declarations.some(
                    (decl) =>
                        decl.prop === 'outline-offset' &&
                        decl.value.includes('--cratis-focus-outline-offset'),
                );
                const key = `${file}|${rule.selector}`;
                if (!(hasOutline && hasOffset) && !(key in ALLOWED_WITHOUT_OUTLINE_HOOK)) {
                    offenders.push(key);
                }
            });
        }

        expect(offenders).to.deep.equal([]);
    });
});
