// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { DatePickerInput } from '../../Common/DatePickerInput';
import { Tooltip } from '../../Common/Tooltip';
import { TablePaginator } from '../../DataTables/TablePaginator';
import { Dialog } from '../../Dialogs/Dialog';
import { Dropdown } from '../../Dropdown/Dropdown';
import { unstable_useOverlayEnvironment } from '../RendererContext';
import type { unstable_CratisOverlayEnvironment } from '../overlayEnvironment';

interface OverlayFixture {
    readonly name: string;
    readonly element: ReactElement;
    readonly primarySelector: string;
    readonly overlaySelector: string;
    readonly open: (container: HTMLElement) => void;
}

const DialogHarness = ({ children }: { children?: ReactElement }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button type='button' data-open-dialog onClick={() => setIsOpen(true)}>
                Open dialog
            </button>
            <Dialog title='Overlay dialog' visible={isOpen} buttons={null}>
                {children ?? 'Dialog content'}
            </Dialog>
        </>
    );
};

const fixtures: readonly OverlayFixture[] = [
    {
        name: 'tooltip',
        element: (
            <Tooltip content='Overlay tooltip'>
                <button type='button'>Tooltip trigger</button>
            </Tooltip>
        ),
        primarySelector: 'button',
        overlaySelector: '[data-cratis-part="popup"]',
        open: (container) =>
            container.querySelector<HTMLButtonElement>('button')?.focus(),
    },
    {
        name: 'dropdown',
        element: <Dropdown options={['One', 'Two']} aria-label='Choice' />,
        primarySelector: '[data-cratis-part="trigger"]',
        overlaySelector: '[data-cratis-part="popover"]',
        open: (container) =>
            container
                .querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')
                ?.click(),
    },
    {
        name: 'date picker',
        element: (
            <DatePickerInput value={null} onChange={() => undefined} aria-label='Date' />
        ),
        primarySelector: '[data-cratis-part="trigger"]',
        overlaySelector: '[data-cratis-part="popover"]',
        open: (container) =>
            container
                .querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')
                ?.click(),
    },
    {
        name: 'dialog',
        element: <DialogHarness />,
        primarySelector: '[data-open-dialog]',
        overlaySelector: '.cratis-dialog[data-cratis-part="root"]',
        open: (container) =>
            container.querySelector<HTMLButtonElement>('[data-open-dialog]')?.click(),
    },
];

interface MountedFixture {
    readonly container: HTMLDivElement;
    readonly root: Root;
}

const mount = async (
    fixture: OverlayFixture,
    overlayEnvironment?: unstable_CratisOverlayEnvironment,
): Promise<MountedFixture> => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(
            <CratisComponentsProvider overlayEnvironment={overlayEnvironment}>
                {fixture.element}
            </CratisComponentsProvider>,
        );
    });
    return { container, root };
};

const open = async (fixture: OverlayFixture, mounted: MountedFixture) => {
    await act(async () => fixture.open(mounted.container));
};

const unmount = async (mounted: MountedFixture) => {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
};

const OverlayHookProbe = () => {
    unstable_useOverlayEnvironment();
    return <span>hook only</span>;
};

