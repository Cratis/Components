// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SampleCommand, mount, onSuccess, reset, state, unmount } from './given/a_dialog_with_guard';

describe('when confirming with a guard that approves', () => {
    let receivedValues: SampleCommand | undefined;
    beforeEach(async () => {
        reset();
        await mount((values) => { receivedValues = values; return true; }, () => ({ name: 'After' }));
        await act(async () => { await state.confirm!(); });
    });
    afterEach(unmount);
    it('should receive the transformed values', () => { receivedValues!.name.should.equal('After'); });
    it('should execute once', () => { state.execute.mock.calls.length.should.equal(1); });
    it('should call the success callback', () => { onSuccess.mock.calls.length.should.equal(1); });
});
