// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import type { CratisDialogHost, CratisDialogSlotProps } from '../../Dialogs/DialogHost';
import { unstable_useOverlayHost, type unstable_OverlayHost } from '..';
import { AdapterDialog } from './given/a_stable_presentation_library';
import { anAtomicDialogInTheDom, type AnAtomicDialogInTheDom } from './given/an_atomic_dialog_in_the_dom';

let host: CratisDialogHost;
const RecordingDialog = (props: CratisDialogSlotProps) => {
    host = props.host;
    return <AdapterDialog {...props} />;
};

let overlayHost: unstable_OverlayHost;
const Probe = () => {
    overlayHost = unstable_useOverlayHost();
    return null;
};

const renderDialog = (visible: boolean) =>
    dom.render(
        <Dialog title='Example' buttons={null} visible={visible}>
            <Probe />
        </Dialog>,
    );

let dom: AnAtomicDialogInTheDom;

beforeEach(() => {
    dom = anAtomicDialogInTheDom(RecordingDialog);
});

afterEach(() => dom.unmount());

describe('when a stable atomic dialog hosts overlays', () => {
    describe('and the dialog is open', () => {
        beforeEach(() => renderDialog(true));

        it('should give descendants the dialog as their overlay host', () => overlayHost.id.should.equal(host.id));
        it('should report the overlay host open', () => overlayHost.open.should.be.true);
        it('should stack descendant tooltips above the dialog', () =>
            overlayHost.tooltipZIndex.should.contain(host.zIndex));
    });

    describe('and the dialog is hidden', () => {
        beforeEach(() => renderDialog(false));

        it('should still give descendants the dialog as their overlay host', () =>
            overlayHost.id.should.equal(host.id));
        it('should report the overlay host closed', () => overlayHost.open.should.be.false);
    });
});
