// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createElement } from 'react';
import { ChatComposer } from '../../ChatComposer';
import { render, unmount, type ComposerInTheDom } from '../given/a_composer_in_the_dom';

describe('when enabling a composer that mounted disabled with auto focus', () => {
    let composer: ComposerInTheDom;
    const onSend = () => undefined;

    beforeEach(async () => {
        composer = await render(createElement(ChatComposer, { onSend, autoFocus: true, disabled: true }));
        await act(async () => {
            composer.root.render(createElement(ChatComposer, { onSend, autoFocus: true, disabled: false }));
        });
    });

    afterEach(async () => {
        await unmount(composer);
    });

    it('should focus the input on first enable', () => {
        (document.activeElement === composer.container.querySelector('.chat-composer__input')).should.be.true;
    });
});
