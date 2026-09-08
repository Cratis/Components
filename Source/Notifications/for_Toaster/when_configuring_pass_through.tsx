// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { toast } from '../toast';
import { type ToasterInTheDom, renderToaster, unmountToaster } from './given/a_toaster';

describe('when configuring toaster pass-through', () => {
    let toaster: ToasterInTheDom;

    beforeEach(async () => {
        toaster = await renderToaster({
            pt: {
                region: { className: 'region-probe' },
                toast: { className: 'toast-probe' },
                content: { className: 'content-probe' },
                close: { className: 'close-probe' },
            },
        });
        await act(async () => {
            toast.info({ title: 'Pass-through' });
        });
    });

    afterEach(async () => {
        await unmountToaster(toaster);
    });

    it('should configure the toaster region', () => {
        expect(document.querySelector('.region-probe')).not.to.equal(null);
    });

    it('should configure each toast frame', () => {
        expect(document.querySelector('.toast-probe')).not.to.equal(null);
        expect(document.querySelector('.content-probe')).not.to.equal(null);
        expect(document.querySelector('.close-probe')).not.to.equal(null);
    });
});
