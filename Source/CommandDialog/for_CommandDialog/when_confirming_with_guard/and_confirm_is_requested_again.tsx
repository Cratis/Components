// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { mount, reset, state, unmount } from '../given/a_dialog_with_guard';

describe('when a guard is pending and another confirm is requested', () => {
    let resolveGuard: (approved: boolean) => void;
    let busyWhilePending: boolean;
    let executeCalls: number;
    beforeEach(async () => {
        reset();
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount(() => pending);
        await act(async () => { void state.confirm!(); });
        busyWhilePending = state.busy;
        await act(async () => { void state.confirm!(); });
        await act(async () => resolveGuard(true));
        executeCalls = state.execute.mock.calls.length;
    });
    afterEach(unmount);
    it('should hold busy through confirmation', () => { busyWhilePending.should.equal(true); });
    it('should execute only once', () => { executeCalls.should.equal(1); });
});
