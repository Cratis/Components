// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onConfirm, onSuccess, reset, state, unmount } from '../given/a_dialog_with_guard';

describe('when an async success callback unmounts the dialog', () => {
    beforeEach(async () => {
        reset();
        let resolveSuccess!: () => void;
        onSuccess.mockImplementation(async () => new Promise<void>(resolve => { resolveSuccess = resolve; }));
        await mount();
        await act(async () => { void state.confirm!(); });
        await unmount();
        await act(async () => resolveSuccess());
    });
    it('should call onConfirm after the callback completes', () => { onConfirm.mock.calls.length.should.equal(1); });
});
