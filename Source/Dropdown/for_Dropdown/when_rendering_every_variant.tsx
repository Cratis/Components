// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown, type DropdownProps } from '../Dropdown';

const options = [
    { label: 'One', value: 'one' },
    { label: 'Two', value: 'two', disabled: true },
    { label: 'Three', value: 'three' },
];

type Shape = { name: string; extra: Partial<DropdownProps<unknown>>; selected: unknown; part: string };

const shapes: Shape[] = [
    { name: 'single', extra: {}, selected: 'one', part: 'trigger' },
    { name: 'single filterable', extra: { filter: true }, selected: 'one', part: 'filter' },
    { name: 'multiple', extra: { multiple: true }, selected: ['one', 'three'], part: 'multiple' },
    { name: 'multiple filterable', extra: { multiple: true, filter: true }, selected: ['one', 'three'], part: 'filter' },
];

describe('when rendering every dropdown variant', () => {
    let container: HTMLDivElement;
    let root: Root;

    const mount = async (props: Partial<DropdownProps<unknown>>, providerValue?: object) => {
        await act(async () => root.render(
            <CratisComponentsProvider value={providerValue}>
                <Dropdown options={options} value={null} onChange={() => undefined} {...props} />
            </CratisComponentsProvider>,
        ));
    };
    const part = (name: string) => container.querySelector<HTMLElement>(`[data-cratis-part="${name}"]`);

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { return undefined; }
            unobserve() { return undefined; }
            disconnect() { return undefined; }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    for (const shape of shapes) {
        describe(shape.name, () => {
            it('should render a root without selection state when nothing is selected', async () => {
                await mount(shape.extra);
                expect(part('root')?.getAttribute('data-selected')).to.equal(null);
                expect(part(shape.part)).to.not.equal(null);
                expect(part('clear')).to.equal(null);
            });

            it('should mark the root and the control selected for a value', async () => {
                await mount({ ...shape.extra, value: shape.selected });
                expect(part('root')?.getAttribute('data-selected')).to.equal('true');
            });

            it('should render the clear button only when showClear is set and there is a selection', async () => {
                await mount({ ...shape.extra, showClear: true });
                expect(part('clear')).to.equal(null);
                await mount({ ...shape.extra, showClear: true, value: shape.selected });
                expect(part('clear')?.getAttribute('aria-label')).to.equal('Clear selection');
            });

            it('should label the clear button from the pass-through, then provider messages', async () => {
                await mount({ ...shape.extra, showClear: true, value: shape.selected },
                    { messages: { dropdown: { clearSelection: 'Provider clear' } } });
                expect(part('clear')?.getAttribute('aria-label')).to.equal('Provider clear');
                await mount({ ...shape.extra, showClear: true, value: shape.selected, pt: { clear: { 'aria-label': 'Own clear' } } },
                    { messages: { dropdown: { clearSelection: 'Provider clear' } } });
                expect(part('clear')?.getAttribute('aria-label')).to.equal('Own clear');
            });

            it('should emit an empty value with the native event when cleared', async () => {
                const onChange = vi.fn();
                await mount({ ...shape.extra, showClear: true, value: shape.selected, onChange });
                await act(async () => part('clear')!.click());
                expect(onChange.mock.calls.length).to.equal(1);
                const expectedEmpty = Array.isArray(shape.selected) ? [] : null;
                expect(onChange.mock.calls[0][0]).to.deep.equal(expectedEmpty);
                expect(onChange.mock.calls[0][1].source).to.equal('user');
                expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
            });

            it('should mirror disabled and invalid state as data attributes and disable the clear button', async () => {
                await mount({ ...shape.extra, showClear: true, value: shape.selected, disabled: true, invalid: true });
                expect(part('root')?.getAttribute('data-disabled')).to.equal('true');
                expect(part('root')?.getAttribute('data-invalid')).to.equal('true');
                expect(part(shape.part)?.getAttribute('data-invalid')).to.equal('true');
                expect(part('clear')?.hasAttribute('disabled')).to.equal(true);
            });

            it('should merge class names and styles from the pass-through parts and props', async () => {
                await mount({
                    ...shape.extra,
                    className: 'own',
                    style: { margin: 1 },
                    pt: { root: { className: 'r', style: { padding: 2 } }, select: { className: 's', style: { color: 'red' } } },
                });
                const rootPart = part('root')!;
                expect(rootPart.className).to.equal('cratis-dropdown r s own');
                expect(rootPart.style.padding).to.equal('2px');
                expect(rootPart.style.color).to.equal('red');
                expect(rootPart.style.margin).to.equal('1px');
            });

            it('should apply the tab index and ids to the control', async () => {
                await mount({ ...shape.extra, tabIndex: 3, id: 'dd' });
                const control = part(shape.part)!;
                expect(control.id).to.equal('dd');
                expect(control.getAttribute('tabindex')).to.equal('3');
            });

            it('should expose the placeholder as the filter placeholder or the value text', async () => {
                await mount({ ...shape.extra, placeholder: 'Pick' });
                const text = part('filter')?.getAttribute('placeholder') ?? part('value')?.textContent;
                if (shape.name.includes('multiple') && !shape.extra.filter) return;
                expect(text).to.equal('Pick');
            });
        });
    }

    it('should render a native multiple select with an option per item for the unfiltered multiple variant', async () => {
        await mount({ multiple: true, value: ['one'] });
        const select = container.querySelector('select')!;
        expect(select.multiple).to.equal(true);
        expect(Array.from(select.options).map(option => option.textContent)).to.deep.equal(['One', 'Two', 'Three']);
        expect(select.options[1].disabled).to.equal(true);
        expect(select.options[0].getAttribute('data-selected')).to.equal('true');
    });

    it('should emit the values of the chosen native options for the unfiltered multiple variant', async () => {
        const onChange = vi.fn();
        await mount({ multiple: true, value: [], onChange });
        const select = container.querySelector('select')!;
        select.options[0].selected = true;
        select.options[2].selected = true;
        await act(async () => select.dispatchEvent(new Event('change', { bubbles: true })));
        expect(onChange.mock.calls[0][0]).to.deep.equal(['one', 'three']);
    });

    it('should invalidate through aria-invalid on the control and drop it when valid', async () => {
        await mount({ invalid: true });
        expect(part('trigger')?.getAttribute('aria-invalid')).to.equal('true');
        await mount({ invalid: false });
        expect(part('trigger')?.hasAttribute('aria-invalid')).to.equal(false);
    });
});
