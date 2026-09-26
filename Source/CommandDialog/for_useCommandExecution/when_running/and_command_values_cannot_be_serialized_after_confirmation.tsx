// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { command, execute, mount, onException, run, unmount } from '../given/a_submission';

type CommandWithValue = { propertyDescriptors?: { name: string }[]; value?: string | null };

describe('when approved command values cannot be serialized again', () => {
    const guard = vi.fn();
    let resolveGuard!: (approved: boolean) => void;
    beforeEach(async () => {
        const withValue = command as unknown as CommandWithValue;
        withValue.propertyDescriptors = [{ name: 'value' }];
        withValue.value = 'Before';
        const pending = new Promise<boolean>(resolve => { resolveGuard = resolve; });
        guard.mockReset().mockReturnValue(pending);
        await mount({ guard });
        await act(async () => { void run(); });
        withValue.value = null;
        await act(async () => resolveGuard(true));
    });
    afterEach(async () => {
        const withValue = command as unknown as CommandWithValue;
        delete withValue.propertyDescriptors;
        delete withValue.value;
        await unmount();
    });
    it('should ask the guard once', () => { guard.mock.calls.length.should.equal(1); });
    it('should not execute', () => { execute.mock.calls.length.should.equal(0); });
    it('should report the serialization failure', () => { onException.mock.calls[0][0][0].should.contain('__proto__'); });
});
