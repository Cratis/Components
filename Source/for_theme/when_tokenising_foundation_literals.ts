// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import postcss from 'postcss';
import { describe, it } from 'vitest';

const sourceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(sourceDirectory, path), 'utf8');

const declared = (css: string, selectorPattern: RegExp): Map<string, string> => {
    const values = new Map<string, string>();
    postcss.parse(css).walkRules((rule) => {
        if (!rule.selectors.some((selector) => selectorPattern.test(selector))) return;
        rule.walkDecls((decl) => {
            if (decl.prop.startsWith('--cratis-')) values.set(decl.prop, decl.value);
        });
    });
    return values;
};

// New tokens and the literal each one replaced, so the default look stays identical.
const NEW_TOKENS: Record<string, string> = {
    '--cratis-font-size-xs': '0.75rem',
    '--cratis-font-size-sm': '0.875rem',
    '--cratis-font-size-md': '1rem',
    '--cratis-font-weight-medium': '500',
    '--cratis-font-weight-semibold': '600',
    '--cratis-font-weight-bold': '700',
    '--cratis-radius-sm': '4px',
    '--cratis-radius-lg': '8px',
    '--cratis-radius-xl': '12px',
    '--cratis-radius-full': '999px',
};

const CONTROL_HEIGHTS: Record<string, string> = {
    '--cratis-control-height': '2.75rem',
    '--cratis-control-height-small': '2.25rem',
    '--cratis-control-height-large': '3.25rem',
};

describe('when tokenising foundation literals', () => {
    const tokens = declared(read('tokens.css'), /^:root$/);
    const lightBlock = declared(read('theme.css'), /^\.cratis-theme$/);

    for (const [name, literal] of Object.entries(NEW_TOKENS)) {
        it(`should_default_${name.replace(/-/g, '_')}_to_the_literal_it_replaces`, () => {
            expect(tokens.get(name)).to.equal(literal);
        });

        it(`should_repeat_${name.replace(/-/g, '_')}_in_the_scoped_light_block`, () => {
            expect(lightBlock.get(name)).to.equal(literal);
        });
    }

    for (const [name, literal] of Object.entries(CONTROL_HEIGHTS)) {
        it(`should_keep_${name.replace(/-/g, '_')}_at_its_default`, () => {
            expect(tokens.get(name)).to.equal(literal);
        });
    }

    // Stage 2 replaces the exact-equal literals in the component stylesheets (shared with other lanes);
    // the remaining-literal scan is added there with its allowlist.
});
