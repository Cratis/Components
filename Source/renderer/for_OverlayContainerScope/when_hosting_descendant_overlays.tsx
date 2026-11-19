// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { CratisOverlayEnvironment } from '../overlayEnvironment';
import { OverlayContainerScope, useOverlayContainer, type OverlayContainer } from '../OverlayContainerScope';
import { unstable_useOverlayEnvironment } from '../RendererContext';

const environments = new Map<string, CratisOverlayEnvironment>();
const hosts = new Map<string, OverlayContainer>();

const Probe = ({ name }: { name: string }) => {
    environments.set(name, unstable_useOverlayEnvironment());
    return null;
};

interface HostProps {
    readonly name: string;
    readonly open: boolean;
    readonly register?: boolean;
    readonly children?: ReactNode;
}

const Host = ({ name, open, register = true, children }: HostProps) => {
    const host = useOverlayContainer(open);
    hosts.set(name, host);
    return (
        <OverlayContainerScope host={host}>
            <div data-host={name}>
                {register && <div data-overlay-container={name} ref={host.register} />}
                {children}
            </div>
        </OverlayContainerScope>
    );
};

const containerOf = (name: string) => environments.get(name)?.getContainer();
const overlayElementOf = (name: string) => document.querySelector(`[data-overlay-container="${name}"]`);

let container: HTMLDivElement;
let root: Root;
let pageContainer: HTMLDivElement;
const pageEnvironment: CratisOverlayEnvironment = { getContainer: () => pageContainer };

const render = (children: ReactNode, overlayEnvironment = pageEnvironment) =>
    act(() => {
        root.render(
            <CratisComponentsProvider overlayEnvironment={overlayEnvironment}>{children}</CratisComponentsProvider>,
        );
    });

beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    environments.clear();
    hosts.clear();
    pageContainer = document.createElement('div');
    container = document.createElement('div');
    document.body.append(pageContainer, container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    pageContainer.remove();
});

describe('when hosting descendant overlays', () => {
    it('should portal descendants of an open host into the element it registered', async () => {
        await render(
            <Host name='first' open>
                <Probe name='inside' />
            </Host>,
        );

        expect(containerOf('inside')).to.equal(overlayElementOf('first'));
    });

    it('should keep the surrounding environment until the host registers an element', async () => {
        await render(
            <Host name='first' open register={false}>
                <Probe name='inside' />
            </Host>,
        );

        expect(containerOf('inside')).to.equal(pageContainer);
    });

    it('should give every host its own registration', async () => {
        await render(
            <>
                <Host name='first' open>
                    <Probe name='in-first' />
                </Host>
                <Host name='second' open>
                    <Probe name='in-second' />
                </Host>
            </>,
        );

        expect(hosts.get('first')!.register).to.not.equal(hosts.get('second')!.register);
        expect(containerOf('in-first')).to.equal(overlayElementOf('first'));
        expect(containerOf('in-second')).to.equal(overlayElementOf('second'));
    });

    it('should register descendants with the nearest host rather than an outer one', async () => {
        await render(
            <Host name='outer' open>
                <Probe name='in-outer' />
                <Host name='inner' open>
                    <Probe name='in-inner' />
                </Host>
            </Host>,
        );

        expect(containerOf('in-inner')).to.equal(overlayElementOf('inner'));
        expect(containerOf('in-outer')).to.equal(overlayElementOf('outer'));
    });

    it('should give no container to descendants once the host closes', async () => {
        await render(
            <Host name='first' open>
                <Probe name='inside' />
            </Host>,
        );
        const openEnvironment = environments.get('inside')!;

        await render(
            <Host name='first' open={false}>
                <Probe name='inside' />
            </Host>,
        );

        expect(containerOf('inside')).to.equal(null);
        expect(openEnvironment).to.not.equal(environments.get('inside'));
    });

    it('should ignore a registration from a closed session after the host reopens', async () => {
        await render(<Host name='first' open register={false} />);
        const staleRegister = hosts.get('first')!.register;
        await render(<Host name='first' open={false} register={false} />);
        await render(
            <Host name='first' open register={false}>
                <Probe name='inside' />
            </Host>,
        );

        const staleElement = document.createElement('div');
        document.body.append(staleElement);
        await act(() => staleRegister(staleElement));

        expect(containerOf('inside')).to.equal(pageContainer);
        staleElement.remove();
    });

    it('should keep a newer session registration when a callback from an earlier session fires', async () => {
        await render(<Host name='first' open register={false} />);
        const staleRegister = hosts.get('first')!.register;
        await render(<Host name='first' open={false} register={false} />);
        await render(
            <Host name='first' open>
                <Probe name='inside' />
            </Host>,
        );

        const staleElement = document.createElement('div');
        document.body.append(staleElement);
        await act(() => staleRegister(staleElement));
        await act(() => staleRegister(null));

        expect(containerOf('inside')).to.equal(overlayElementOf('first'));
        staleElement.remove();
    });

    it('should not carry a registration over when the host remounts', async () => {
        await render(
            <Host name='first' open>
                <Probe name='inside' />
            </Host>,
        );
        const firstElement = overlayElementOf('first');
        await render(null);
        await render(
            <Host name='first' open register={false}>
                <Probe name='inside' />
            </Host>,
        );

        expect(firstElement?.isConnected).to.equal(false);
        expect(containerOf('inside')).to.equal(pageContainer);
    });

    it('should fall back to the current surrounding environment when it changes while unregistered', async () => {
        await render(
            <Host name='first' open register={false}>
                <Probe name='inside' />
            </Host>,
        );
        const themedContainer = document.createElement('div');
        document.body.append(themedContainer);

        await render(
            <Host name='first' open register={false}>
                <Probe name='inside' />
            </Host>,
            { getContainer: () => themedContainer },
        );

        expect(containerOf('inside')).to.equal(themedContainer);
        themedContainer.remove();
    });
});
