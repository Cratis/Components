// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { RouterProvider } from 'react-aria-components';
import { Breadcrumbs } from '../Breadcrumbs';
import { CratisComponentsProvider, type CratisComponentsRouter } from '../CratisComponentsProvider';
import { mountPrimitive, unmountPrimitive, type MountedPrimitive } from '../for_Primitives/given/a_primitive_dom';

const trail = (onNavigate?: () => void, href = '/projects') => (
    <Breadcrumbs items={[
        { label: 'Projects', href, onNavigate },
        { label: 'Example Project', href: '/projects/example' },
    ]} />
);

// These specs observe event cancellation and callback delivery, not actual tab opening or reloads.
describe('when routing breadcrumbs through the Components provider', () => {
    let mounted: MountedPrimitive;
    let navigate: ReturnType<typeof vi.fn>;

    const render = async (router?: CratisComponentsRouter, onNavigate?: () => void, href?: string) => {
        await act(async () => mounted.root.render(
            <CratisComponentsProvider value={{ router }}>
                {trail(onNavigate, href)}
            </CratisComponentsProvider>,
        ));
    };

    const click = async (options: MouseEventInit = {}, type = 'click') => {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...options });
        await act(async () => mounted.container.querySelector('a')!.dispatchEvent(event));
        return event;
    };

    beforeEach(async () => {
        navigate = vi.fn();
        mounted = await mountPrimitive(<div />);
        await render({ navigate });
    });

    afterEach(async () => unmountPrimitive(mounted));

    it('should route an ordinary click once and prevent native navigation', async () => {
        const event = await click();
        expect(navigate.mock.calls.map(([href]) => href)).to.deep.equal(['/projects']);
        expect(event.defaultPrevented).to.equal(true);
    });

    it('should resolve the rendered href while navigating to the original destination', async () => {
        await render({ navigate, useHref: (href) => `/demo${href}` });
        expect(mounted.container.querySelector('a')?.getAttribute('href')).to.equal('/demo/projects');
        await click();
        expect(navigate.mock.calls.map(([href]) => href)).to.deep.equal(['/projects']);
    });

    for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
        it(`should leave ${modifier} clicks to the browser`, async () => {
            const event = await click({ [modifier]: true });
            expect(navigate.mock.calls).to.have.lengthOf(0);
            expect(event.defaultPrevented).to.equal(false);
        });
    }

    it('should leave middle button auxiliary clicks to the browser', async () => {
        const event = await click({ button: 1 }, 'auxclick');
        expect(navigate.mock.calls).to.have.lengthOf(0);
        expect(event.defaultPrevented).to.equal(false);
    });

    it('should leave external links to the browser', async () => {
        await render({ navigate }, undefined, 'https://example.invalid/projects');
        const event = await click();
        expect(navigate.mock.calls).to.have.lengthOf(0);
        expect(event.defaultPrevented).to.equal(false);
    });

    it('should retain native links when no router is configured', async () => {
        await render();
        const event = await click();
        expect(mounted.container.querySelector('a')?.getAttribute('href')).to.equal('/projects');
        expect(navigate.mock.calls).to.have.lengthOf(0);
        expect(event.defaultPrevented).to.equal(false);
    });

    it('should not make the current page navigable', async () => {
        const current = mounted.container.querySelector('[aria-current="page"]')!;
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        await act(async () => current.dispatchEvent(event));
        expect(current.hasAttribute('href')).to.equal(false);
        expect(navigate.mock.calls).to.have.lengthOf(0);
    });

    it('should retain the legacy press callback without a router', async () => {
        const onNavigate = vi.fn();
        await render(undefined, onNavigate);
        await click();
        expect(onNavigate.mock.calls).to.have.lengthOf(1);
    });

    it('should use the latest router callbacks after rerendering', async () => {
        const latestNavigate = vi.fn();
        await render({ navigate: latestNavigate, useHref: (href) => `/latest${href}` });
        expect(mounted.container.querySelector('a')?.getAttribute('href')).to.equal('/latest/projects');
        await click();
        expect(navigate.mock.calls).to.have.lengthOf(0);
        expect(latestNavigate.mock.calls.map(([href]) => href)).to.deep.equal(['/projects']);
    });

    it('should preserve inherited routing when no router is configured', async () => {
        await act(async () => mounted.root.render(
            <RouterProvider navigate={navigate}>
                <CratisComponentsProvider>{trail()}</CratisComponentsProvider>
            </RouterProvider>,
        ));
        const event = await click();
        expect(navigate.mock.calls.map(([href]) => href)).to.deep.equal(['/projects']);
        expect(event.defaultPrevented).to.equal(true);
    });
});
