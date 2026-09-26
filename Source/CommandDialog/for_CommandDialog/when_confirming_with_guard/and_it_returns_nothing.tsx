// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { confirm, mount, reset, state, unmount } from '../given/a_dialog_with_guard';

describe('when a guard returns nothing at runtime', () => {
    beforeEach(async () => {
        reset();
        // SAFETY: callbacks from JavaScript consumers may return undefined despite the TypeScript contract.
        await mount(() => undefined as unknown as boolean);
        await confirm();
    });
    afterEach(unmount);
    it('should not execute', () => { state.execute.mock.calls.length.should.equal(0); });
});
