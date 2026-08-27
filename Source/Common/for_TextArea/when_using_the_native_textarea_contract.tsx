// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { act } from 'react';
import { describe, it, vi } from 'vitest';
import { TextArea } from '../TextArea';
import {
    mountPrimitive,
    setNativeValue,
    unmountPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when using the native TextArea contract', () => {
    it('should forward the textarea ref and emit semantic native metadata', async () => {
        const ref = createRef<HTMLTextAreaElement>();
        const onChange = vi.fn();
        const mounted = await mountPrimitive(
            <TextArea
                ref={ref}
                aria-label='Notes'
                onChange={onChange}
                pt={{ root: { 'data-testid': 'notes-input' } }}
            />,
        );
        try {
            const textarea = ref.current;
            if (!textarea) throw new Error('TextArea did not forward its textarea ref.');
            await setNativeValue(textarea, 'Repository-owned notes');
            expect(textarea.getAttribute('data-testid')).to.equal('notes-input');
            expect(onChange.mock.calls[0][0]).to.equal('Repository-owned notes');
            expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
            expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should submit and reset through native form behavior while uncontrolled', async () => {
        const mounted = await mountPrimitive(
            <form>
                <TextArea name='notes' defaultValue='Initial notes' aria-label='Notes' />
            </form>,
        );
        try {
            const form = mounted.container.querySelector('form')!;
            const textarea = mounted.container.querySelector('textarea')!;
            await setNativeValue(textarea, 'Changed notes');
            expect(new FormData(form).get('notes')).to.equal('Changed notes');
            await act(async () => form.reset());
            expect(textarea.value).to.equal('Initial notes');
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should expose accessibility, pt, canonical states, and semantic SSR markup', () => {
        const html = renderToStaticMarkup(
            <TextArea
                aria-label='Notes'
                pt={{ root: { id: 'notes' } }}
                disabled
                invalid
                readOnly
            />,
        );
        expect(html).to.contain('<textarea');
        expect(html).to.contain('id="notes"');
        expect(html).to.contain('data-disabled="true"');
        expect(html).to.contain('data-invalid="true"');
        expect(html).to.contain('data-readonly="true"');
        expect(html).to.contain('aria-label="Notes"');
    });
});
