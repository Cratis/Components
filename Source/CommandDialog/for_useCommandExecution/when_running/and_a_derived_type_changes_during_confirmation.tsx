// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { DerivedType } from '@cratis/fundamentals';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { command, execute, mount, onException, run, unmount } from '../given/a_submission';

class SampleValue { name = 'Same fields'; }
class FirstValue extends SampleValue {}
class SecondValue extends SampleValue {}
DerivedType.set(FirstValue, 'first-sample-value', SampleValue);
DerivedType.set(SecondValue, 'second-sample-value', SampleValue);

type CommandWithValue = { propertyDescriptors?: { name: string }[]; value?: SampleValue };

describe('when a registered derived command value changes while confirmation is pending', () => {
    const guard = vi.fn();
    let resolveGuard!: (approved: boolean) => void;
    beforeEach(async () => {
        const withValue = command as unknown as CommandWithValue;
        withValue.propertyDescriptors = [{ name: 'value' }];
        withValue.value = new FirstValue();
        const pending = new Promise<boolean>(resolve => { resolveGuard = resolve; });
        guard.mockReset().mockReturnValue(pending);
        await mount({ guard });
        await act(async () => { void run(); });
        withValue.value = new SecondValue();
        await act(async () => resolveGuard(true));
    });
    afterEach(async () => {
        const withValue = command as unknown as CommandWithValue;
        delete withValue.propertyDescriptors;
        delete withValue.value;
        await unmount();
    });
    it('should ask the guard once', () => { guard.mock.calls.length.should.equal(1); });
    it('should not execute the changed command', () => { execute.mock.calls.length.should.equal(0); });
    it('should not report an exception', () => { onException.mock.calls.length.should.equal(0); });
});
