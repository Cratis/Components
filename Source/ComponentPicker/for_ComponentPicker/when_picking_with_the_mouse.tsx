// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { Button } from '../../Common/Button';
import { Page } from '../../Common/Page';
import { TextInput } from '../../Common/TextInput';
import type { PickedComponent } from '../PickedComponent';
import {
    click,
    highlightedName,
    hover,
    mountScreen,
    startPicking,
    unmountScreen,
    type ScreenInTheDom,
} from './given/a_screen_in_the_dom';

describe('when picking with the mouse', () => {
    let screen: ScreenInTheDom;
    let pending: { result: Promise<PickedComponent | null> };
    const onSave = vi.fn();
    const resolve = vi.fn((element: Element) => ({ screen: 'example-screen', tag: element.tagName }));

    beforeEach(async () => {
        onSave.mockClear();
        screen = await mountScreen(
            <Page title='Example page' showTitle id='example-page'>
                <Button id='save' label='Save' onClick={onSave} />
                <TextInput name='email' placeholder='Email address' />
            </Page>,
            resolve,
        );
        pending = await startPicking(screen);
    });

    afterEach(async () => {
        screen.picker().cancel();
        await unmountScreen(screen);
    });

    it('should name the component under the pointer', async () => {
        await hover(document.querySelector('#save')!);
        highlightedName()!.should.equal('Button save');
    });

    it('should follow the pointer to another component', async () => {
        await hover(document.querySelector('#save')!);
        await hover(document.querySelector('input[name="email"]')!);
        highlightedName()!.should.equal('TextInput email');
    });

    it('should not press the button that was clicked', async () => {
        await click(document.querySelector('#save')!);
        expect(onSave.mock.calls).to.have.lengthOf(0);
    });

    describe('and a component is confirmed with a click', () => {
        let picked: PickedComponent;

        beforeEach(async () => {
            await click(document.querySelector('#save [data-cratis-part="label"]')!);
            picked = (await pending.result)!;
        });

        it('should return the component name', () => picked.component.should.equal('Button'));
        it('should return the component id', () => picked.id!.should.equal('save'));
        it('should return the part that was clicked', () => picked.part!.should.equal('label'));
        it('should return the component root element', () => (picked.element === document.querySelector('#save')).should.be.true);
        it('should return the rectangle', () => picked.rect.width.should.be.a('number'));
        it('should return the current value of a presentation property', () =>
            picked.presentationProperties.find((property) => property.name === 'label')!.value!.should.equal('Save'));
        it('should return the enclosing components', () => picked.ancestors.map((ancestor) => ancestor.component).should.deep.equal(['Page']));
        it('should return the enclosing component id', () => picked.ancestors[0].id!.should.equal('example-page'));
        it('should add the context the host resolved', () => picked.context.should.deep.equal({ screen: 'example-screen', tag: 'BUTTON' }));
        it('should stop picking', () => screen.picker().isPicking.should.be.false);
        it('should remove the highlight', () => (document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="picker"]') === null).should.be.true);
        it('should not press the button', () => onSave.should.not.have.been.called);
    });

    describe('and the component declares no presentation properties', () => {
        it('should return an empty list', async () => {
            await click(document.querySelector('[data-cratis-component="Page"]')!);
            const picked = (await pending.result)!;
            picked.component.should.equal('Page');
            picked.presentationProperties.map((property) => property.name).should.include('title');
        });
    });

    describe('and nothing is under the pointer', () => {
        it('should keep picking', async () => {
            await click(document.body);
            expect(screen.picker().isPicking).to.equal(true);
        });
    });
});
