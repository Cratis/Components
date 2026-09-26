// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onFailed, reset, state, submit } from '../given/a_submission';
import { unmount } from '../given/a_stepper_dialog_in_the_dom';

describe('when stepper dialog execution fails after unmount without a guard', () => {
    beforeEach(async () => {
        reset();
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        const dialog = await mount({ onFailed });
        await submit();
        await unmount(dialog);
        await act(async () => resolveExecution({ isSuccess: false, response: {} }));
    });
    it('should call onFailed', () => { onFailed.mock.calls.length.should.equal(1); });
});
