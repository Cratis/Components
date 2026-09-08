// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

const options = [
    { label: 'One', value: 'one' },
    { label: 'Two', value: 'two' },
];

const OneArgumentHarness = () => {
    const [value, setValue] = useState<Array<string>>(['one']);
    return (
        <Dropdown<Array<string>>
            multiple
            value={value}
            options={options}
            optionLabel='label'
            optionValue='value'
            onChange={setValue}
        />
    );
};

describe('when emitting semantic Dropdown changes', () => {
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

    it('should emit selected values and a native Event from the native multiple control', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown<Array<string>>
                        multiple
                        value={['one']}
                        options={options}
                        optionLabel='label'
                        optionValue='value'
                        onChange={onChange}
                    />
                </CratisComponentsProvider>,
            );
        });

        const select = container.querySelector<HTMLSelectElement>(
            '[data-cratis-part="multiple"]',
        );
        if (!select) throw new Error('Dropdown did not render a native multiple control.');
        select.options[0].selected = false;
        select.options[1].selected = true;
        await act(async () => {
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        expect(onChange.mock.calls).to.have.lengthOf(1);
        expect(onChange.mock.calls[0][0]).to.deep.equal(['two']);
        expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
        const nativeEvent = onChange.mock.calls[0][1].nativeEvent;
        expect(nativeEvent).to.be.instanceOf(Event);
        expect(Object.hasOwn(nativeEvent, 'nativeEvent')).to.equal(false);
    });

    it('should remain compatible with a one-argument React state setter', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <OneArgumentHarness />
                </CratisComponentsProvider>,
            );
        });
        const select = container.querySelector<HTMLSelectElement>(
            '[data-cratis-part="multiple"]',
        );
        if (!select) throw new Error('Dropdown did not render a native multiple control.');
        select.options[0].selected = false;
        select.options[1].selected = true;
        await act(async () => {
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        expect(select.selectedOptions[0]?.textContent).to.equal('Two');
    });

    it('should not emit when controlled values or options change programmatically', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown<string>
                        value='one'
                        options={options}
                        optionLabel='label'
                        optionValue='value'
                        onChange={onChange}
                    />
                </CratisComponentsProvider>,
            );
        });
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Dropdown<string>
                        value='two'
                        options={[options[1]]}
                        optionLabel='label'
                        optionValue='value'
                        onChange={onChange}
                    />
                </CratisComponentsProvider>,
            );
        });
        expect(onChange.mock.calls).to.have.lengthOf(0);
    });
});
