// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, reset, state, unmount } from './given/a_dialog_with_guard';

describe('when unmounting while the guard is pending', () => {
    let resolveGuard: (approved: boolean) => void;
    beforeEach(async () => {
        reset();
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount(() => pending);
        await act(async () => { void state.confirm!(); });
        await unmount();
        await act(async () => resolveGuard(true));
    });
    it('should not execute after unmount', () => { state.execute.mock.calls.length.should.equal(0); });
});
