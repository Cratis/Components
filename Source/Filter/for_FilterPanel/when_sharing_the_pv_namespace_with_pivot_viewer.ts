// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type Rule } from 'postcss';
import { describe, it } from 'vitest';

// `Source/Filter` was extracted out of `Source/PivotViewer` but kept the historical `pv-`
// class namespace, and `styles.css` imports both stylesheets into a single global cascade.
// PivotViewer is imported last, so any selector it redefines silently wins for the
// standalone FilterPanel too. Divergent copies therefore leak PivotViewer styling onto the
// extracted component, which is how the `#199` trigger fix regressed: the markup and
// `Filter/FilterPanel.css` were updated while the forked PivotViewer copy still described
// the superseded trigger-as-button element.
//
// Identical copies are harmless to the cascade and are tolerated here; divergent copies are
// not. Every shared selector must resolve to exactly one declaration set.

const declarationsBySelector = (path: string) => {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const rules = new Map<string, string>();

    postcss.parse(source).walkRules((rule: Rule) => {
        const context: string[] = [];
        for (let node = rule.parent; node && node.type !== 'root'; node = node.parent) {
            if (node.type === 'atrule') {
                context.unshift(`@${node.name} ${node.params}`);
            }
        }

        const declarations = rule.nodes
            .filter((node) => node.type === 'decl')
            .map((node) => `${node.prop}:${node.value}`)
            .join(';');

        for (const selector of rule.selectors) {
            rules.set([...context, selector].join(' | '), declarations);
        }
    });

    return rules;
};

const filter = declarationsBySelector('../FilterPanel.css');
const pivotViewer = declarationsBySelector('../../PivotViewer/PivotViewer.css');

const divergent = [...filter.keys()].filter(
    (selector) =>
        pivotViewer.has(selector) && filter.get(selector) !== pivotViewer.get(selector),
);

describe('when sharing the pv namespace with PivotViewer', () => {
    it('should_never_let_the_forked_stylesheets_diverge_on_a_shared_selector', () => {
        expect(divergent).to.deep.equal([]);
    });

    it('should_keep_the_extracted_filter_trigger_owned_by_its_own_stylesheet', () => {
        expect(filter.has('.pv-filter-trigger')).to.equal(true);
        expect(pivotViewer.has('.pv-filter-trigger')).to.equal(false);
    });
});
