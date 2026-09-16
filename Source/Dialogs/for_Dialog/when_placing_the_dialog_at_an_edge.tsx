// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Dialog } from '../Dialog';
import {
    type DialogInTheDom,
    focusedElement,
    pressEscape,
    render,
    unmount,
} from './given/a_dialog_in_the_dom';

describe('when placing the dialog at an edge', () => {
    let dialog: DialogInTheDom;
    const onCancel = vi.fn();

    beforeEach(async () => {
        onCancel.mockReset();
        dialog = await render(
            <Dialog
                title='Activity'
                placement='end'
                dismissable
                buttons={null}
                onCancel={onCancel}
                width='440px'
            >
                <button type='button'>Content action</button>
            </Dialog>,
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should mark the backdrop, positioner and root with the placement', () => {
        const placements = [
            document.querySelector('[data-cratis-part="backdrop"]'),
            document.querySelector('[data-cratis-part="positioner"]'),
            document.querySelector('[data-cratis-part="root"]'),
        ].map((part) => part?.getAttribute('data-placement'));
        expect(placements).to.deep.equal(['end', 'end', 'end']);
    });

    it('should remain modal by hiding the rest of the document from assistive technology', () => {
        expect(document.querySelector('[role="dialog"]')).to.not.equal(null);
        expect(dialog.container.getAttribute('aria-hidden')).to.equal('true');
    });

    it('should keep the width on the root', () => {
        const root = document.querySelector<HTMLElement>('[data-cratis-part="root"]');
        expect(root?.style.width).to.equal('440px');
    });

    it('should move focus into the sheet', () => {
        expect(focusedElement()).to.not.equal('document.body');
    });

    it('should still dismiss on escape', async () => {
        await pressEscape();
        expect(onCancel.mock.calls).to.have.lengthOf(1);
    });
});
