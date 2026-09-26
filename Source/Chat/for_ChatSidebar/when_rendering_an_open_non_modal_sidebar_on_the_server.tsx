// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { ChatSidebar } from '../ChatSidebar';

describe('when rendering an open non-modal sidebar on the server', () => {
    let markup: string;

    beforeEach(() => {
        markup = renderToString(
            <ChatSidebar
                open
                modal={false}
                onClose={() => undefined}
                topics={[]}
                messages={[]}
                onSendMessage={() => undefined}
            />,
        );
    });

    it('should render no portal markup', () => {
        markup.should.equal('');
    });
});
