// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type Rule } from 'postcss';
import { describe, it } from 'vitest';

// `DataTableCore` bounds its scroll container with a percentage `max-height`. CSS resolves a
// percentage `max-height` to `none` whenever the containing block's height is not definite
// (CSS 2.1 10.7), and the table root is `height: auto` by default. A scrollable table therefore
// grew past its parent and was clipped by the surrounding `overflow: hidden` instead of
// scrolling. The scrollable modifier restores a definite height so the bound can resolve.
//
// Layout is not asserted here because jsdom does not lay out; the stylesheet contract that the
// resolution depends on is asserted instead.

const source = readFileSync(new URL('../DataTableCore.css', import.meta.url), 'utf8');

const declarationsFor = (selector: string) => {
    const declarations = new Map<string, string>();

    postcss.parse(source).walkRules((rule: Rule) => {
        if (!rule.selectors.includes(selector)) return;

        for (const node of rule.nodes) {
            if (node.type === 'decl') declarations.set(node.prop, node.value);
        }
    });

    return declarations;
};

describe('when resolving the DataTableCore scroll bound', () => {
    it('should_give_the_scrollable_root_a_definite_height', () => {
        const declarations = declarationsFor('.cratis-datatable--scrollable');

        expect(declarations.get('height')).to.equal('100%');
        expect(declarations.get('min-height')).to.equal('0');
    });

    it('should_let_the_scroll_container_absorb_the_remaining_height', () => {
        const declarations = declarationsFor(
            '.cratis-datatable--scrollable .cratis-datatable__container',
        );

        expect(declarations.get('flex')).to.equal('1 1 auto');
        expect(declarations.get('min-height')).to.equal('0');
    });

    it('should_keep_the_unmodified_root_sizing_to_its_content', () => {
        const declarations = declarationsFor('.cratis-datatable');

        expect(declarations.has('height')).to.equal(false);
    });
});
