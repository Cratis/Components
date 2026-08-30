// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

describe('when configuring input pass-through', () => {
    let container: HTMLDivElement;
    let root: Root;
    let group: HTMLElement;
    let dateInput: HTMLElement;
    let pickerRoot: HTMLElement;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <DatePickerInput
                        value={null}
                        onChange={() => undefined}
                        pt={{
                            input: {
                                id: 'appointment-date',
                                'aria-label': 'Appointment date',
                                'aria-describedby': 'appointment-date-help',
                                'aria-invalid': true,
                                disabled: true,
                                placeholder: 'Pass-through placeholder',
                                'data-product-control': 'appointment',
                            },
                        }}
                    />
                </CratisComponentsProvider>,
            );
        });

        const renderedRoot = container.querySelector<HTMLElement>(
            '[data-cratis-part="root"]',
        );
        const renderedGroup = container.querySelector<HTMLElement>(
            '[data-cratis-part="group"]',
        );
        const renderedInput = container.querySelector<HTMLElement>(
            '[data-cratis-part="input"]',
        );
        if (!renderedRoot || !renderedGroup || !renderedInput) {
            throw new Error('DatePickerInput did not render its stable Cratis parts.');
        }
        pickerRoot = renderedRoot;
        group = renderedGroup;
        dateInput = renderedInput;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should set the group id', () => {
        expect(group.id).to.equal('appointment-date');
    });

    it('should set the accessible name', () => {
        expect(group.getAttribute('aria-label')).to.equal('Appointment date');
    });

    it('should set the description reference', () => {
        expect(group.getAttribute('aria-describedby')).to.equal('appointment-date-help');
    });

    it('should preserve pass-through invalid state when the wrapper prop is omitted', () => {
        expect(pickerRoot.getAttribute('data-invalid')).to.equal('true');
    });

    it('should disable the picker', () => {
        expect(pickerRoot.getAttribute('data-disabled')).to.equal('true');
    });

    it('should forward ordinary data attributes to the segmented input', () => {
        expect(dateInput.getAttribute('data-product-control')).to.equal('appointment');
    });

    it('should preserve the pass-through placeholder when the wrapper prop is omitted', () => {
        expect(dateInput.getAttribute('data-placeholder')).to.equal(
            'Pass-through placeholder',
        );
    });
});
