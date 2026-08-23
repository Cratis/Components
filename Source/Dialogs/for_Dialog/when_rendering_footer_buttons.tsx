// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons } from '@cratis/arc.react/dialogs';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import { type DialogInTheDom, render, unmount } from './given/a_dialog_in_the_dom';

const footerButtons = () =>
    Array.from(
        document.querySelectorAll<HTMLButtonElement>(
            '[data-scope="dialog"][data-part="footer"] button',
        ),
    );

const accessibleContentName = (button: HTMLButtonElement) =>
    Array.from(button.childNodes)
        .filter(
            (node) =>
                !(
                    node instanceof HTMLElement &&
                    node.getAttribute('aria-hidden') === 'true'
                ),
        )
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();

describe('when rendering footer buttons', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(
            <Dialog
                title='Log interview'
                buttons={DialogButtons.OkCancel}
                okLabel='Logg intervju'
                cancelLabel='Avbryt'
            >
                Content
            </Dialog>,
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should hide every decorative icon from accessibility APIs', () => {
        const icons = footerButtons().map((button) => button.querySelector('i'));
        expect(icons).to.have.lengthOf(2);
        expect(
            icons.every((icon) => icon?.getAttribute('aria-hidden') === 'true'),
        ).to.equal(true);
    });

    it('should give each button exactly its visible label as accessible content', () => {
        expect(footerButtons().map(accessibleContentName)).to.deep.equal([
            'Logg intervju',
            'Avbryt',
        ]);
    });
});
