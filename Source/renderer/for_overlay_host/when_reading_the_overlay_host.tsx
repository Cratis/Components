// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import { unstable_useOverlayHost, type unstable_OverlayHost } from '../useOverlayHost';

let root: Root | undefined;
let host: HTMLElement | undefined;
const seen: Record<string, unstable_OverlayHost> = {};

const Probe = ({ name }: { name: string }) => {
    seen[name] = unstable_useOverlayHost();
    return null;
};

const render = async (element: React.ReactElement) => {
    if (!root) {
        host = document.createElement('div');
        document.body.append(host);
        root = createRoot(host);
    }
    await act(async () => root!.render(element));
};

afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    root = undefined;
    host = undefined;
    document.body.innerHTML = '';
    for (const key of Object.keys(seen)) delete seen[key];
});

describe('when reading the overlay host outside any dialog', () => {
    it('should report the always-open document with the static tooltip token', async () => {
        await render(<Probe name='plain' />);
        expect(seen.plain).to.deep.equal({
            id: 'document',
            open: true,
            tooltipZIndex: 'var(--cratis-z-index-tooltip)',
        });
    });
});

describe('when reading the overlay host inside a dialog', () => {
    it('should report an open host with a tooltip z-index above the dialog', async () => {
        await render(
            <Dialog title='First' visible buttons={null}>
                <Probe name='first' />
            </Dialog>,
        );
        expect(seen.first.open).to.equal(true);
        expect(seen.first.id).to.not.equal('document');
        expect(seen.first.tooltipZIndex).to.equal('calc(var(--cratis-z-index-dialog) + 200)');
    });

    it('should report a closed host with the same identity once the dialog starts closing', async () => {
        const dialog = (visible: boolean) => (
            <Dialog title='First' visible={visible} buttons={null}>
                <Probe name='first' />
            </Dialog>
        );
        await render(dialog(true));
        const openHost = seen.first;
        await render(dialog(false));
        expect(seen.first.open).to.equal(false);
        expect(seen.first.id).to.equal(openHost.id);
    });
});

describe('when reading the overlay host inside nested dialogs', () => {
    it('should give each dialog its own identity and stack the inner one higher', async () => {
        await render(
            <>
                <Dialog title='First' visible buttons={null}>
                    <Probe name='first' />
                </Dialog>
                <Dialog title='Second' visible buttons={null}>
                    <Probe name='second' />
                </Dialog>
            </>,
        );
        expect(seen.second.id).to.not.equal(seen.first.id);
        expect(seen.second.tooltipZIndex).to.not.equal(seen.first.tooltipZIndex);
    });
});
