// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import { DialogInitialFocus } from '../../Dialogs/DialogInitialFocus';
import { AdapterDialog } from './given/a_stable_presentation_library';
import { anAtomicDialogInTheDom, nextFrame, type AnAtomicDialogInTheDom } from './given/an_atomic_dialog_in_the_dom';

let dom: AnAtomicDialogInTheDom;
let title: HTMLHeadingElement;

beforeEach(async () => {
    dom = anAtomicDialogInTheDom(AdapterDialog);
    await dom.render(
        <Dialog title='Example' buttons={null} initialFocus={DialogInitialFocus.Content}>
            Content
        </Dialog>,
    );
    await nextFrame();
    title = dom.container.querySelector('h2')!;
});

afterEach(() => dom.unmount());

describe('when a stable atomic dialog focuses its content', () => {
    it('should focus the adapter title heading', () => (document.activeElement === title).should.be.true);

    it('should keep the title out of the tab order', () => title.tabIndex.should.equal(-1));
});
