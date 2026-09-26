// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onConfirm, onSuccess, reset, state, unmount, type SampleCommand } from '../given/a_dialog_with_guard';

describe('when an async transform settles after unmount without a guard', () => {
    beforeEach(async () => {
        reset();
        let resolveTransform!: (values: SampleCommand) => void;
        await mount(undefined, () => new Promise(resolve => { resolveTransform = resolve; }));
        await act(async () => { void state.confirm!(); });
        await unmount();
        await act(async () => resolveTransform({ name: 'After' }));
    });
    it('should still execute', () => { state.execute.mock.calls.length.should.equal(1); });
    it('should execute with the transformed values', () => { state.values.name.should.equal('After'); });
    it('should deliver the result callback', () => { onSuccess.mock.calls.length.should.equal(1); });
    it('should call onConfirm', () => { onConfirm.mock.calls.length.should.equal(1); });
});
