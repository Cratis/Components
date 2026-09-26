// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createElement } from 'react';
import { ChatComposer } from '../ChatComposer';
import { click, render, unmount, type ComposerInTheDom } from './given/a_composer_in_the_dom';

describe('when opening the emoji picker before disabling the composer', () => {
    let composer: ComposerInTheDom;
    const onSend = () => undefined;

    beforeEach(async () => {
        composer = await render(createElement(ChatComposer, { onSend }));
        await click(composer.container.querySelector<HTMLButtonElement>('.chat-composer__emoji-toggle')!);
    });

    afterEach(async () => {
        await unmount(composer);
    });

    it('should open the picker', () => {
        composer.container.querySelector('.chat-composer__emoji-toggle')!
            .getAttribute('aria-expanded')!.should.equal('true');
        (document.querySelector('.reaction-picker') !== null).should.be.true;
    });

    describe('and the composer is disabled', () => {
        beforeEach(async () => {
            await act(async () => {
                composer.root.render(createElement(ChatComposer, { onSend, disabled: true }));
            });
        });

        it('should report the picker as closed', () => {
            composer.container.querySelector('.chat-composer__emoji-toggle')!
                .getAttribute('aria-expanded')!.should.equal('false');
        });

        it('should remove the picker', () => {
            (document.querySelector('.reaction-picker') === null).should.be.true;
        });

        describe('and the composer is enabled again', () => {
            beforeEach(async () => {
                await act(async () => {
                    composer.root.render(createElement(ChatComposer, { onSend, disabled: false }));
                });
            });

            it('should keep the toggle collapsed', () => {
                composer.container.querySelector('.chat-composer__emoji-toggle')!
                    .getAttribute('aria-expanded')!.should.equal('false');
            });

            it('should not reopen the picker', () => {
                (document.querySelector('.reaction-picker') === null).should.be.true;
            });
        });
    });
});
