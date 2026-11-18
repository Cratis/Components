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
    '--cratis-type-weight-medium': '500',
    '--cratis-type-weight-semibold': '600',
    '--cratis-type-weight-bold': '700',
    '--cratis-corner-sm': '4px',
    '--cratis-corner-lg': '8px',
    '--cratis-corner-xl': '12px',
    '--cratis-corner-full': '999px',
};

const CONTROL_HEIGHTS: Record<string, string> = {
    '--cratis-control-height': '2.75rem',
    '--cratis-control-height-small': '2.25rem',
    '--cratis-control-height-large': '3.25rem',
};

// Stylesheets whose exact-equal literals were replaced by the tokens (see ui-foundation.md for the rest).
const CONVERTED_STYLESHEETS = [
    'Common/Button.css',
    'Common/Primitives.css',
    'Common/FormElement.css',
    'Common/ComboBox.css',
    'Common/Collections.css',
    'Common/NumberInput.css',
    'Common/DatePickerInput.css',
    'CommandDialog/CommandStepper.css',
    'Dropdown/Dropdown.css',
    'DataTables/DataTableCore.css',
    'DataTables/ColumnFilterMenu.css',
    'Filter/FilterPanel.css',
    'Toolbar/Toolbar.css',
    'Notifications/Toaster.css',
    'ObjectNavigationalBar/ObjectNavigationalBar.css',
    'CommandForm/fields/Fields.css',
    'Dialogs/Dialog.css',
    'DataTables/TablePaginator.css',
];

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

    // The converted stylesheets must not reintroduce an exact-equal literal for a token.
    const FONT_SIZES = new Set(['0.75rem', '0.875rem', '1rem']);
    const FONT_WEIGHTS = new Set(['500', '600', '700']);
    const RADII = new Set(['4px', '8px', '12px', '999px']);

    for (const file of CONVERTED_STYLESHEETS) {
        it(`should_not_reintroduce_exact_equal_literals_in_${file.replace(/\W/g, '_')}`, () => {
            const offenders: string[] = [];
            postcss.parse(read(file)).walkDecls((decl) => {
                const literal =
                    (decl.prop === 'font-size' && FONT_SIZES.has(decl.value)) ||
                    (decl.prop === 'font-weight' && FONT_WEIGHTS.has(decl.value)) ||
                    (decl.prop === 'border-radius' && RADII.has(decl.value));
                if (literal)
                    offenders.push(
                        `${decl.parent && 'selector' in decl.parent ? decl.parent.selector : ''} { ${decl.prop}: ${decl.value} }`,
                    );
            });

            expect(offenders).to.deep.equal([]);
        });
    }
});
