// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { command, execute, mount, onException, run, unmount } from '../given/a_submission';

type WithDescriptors = { propertyDescriptors?: { name: string }[]; value?: null };

describe('when running a guarded submission whose values cannot be serialized', () => {
    const guard = vi.fn(() => true);
    let isBusyAfterRun: boolean;
    beforeEach(async () => {
        const withDescriptors = command as unknown as WithDescriptors;
        withDescriptors.propertyDescriptors = [{ name: 'value' }];
        withDescriptors.value = null;
        guard.mockClear();
        await mount({ guard });
        await act(async () => { await run(); });
        const { isBusy } = await import('../given/a_submission');
        isBusyAfterRun = isBusy;
    });
    afterEach(async () => {
        const withDescriptors = command as unknown as WithDescriptors;
        delete withDescriptors.propertyDescriptors;
        delete withDescriptors.value;
        await unmount();
    });
    it('should not ask the guard', () => { guard.mock.calls.length.should.equal(0); });
    it('should not execute', () => { execute.mock.calls.length.should.equal(0); });
    it('should report the failure through onException', () => { onException.mock.calls.length.should.equal(1); });
    it('should report the serializer failure', () => { onException.mock.calls[0][0][0].should.contain('__proto__'); });
    it('should release busy', () => { isBusyAfterRun.should.equal(false); });
});
