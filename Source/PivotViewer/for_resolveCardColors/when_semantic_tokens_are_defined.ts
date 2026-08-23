// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { resolveCardColors } from '../components/pivot/colorResolver';
import { DEFAULT_COLORS } from '../components/pivot/constants';

const parseHex = (value: string, fallback: number) => {
    const match = value.trim().match(/^#([0-9a-f]{6})$/i);
    return match ? Number.parseInt(match[1], 16) : fallback;
};

describe('when semantic PivotViewer color tokens are defined', () => {
    it('should_resolve_them_from_the_viewer_element', () => {
        const element = document.createElement('div');
        element.style.setProperty('--cratis-surface-100', '#112233');
        element.style.setProperty('--cratis-surface-0', '#223344');
        element.style.setProperty('--cratis-surface-ground', '#334455');
        element.style.setProperty('--cratis-surface-border', '#445566');
        element.style.setProperty('--cratis-text-color', '#556677');
        element.style.setProperty('--cratis-text-color-secondary', '#667788');
        document.body.appendChild(element);

        const result = resolveCardColors(parseHex, element);

        expect(result).to.deep.equal({
            base: 0x112233,
            mid: 0x223344,
            gradient: 0x334455,
            border: 0x445566,
            text: 0x556677,
            textSecondary: 0x667788,
        });
        element.remove();
    });

    it('should_use_internal_fallbacks_when_tokens_are_missing', () => {
        const result = resolveCardColors(parseHex, document.createElement('div'));

        expect(result).to.deep.equal(DEFAULT_COLORS);
    });
});
