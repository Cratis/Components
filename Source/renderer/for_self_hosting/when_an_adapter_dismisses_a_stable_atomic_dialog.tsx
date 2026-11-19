// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogResult } from '@cratis/arc.react/dialogs';
import { act } from 'react';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog, type DialogProps } from '../../Dialogs/Dialog';
import type { CratisDialogHost, CratisDialogSlotProps } from '../../Dialogs/DialogHost';
import { AdapterDialog } from './given/a_stable_presentation_library';
import { anAtomicDialogInTheDom, type AnAtomicDialogInTheDom } from './given/an_atomic_dialog_in_the_dom';

let host: CratisDialogHost;
const RecordingDialog = (props: CratisDialogSlotProps) => {
    host = props.host;
    return <AdapterDialog {...props} />;
};

let dom: AnAtomicDialogInTheDom;
let onClose: sinon.SinonStub;

const dismissFrom = async (source: Parameters<CratisDialogHost['dismiss']>[0], props: Partial<DialogProps>) => {
    await dom.render(
        <Dialog title='Example' onClose={onClose} {...props}>
            Content
        </Dialog>,
    );
    await act(() => host.dismiss(source));
};

beforeEach(() => {
    dom = anAtomicDialogInTheDom(RecordingDialog);
    onClose = sinon.stub();
});

afterEach(() => dom.unmount());

describe('when an adapter dismisses a stable atomic dialog', () => {
    it('should cancel the dialog for an allowed dismissal', async () => {
        await dismissFrom('escape', {});

        onClose.args.should.deep.equal([[DialogResult.Cancelled]]);
    });

    it('should ignore Escape while the dialog is busy', async () => {
        await dismissFrom('escape', { isBusy: true });

        onClose.callCount.should.equal(0);
    });

    it('should ignore the close button while the dialog is busy, even though it stays shown', async () => {
        await dismissFrom('closeButton', { isBusy: true, showCloseButton: true });

        onClose.callCount.should.equal(0);
    });

    it('should ignore an outside press the dialog does not allow', async () => {
        await dismissFrom('outside', { dismissOnOutsideClick: false });

        onClose.callCount.should.equal(0);
    });

    it('should ignore Escape the dialog does not allow', async () => {
        await dismissFrom('escape', { closeOnEscape: false });

        onClose.callCount.should.equal(0);
    });

    it('should ignore a dismissal while the dialog is hidden', async () => {
        await dismissFrom('escape', { visible: false });

        onClose.callCount.should.equal(0);
    });
});
