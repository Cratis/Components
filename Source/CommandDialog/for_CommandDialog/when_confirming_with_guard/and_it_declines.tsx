// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { confirm, mount, onConfirm, onFailed, onSuccess, reset, state, unmount } from './given/a_dialog_with_guard';

describe('when confirming with a guard that declines', () => {
    let close: boolean;
    beforeEach(async () => {
        reset();
        await mount(() => false);
        close = await confirm();
    });
    afterEach(unmount);
    it('should keep the dialog open', () => { close.should.equal(false); });
    it('should not execute', () => { state.execute.mock.calls.length.should.equal(0); });
    it('should not call result or close callbacks', () => {
        onSuccess.mock.calls.length.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
        onConfirm.mock.calls.length.should.equal(0);
    });
    it('should release busy state', () => { state.busy.should.equal(false); });
});