describe('when Core atomic implementations use the overlay environment', () => {
    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
    });

    afterEach(() => {
        document.documentElement.style.removeProperty('overflow');
        vi.restoreAllMocks();
    });

    for (const fixture of fixtures) {
        it(`should defer ${fixture.name} container lookup until its overlay opens`, async () => {
            const customContainer = document.createElement('div');
            document.body.append(customContainer);
            const getContainer = vi.fn(() => customContainer);
            const mounted = await mount(fixture, { getContainer });

            try {
                expect(getContainer.mock.calls).to.have.lengthOf(0);
                expect(
                    mounted.container.querySelector(fixture.primarySelector),
                ).not.to.equal(null);

                await open(fixture, mounted);

                expect(getContainer.mock.calls.length).to.be.greaterThan(0);
                expect(
                    customContainer.querySelector(fixture.overlaySelector),
                ).not.to.equal(null);
            } finally {
                await unmount(mounted);
                customContainer.remove();
            }
        });

        it(`should portal ${fixture.name} to the body by default`, async () => {
            const mounted = await mount(fixture);

            try {
                await open(fixture, mounted);
                const overlay = document.querySelector(fixture.overlaySelector);
                expect(overlay).not.to.equal(null);
                expect(document.body.contains(overlay)).to.equal(true);
                expect(mounted.container.contains(overlay)).to.equal(false);
            } finally {
                await unmount(mounted);
            }
        });

        it(`should keep the ${fixture.name} control and defer its overlay when the container is null`, async () => {
            const getContainer = vi.fn(() => null);
            const mounted = await mount(fixture, { getContainer });

            try {
                expect(getContainer.mock.calls).to.have.lengthOf(0);
                await open(fixture, mounted);

                expect(getContainer.mock.calls.length).to.be.greaterThan(0);
                expect(
                    mounted.container.querySelector(fixture.primarySelector),
                ).not.to.equal(null);
                expect(document.querySelector(fixture.overlaySelector)).to.equal(null);
            } finally {
                await unmount(mounted);
            }
        });
    }

    it('should not look up a container merely from the hook, closed controls, or SSR', async () => {
        const getContainer = vi.fn(() => document.body);
        const closedControls = (
            <>
                <OverlayHookProbe />
                <Tooltip disabled content='Closed'>
                    <button type='button'>Disabled tooltip</button>
                </Tooltip>
                <Dropdown options={['One']} aria-label='Closed choice' />
                <DatePickerInput value={null} onChange={() => undefined} />
                <Dialog title='Closed dialog' visible={false}>
                    Closed
                </Dialog>
                <TablePaginator page={0} pageCount={1} onPageChange={() => undefined} />
            </>
        );
        const mountedContainer = document.createElement('div');
        document.body.append(mountedContainer);
        const root = createRoot(mountedContainer);

        try {
            await act(async () => {
                root.render(
                    <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
                        {closedControls}
                    </CratisComponentsProvider>,
                );
            });
            expect(getContainer.mock.calls).to.have.lengthOf(0);

            renderToStaticMarkup(
                <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
                    <Tooltip content='SSR tooltip'>
                        <button type='button'>Trigger</button>
                    </Tooltip>
                    <Dropdown options={['One']} aria-label='SSR choice' />
                    <DatePickerInput value={null} onChange={() => undefined} />
                    <Dialog title='SSR dialog'>Inline server dialog</Dialog>
                    <TablePaginator
                        page={0}
                        pageCount={1}
                        onPageChange={() => undefined}
                    />
                </CratisComponentsProvider>,
            );
            expect(getContainer.mock.calls).to.have.lengthOf(0);
        } finally {
            await act(async () => root.unmount());
            mountedContainer.remove();
        }
    });

    it('should create only one Core focus trap, modal marker, scroll lock, and dismissal owner', async () => {
        const onCancel = vi.fn(() => true);
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);

        try {
            await act(async () => {
                root.render(
                    <CratisComponentsProvider>
                        <Dialog title='Single owner' dismissable onCancel={onCancel}>
                            Content
                        </Dialog>
                    </CratisComponentsProvider>,
                );
                await new Promise((resolve) => setTimeout(resolve, 0));
            });

            expect(
                document.querySelectorAll('[data-overlay-container]').length,
            ).to.be.at.most(1);
            expect(
                document.querySelectorAll('[data-focus-scope-start]').length,
            ).to.be.at.most(1);
            expect(
                document.querySelectorAll('[data-focus-scope-end]').length,
            ).to.be.at.most(1);
            expect(document.querySelectorAll('[role="dialog"]')).to.have.lengthOf(1);
            expect(document.documentElement.style.overflow).to.equal('hidden');

            await act(async () => {
                (document.activeElement ?? document).dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'Escape',
                        code: 'Escape',
                        bubbles: true,
                    }),
                );
            });
            expect(onCancel.mock.calls).to.have.lengthOf(1);
        } finally {
            await act(async () => root.unmount());
            container.remove();
        }
        expect(document.documentElement.style.overflow).to.equal('');
    });

    it('should portal a Dropdown inside a Dialog to the same custom host but outside the dialog', async () => {
        const customContainer = document.createElement('div');
        document.body.append(customContainer);
        const getContainer = vi.fn(() => customContainer);
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);

        try {
            await act(async () => {
                root.render(
                    <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
                        <Dialog title='Nested overlays' buttons={null}>
                            <Dropdown options={['One', 'Two']} aria-label='Choice' />
                        </Dialog>
                    </CratisComponentsProvider>,
                );
            });
            const dialog = customContainer.querySelector(
                '.cratis-dialog[data-cratis-part="root"]',
            );
            const trigger = customContainer.querySelector<HTMLButtonElement>(
                '[data-cratis-part="trigger"]',
            );
            if (!trigger) throw new Error('Nested Dropdown trigger was not rendered.');

            await act(async () => trigger.click());

            const popover = customContainer.querySelector(
                '.cratis-dropdown__popover[data-cratis-part="popover"]',
            );
            expect(dialog).not.to.equal(null);
            expect(popover).not.to.equal(null);
            expect(dialog?.contains(popover)).to.equal(false);
            expect(getContainer.mock.calls.length).to.be.greaterThan(1);
        } finally {
            await act(async () => root.unmount());
            container.remove();
            customContainer.remove();
        }
    });
});
