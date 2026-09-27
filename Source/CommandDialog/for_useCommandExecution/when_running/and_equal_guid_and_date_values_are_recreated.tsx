// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { Guid } from '@cratis/fundamentals';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { command, execute, mount, onException, run, unmount } from '../given/a_submission';

type CommandWithValues = { propertyDescriptors?: { name: string }[]; identifier?: Guid; date?: Date };
const identifier = '00000000-0000-4000-8000-000000000001';
const timestamp = '2026-01-01T00:00:00.000Z';

describe('when equal Guid and Date command values are recreated while confirmation is pending', () => {
    const guard = vi.fn();
    let resolveGuard!: (approved: boolean) => void;
    beforeEach(async () => {
        const withValues = command as unknown as CommandWithValues;
        withValues.propertyDescriptors = [{ name: 'identifier' }, { name: 'date' }];
        withValues.identifier = Guid.parse(identifier);
        withValues.date = new Date(timestamp);
        const pending = new Promise<boolean>(resolve => { resolveGuard = resolve; });
        guard.mockReset().mockReturnValue(pending);
        await mount({ guard });
        await act(async () => { void run(); });
        withValues.identifier = Guid.parse(identifier);
        withValues.date = new Date(timestamp);
        await act(async () => resolveGuard(true));
    });
    afterEach(async () => {
        const withValues = command as unknown as CommandWithValues;
        delete withValues.propertyDescriptors;
        delete withValues.identifier;
        delete withValues.date;
        await unmount();
    });
    it('should execute once', () => { execute.mock.calls.length.should.equal(1); });
    it('should not report an exception', () => { onException.mock.calls.length.should.equal(0); });
});
