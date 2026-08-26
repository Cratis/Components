// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, expect, it } from 'vitest';
import {
    assertExpectedCascadeLayerOrder,
    cascadeLayerEstablishmentOrder,
    EXPECTED_CASCADE_LAYER_ORDER,
} from '../lib/release-package-guards.mjs';

/**
 * Modeled after the actual `dist/esm/styles.css` Tailwind v4 + `@tailwindcss/postcss` produces:
 * a leading, single-name `@layer properties;` forward declaration (for its `@property`
 * custom-property fallback), the statement that binds Cratis's own precedence, each named layer's
 * opening block, and the `properties` layer's own block reopened later in the file wrapped in an
 * `@supports` guard.
 */
const packedProductionStyles =
    '/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n' +
    '@layer properties;\n' +
    '@layer cratis-theme, cratis-components, cratis-utilities;\n' +
    '@layer cratis-theme {\n  :root, :host {\n    --cratis-color-white: #fff;\n  }\n}\n' +
    '@layer cratis-utilities {\n  .cratis\\:flex { display: flex; }\n' +
    '  @property --tw-border-style {\n    syntax: "*";\n    inherits: false;\n    initial-value: solid;\n  }\n}\n' +
    '@layer properties {\n  @supports ((-webkit-hyphens: none)) {\n    *, ::before, ::after {\n      --tw-border-style: solid;\n    }\n  }\n}\n' +
    '@layer cratis-components {\n  .my-component { color: red; }\n}\n';

describe('when checking the cascade-layer establishment order', () => {
    it('should not reject the real packed-production shape', () => {
        expect(() =>
            assertExpectedCascadeLayerOrder(packedProductionStyles, 'styles.css'),
        ).not.toThrow();
    });

    it('should report the cumulative first-occurrence order across the whole file', () => {
        expect(cascadeLayerEstablishmentOrder(packedProductionStyles)).toEqual(
            EXPECTED_CASCADE_LAYER_ORDER,
        );
        expect(EXPECTED_CASCADE_LAYER_ORDER).toEqual([
            'properties',
            'cratis-theme',
            'cratis-components',
            'cratis-utilities',
        ]);
    });

    it('should reject styles missing the leading properties forward declaration', () => {
        const withoutProperties = packedProductionStyles.replace(
            '@layer properties;\n',
            '',
        );
        expect(() =>
            assertExpectedCascadeLayerOrder(withoutProperties, 'styles.css'),
        ).toThrow(/cumulative cascade-layer establishment order must be exactly/);
    });

    it('should reject a binding statement that reorders the reviewed layers', () => {
        const reordered = packedProductionStyles.replace(
            '@layer cratis-theme, cratis-components, cratis-utilities;',
            '@layer cratis-components, cratis-theme, cratis-utilities;',
        );
        expect(() => assertExpectedCascadeLayerOrder(reordered, 'styles.css')).toThrow();
    });

    it('should reject a layer whose opening block establishes it before the binding statement lists it', () => {
        const utilitiesBeforeComponents =
            '@layer properties;\n' +
            '@layer cratis-theme {}\n' +
            '@layer cratis-utilities {}\n' +
            '@layer cratis-theme, cratis-components, cratis-utilities;\n' +
            '@layer cratis-components {}\n';
        expect(() =>
            assertExpectedCascadeLayerOrder(utilitiesBeforeComponents, 'styles.css'),
        ).toThrow();
        expect(cascadeLayerEstablishmentOrder(utilitiesBeforeComponents)).toEqual([
            'properties',
            'cratis-theme',
            'cratis-utilities',
            'cratis-components',
        ]);
    });

    it('should reject a missing layer even when the rest are correctly ordered', () => {
        const missingUtilities = '@layer properties;\n@layer cratis-theme, cratis-components;\n';
        expect(() =>
            assertExpectedCascadeLayerOrder(missingUtilities, 'styles.css'),
        ).toThrow();
    });

    it('should reject a duplicated layer name that does not repair an otherwise wrong order', () => {
        const duplicatedButStillReordered =
            '@layer properties;\n' +
            '@layer cratis-utilities, cratis-theme, cratis-components;\n' +
            '@layer cratis-utilities, cratis-theme, cratis-components;\n';
        expect(() =>
            assertExpectedCascadeLayerOrder(duplicatedButStillReordered, 'styles.css'),
        ).toThrow();
    });

    it('should reject a stylesheet with no @layer statements at all', () => {
        expect(() =>
            assertExpectedCascadeLayerOrder('.foo { color: red; }', 'styles.css'),
        ).toThrow(/found '\(none\)'/);
    });
});
