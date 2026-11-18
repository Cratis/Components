// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { expect } from 'chai';
import postcss, { type Declaration, type Rule } from 'postcss';
import { describe, it } from 'vitest';

const bridge = postcss.parse(
    readFileSync(new URL('../themes/designsystemet.css', import.meta.url), 'utf8'),
);
const tokens = postcss.parse(readFileSync(new URL('../tokens.css', import.meta.url), 'utf8'));

// Tokens with no Designsystemet equivalent keep their tokens.css defaults (documented in the bridge).
const UNMAPPED = [
    '--cratis-maskbg',
    '--cratis-z-index-dialog',
    '--cratis-z-index-overlay',
    '--cratis-z-index-filter',
    '--cratis-z-index-tooltip',
    '--cratis-z-index-toast',
];

const BRIDGE_SELECTORS = [
    ':root',
    '[data-color-scheme]',
    "[data-size='sm']",
    "[data-size='md']",
    "[data-size='lg']",
];

const rules = (root: postcss.Root): Rule[] => {
    const found: Rule[] = [];
    root.walkRules((rule) => found.push(rule));
    return found;
};

const declarations = (root: postcss.Root): Declaration[] => {
    const found: Declaration[] = [];
    root.walkDecls((decl) => found.push(decl));
    return found;
};

const bridgeDeclarations = declarations(bridge);
const bridgeProperties = bridgeDeclarations.map((decl) => decl.prop);

// The package's dist directory (theme/ and src/ sit beside each other).
const designsystemetCssDirectory = (() => {
    try {
        const resolved = createRequire(import.meta.url).resolve(
            '@digdir/designsystemet-css/theme.css',
        );
        return dirname(dirname(resolved));
    } catch {
        return undefined;
    }
})();

// The Designsystemet package is a development dependency; without it the cross-check cannot run.
const itWithDesignsystemet = designsystemetCssDirectory ? it : it.skip;

const referencedVariables = (value: string): string[] =>
    [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);

describe('when bridging designsystemet tokens', () => {
    it('should_declare_every_cratis_token_except_the_documented_unmapped_ones', () => {
        const expected = declarations(tokens)
            .map((decl) => decl.prop)
            .filter((prop) => prop.startsWith('--cratis-') && !UNMAPPED.includes(prop));

        const missing = expected.filter((prop) => !bridgeProperties.includes(prop));

        expect(missing).to.deep.equal([]);
    });

    it('should_not_declare_the_unmapped_tokens', () => {
        expect(bridgeProperties.filter((prop) => UNMAPPED.includes(prop))).to.deep.equal([]);
    });

    it('should_declare_only_cratis_tokens', () => {
        expect(bridgeProperties.filter((prop) => !prop.startsWith('--cratis-'))).to.deep.equal([]);
    });

    it('should_redeclare_on_every_element_designsystemet_redeclares_on', () => {
        const bridgeRules = rules(bridge);

        expect(bridgeRules).to.have.length(1);
        expect(bridgeRules[0].selectors).to.deep.equal(BRIDGE_SELECTORS);
    });

    it('should_have_no_second_dark_selector_and_no_bare_size_selector', () => {
        const css = rules(bridge)
            .map((rule) => rule.selector)
            .join(',');

        expect(css).not.to.include('cratis-dark');
        expect(css).not.to.include('prefers-color-scheme');
        expect(css).not.to.include("[data-color-scheme='dark']");
        expect(css).not.to.match(/\[data-size\]/);
    });

    it('should_stay_unlayered_so_it_beats_the_layered_designsystemet_rules', () => {
        const layered = bridge.nodes.filter((node) => node.type === 'atrule');

        expect(layered).to.have.length(0);
    });

    it('should_reference_only_designsystemet_variables', () => {
        const references = bridgeDeclarations.flatMap((decl) => referencedVariables(decl.value));

        expect(references.filter((name) => !name.startsWith('--ds-'))).to.deep.equal([]);
    });

    it('should_resolve_no_value_itself', () => {
        const KEYWORDS = /\b(solid|none|inset|calc|color-mix|in srgb)\b/g;
        const literals = bridgeDeclarations
            .map((decl) => ({
                prop: decl.prop,
                value: decl.value.replace(/var\([^)]*\)/g, '').replace(KEYWORDS, ''),
            }))
            .filter(({ value }) => /#[0-9a-f]{3,8}|rgb\(|hsl\(|oklch\(|\d(px|rem|em)\b/i.test(value));

        expect(literals).to.deep.equal([]);
    });

    itWithDesignsystemet('should_only_reference_variables_designsystemet_declares', () => {
        const root = designsystemetCssDirectory as string;
        const themeDirectory = join(root, 'theme');
        const sourceDirectory = join(root, 'src');
        const files = [
            ...readdirSync(themeDirectory).map((name) => join(themeDirectory, name)),
            ...(existsSync(sourceDirectory)
                ? readdirSync(sourceDirectory).map((name) => join(sourceDirectory, name))
                : []),
        ].filter((file) => file.endsWith('.css'));
        const declared = new Set<string>();
        for (const file of files) {
            for (const match of readFileSync(file, 'utf8').matchAll(/(--ds-[\w-]+)\s*:/g)) {
                declared.add(match[1]);
            }
        }

        const unknown = bridgeDeclarations
            .flatMap((decl) => referencedVariables(decl.value))
            .filter((name) => !declared.has(name));

        expect(unknown).to.deep.equal([]);
    });
});
