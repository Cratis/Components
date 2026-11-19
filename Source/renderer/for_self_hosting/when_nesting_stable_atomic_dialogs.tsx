// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useEffect } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import type { CratisDialogSlotProps } from '../../Dialogs/DialogHost';
import { AdapterDialog } from './given/a_stable_presentation_library';
import { anAtomicDialogInTheDom, type AnAtomicDialogInTheDom } from './given/an_atomic_dialog_in_the_dom';

// Records each committed open-state change the way a native adapter would call showModal() and close().
let shown: string[];
const ShowingDialog = (props: CratisDialogSlotProps) => {
    const { title, visible = true } = props;
    useEffect(() => {
        shown.push(`${visible ? 'open' : 'close'} ${title}`);
    }, [title, visible]);
    return <AdapterDialog {...props} />;
};

const parentWithNested = (parentVisible: boolean) => (
    <Dialog title='Parent' visible={parentVisible} buttons={null}>
        <Dialog title='Nested' buttons={null}>
            Content
        </Dialog>
    </Dialog>
);

let dom: AnAtomicDialogInTheDom;

beforeEach(() => {
    shown = [];
    dom = anAtomicDialogInTheDom(ShowingDialog);
});

afterEach(() => dom.unmount());

describe('when nesting stable atomic dialogs', () => {
    it('should open the parent before the nested dialog when both mount together', async () => {
        await dom.render(parentWithNested(true));

        shown.filter((entry) => entry.startsWith('open')).should.deep.equal(['open Parent', 'open Nested']);
    });

    it('should close the nested dialog before its parent when the parent is hidden', async () => {
        await dom.render(parentWithNested(true));
        shown.length = 0;

        await dom.render(parentWithNested(false));

        shown.should.deep.equal(['close Nested', 'close Parent']);
    });

    it('should keep the nested dialog closed while its parent is hidden', async () => {
        await dom.render(parentWithNested(false));

        shown.should.deep.equal(['close Nested', 'close Parent']);
    });
});
