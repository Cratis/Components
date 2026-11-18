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

const TONES: Record<string, string> = {
    accent: 'info',
    positive: 'success',
    caution: 'warning',
    critical: 'danger',
};

const valueOf = (css: string, selector: string, property: string): string | undefined => {
    let value: string | undefined;
    postcss.parse(css).walkRules((rule) => {
        if (rule.selector.replace(/\s+/g, ' ') !== selector) return;
        rule.walkDecls(property, (decl) => {
            value = decl.value;
        });
    });
    return value;
};

describe('when mapping status foregrounds', () => {
    const button = read('Common/Button.css');
    const bridge = read('themes/designsystemet.css');

    for (const [tone, status] of Object.entries(TONES)) {
        it(`should_use_the_${status}_foreground_for_the_${tone}_tone_and_fall_back_to_the_background`, () => {
            expect(
                valueOf(
                    button,
                    `.cratis-button[data-tone='${tone}']`,
                    '--cratis-button-tone',
                ),
            ).to.equal(
                `var(--cratis-${status}-foreground, var(--cratis-${status}-background))`,
            );
        });

        it(`should_map_the_${status}_foreground_to_the_designsystemet_text_color`, () => {
            expect(
                valueOf(
                    bridge,
                    ":root, [data-color-scheme], [data-size='sm'], [data-size='md'], [data-size='lg']",
                    `--cratis-${status}-foreground`,
                ),
            ).to.equal(`var(--ds-color-${status}-text-default)`);
        });
    }

    it('should_not_declare_the_foregrounds_in_the_default_tokens_so_the_background_is_used', () => {
        expect(read('tokens.css')).not.to.include('-foreground');
        expect(read('theme.css')).not.to.include('-foreground');
    });
});
