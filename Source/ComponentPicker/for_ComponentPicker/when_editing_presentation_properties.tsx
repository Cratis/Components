// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from '../../Common/Button';
import type { PresentationChange } from '../../configuration/identity/PresentationChange';
import { describeComponentElement } from '../describeComponentElement';
import { PresentationPropertyEditor } from '../PresentationPropertyEditor';
import { mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const buttonLabel = () => document.querySelector('#save [data-cratis-part="label"]')?.textContent;

const setInput = async (label: string, value: string) => {
    const input = Array.from(document.querySelectorAll('label'))
        .find((candidate) => candidate.textContent === label)!
        .control as HTMLInputElement | HTMLSelectElement;
    await act(async () => {
        const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    });
};

describe('when editing presentation properties', () => {
    let screen: ScreenInTheDom;
    let editorHost: HTMLDivElement;
    let editorRoot: Root;
    let changes: PresentationChange[];

    const mountEditor = async (preview: boolean) => {
        const picked = describeComponentElement(document.querySelector('#save')!);
        await act(async () => {
            editorRoot.render(
                <PresentationPropertyEditor picked={picked} preview={preview} onChange={(next) => (changes = next)} />,
            );
        });
    };

    beforeEach(async () => {
        changes = [];
        screen = await mountScreen(<Button id='save' label='Save' />);
        editorHost = document.createElement('div');
        document.body.appendChild(editorHost);
        editorRoot = createRoot(editorHost);
    });

    afterEach(async () => {
        await act(async () => editorRoot.unmount());
        editorHost.remove();
        await unmountScreen(screen);
    });

    it('should list the descriptor properties', async () => {
        await mountEditor(false);
        Array.from(document.querySelectorAll('label')).map((label) => label.textContent).should.deep.equal([
            'Label',
            'Tooltip',
            'Variant',
            'Tone',
            'Shape',
            'Size',
        ]);
    });

    it('should show the rendered value', async () => {
        await mountEditor(false);
        (document.querySelector('input[id$="-label"]') as HTMLInputElement).value.should.equal('Save');
    });

    it('should report no changes before anything is edited', async () => {
        await mountEditor(false);
        changes.should.deep.equal([]);
    });

    it('should report an edited text as a change from the rendered value', async () => {
        await mountEditor(false);
        await setInput('Label', 'Save draft');
        changes.should.deep.equal([{ property: 'label', from: 'Save', to: 'Save draft' }]);
    });

    it('should report a chosen enumeration value', async () => {
        await mountEditor(false);
        await setInput('Variant', 'outline');
        changes.should.deep.equal([{ property: 'variant', from: undefined, to: 'outline' }]);
    });

    it('should drop a change that is edited back to the original', async () => {
        await mountEditor(false);
        await setInput('Label', 'Save draft');
        await setInput('Label', 'Save');
        changes.should.deep.equal([]);
    });

    it('should not change the app without a preview', async () => {
        await mountEditor(false);
        await setInput('Label', 'Save draft');
        buttonLabel()!.should.equal('Save');
    });

    describe('with a live preview', () => {
        beforeEach(async () => {
            await mountEditor(true);
            await setInput('Label', 'Save draft');
        });

        it('should show the proposed value in the app', () => buttonLabel()!.should.equal('Save draft'));

        it('should return to the original when the change is edited back', async () => {
            await setInput('Label', 'Save');
            buttonLabel()!.should.equal('Save');
        });

        it('should return to the original when the editor goes away', async () => {
            await act(async () => editorRoot.render(<></>));
            buttonLabel()!.should.equal('Save');
        });

        it('should return to the original when the preview is turned off', async () => {
            await mountEditor(false);
            buttonLabel()!.should.equal('Save');
        });
    });

    describe('for a component with no descriptor', () => {
        it('should say there is nothing to edit', async () => {
            const Host = () => {
                const [picked] = useState(() => describeComponentElement(document.body));
                return <PresentationPropertyEditor picked={picked} onChange={() => undefined} />;
            };
            await act(async () => editorRoot.render(<Host />));
            editorHost.textContent!.should.contain('has no properties');
        });
    });
});
