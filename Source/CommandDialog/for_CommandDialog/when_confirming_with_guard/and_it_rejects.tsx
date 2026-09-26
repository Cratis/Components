// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { mount, onException, onFailed, onSuccess, reset, state, unmount } from './given/a_dialog_with_guard';

describe('when a pending guard rejects', () => {
    let rejectGuard: (error: Error) => void;
    let busyWhilePending: boolean;
    let busyInException: boolean;
    beforeEach(async () => {
        reset();
        const pending = new Promise<boolean>((_resolve, reject) => { rejectGuard = reject; });
        onException.mockImplementation(() => { busyInException = state.busy; });
        await mount(() => pending);
        await act(async () => { void state.confirm!(); });
        busyWhilePending = state.busy;
        await act(async () => rejectGuard(new Error('Example failure')));
    });
    afterEach(unmount);
    it('should be busy until rejection', () => { busyWhilePending.should.equal(true); });
    it('should release busy', () => { state.busy.should.equal(false); });
    it('should clear busy before onException', () => { busyInException.should.equal(false); });
    it('should report through onException', () => { onException.mock.calls[0][0].should.deep.equal(['Example failure']); });
    it('should stay open and not execute', () => {
        state.execute.mock.calls.length.should.equal(0);
        onSuccess.mock.calls.length.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
    });
});
