// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

const onChange = vi.fn();
let container: HTMLDivElement;
let root: Root;

const renderPicker = async (readOnly: boolean, disabled: boolean) => {
    await act(async () => {
        root.render(
            <CratisComponentsProvider>
                <DatePickerInput
                    value={new Date(2026, 7, 27)}
                    onChange={onChange}
                    showButtonBar
                    readOnly={readOnly}
                    disabled={disabled}
                />
            </CratisComponentsProvider>,
        );
    });
};

const action = (name: string) => {
    const button = name === 'today'
        ? document.querySelector<HTMLButtonElement>('[data-cratis-part="today"]')
        : document.querySelector<HTMLButtonElement>('[data-cratis-part="clear"]');
    if (!button) throw new Error(`DatePickerInput did not render ${name}.`);
    return button;
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    onChange.mockClear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const openCalendar = async () => {
    await renderPicker(false, false);
    const trigger = container.querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]');
    if (!trigger) throw new Error('DatePickerInput did not render its trigger.');
    await act(async () => trigger.click());
};

for (const state of ['read-only', 'disabled'] as const) {
    describe(`when the DatePickerInput becomes ${state} with its button bar open`, () => {
        let todayButton: HTMLButtonElement;
        let clearButton: HTMLButtonElement;

        beforeEach(async () => {
            await openCalendar();
            await renderPicker(state === 'read-only', state === 'disabled');
            todayButton = action('today');
            clearButton = action('clear');
            await act(async () => {
                todayButton.click();
                clearButton.click();
            });
        });

        it('should disable both actions', () => {
            for (const button of [todayButton, clearButton]) {
                expect(button.disabled).to.equal(true);
                expect(button.getAttribute('aria-disabled')).to.equal('true');
                expect(button.getAttribute('data-disabled')).to.equal('true');
            }
        });

        it('should not emit changes from either action', () => {
            expect(onChange.mock.calls).to.have.lengthOf(0);
        });
    });
}

for (const readOnly of [true, false]) {
    describe(`when pressing Alt+ArrowDown on a ${readOnly ? 'read-only' : 'writable'} DatePickerInput`, () => {
        let isOpen: boolean;

        beforeEach(async () => {
            await renderPicker(readOnly, false);
            const segment = container.querySelector<HTMLElement>('[data-cratis-part="segment"][tabindex="0"]');
            if (!segment) throw new Error('DatePickerInput did not render a focusable segment.');
            await act(async () => {
                segment.focus();
                segment.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true,
                }));
            });
            isOpen = container.querySelector('[data-cratis-part="root"]')?.getAttribute('data-open') === 'true';
        });

        it(`should ${readOnly ? 'not open' : 'open'} the calendar`, () => {
            expect(isOpen).to.equal(!readOnly);
        });
    });
}
