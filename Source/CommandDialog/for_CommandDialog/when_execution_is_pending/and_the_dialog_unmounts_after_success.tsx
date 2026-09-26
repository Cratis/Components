// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onConfirm, onSuccess, reset, state, unmount } from '../when_confirming_with_guard/given/a_dialog_with_guard';

describe('when a successful execute settles after unmount', () => {
    beforeEach(async () => {
        reset();
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        await mount();
        await act(async () => { void state.confirm!(); });
        await unmount();
        await act(async () => resolveExecution({ isSuccess: true, response: {} }));
    });
    it('should call the success callback', () => { onSuccess.mock.calls.length.should.equal(1); });
    it('should not close after unmount', () => { onConfirm.mock.calls.length.should.equal(0); });
});
