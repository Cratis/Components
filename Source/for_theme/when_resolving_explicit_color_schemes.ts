// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { expect } from 'chai';
import postcss from 'postcss';
import { describe, it } from 'vitest';

const theme = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');
const selectors = postcss
    .parse(theme)
    .nodes.flatMap((node) =>
        node.type === 'rule' ? node.selectors : [],
    );

describe('when resolving explicit baseline color schemes', () => {
    it('should_allow_an_explicit_light_root_to_override_system_dark', () => {
        expect(selectors).to.include(':root.cratis-light');
    });

    it('should_keep_ordinary_themed_descendants_light_under_a_light_root', () => {
        expect(selectors).to.include(
            ':root.cratis-light .cratis-theme:not(.cratis-dark)',
        );
    });

    it('should_allow_an_explicit_light_subtree_under_a_dark_root', () => {
        expect(selectors).to.include('.cratis-dark .cratis-theme.cratis-light');
    });

    it('should_keep_an_explicit_dark_subtree_available', () => {
        expect(selectors).to.include('.cratis-theme.cratis-dark');
    });
});
