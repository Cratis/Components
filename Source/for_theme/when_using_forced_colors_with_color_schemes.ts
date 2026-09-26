// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss from 'postcss';
import { beforeEach, describe, it } from 'vitest';

const theme = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');

describe('when using forced colors with a color scheme', () => {
    let schemeSelectors: string[];
    let forcedColorSelectors: string[];

    beforeEach(() => {
        schemeSelectors = [];
        forcedColorSelectors = [];
        postcss.parse(theme).walkRules(rule => {
            if (!rule.nodes.some(node => node.type === 'decl' && node.prop === '--cratis-text-color')) return;

            if (rule.parent.type === 'atrule' && rule.parent.params === '(forced-colors: active)') {
                forcedColorSelectors.push(...rule.selectors);
            } else {
                schemeSelectors.push(...rule.selectors);
            }
        });
    });

    it('should override every scheme selector with equally specific forced-colors tokens', () => {
        expect(schemeSelectors).not.to.be.empty;
        expect(forcedColorSelectors).to.include.members(schemeSelectors);
    });
});
