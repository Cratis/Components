// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { createCssColorResolver } from '../components/pivot/colorResolver';

const fallback = '#fallback';

const resolveComputedColor = (computedColor: string, cssValue = 'red') => {
    vi.stubGlobal('getComputedStyle', () => ({ color: computedColor }));
    return createCssColorResolver()(cssValue, fallback);
};

const fakeCanvasContext = (supportedValue: string) => {
    let fillStyle = '';
    return {
        get fillStyle() {
            return fillStyle;
        },
        set fillStyle(value: string) {
            if (value.startsWith('#')) fillStyle = value;
            else if (value === supportedValue) fillStyle = 'resolved';
        },
        clearRect: () => undefined,
        fillRect: () => undefined,
        getImageData: () => ({ data: [1, 2, 254, 128] }),
    };
};

describe('when resolving css colors', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should_expand_short_hex_colors', () => {
        expect(resolveComputedColor('#123')).to.equal('rgba(17,34,51,1)');
    });

    it('should_expand_short_hex_colors_with_alpha', () => {
        expect(resolveComputedColor('#1234')).to.equal(`rgba(17,34,51,${0x44 / 255})`);
    });

    it('should_read_long_hex_colors', () => {
        expect(resolveComputedColor('#AbCdEf')).to.equal('rgba(171,205,239,1)');
    });

    it('should_read_long_hex_colors_with_alpha', () => {
        expect(resolveComputedColor('#11223380')).to.equal(`rgba(17,34,51,${128 / 255})`);
    });

    it('should_read_comma_separated_rgb', () => {
        expect(resolveComputedColor('rgb(10, 20, 30)')).to.equal('rgba(10,20,30,1)');
    });

    it('should_read_comma_separated_rgba', () => {
        expect(resolveComputedColor('rgba(10, 20, 30, 0.5)')).to.equal('rgba(10,20,30,0.5)');
    });

    it('should_read_space_separated_rgb_with_slash_alpha', () => {
        expect(resolveComputedColor('rgb(10 20 30 / 25%)')).to.equal('rgba(10,20,30,0.25)');
    });

    it('should_read_percentage_channels_and_round_them', () => {
        expect(resolveComputedColor('rgb(100%, 0%, 50%)')).to.equal('rgba(255,0,127,1)');
    });

    it('should_clamp_channels_and_alpha', () => {
        expect(resolveComputedColor('rgba(300, -5, 20.4, 2)')).to.equal('rgba(255,0,20,1)');
    });

    it('should_fall_back_for_a_wrong_number_of_channels', () => {
        expect(resolveComputedColor('rgb(10, 20)')).to.equal(fallback);
    });

    it('should_fall_back_for_non_numeric_channels', () => {
        expect(resolveComputedColor('rgb(a, b, c)')).to.equal(fallback);
    });

    it('should_fall_back_for_a_non_numeric_alpha', () => {
        expect(resolveComputedColor('rgb(1 2 3 / x)')).to.equal(fallback);
    });

    it('should_fall_back_for_an_empty_computed_color', () => {
        expect(resolveComputedColor('')).to.equal(fallback);
    });

    it('should_fall_back_for_a_blank_css_value', () => {
        expect(resolveComputedColor('rgb(1, 2, 3)', '   ')).to.equal(fallback);
    });

    it('should_fall_back_for_a_css_value_the_browser_rejects', () => {
        expect(resolveComputedColor('rgb(1, 2, 3)', 'not-a-color')).to.equal(fallback);
    });

    it('should_fall_back_for_modern_colors_when_css_supports_is_unavailable', () => {
        vi.stubGlobal('CSS', undefined);
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal(fallback);
    });

    it('should_fall_back_for_modern_colors_the_browser_does_not_support', () => {
        vi.stubGlobal('CSS', { supports: () => false });
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal(fallback);
    });

    it('should_rasterize_supported_modern_colors_through_a_canvas', () => {
        vi.stubGlobal('CSS', { supports: () => true });
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            fakeCanvasContext('oklch(0.5 0.1 200)') as unknown as CanvasRenderingContext2D,
        );
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal('#0102fe80');
    });

    it('should_fall_back_when_the_canvas_cannot_serialize_the_color', () => {
        vi.stubGlobal('CSS', { supports: () => true });
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            fakeCanvasContext('something-else') as unknown as CanvasRenderingContext2D,
        );
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal(fallback);
    });

    it('should_fall_back_when_no_canvas_context_is_available', () => {
        vi.stubGlobal('CSS', { supports: () => true });
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal(fallback);
    });

    it('should_fall_back_when_creating_the_canvas_throws', () => {
        vi.stubGlobal('CSS', { supports: () => true });
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
            throw new Error('canvas unavailable');
        });
        expect(resolveComputedColor('oklch(0.5 0.1 200)')).to.equal(fallback);
    });

    it('should_create_the_canvas_context_only_once', () => {
        vi.stubGlobal('CSS', { supports: () => true });
        vi.stubGlobal('getComputedStyle', () => ({ color: 'oklch(0.5 0.1 200)' }));
        const getContext = vi
            .spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockReturnValue(null);
        const resolve = createCssColorResolver();

        resolve('red', fallback);
        resolve('blue', fallback);

        expect(getContext).toHaveBeenCalledTimes(1);
    });

    it('should_remove_the_probe_from_the_host_element', () => {
        vi.stubGlobal('getComputedStyle', () => ({ color: 'rgb(1, 2, 3)' }));
        const host = document.createElement('div');

        const result = createCssColorResolver()('red', fallback, host);

        expect(result).to.equal('rgba(1,2,3,1)');
        expect(host.childElementCount).to.equal(0);
    });
});
