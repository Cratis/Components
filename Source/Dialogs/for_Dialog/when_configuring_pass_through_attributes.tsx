// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { type DialogInTheDom, render, unmount } from './given/a_dialog_in_the_dom';

describe('when configuring pass-through attributes', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(
            <Dialog
                title='Account details'
                pt={{
                    backdrop: { id: 'dialog-backdrop', 'data-product-layer': 'modal' },
                    positioner: { 'aria-label': 'Dialog positioner' },
                    root: { 'data-product-surface': 'glass' },
                    header: { 'data-product-header': 'account' },
                    title: { id: 'account-dialog-title' },
                    content: { 'aria-describedby': 'account-dialog-help' },
                    footer: { 'data-product-footer': 'actions' },
                }}
            >
                <span id='account-dialog-help'>Account guidance</span>
            </Dialog>,
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should apply ordinary attributes to every configured stable part', () => {
        expect(document.querySelector('#dialog-backdrop')).not.to.equal(null);
        expect(
            document
                .querySelector('[data-cratis-part="root"]')
                ?.getAttribute('data-product-surface'),
        ).to.equal('glass');
        expect(
            document
                .querySelector('[data-cratis-part="header"]')
                ?.getAttribute('data-product-header'),
        ).to.equal('account');
        expect(document.querySelector('#account-dialog-title')).not.to.equal(null);
        expect(
            document
                .querySelector('[data-cratis-part="content"]')
                ?.getAttribute('aria-describedby'),
        ).to.equal('account-dialog-help');
        expect(
            document
                .querySelector('[data-cratis-part="footer"]')
                ?.getAttribute('data-product-footer'),
        ).to.equal('actions');
    });
});
