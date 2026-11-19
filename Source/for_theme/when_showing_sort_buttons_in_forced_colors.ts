// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss, { type AtRule, type Rule } from 'postcss';
import { beforeEach, describe, it } from 'vitest';

const read = (path: string) => postcss.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const inForcedColors = (rule: Rule): boolean =>
    rule.parent?.type === 'atrule' && (rule.parent as AtRule).params.includes('forced-colors');

const forcedColorsDeclarations = (root: postcss.Root, selector: string): Record<string, string> | undefined => {
    let found: Record<string, string> | undefined;
    root.walkRules((rule) => {
        if (inForcedColors(rule) && rule.selectors.includes(selector)) {
            found = {};
            rule.walkDecls((decl) => {
                (found as Record<string, string>)[decl.prop] = decl.value;
            });
        }
    });
    return found;
};

describe('when showing column sort controls in forced colors', () => {
    let dataTable: postcss.Root;

    beforeEach(() => {
        dataTable = read('../DataTables/DataTableCore.css');
    });

    it('should_give_the_column_sort_buttons_a_system_colour_border', () => {
        const forced = forcedColorsDeclarations(dataTable, '.cratis-datatable__sort');
        expect(forced?.border).to.equal('1px solid ButtonText');
    });

    it('should_give_the_column_sort_button_focus_a_system_colour_outline', () => {
        const forced = forcedColorsDeclarations(dataTable, '.cratis-datatable__sort:focus-visible');
        expect(forced?.outline).to.equal('2px solid Highlight');
        expect(forced?.['outline-offset']).to.equal('2px');
    });
});
