// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AutoCommandFields } from '../AutoCommandFields';

describe('when rendered without a host', () => {
    let message = '';

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        const root = createRoot(container);
        const errors = console.error;
        console.error = () => undefined;
        try {
            await act(async () => root.render(<AutoCommandFields />));
        } catch (error) {
            message = (error as Error).message;
        } finally {
            console.error = errors;
        }
    });

    it('should fail clearly', () => message.should.equal('AutoCommandFields must be rendered inside a CommandForm or CommandDialog.'));
});
