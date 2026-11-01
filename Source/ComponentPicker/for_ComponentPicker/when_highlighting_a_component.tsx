// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React, { act } from 'react';
import { Button } from '../../Common/Button';
import { ComponentHighlight } from '../ComponentHighlight';
import { describeComponentElement } from '../describeComponentElement';
import { mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const frame = () => document.querySelector('[data-cratis-part="overlay"][data-cratis-kind="highlight"]');

describe('when highlighting a component', () => {
    let screen: ScreenInTheDom;

    const show = async (target: Parameters<typeof ComponentHighlight>[0]['target']) => {
        await act(async () => {
            screen.root.render(
                <>
                    <Button id='save' label='Save' />
                    <ComponentHighlight target={target} />
                </>,
            );
        });
    };

    beforeEach(async () => {
        screen = await mountScreen(<Button id='save' label='Save' />);
    });

    afterEach(async () => {
        await unmountScreen(screen);
    });

    it('should draw nothing without a target', async () => {
        await show(null);
        expect((frame() === null || frame()!.querySelector('[data-cratis-part="frame"]') === null)).to.equal(true);
    });

    it('should name an element by its component', async () => {
        await show(document.querySelector('#save'));
        frame()!.querySelector('[data-cratis-part="name"]')!.textContent!.should.equal('Button');
    });

    it('should accept a picked component', async () => {
        await show(describeComponentElement(document.querySelector('#save')!));
        frame()!.querySelector('[data-cratis-part="name"]')!.textContent!.should.equal('Button');
    });

    it('should be passive for pointers and hidden from assistive technology', async () => {
        await show(document.querySelector('#save'));
        (frame() as HTMLElement).style.pointerEvents.should.equal('none');
        frame()!.querySelector('[data-cratis-part="frame"]')!.getAttribute('aria-hidden')!.should.equal('true');
    });
});
