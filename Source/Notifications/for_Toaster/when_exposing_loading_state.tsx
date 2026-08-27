// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { toast, type ToastId } from '../toast';
import { type ToasterInTheDom, renderToaster, unmountToaster } from './given/a_toaster';

describe('when exposing toast loading state', () => {
    let toaster: ToasterInTheDom;
    let toastId: ToastId = 0;

    beforeEach(async () => {
        toaster = await renderToaster();
        await act(async () => {
            toastId = toast.info({ title: 'Example work', loading: true });
        });
    });

    afterEach(async () => {
        await unmountToaster(toaster);
    });

    it('should expose loading and busy on the toast and content parts', () => {
        const toastPart = document.querySelector('[data-cratis-part="toast"]');
        const content = document.querySelector('[data-cratis-part="content"]');

        expect(toastPart?.getAttribute('data-loading')).to.equal('true');
        expect(toastPart?.getAttribute('data-busy')).to.equal('true');
        expect(content?.getAttribute('data-loading')).to.equal('true');
        expect(content?.getAttribute('data-busy')).to.equal('true');
        expect(document.querySelector('[data-loading="false"]')).to.equal(null);
        expect(document.querySelector('[data-busy="false"]')).to.equal(null);
    });

    it('should remove loading and busy when the toast settles', async () => {
        await act(async () => {
            toast.update(toastId, { loading: false });
        });

        const toastPart = document.querySelector('[data-cratis-part="toast"]');
        const content = document.querySelector('[data-cratis-part="content"]');

        expect(toastPart?.hasAttribute('data-loading')).to.equal(false);
        expect(toastPart?.hasAttribute('data-busy')).to.equal(false);
        expect(content?.hasAttribute('data-loading')).to.equal(false);
        expect(content?.hasAttribute('data-busy')).to.equal(false);
    });
});
