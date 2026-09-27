// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { beforeEach, afterEach, describe, it } from 'vitest';
import { confirm, mount, onFailed, reset, state, unmount } from '../given/a_dialog_with_guard';

describe('when execution fails without a guard', () => {
    let busyInFailure: boolean;
    beforeEach(async () => {
        reset();
        state.execute.mockResolvedValue({ isSuccess: false, response: {} });
        onFailed.mockImplementation(() => { busyInFailure = state.busy; });
        await mount();
        await confirm();
    });
    afterEach(unmount);
    it('should clear busy before calling onFailed', () => { busyInFailure.should.equal(false); });
});
