// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { act } from 'react';
import { describe, it, vi } from 'vitest';
import { TextInput } from '../TextInput';
import {
    mountPrimitive,
    setNativeValue,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the native TextInput contract', () => {
    it('should forward the input ref, emit semantic native metadata, and honor pt', async () => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        const mounted = await mountPrimitive(
            <TextInput
                ref={ref}
                aria-label='Project name'
                onChange={onChange}
                pt={{ root: { 'data-testid': 'project-input' } }}
            />,
        );
        try {
            const input = ref.current;
            if (!input) throw new Error('TextInput did not forward its input ref.');
            await setNativeValue(input, 'Example Project');
            expect(input.getAttribute('data-testid')).to.equal('project-input');
            expect(onChange.mock.calls[0][0]).to.equal('Example Project');
            expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
            expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should participate in native form submission and reset while uncontrolled', async () => {
        const mounted = await mountPrimitive(
            <form>
                <TextInput name='project' defaultValue='Initial' aria-label='Project' />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const input = mounted.container.querySelector('input')!;
            await setNativeValue(input, 'Changed');
            expect(new FormData(form).get('project')).to.equal('Changed');
            await act(async () => form.reset());
            expect(input.value).to.equal('Initial');
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should expose native accessibility and canonical states during SSR', () => {
        const html = renderToStaticMarkup(
            <TextInput
                aria-label='Project name'
                defaultValue='Example'
                disabled
                invalid
                readOnly
            />,
        );
        expect(html).to.contain('data-cratis-part="root"');
        expect(html).to.contain('data-disabled="true"');
        expect(html).to.contain('data-invalid="true"');
        expect(html).to.contain('data-readonly="true"');
        expect(html).to.contain('aria-invalid="true"');
        expect(html).to.contain('aria-label="Project name"');
    });
});
