// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { approve, mount, onSuccess, state, submit, unmount } from '../given/a_dialog_with_current_values';

describe('when current values remain unchanged while the guard is pending', () => {
    let resolveGuard!: (approved: boolean) => void;
    beforeEach(async () => {
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount(() => pending);
        await submit();
        await approve(resolveGuard);
    });
    afterEach(unmount);
    it('should execute once', () => { state.command.execute.mock.calls.length.should.equal(1); });
    it('should report success', () => { onSuccess.mock.calls.length.should.equal(1); });
});
