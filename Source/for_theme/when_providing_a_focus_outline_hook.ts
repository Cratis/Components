// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss';
import { describe, it } from 'vitest';

const sourceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(sourceDirectory, path), 'utf8');

const valueOf = (
    css: string,
    selectorPattern: RegExp,
    property: string,
): string | undefined => {
    let value: string | undefined;
    postcss.parse(css).walkRules((rule) => {
        if (!rule.selectors.some((selector) => selectorPattern.test(selector))) return;
        rule.walkDecls(property, (decl) => {
            value = decl.value;
        });
    });
    return value;
};

// Stylesheets still owned by another lane in this release train. They take the outline hook when that
// work is rebased onto this change; until then they are skipped here, so remove each entry as it lands.
const PENDING_REBASE = new Set([
    'CommandForm/fields/Fields.css',
    'Dialogs/Dialog.css',
    'DataTables/TablePaginator.css',
]);

// Rules that intentionally do not take the outline hook, keyed by "file|selector start". Each needs a reason.
const ALLOWED_WITHOUT_OUTLINE_HOOK: Record<string, string> = {
    'Dropdown/Dropdown.css|.cratis-dropdown__option[data-focus-visible]':
        'inset option ring inside a scrolling list: an outline would be clipped by the panel; --cratis-focus-ring-inset gives it an inward two-tone ring',
    'SchemaEditor/SchemaEditor.css|.cratis-schema-editor__menu-item[data-focus-visible]':
        'inset menu item ring inside a popover: an outline would be clipped by the panel; --cratis-focus-ring-inset gives it an inward two-tone ring',
    'PivotViewer/PivotViewer.css|.pv-filter-button.active':
        'the ring marks an active filter, not keyboard focus',
    'PivotViewer/PivotViewer.css|.pv-groups-wrapper > div:has(> .pv-viewport:focus-visible)::after':
        'inset ring drawn on a pseudo-element over the viewport',
    'PivotViewer/PivotViewer.css|.pv-card.selected':
        'the ring marks the selection, not keyboard focus',
};

const isAllowed = (file: string, selector: string): boolean =>
    Object.keys(ALLOWED_WITHOUT_OUTLINE_HOOK).some((key) => {
        const [allowedFile, allowedSelector] = key.split('|');
        return allowedFile === file && selector.startsWith(allowedSelector);
    });

const importedStylesheets = (): string[] =>
    [
        ...read('styles.css').matchAll(/@import\s+(?:url\()?['"]\.\/([^'"]+\.css)['"]/g),
    ].map((match) => match[1]);

const insideForcedColors = (rule: Rule): boolean => {
    let parent = rule.parent;
    while (parent) {
        if (
            parent.type === 'atrule' &&
            (parent as AtRule).params.includes('forced-colors')
        ) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
};

const declarationsOf = (rule: Rule): Declaration[] => {
    const declarations: Declaration[] = [];
    rule.each((node) => {
        if (node.type === 'decl') declarations.push(node);
    });
    return declarations;
};

const drawsFocusRing = (declarations: Declaration[]): boolean =>
    declarations.some(
        (decl) =>
            decl.prop === 'box-shadow' && decl.value.includes('var(--cratis-focus-ring)'),
    );

const usesOutlineHook = (declarations: Declaration[]): boolean =>
    declarations.some(
        (decl) =>
            decl.prop === 'outline' && decl.value.includes('--cratis-focus-outline'),
    ) &&
    declarations.some(
        (decl) =>
            decl.prop === 'outline-offset' &&
            decl.value.includes('--cratis-focus-outline-offset'),
    );

const offendingRules = (file: string): string[] => {
    const offenders: string[] = [];
    postcss.parse(read(file)).walkRules((rule) => {
        const declarations = declarationsOf(rule);
        const selector = rule.selector.replace(/\s+/g, ' ');
        const offends =
            !insideForcedColors(rule) &&
            drawsFocusRing(declarations) &&
            !usesOutlineHook(declarations) &&
            !isAllowed(file, selector);
        if (offends) offenders.push(`${file}|${selector}`);
    });
    return offenders;
};

describe('when providing a focus outline hook', () => {
    it('should_default_the_outline_hook_to_none_in_tokens', () => {
        const tokens = read('tokens.css');

        expect(valueOf(tokens, /^:root$/, '--cratis-focus-outline')).to.equal('none');
        expect(valueOf(tokens, /^:root$/, '--cratis-focus-outline-offset')).to.equal('0');
    });

    it('should_keep_the_outline_hook_in_the_scoped_light_block_of_the_theme', () => {
        const theme = read('theme.css');

        expect(valueOf(theme, /^\.cratis-theme$/, '--cratis-focus-outline')).to.equal(
            'none',
        );
        expect(
            valueOf(theme, /^\.cratis-theme$/, '--cratis-focus-outline-offset'),
        ).to.equal('0');
    });

    it('should_map_the_hook_to_the_designsystemet_outer_focus_colour_in_the_bridge', () => {
        const bridge = read('themes/designsystemet.css');

        expect(valueOf(bridge, /^:root$/, '--cratis-focus-outline')).to.equal(
            'var(--ds-color-focus-outer) solid var(--ds-border-width-focus)',
        );
        expect(valueOf(bridge, /^:root$/, '--cratis-focus-outline-offset')).to.equal(
            'var(--ds-border-width-focus)',
        );
    });

    it('should_map_the_inset_ring_for_list_items_with_the_default_ring_as_fallback', () => {
        const bridge = read('themes/designsystemet.css');
        const inset = valueOf(bridge, /^:root$/, '--cratis-focus-ring-inset') ?? '';

        expect(inset).to.include('var(--ds-color-focus-outer)');
        expect(inset).to.include('var(--ds-color-focus-inner)');
        expect(read('Dropdown/Dropdown.css')).to.include(
            'box-shadow: var(--cratis-focus-ring-inset, inset var(--cratis-focus-ring));',
        );
        expect(read('SchemaEditor/SchemaEditor.css')).to.include(
            'box-shadow: var(--cratis-focus-ring-inset, inset var(--cratis-focus-ring));',
        );
    });

    it('should_let_every_focus_ring_rule_declare_the_outline_hook', () => {
        expect(importedStylesheets().length).to.be.greaterThan(20);

        const offenders = importedStylesheets()
            .filter((file) => !PENDING_REBASE.has(file))
            .flatMap(offendingRules);

        expect(offenders).to.deep.equal([]);
    });
});
