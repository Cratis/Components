// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';
import { Switch } from '../Switch';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the native Switch contract', () => {
    it('should forward the checkbox ref and emit boolean native metadata', async () => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        const mounted = await mountPrimitive(
            <Switch
                ref={ref}
                label='Enable notifications'
                name='notifications'
                value='enabled'
                onChange={onChange}
                pt={{ control: { 'data-testid': 'switch-control' } }}
            />,
        );
        try {
            expect(ref.current).to.be.instanceOf(HTMLInputElement);
            expect(ref.current?.type).to.equal('checkbox');
            expect(ref.current?.getAttribute('role')).to.equal('switch');
            await act(async () => ref.current?.click());
            expect(onChange.mock.calls[0][0]).to.equal(true);
            expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
            expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
            expect(
                mounted.container.querySelector('[data-testid="switch-control"]'),
            ).not.to.equal(null);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should submit and reset as a native checkbox without swallowing name or value', async () => {
        const mounted = await mountPrimitive(
            <form>
                <Switch
                    label='Notifications'
                    name='notifications'
                    value='enabled'
                    defaultChecked
                />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const input = mounted.container.querySelector('input')!;
            expect(new FormData(form).get('notifications')).to.equal('enabled');
            await act(async () => input.click());
            expect(new FormData(form).has('notifications')).to.equal(false);
            await act(async () => form.reset());
            expect(input.checked).to.equal(true);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should expose switch accessibility and canonical states on every SSR part', () => {
        const html = renderToStaticMarkup(
            <Switch
                label='Notifications'
                checked
                disabled
                invalid
                readOnly
            />,
        );
        expect(html).to.contain('role="switch"');
        expect(html).to.contain('Notifications');
        const container = document.createElement('div');
        container.innerHTML = html;
        const elements = Array.from(
            container.querySelectorAll<HTMLElement>('[data-cratis-part]'),
        );
        expect(elements.map((element) => element.dataset.cratisPart)).to.deep.equal([
            'root',
            'input',
            'control',
            'handle',
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
