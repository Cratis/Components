// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';
import { Checkbox } from '../Checkbox';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the native Checkbox contract', () => {
    it('should forward the input ref and emit a boolean with a real native event', async () => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        const mounted = await mountPrimitive(
            <Checkbox
                ref={ref}
                label='Include archived items'
                name='archived'
                value='yes'
                onChange={onChange}
                pt={{ box: { 'data-testid': 'checkbox-box' } }}
            />,
        );
        try {
            expect(ref.current).to.be.instanceOf(HTMLInputElement);
            expect(ref.current?.type).to.equal('checkbox');
            await act(async () => ref.current?.click());
            expect(onChange.mock.calls[0][0]).to.equal(true);
            expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
            expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
            expect(
                mounted.container.querySelector('[data-testid="checkbox-box"]'),
            ).not.to.equal(null);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should preserve native submission, reset, and readonly successful-control behavior', async () => {
        const mounted = await mountPrimitive(
            <form>
                <Checkbox
                    label='Enabled'
                    name='enabled'
                    value='yes'
                    defaultChecked
                />
                <Checkbox
                    label='Locked'
                    name='locked'
                    value='kept'
                    defaultChecked
                    readOnly
                />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const [enabled, locked] = Array.from(
                mounted.container.querySelectorAll<HTMLInputElement>('input'),
            );
            await act(async () => enabled.click());
            expect(new FormData(form).has('enabled')).to.equal(false);
            expect(new FormData(form).get('locked')).to.equal('kept');
            await act(async () => locked.click());
            expect(locked.checked).to.equal(true);
            await act(async () => form.reset());
            expect(enabled.checked).to.equal(true);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should expose the accessible label and every canonical state on stable parts in SSR', () => {
        const html = renderToStaticMarkup(
            <Checkbox label='Selected choice' checked disabled invalid readOnly />,
        );
        expect(html).to.contain('Selected choice');
        const container = document.createElement('div');
        container.innerHTML = html;
        const elements = Array.from(
            container.querySelectorAll<HTMLElement>('[data-cratis-part]'),
        );
        expect(elements.map((element) => element.dataset.cratisPart)).to.deep.equal([
            'root',
            'input',
            'box',
            'indicator',
            'label',
        ]);
        for (const element of elements) {
            expect(element.dataset.selected).to.equal('true');
            expect(element.dataset.disabled).to.equal('true');
            expect(element.dataset.invalid).to.equal('true');
            expect(element.dataset.readonly).to.equal('true');
        }
    });
});
