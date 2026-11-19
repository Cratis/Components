// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { expect } from 'chai';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { ButtonProps } from '../../Common/Button';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog, type DialogProps } from '../../Dialogs/Dialog';
import type { CratisDialogHost, CratisDialogSlotProps } from '../../Dialogs/DialogHost';
import {
    definePresentationUiLibrary,
    type CratisAtomicSlotMap,
    type CratisPresentationSlotMap,
    type unstable_UiLibrary,
} from '..';
import { useNearestDialogZIndex } from '../DialogStackContext';
import { unstable_useOverlayEnvironment } from '../RendererContext';
import {
    aStablePresentationLibrary,
    AdapterDialog,
    dialogAtomicSlots,
    silentPresentationSlots,
} from './given/a_stable_presentation_library';

const hosts: CratisDialogHost[] = [];

const RecordingDialog = (props: CratisDialogSlotProps) => {
    hosts.push(props.host);
    return <AdapterDialog {...props} />;
};

const StubButton = ({ label, onClick }: ButtonProps) => (
    <button type='button' data-stub-button={String(label)} onClick={onClick}>
        {label}
    </button>
);

const presentationSlots = (): CratisPresentationSlotMap => ({
    ...silentPresentationSlots(),
    'common.button': { mode: 'presentation', fidelity: 'native', render: StubButton },
});

const stableLibrary = (atomicSlots?: CratisAtomicSlotMap) =>
    definePresentationUiLibrary({ ...aStablePresentationLibrary(atomicSlots), slots: presentationSlots() });
const withDialog = () => stableLibrary(dialogAtomicSlots(RecordingDialog));
const withoutDialog = () => stableLibrary();

const dialog = ({ children = 'Content', ...props }: Partial<DialogProps> = {}) => (
    <Dialog title='Example' {...props}>
        {children}
    </Dialog>
);

const renderStatic = (library: unstable_UiLibrary | undefined, children: ReactNode) =>
    renderToStaticMarkup(<CratisComponentsProvider library={library}>{children}</CratisComponentsProvider>);

let container: HTMLDivElement;
let root: Root;

const render = (children: ReactNode) =>
    act(() => {
        root.render(<CratisComponentsProvider library={withDialog()}>{children}</CratisComponentsProvider>);
    });

const lastHost = () => hosts[hosts.length - 1];

beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    hosts.length = 0;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe('when resolving a stable atomic dialog', () => {
    it('should keep the built-in dialog for a stable library without the dialog slot', () => {
        const html = renderStatic(withoutDialog(), dialog());

        expect(html).to.contain('data-cratis-part="backdrop"');
        expect(html).to.not.contain('data-adapter-dialog');
    });

    it('should render the adapter dialog with its public props', () => {
        const html = renderStatic(withDialog(), dialog());

        expect(html).to.contain('<h2>Example</h2>');
        expect(html).to.contain('Content');
        expect(html).to.not.contain('cratis-dialog__backdrop');
    });

    it('should hand the adapter the footer part with the dialog buttons', () => {
        const html = renderStatic(withDialog(), dialog({ buttons: DialogButtons.OkCancel }));

        expect(html).to.contain('data-cratis-part="footer"');
        expect(html).to.contain('data-stub-button="Ok"');
        expect(html).to.contain('data-stub-button="Cancel"');
    });

    it('should hand the adapter no footer when the dialog has no buttons', () => {
        renderStatic(withDialog(), dialog({ buttons: null }));

        expect(lastHost().footer).to.equal(null);
    });

    it('should block every dismissal path while busy', () => {
        renderStatic(withDialog(), dialog({ isBusy: true, showCloseButton: true }));

        expect(lastHost().dismissal).to.deep.equal({ outside: false, escape: false, closeButton: true });
    });

    it('should resolve the dismissal paths from the public props', () => {
        renderStatic(withDialog(), dialog({ dismissOnOutsideClick: false }));

        expect(lastHost().dismissal).to.deep.equal({ outside: false, escape: true, closeButton: true });
    });

    it('should cancel the dialog when the adapter dismisses it', async () => {
        const onClose = vi.fn();
        await render(dialog({ onClose }));

        await act(() => lastHost().dismiss('escape'));

        expect(onClose).toHaveBeenCalledWith(DialogResult.Cancelled);
    });

    it('should confirm the dialog through the host footer', async () => {
        const onConfirm = vi.fn();
        await render(dialog({ onConfirm }));

        await act(() => container.querySelector<HTMLButtonElement>('[data-stub-button="Ok"]')!.click());

        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('should give every dialog its own host identity and stack tier', async () => {
        await render(
            <>
                {dialog({ title: 'First' })}
                {dialog({ title: 'Second' })}
            </>,
        );
        const [first, second] = [...container.querySelectorAll('[data-adapter-dialog]')];

        expect(first.getAttribute('data-adapter-dialog')).to.not.equal(second.getAttribute('data-adapter-dialog'));
        expect(first.getAttribute('data-z-index')).to.not.equal(second.getAttribute('data-z-index'));
    });

    it('should stack descendants on the dialog they are rendered in', async () => {
        const nearest: (string | null)[] = [];
        const Probe = () => {
            nearest.push(useNearestDialogZIndex());
            return null;
        };
        await render(dialog({ children: <Probe /> }));

        expect(nearest[nearest.length - 1]).to.equal(lastHost().zIndex);
    });

    it('should portal descendants into the overlay element the adapter registered', async () => {
        let environment: ReturnType<typeof unstable_useOverlayEnvironment> | undefined;
        const Probe = () => {
            environment = unstable_useOverlayEnvironment();
            return null;
        };
        await render(dialog({ children: <Probe /> }));

        expect(environment?.getContainer()).to.equal(container.querySelector('[data-overlay-container]'));
    });

    it('should give descendants no overlay container while the dialog is hidden', async () => {
        let environment: ReturnType<typeof unstable_useOverlayEnvironment> | undefined;
        const Probe = () => {
            environment = unstable_useOverlayEnvironment();
            return null;
        };
        await render(dialog({ visible: false, children: <Probe /> }));

        expect(environment?.getContainer()).to.equal(null);
    });
});
