// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

describe('when DatePickerInput renders authoritative states', () => {
    let container: HTMLDivElement;
    let root: Root;

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
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderPicker = async (element: React.ReactElement) => {
        await act(async () => {
            root.render(<CratisComponentsProvider>{element}</CratisComponentsProvider>);
        });
    };

    const part = (name: string, parent: ParentNode = container) => {
        switch (name) {
            case 'root':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="root"]',
                );
            case 'group':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="group"]',
                );
            case 'input':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="input"]',
                );
            case 'trigger':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="trigger"]',
                );
            case 'popover':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="popover"]',
                );
            case 'dialog':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="dialog"]',
                );
            case 'calendar':
                return parent.querySelector<HTMLElement>(
                    '[data-cratis-part="calendar"]',
                );
            default:
                throw new Error(`Unknown DatePickerInput part: ${name}`);
        }
    };

    it('should put selected, invalid, disabled, and readonly on root and control pt destinations', async () => {
        await renderPicker(
            <DatePickerInput
                value={new Date(2026, 7, 27)}
                onChange={() => undefined}
                invalid
                disabled
                pt={{
                    root: { 'data-testid': 'date-root' },
                    group: { 'data-testid': 'date-group' },
                    input: { 'data-testid': 'date-input' },
                    trigger: { 'data-testid': 'date-trigger' },
                }}
            />,
        );

        for (const name of ['root', 'group', 'input', 'trigger']) {
            const element = part(name);
            expect(element?.dataset.selected, `${name} selected`).to.equal('true');
            expect(element?.dataset.invalid, `${name} invalid`).to.equal('true');
            expect(element?.dataset.disabled, `${name} disabled`).to.equal('true');
            expect(element?.hasAttribute('data-open')).to.equal(false);
            expect(element?.getAttribute('data-testid')).to.equal(`date-${name}`);
        }

        await renderPicker(
            <DatePickerInput
                value={new Date(2026, 7, 27)}
                onChange={() => undefined}
                readOnly
            />,
        );
        for (const name of ['root', 'group', 'input', 'trigger']) {
            expect(part(name)?.dataset.readonly, `${name} readonly`).to.equal('true');
        }
    });

    it('should omit false state attributes', async () => {
        await renderPicker(
            <DatePickerInput value={null} onChange={() => undefined} />,
        );

        for (const name of ['root', 'group', 'input', 'trigger']) {
            const element = part(name);
            expect(element?.hasAttribute('data-selected')).to.equal(false);
            expect(element?.hasAttribute('data-invalid')).to.equal(false);
            expect(element?.hasAttribute('data-disabled')).to.equal(false);
            expect(element?.hasAttribute('data-readonly')).to.equal(false);
            expect(element?.hasAttribute('data-open')).to.equal(false);
        }
    });

    it('should put open, selected, and disabled states on popup and cell pt destinations', async () => {
        const selectedDate = new Date(2026, 7, 27);
        const minDate = new Date(2026, 7, 26);
        const maxDate = new Date(2026, 7, 28);
        await renderPicker(
            <DatePickerInput
                value={selectedDate}
                onChange={() => undefined}
                minDate={minDate}
                maxDate={maxDate}
                pt={{
                    popover: { 'data-testid': 'date-popover' },
                    dialog: { 'data-testid': 'date-dialog' },
                    calendar: { 'data-testid': 'date-calendar' },
                    cell: { 'data-testid': 'date-cell' },
                }}
            />,
        );

        const trigger = part('trigger') as HTMLButtonElement;
        await act(async () => trigger.click());

        for (const name of ['root', 'group', 'input', 'trigger']) {
            expect(part(name)?.dataset.open).to.equal('true');
        }
        for (const name of ['popover', 'dialog', 'calendar']) {
            const element = part(name, document);
            expect(element?.dataset.open).to.equal('true');
            expect(element?.getAttribute('data-testid')).to.equal(`date-${name}`);
        }

        const cells = document.querySelectorAll<HTMLElement>(
            '[data-cratis-part="cell"]',
        );
        const selectedCell = Array.from(cells).find((cell) =>
            cell.hasAttribute('data-selected'),
        );
        const disabledCell = Array.from(cells).find((cell) =>
            cell.hasAttribute('data-disabled'),
        );
        expect(selectedCell).not.to.equal(undefined);
        expect(selectedCell?.getAttribute('data-testid')).to.equal('date-cell');
        expect(disabledCell).not.to.equal(undefined);
        expect(disabledCell?.getAttribute('data-selected')).to.equal(null);
    });
});
