// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { beforeEach, afterEach, describe, it } from 'vitest';
import { confirm, mount, onSuccess, reset, state, unmount } from '../when_confirming_with_guard/given/a_dialog_with_guard';

describe('when execution succeeds without a guard', () => {
    let busyInSuccess: boolean;
    beforeEach(async () => {
        reset();
        onSuccess.mockImplementation(() => { busyInSuccess = state.busy; });
        await mount();
        await confirm();
    });
    afterEach(unmount);
    it('should clear busy before calling onSuccess', () => { busyInSuccess.should.equal(false); });
});
