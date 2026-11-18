// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { commands } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { mountGallery, unmountGallery } from './gallery';

afterEach(unmountGallery);

// Only the rotation is asserted: Designsystemet slows `ds-spinner-rotate-animation` under reduced motion
// but leaves the small `ds-spinner-stroke-animation` dash morph at its normal 2s speed (upstream, reported
// in .ai-work/534/report.md as a known finding).
const rotationOnly = (animation: { name: string }) => animation.name.startsWith('ds-spinner-rotate-animation');

const loopingAnimations = (gallery: HTMLElement) =>
    gallery
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().iterations === Infinity)
        .map((animation) => ({
            name: `${(animation as CSSAnimation).animationName} on ${(animation.effect as KeyframeEffect).target?.className}`,
            duration: Number(animation.effect?.getComputedTiming().duration),
        }));

describe('the Designsystemet slot gallery with reduced motion', () => {
    it('slows the looping spinner animation down', async () => {
        await commands.emulateMedia({ reducedMotion: 'no-preference' });
        const normal = loopingAnimations(await mountGallery('light', 'md'));
        await unmountGallery();
        await commands.emulateMedia({ reducedMotion: 'reduce' });
        const reduced = loopingAnimations(await mountGallery('light', 'md'));
        expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        expect(normal.filter(rotationOnly).length).toBeGreaterThan(0);
        const slowest = Math.max(...normal.filter(rotationOnly).map(({ duration }) => duration));
        expect(reduced.filter(rotationOnly).filter(({ duration }) => duration <= slowest)).toEqual([]);
    });
});
