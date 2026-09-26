// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createElement } from 'react';
import { ChatComposer } from '../../ChatComposer';
import { render, unmount, type ComposerInTheDom } from '../given/a_composer_in_the_dom';

describe('when reenabling a composer after it auto focused on mount', () => {
    let composer: ComposerInTheDom;
    let otherButton: HTMLButtonElement;
    const onSend = () => undefined;

    beforeEach(async () => {
        composer = await render(createElement(ChatComposer, { onSend, autoFocus: true }));
        await act(async () => {
            composer.root.render(createElement(ChatComposer, { onSend, autoFocus: true, disabled: true }));
        });
        otherButton = document.createElement('button');
        document.body.appendChild(otherButton);
        otherButton.focus();
        await act(async () => {
            composer.root.render(createElement(ChatComposer, { onSend, autoFocus: true, disabled: false }));
        });
    });

    afterEach(async () => {
        await unmount(composer);
        otherButton.remove();
    });

    it('should leave focus on the other button', () => {
        (document.activeElement === otherButton).should.be.true;
    });
});
