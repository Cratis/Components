// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    createCssColorResolver,
    type CssColorResolver,
    resolveCardColors,
} from '../components/pivot/colorResolver';
import { DEFAULT_COLORS } from '../components/pivot/constants';

const identityResolver: CssColorResolver = (value, fallback) => value.trim() || fallback;

describe('when semantic PivotViewer color tokens are defined', () => {
    it('should_resolve_them_from_the_viewer_element', () => {
        const element = document.createElement('div');
        element.style.setProperty('--cratis-surface-card', '#112233');
        element.style.setProperty('--cratis-surface-section', '#223344');
        element.style.setProperty('--cratis-surface-ground', '#334455');
        element.style.setProperty('--cratis-surface-border', '#44556680');
        element.style.setProperty('--cratis-text-color', '#556677');
        element.style.setProperty(
            '--cratis-text-color-secondary',
            'rgba(102, 119, 136, 0.25)',
        );
        document.body.appendChild(element);

        const result = resolveCardColors(identityResolver, element);

        expect(result).to.deep.equal({
            base: '#112233',
            mid: '#223344',
            gradient: '#334455',
            border: '#44556680',
            text: '#556677',
            textSecondary: 'rgba(102, 119, 136, 0.25)',
        });
        element.remove();
    });

    it('should_preserve_alpha_in_browser_color_values', () => {
        const element = document.createElement('div');
        element.style.setProperty('--cratis-surface-card', 'rgb(17, 34, 51)');
        element.style.setProperty('--cratis-surface-section', 'rgb(34, 51, 68)');
        element.style.setProperty('--cratis-surface-ground', 'rgb(51, 68, 85)');
        element.style.setProperty('--cratis-surface-border', 'rgba(68, 85, 102, 0.5)');
        element.style.setProperty('--cratis-text-color', 'rgb(85, 102, 119)');
        element.style.setProperty(
            '--cratis-text-color-secondary',
            'rgba(102, 119, 136, 0.25)',
        );
        document.body.appendChild(element);

        const result = resolveCardColors(createCssColorResolver(), element);

        expect(result).to.deep.equal({
            base: 'rgba(17,34,51,1)',
            mid: 'rgba(34,51,68,1)',
            gradient: 'rgba(51,68,85,1)',
            border: 'rgba(68,85,102,0.5)',
            text: 'rgba(85,102,119,1)',
            textSecondary: 'rgba(102,119,136,0.25)',
        });
        element.remove();
    });

    it('should_use_internal_fallbacks_without_calling_the_resolver_when_tokens_are_missing', () => {
        let resolverWasCalled = false;
        const resolver: CssColorResolver = () => {
            resolverWasCalled = true;
            return '#000000';
        };

        const result = resolveCardColors(resolver, document.createElement('div'));

        expect(result).to.deep.equal(DEFAULT_COLORS);
        expect(resolverWasCalled).to.equal(false);
    });

    it('should_use_the_specific_fallback_for_a_malformed_token', () => {
        const element = document.createElement('div');
        element.style.setProperty('--cratis-surface-card', 'not-a-color');
        document.body.appendChild(element);

        const result = resolveCardColors(createCssColorResolver(), element);

        expect(result.base).to.equal(DEFAULT_COLORS.base);
        element.remove();
    });
});
