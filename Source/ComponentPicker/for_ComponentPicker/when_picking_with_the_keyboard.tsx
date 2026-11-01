// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { Button } from '../../Common/Button';
import { Page } from '../../Common/Page';
import { TextInput } from '../../Common/TextInput';
import type { PickedComponent } from '../PickedComponent';
import {
    highlightedName,
    mountScreen,
    press,
    startPicking,
    unmountScreen,
    type ScreenInTheDom,
} from './given/a_screen_in_the_dom';

describe('when picking with the keyboard', () => {
    let screen: ScreenInTheDom;
    let pending: { result: Promise<PickedComponent | null> };

    beforeEach(async () => {
        screen = await mountScreen(
            <Page title='Example page' id='example-page'>
                <Button id='first' label='First' />
                <Button id='second' label='Second' />
                <TextInput name='email' />
            </Page>,
        );
        pending = await startPicking(screen);
    });

    afterEach(async () => {
        screen.picker().cancel();
        await unmountScreen(screen);
    });

    it('should start at the first component when nothing has focus', async () => {
        await press('ArrowRight');
        highlightedName()!.should.equal('Page example-page');
    });

    it('should move down into the first child component', async () => {
        await press('ArrowRight');
        await press('ArrowDown');
        highlightedName()!.should.equal('Button first');
    });

    it('should move across to the next sibling', async () => {
        await press('ArrowRight');
        await press('ArrowDown');
        await press('ArrowRight');
        highlightedName()!.should.equal('Button second');
    });

    it('should wrap around from the last sibling to the first', async () => {
        await press('ArrowRight');
        await press('ArrowDown');
        await press('ArrowLeft');
        highlightedName()!.should.equal('TextInput email');
    });

    it('should move up to the enclosing component', async () => {
        await press('ArrowRight');
        await press('ArrowDown');
        await press('ArrowUp');
        highlightedName()!.should.equal('Page example-page');
    });

    it('should confirm the highlighted component with Enter', async () => {
        await press('ArrowRight');
        await press('ArrowDown');
        await press('ArrowRight');
        await press('Enter');
        const picked = (await pending.result)!;
        picked.id!.should.equal('second');
        picked.ancestors.map((ancestor) => ancestor.component).should.deep.equal(['Page']);
    });

    it('should cancel with Escape', async () => {
        await press('Escape');
        expect(((await pending.result) === null)).to.equal(true);
        expect(screen.picker().isPicking).to.equal(false);
    });

    it('should ignore Enter while nothing is highlighted', async () => {
        await press('Enter');
        expect(screen.picker().isPicking).to.equal(true);
    });

    it('should announce the highlighted component politely', async () => {
        await press('ArrowRight');
        const status = document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="picker"] [role="status"]')!;
        status.textContent!.should.contain('Page example-page');
    });

    it('should keep the overlay out of aria-hidden handling', () => {
        const root = document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="picker"]')!;
        root.getAttribute('data-live-announcer')!.should.equal('true');
    });
});
