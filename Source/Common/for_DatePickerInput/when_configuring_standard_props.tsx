// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { en } from '@primereact/core/locale';
import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it } from 'vitest';
import {
    CratisComponentsProvider,
    type CratisComponentsConfig,
} from '../CratisComponentsProvider';
import { DatePickerInput, type DatePickerInputProps } from '../DatePickerInput';

type DatePickerOptions = Partial<Omit<DatePickerInputProps, 'value' | 'onChange'>> & {
    value?: Date | null;
};

interface MountedDatePicker {
    container: HTMLDivElement;
    root: Root;
    input: HTMLInputElement;
    trigger: HTMLButtonElement;
}

const mountDatePicker = async (
    options: DatePickerOptions,
    configuration?: CratisComponentsConfig,
): Promise<MountedDatePicker> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver, while PrimeReact only calls its three observer methods.
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
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            <CratisComponentsProvider value={configuration}>
                <DatePickerInput
                    value={options.value ?? null}
                    onChange={() => undefined}
                    showIcon
                    {...options}
                />
            </CratisComponentsProvider>,
        );
    });

    const input = container.querySelector<HTMLInputElement>(
        '[data-scope="datepicker"][data-part="input"]',
    );
    const trigger = container.querySelector<HTMLButtonElement>(
        '[data-scope="datepicker"][data-part="trigger"]',
    );
    if (!input || !trigger) {
        throw new Error('DatePickerInput did not render its input and trigger.');
    }

    return { container, root, input, trigger };
};

const unmountDatePicker = async (mounted: MountedDatePicker) => {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
};

const popup = () =>
    document.querySelector('[data-scope="datepicker"][data-part="popup"]');

describe('when configuring standard DatePickerInput props', () => {
    it('should put the id directly on the input', async () => {
        const mounted = await mountDatePicker({ id: 'appointment-date' });
        try {
            expect(mounted.input.id).to.equal('appointment-date');
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should disable the model and prevent keyboard activation', async () => {
        const mounted = await mountDatePicker({ disabled: true });
        try {
            expect(mounted.input.disabled).to.equal(true);
            expect(mounted.trigger.disabled).to.equal(true);
            await act(async () => {
                mounted.input.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        bubbles: true,
                        code: 'ArrowDown',
                        key: 'ArrowDown',
                    }),
                );
            });
            expect(popup()).to.equal(null);
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should make the date model read-only', async () => {
        const mounted = await mountDatePicker({ readOnly: true });
        try {
            expect(mounted.input.readOnly).to.equal(true);
            expect(mounted.trigger.disabled).to.equal(true);
            await act(async () => {
                mounted.input.focus();
                mounted.input.click();
                mounted.input.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        bubbles: true,
                        code: 'ArrowDown',
                        key: 'ArrowDown',
                    }),
                );
            });
            expect(popup()).to.equal(null);
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should render the localized button bar', async () => {
        const mounted = await mountDatePicker(
            {
                showButtonBar: true,
                value: new Date(2026, 7, 22),
            },
            {
                locale: 'test',
                locales: {
                    test: {
                        ...en,
                        today: 'Translated today',
                        clear: 'Translated clear',
                    },
                },
            },
        );
        try {
            await act(async () => mounted.trigger.click());
            const buttonBar = document.querySelector(
                '[data-scope="datepicker"][data-part="buttonbar"]',
            );
            expect(buttonBar?.textContent).to.contain('Translated today');
            expect(buttonBar?.textContent).to.contain('Translated clear');
        } finally {
            await unmountDatePicker(mounted);
        }
    });
});
