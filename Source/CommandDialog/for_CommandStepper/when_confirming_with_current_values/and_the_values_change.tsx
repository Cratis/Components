// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { approve, changeValues, mount, nameFieldDisabled, onFailed, onSuccess, state, submit, unmount } from '../given/a_stepper_with_current_values';

describe('when current values change while a stepper guard is pending', () => {
    let resolveGuard!: (approved: boolean) => void;
    let receivedName: string | undefined;
    let disabledWhilePending: boolean;
    beforeEach(async () => {
        const pending = new Promise<boolean>((resolve) => { resolveGuard = resolve; });
        await mount((values) => { receivedName = values.name; return pending; });
        await submit();
        disabledWhilePending = nameFieldDisabled();
        await changeValues();
        await approve(resolveGuard);
    });
    afterEach(unmount);
    it('should ask about the original value', () => { receivedName!.should.equal('Approved value'); });
    it('should not execute the changed command', () => { state.command.execute.mock.calls.length.should.equal(0); });
    it('should not report a result', () => {
        onSuccess.mock.calls.length.should.equal(0);
        onFailed.mock.calls.length.should.equal(0);
    });
    it('should disable the field during confirmation', () => { disabledWhilePending.should.equal(true); });
    it('should enable the field after confirmation', () => { nameFieldDisabled().should.equal(false); });
});
