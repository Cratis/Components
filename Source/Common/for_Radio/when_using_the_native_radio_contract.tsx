// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';
import { Radio } from '../Radio';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the native Radio contract', () => {
    it('should let the browser own grouping while emitting native user metadata', async () => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        const mounted = await mountPrimitive(
            <form>
                <Radio label='Daily' name='frequency' value='daily' defaultChecked />
                <Radio
                    ref={ref}
                    label='Weekly'
                    name='frequency'
                    value='weekly'
                    onChange={onChange}
                    pt={{ indicator: { 'data-testid': 'weekly-indicator' } }}
                />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const first = mounted.container.querySelector<HTMLInputElement>(
                'input[value="daily"]',
            )!;
            expect(ref.current).to.be.instanceOf(HTMLInputElement);
            await act(async () => ref.current?.click());
            expect(first.checked).to.equal(false);
            expect(ref.current?.checked).to.equal(true);
            expect(new FormData(form).get('frequency')).to.equal('weekly');
            expect(onChange.mock.calls[0][0]).to.equal(true);
            expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
            expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
            expect(
                mounted.container.querySelector('[data-testid="weekly-indicator"]'),
            ).not.to.equal(null);
            await act(async () => form.reset());
            expect(first.checked).to.equal(true);
            expect(ref.current?.checked).to.equal(false);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should keep a readonly checked option successful and unchanged', async () => {
        const mounted = await mountPrimitive(
            <form>
                <Radio
                    label='Fixed'
                    name='choice'
                    value='fixed'
                    defaultChecked
                    readOnly
                />
                <Radio label='Other' name='choice' value='other' />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const [fixed, other] = Array.from(
                mounted.container.querySelectorAll<HTMLInputElement>('input'),
            );
            await act(async () => fixed.click());
            expect(fixed.checked).to.equal(true);
            expect(other.checked).to.equal(false);
            expect(new FormData(form).get('choice')).to.equal('fixed');
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should expose accessible content and canonical selected states during SSR', () => {
        const html = renderToStaticMarkup(
            <Radio
                label='Daily'
                name='frequency'
                value='daily'
                checked
                disabled
                invalid
                readOnly
            />,
        );
        expect(html).to.contain('type="radio"');
        expect(html).to.contain('name="frequency"');
        expect(html).to.contain('value="daily"');
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
