// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { command, execute, mount, onException, run, unmount } from '../given/a_submission';

type WithDescriptors = { propertyDescriptors?: { name: string }[]; value?: null };

describe('when running an approved submission with a null command value', () => {
    const guard = vi.fn(() => true);
    beforeEach(async () => {
        const withDescriptors = command as unknown as WithDescriptors;
        withDescriptors.propertyDescriptors = [{ name: 'value' }];
        withDescriptors.value = null;
        guard.mockClear();
        await mount({ guard });
        await act(async () => { await run(); });
    });
    afterEach(async () => {
        const withDescriptors = command as unknown as WithDescriptors;
        delete withDescriptors.propertyDescriptors;
        delete withDescriptors.value;
        await unmount();
    });
    it('should ask the guard once', () => { guard.mock.calls.length.should.equal(1); });
    it('should execute once', () => { execute.mock.calls.length.should.equal(1); });
    it('should not report a serialization failure', () => { onException.mock.calls.length.should.equal(0); });
});
