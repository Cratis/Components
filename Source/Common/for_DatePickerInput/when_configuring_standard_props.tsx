// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput, type DatePickerInputProps } from '../DatePickerInput';

type DatePickerOptions = Partial<Omit<DatePickerInputProps, 'value' | 'onChange'>> & {
    value?: Date | null;
};

interface MountedDatePicker {
    container: HTMLDivElement;
    root: Root;
    pickerRoot: HTMLElement;
    group: HTMLElement;
    trigger: HTMLButtonElement;
}

const mountDatePicker = async (options: DatePickerOptions): Promise<MountedDatePicker> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            <CratisComponentsProvider>
                <DatePickerInput
                    value={options.value ?? null}
                    onChange={() => undefined}
                    showIcon
                    aria-label='Appointment date'
                    {...options}
                />
            </CratisComponentsProvider>,
        );
    });

    const pickerRoot = container.querySelector<HTMLElement>('[data-cratis-part="root"]');
    const group = container.querySelector<HTMLElement>('[data-cratis-part="group"]');
    const trigger = container.querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]');
    if (!pickerRoot || !group || !trigger) {
        throw new Error('DatePickerInput did not render its stable Cratis parts.');
    }

    return { container, root, pickerRoot, group, trigger };
};

const unmountDatePicker = async (mounted: MountedDatePicker) => {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
};

const popup = () => document.querySelector('[data-cratis-part="popover"]');

describe('when configuring standard DatePickerInput props', () => {
    it('should put the id directly on the focus group', async () => {
        const mounted = await mountDatePicker({ id: 'appointment-date' });
        try {
            expect(mounted.group.id).to.equal('appointment-date');
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should disable the model and trigger', async () => {
        const mounted = await mountDatePicker({ disabled: true });
        try {
            expect(mounted.pickerRoot.getAttribute('data-disabled')).to.equal('true');
            expect(mounted.trigger.disabled).to.equal(true);
            await act(async () => mounted.trigger.click());
            expect(popup()).to.equal(null);
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should make the date model read-only', async () => {
        const mounted = await mountDatePicker({ readOnly: true });
        try {
            expect(mounted.pickerRoot.getAttribute('data-readonly')).to.equal('true');
            expect(mounted.trigger.disabled).to.equal(true);
            await act(async () => mounted.trigger.click());
            expect(popup()).to.equal(null);
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should render the localized button bar', async () => {
        const mounted = await mountDatePicker({
            showButtonBar: true,
            value: new Date(2026, 7, 22),
            todayLabel: 'Translated today',
            clearLabel: 'Translated clear',
        });
        try {
            await act(async () => mounted.trigger.click());
            const buttonBar = document.querySelector('[data-cratis-part="button-bar"]');
            expect(buttonBar?.textContent).to.contain('Translated today');
            expect(buttonBar?.textContent).to.contain('Translated clear');
        } finally {
            await unmountDatePicker(mounted);
        }
    });
});
