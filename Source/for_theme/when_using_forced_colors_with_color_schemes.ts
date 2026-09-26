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
    let schemeOffsets: number[];
    let forcedColorOffsets: number[];

    beforeEach(() => {
        schemeSelectors = [];
        forcedColorSelectors = [];
        schemeOffsets = [];
        forcedColorOffsets = [];
        postcss.parse(theme).walkRules(rule => {
            if (!rule.nodes.some(node => node.type === 'decl' && node.prop === '--cratis-text-color')) return;
            const offset = rule.source?.start?.offset;
            if (offset === undefined) throw new Error('Theme rule has no source offset');

            if (rule.parent.type === 'atrule' && rule.parent.params === '(forced-colors: active)') {
                forcedColorSelectors.push(...rule.selectors);
                forcedColorOffsets.push(offset);
            } else {
                schemeSelectors.push(...rule.selectors);
                schemeOffsets.push(offset);
            }
        });
    });

    it('should override every scheme selector with equally specific forced-colors tokens', () => {
        expect(schemeSelectors).not.to.be.empty;
        expect(forcedColorSelectors).to.include.members(schemeSelectors);
    });

    it('should place every forced-colors rule after all scheme rules it overrides', () => {
        expect(schemeOffsets).not.to.be.empty;
        expect(forcedColorOffsets).not.to.be.empty;
        expect(Math.min(...forcedColorOffsets)).to.be.greaterThan(Math.max(...schemeOffsets));
    });
});
