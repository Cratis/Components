// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act, createRef } from 'react';
import { NumericInput } from '../../Common/NumericInput';
import { Surface } from '../../Common/Surface';
import { Tabs } from '../../Common/Tabs';
import { ProgressBar } from '../../Display/ProgressBar';
import { previewPresentationChanges } from '../../configuration/identity/componentInstances';
import { click, mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const markerIn = (screen: ScreenInTheDom, component: string) =>
    screen.container.querySelector<HTMLElement>(`[data-cratis-component="${component}"]`)!;

const previewLabel = (element: HTMLElement) =>
    previewPresentationChanges(element, [{ property: 'aria-label', from: undefined, to: 'Preview name' }]);

describe('when previewing atomic and tab presentation details', () => {
    let screen: ScreenInTheDom;

    afterEach(async () => { await unmountScreen(screen); });

    it('should preserve progress bounds and external labeling when hiding the value label', async () => {
        screen = await mountScreen(<ProgressBar value={140} aria-labelledby='example-heading' />);
        const element = markerIn(screen, 'ProgressBar');
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [
                { property: 'showValue', from: undefined, to: false },
                { property: 'aria-label', from: undefined, to: 'Preview progress' },
            ]);
        });
        [element.getAttribute('aria-label'), element.getAttribute('aria-labelledby'), element.getAttribute('aria-valuenow')]
            .should.deep.equal([null, 'example-heading', '100']);
        [element.querySelector('[data-cratis-part="label"]')].should.deep.equal([null]);
        element.querySelector<HTMLElement>('[data-cratis-part="indicator"]')!.style.width.should.equal('100%');
        await act(async () => revert());
        element.querySelector('[data-cratis-part="label"]')!.textContent!.should.equal('100%');
    });

    it('should leave indeterminate progress semantics unchanged during a label preview', async () => {
        screen = await mountScreen(<ProgressBar mode='indeterminate' value={75} />);
        const element = markerIn(screen, 'ProgressBar');
        await act(async () => { previewLabel(element); });
        element.getAttribute('aria-label')!.should.equal('Preview name');
        [element.dataset.mode, element.dataset.busy, element.dataset.loading].should.deep.equal(['indeterminate', 'true', 'true']);
        [element.getAttribute('aria-valuenow'), element.getAttribute('aria-valuemin'), element.getAttribute('aria-valuemax'), element.querySelector('[data-cratis-part="label"]')]
            .should.deep.equal([null, null, null, null]);
    });

    it('should preserve surface markup, parts, children and callback refs during a label preview', async () => {
        const refs: (HTMLElement | null)[] = [];
        screen = await mountScreen(
            <Surface as='article' ref={(element) => { refs.push(element); }} className='example-surface'
                style={{ padding: 8 }} pt={{ root: { className: 'example-part', style: { margin: 4 } } }}>
                <strong>Example content</strong>
            </Surface>,
        );
        const element = markerIn(screen, 'Surface');
        let revert!: () => void;
        await act(async () => { revert = previewLabel(element); });
        element.getAttribute('aria-label')!.should.equal('Preview name');
        element.tagName.should.equal('ARTICLE');
        element.className.should.equal('cratis-surface example-part example-surface');
        [element.style.padding, element.style.margin].should.deep.equal(['8px', '4px']);
        element.querySelector('strong')!.textContent!.should.equal('Example content');
        [refs.at(-1)].should.deep.equal([element]);
        await act(async () => revert());
        [element.getAttribute('aria-label')].should.deep.equal([null]);
        await act(async () => screen.root.render(<></>));
        [refs.at(-1)].should.deep.equal([null]);
    });

    it('should preserve numeric input value, native state, parts and object refs without emitting changes', async () => {
        const ref = createRef<HTMLInputElement>();
        const changes: (number | undefined)[] = [];
        screen = await mountScreen(
            <NumericInput ref={ref} value={12} min={2} max={20} step={2} name='example-quantity'
                disabled readOnly invalid onChange={(value) => { changes.push(value); }}
                pt={{ root: { className: 'example-part', style: { margin: 4 }, placeholder: 'Example number' } }} />,
        );
        const element = ref.current!;
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [
                { property: 'placeholder', from: undefined, to: 'Preview number' },
                { property: 'aria-label', from: undefined, to: 'Preview quantity' },
            ]);
        });
        [element.placeholder, element.getAttribute('aria-label')].should.deep.equal(['Preview number', 'Preview quantity']);
        [element.value, element.min, element.max, element.step, element.name, element.type].should.deep.equal(['12', '2', '20', '2', 'example-quantity', 'number']);
        [element.disabled, element.readOnly, element.dataset.invalid, element.dataset.disabled, element.dataset.readonly].should.deep.equal([true, true, 'true', 'true', 'true']);
        element.classList.contains('example-part').should.equal(true);
        element.style.margin.should.equal('4px');
        [ref.current].should.deep.equal([element]);
        await act(async () => revert());
        element.placeholder.should.equal('Example number');
        changes.should.deep.equal([]);
        await act(async () => screen.root.render(<></>));
        [ref.current].should.deep.equal([null]);
    });

    it('should preserve tab content, selection and callbacks during a tab-list label preview', async () => {
        const selections: string[] = [];
        screen = await mountScreen(<Tabs aria-labelledby='example-heading' tabs={[
            { id: 'first', label: <strong>First example</strong>, content: <em>Example panel</em> },
            { id: 'second', label: 'Second example', content: 'Another example panel' },
            { id: 'disabled', label: 'Disabled example', content: 'Disabled example panel', disabled: true },
        ]} value='first' onChange={(value) => { selections.push(value); }} pt={{ list: { className: 'example-list' } }} />);
        const element = markerIn(screen, 'Tabs');
        let revert!: () => void;
        await act(async () => { revert = previewLabel(element); });
        const list = element.querySelector('[role="tablist"]')!;
        list.getAttribute('aria-label')!.should.equal('Preview name');
        list.getAttribute('aria-labelledby')!.split(' ').should.contain('example-heading');
        list.classList.contains('example-list').should.equal(true);
        const tabs = element.querySelectorAll<HTMLElement>('[role="tab"]');
        tabs[0].getAttribute('aria-selected')!.should.equal('true');
        tabs[2].getAttribute('aria-disabled')!.should.equal('true');
        element.querySelector('strong')!.textContent!.should.equal('First example');
        element.querySelector('em')!.textContent!.should.equal('Example panel');
        selections.should.deep.equal([]);
        await click(tabs[1]);
        selections.should.deep.equal(['second']);
        await act(async () => revert());
        [list.getAttribute('aria-label')].should.deep.equal([null]);
        list.getAttribute('aria-labelledby')!.split(' ').should.contain('example-heading');
    });
});
