// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { observeLabelAssociations } from '../observeLabelAssociations';

describe('when observing native label associations', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;
    let cleanups: Array<() => void>;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.id = 'sample-input';
        container.append(input);
        document.body.append(container);
        cleanups = [];
    });
    afterEach(() => {
        cleanups.forEach(cleanup => cleanup());
        container.remove();
        sinon.restore();
    });

    it('should share one observer and disconnect only when the final subscriber leaves', () => {
        const observe = sinon.spy(MutationObserver.prototype, 'observe');
        const disconnect = sinon.spy(MutationObserver.prototype, 'disconnect');
        const releaseFirst = observeLabelAssociations(input, () => undefined);
        const releaseLast = observeLabelAssociations(input, () => undefined);
        cleanups.push(releaseFirst, releaseLast);
        observe.callCount.should.equal(1);
        releaseFirst();
        disconnect.callCount.should.equal(0);
        releaseLast();
        disconnect.callCount.should.equal(1);
    });

    it('should ignore visual changes unrelated to labeling', async () => {
        const changed = sinon.spy();
        cleanups.push(observeLabelAssociations(input, changed));
        input.className = 'sample-class';
        input.style.width = '100px';
        container.append(document.createElement('span'));
        await Promise.resolve();
        changed.callCount.should.equal(0);
    });

    it('should notify about a newly inserted label', async () => {
        const changed = sinon.spy();
        cleanups.push(observeLabelAssociations(input, changed));
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = 'Example label';
        container.prepend(label);
        await Promise.resolve();
        changed.callCount.should.equal(1);
    });

    it('should observe the controls shadow root rather than the outer document', async () => {
        const host = document.createElement('div');
        container.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const shadowInput = document.createElement('input');
        shadowInput.id = 'shadow-input';
        shadow.append(shadowInput);
        const changed = sinon.spy();
        cleanups.push(observeLabelAssociations(shadowInput, changed));
        const label = document.createElement('label');
        label.htmlFor = shadowInput.id;
        shadow.prepend(label);
        await Promise.resolve();
        changed.callCount.should.equal(1);
        changed.resetHistory();
        container.prepend(document.createElement('label'));
        await Promise.resolve();
        changed.callCount.should.equal(0);
    });
});
