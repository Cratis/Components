// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { slotInteraction } from '../src/internal/slotInteractions.js';

describe('when simulating native click defaults', () => {
    let container: HTMLDivElement;
    let evidence: Map<string, Readonly<Record<string, unknown>>>;
    let callbacks: number;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        evidence = new Map();
        callbacks = 0;
    });

    afterEach(() => container.remove());

    const control = (part: 'previous' | 'next', tag: 'button' | 'a', page: number) => {
        const element = document.createElement(tag);
        element.setAttribute('data-cratis-part', part);
        if (tag === 'a') element.setAttribute('href', '#');
        element.addEventListener('click', (event) => {
            event.preventDefault();
            callbacks += 1;
            evidence.set('datatables.paginator', { page, callbacks });
        });
        container.append(element);
    };

    it('should activate a link with Enter and a button with Space', async () => {
        control('previous', 'button', 0);
        control('next', 'a', 2);

        const result = await slotInteraction(evidence, 'datatables.paginator')!(document, container);

        expect(result.keyboard).to.equal(true);
    });

    it('should not activate a link with Space', async () => {
        control('previous', 'a', 0);
        control('next', 'button', 2);

        const result = await slotInteraction(evidence, 'datatables.paginator')!(document, container);

        expect(result.keyboard).to.equal(false);
        expect(callbacks).to.equal(1);
    });

    it.each(['keydown', 'keyup'])('should honor preventDefault on %s', async (eventType) => {
        control('previous', 'button', 0);
        control('next', 'button', 2);
        container.addEventListener(eventType, (event) => event.preventDefault());

        const result = await slotInteraction(evidence, 'datatables.paginator')!(document, container);

        expect(result.keyboard).to.equal(false);
        expect(callbacks).to.equal(eventType === 'keydown' ? 0 : 1);
    });
});
