// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatComposer } from '../../ChatComposer';
import { render, unmount, type ComposerInTheDom } from '../given/a_composer_in_the_dom';

describe('when auto focusing an enabled composer on mount', () => {
    let composer: ComposerInTheDom;

    beforeEach(async () => {
        composer = await render(createElement(ChatComposer, { onSend: () => undefined, autoFocus: true }));
    });

    afterEach(async () => {
        await unmount(composer);
    });

    it('should focus the input', () => {
        (document.activeElement === composer.container.querySelector('.chat-composer__input')).should.be.true;
    });
});
