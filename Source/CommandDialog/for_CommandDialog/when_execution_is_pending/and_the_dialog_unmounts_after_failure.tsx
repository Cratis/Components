// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onFailed, reset, state, unmount } from '../given/a_dialog_with_guard';

describe('when a failed execute settles after unmount', () => {
    beforeEach(async () => {
        reset();
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        await mount();
        await act(async () => { void state.confirm!(); });
        await unmount();
        await act(async () => resolveExecution({ isSuccess: false, response: {} }));
    });
    it('should call the failure callback', () => { onFailed.mock.calls.length.should.equal(1); });
});
