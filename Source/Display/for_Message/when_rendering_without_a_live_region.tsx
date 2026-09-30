// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { Message } from '../Message';

describe('when rendering without a live region', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <div role='alert'>
                <Message severity='error' text='The name is required.' live={false} />
                <Message severity='info' text='Try again.' live={false} />
            </div>,
        );
    });

    it('should render no role on the messages', () => {
        container.querySelectorAll('[data-cratis-part="root"][role]').length.should.equal(0);
    });

    it('should leave only the outer live region', () => {
        container.querySelectorAll('[role]').length.should.equal(1);
    });

    it('should still render the message content and severity', () => {
        const root = container.querySelector('[data-cratis-part="root"]')!;
        root.getAttribute('data-severity')!.should.equal('error');
        root.textContent!.should.contain('The name is required.');
    });
});
