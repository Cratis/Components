// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type AtRule, type Rule } from 'postcss';
import { beforeEach, describe, it } from 'vitest';

const collections = readFileSync(
    new URL('../Common/Collections.css', import.meta.url),
    'utf8',
);

const inForcedColors = (rule: Rule): boolean =>
    rule.parent?.type === 'atrule' &&
    (rule.parent as AtRule).params.includes('forced-colors');

describe('when showing collection focus in forced colors', () => {
    let focusSelectors: string[];
    let forcedColorsFocus: Map<string, Record<string, string>>;

    beforeEach(() => {
        focusSelectors = [];
        forcedColorsFocus = new Map();
        postcss.parse(collections).walkRules((rule) => {
            const declarations: Record<string, string> = {};
            rule.walkDecls((decl) => {
                declarations[decl.prop] = decl.value;
            });
            const forced = inForcedColors(rule);
            for (const selector of rule.selectors) {
                if (!selector.endsWith(':focus-visible') || selector.includes('[data-selected]')) continue;
                if (forced) forcedColorsFocus.set(selector, declarations);
                else if (declarations['box-shadow']?.includes('--cratis-focus-ring')) {
                    focusSelectors.push(selector);
                }
            }
        });
    });

    it('should_draw_the_focus_ring_for_the_collection_controls', () => {
        expect(focusSelectors).to.have.length.greaterThan(5);
    });

    it('should_give_every_focus_ring_selector_a_system_colour_outline', () => {
        for (const selector of focusSelectors) {
            const forced = forcedColorsFocus.get(selector);
            expect(forced, selector).to.not.equal(undefined);
            expect(forced?.outline, selector).to.equal('2px solid Highlight');
            expect(forced?.['outline-offset'], selector).to.equal('2px');
        }
    });

    it('should_keep_the_selected_focus_outline_visible_against_the_highlight_background', () => {
        let selectedOutline: string | undefined;
        postcss.parse(collections).walkRules((rule) => {
            if (
                inForcedColors(rule) &&
                rule.selectors.includes('.cratis-tabs__tab[data-selected]:focus-visible')
            ) {
                rule.walkDecls('outline-color', (decl) => {
                    selectedOutline = decl.value;
                });
            }
        });

        expect(selectedOutline).to.equal('CanvasText');
    });
});
