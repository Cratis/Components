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

const mountDatePicker = async (
    options: DatePickerOptions,
): Promise<MountedDatePicker> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
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
    const trigger = container.querySelector<HTMLButtonElement>(
        '[data-cratis-part="trigger"]',
    );
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

    it('should show the configured placeholder while empty', async () => {
        const mounted = await mountDatePicker({ placeholder: 'Choose a date' });
        try {
            expect(
                mounted.container.querySelector('[data-cratis-part="placeholder"]')
                    ?.textContent,
            ).to.equal('Choose a date');
            expect(mounted.group.getAttribute('data-empty')).to.equal('true');
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should disable every editable date part without emitting inactive states', async () => {
        const mounted = await mountDatePicker({ disabled: true });
        try {
            const input = mounted.container.querySelector('[data-cratis-part="input"]');
            const segments = mounted.container.querySelectorAll(
                '[data-cratis-part="segment"]',
            );

            expect(mounted.pickerRoot.getAttribute('data-disabled')).to.equal('true');
            expect(mounted.group.getAttribute('data-disabled')).to.equal('true');
            expect(input?.getAttribute('data-disabled')).to.equal('true');
            expect(
                Array.from(segments).every(
                    (segment) => segment.getAttribute('data-disabled') === 'true',
                ),
            ).to.equal(true);
            expect(mounted.trigger.getAttribute('data-disabled')).to.equal('true');
            expect(mounted.trigger.hasAttribute('data-open')).to.equal(false);
            expect(mounted.pickerRoot.hasAttribute('data-readonly')).to.equal(false);
            expect(mounted.pickerRoot.hasAttribute('data-invalid')).to.equal(false);
            expect(mounted.trigger.disabled).to.equal(true);
            await act(async () => mounted.trigger.click());
            expect(popup()).to.equal(null);
        } finally {
            await unmountDatePicker(mounted);
        }
    });

    it('should mark editable date parts read-only without emitting disabled on the model', async () => {
        const mounted = await mountDatePicker({ readOnly: true });
        try {
            const input = mounted.container.querySelector('[data-cratis-part="input"]');
            const segments = mounted.container.querySelectorAll(
                '[data-cratis-part="segment"]',
            );

            expect(mounted.pickerRoot.getAttribute('data-readonly')).to.equal('true');
            expect(mounted.group.getAttribute('data-readonly')).to.equal('true');
            expect(input?.getAttribute('data-readonly')).to.equal('true');
            expect(
                Array.from(segments).every(
                    (segment) => segment.getAttribute('data-readonly') === 'true',
                ),
            ).to.equal(true);
            expect(mounted.trigger.getAttribute('data-readonly')).to.equal('true');
            expect(mounted.pickerRoot.hasAttribute('data-disabled')).to.equal(false);
            expect(mounted.trigger.getAttribute('data-disabled')).to.equal('true');
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
            pt: { grid: { id: 'appointment-calendar-grid' } },
        });
        try {
            await act(async () => mounted.trigger.click());
            const buttonBar = document.querySelector('[data-cratis-part="button-bar"]');
            const popover = document.querySelector('[data-cratis-part="popover"]');
            const dialog = document.querySelector('[data-cratis-part="dialog"]');
            const calendar = document.querySelector('[data-cratis-part="calendar"]');
            const selectedCell = document.querySelector(
                '[data-cratis-part="cell"][data-selected]',
            );

            expect(mounted.group.getAttribute('data-open')).to.equal('true');
            expect(mounted.trigger.getAttribute('data-open')).to.equal('true');
            expect(popover?.getAttribute('data-open')).to.equal('true');
            expect(dialog?.getAttribute('data-open')).to.equal('true');
            expect(calendar?.getAttribute('data-open')).to.equal('true');
            expect(selectedCell?.textContent).to.equal('22');
            expect(
                document.querySelector(
                    '[data-cratis-part="cell"][data-selected="false"]',
                ),
            ).to.equal(null);
            expect(buttonBar?.textContent).to.contain('Translated today');
            expect(buttonBar?.textContent).to.contain('Translated clear');
            expect(document.querySelector('#appointment-calendar-grid')).not.to.equal(
                null,
            );
        } finally {
            await unmountDatePicker(mounted);
        }
    });
});
