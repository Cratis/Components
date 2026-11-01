// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { Button } from '../../Common/Button';
import { Dialog } from '../../Dialogs/Dialog';
import type { PickedComponent } from '../PickedComponent';
import {
    click,
    highlightedName,
    hover,
    mountScreen,
    press,
    startPicking,
    unmountScreen,
    type ScreenInTheDom,
} from './given/a_screen_in_the_dom';

describe('when picking inside a dialog', () => {
    let screen: ScreenInTheDom;
    let pending: { result: Promise<PickedComponent | null> };
    const onCancel = vi.fn();
    const onInside = vi.fn();

    beforeEach(async () => {
        onCancel.mockClear();
        onInside.mockClear();
        screen = await mountScreen(
            <>
                <Button id='behind' label='Behind' />
                <Dialog title='Example dialog' onCancel={onCancel} dismissable>
                    <Button id='inside' label='Inside' onClick={onInside} />
                </Dialog>
            </>,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        pending = await startPicking(screen);
    });

    afterEach(async () => {
        screen.picker().cancel();
        await unmountScreen(screen);
    });

    it('should name a component inside the dialog', async () => {
        await hover(document.querySelector('#inside')!);
        highlightedName()!.should.equal('Button inside');
    });

    it('should return the dialog as the enclosing component', async () => {
        await click(document.querySelector('#inside')!);
        const picked = (await pending.result)!;
        picked.ancestors.map((ancestor) => ancestor.component).should.deep.equal(['Dialog']);
    });

    it('should not press the button inside the dialog', async () => {
        await click(document.querySelector('#inside')!);
        expect(onInside.mock.calls).to.have.lengthOf(0);
    });

    it('should cancel picking with Escape without closing the dialog', async () => {
        await press('Escape');
        expect(((await pending.result) === null)).to.equal(true);
        expect(onCancel.mock.calls).to.have.lengthOf(0);
        expect((document.querySelector('[role="dialog"]') !== null)).to.equal(true);
    });

    it('should keep keyboard navigation inside the dialog', async () => {
        await press('ArrowRight');
        highlightedName()!.should.contain('Dialog');
        await press('ArrowDown');
        highlightedName()!.should.equal('Button inside');
    });

    it('should stack the overlay above the dialog', () => {
        const overlay = document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="picker"]') as HTMLElement;
        overlay.style.zIndex.should.contain('calc(');
    });

    it('should pick the dialog title part', async () => {
        await click(document.querySelector('[data-cratis-part="title"]')!);
        const picked = (await pending.result)!;
        picked.component.should.equal('Dialog');
        picked.part!.should.equal('title');
        picked.presentationProperties.find((property) => property.name === 'title')!.value!.should.equal('Example dialog');
    });
});
