// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { NumberInput, type NumberInputProps } from '../NumberInput';

type NumberInputOptions = Partial<Omit<NumberInputProps, 'onChange'>> & {
    value: number | null;
};

describe('when formatting locale values in NumberInput', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderNumberInput = async (options: NumberInputOptions) => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <NumberInput
                        onChange={() => undefined}
                        aria-label='Amount'
                        {...options}
                    />
                </CratisComponentsProvider>,
            );
        });
    };

    const inputElement = () =>
        container.querySelector<HTMLInputElement>('[data-cratis-part="input"]');

    it('should format with Norwegian grouping separator for nb-NO', async () => {
        await renderNumberInput({ value: 1234567, locale: 'nb-NO' });
        const input = inputElement();
        // nb-NO uses non-breaking space as grouping separator
        expect(input?.value.replace(/\s/g, ' ')).to.equal('1 234 567');
    });

    it('should format with US comma grouping separator for en-US', async () => {
        await renderNumberInput({ value: 1234567, locale: 'en-US' });
        const input = inputElement();
        expect(input?.value).to.equal('1,234,567');
    });

    it('should display stable fraction digits when minimumFractionDigits is set', async () => {
        await renderNumberInput({
            value: 42,
            locale: 'en-US',
            minimumFractionDigits: 2,
        });
        const input = inputElement();
        expect(input?.value).to.equal('42.00');
    });

    it('should respect maximumFractionDigits for precision capping', async () => {
        await renderNumberInput({
            value: 3.14159,
            locale: 'en-US',
            maximumFractionDigits: 2,
        });
        const input = inputElement();
        expect(input?.value).to.equal('3.14');
    });

    it('should use Norwegian decimal comma with fraction digits', async () => {
        await renderNumberInput({
            value: 1234.5,
            locale: 'nb-NO',
            minimumFractionDigits: 2,
        });
        const input = inputElement();
        // nb-NO: non-breaking space grouping, comma decimal
        expect(input?.value.replace(/\s/g, ' ')).to.equal('1 234,50');
    });
});
