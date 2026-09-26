// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import { mount, onClose, onConfirm, onSuccess, reset, state, submit } from '../given/a_submission';
import { unmount } from '../given/a_stepper_dialog_in_the_dom';

describe('when successful execution settles after the stepper dialog unmounts', () => {
    beforeEach(async () => {
        reset();
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        const dialog = await mount({ onConfirm, onSuccess });
        await submit();
        await unmount(dialog);
        await act(async () => resolveExecution({ isSuccess: true, response: {} }));
    });
    it('should call the success callback', () => { onSuccess.mock.calls.length.should.equal(1); });
    it('should call onConfirm', () => { onConfirm.mock.calls.length.should.equal(1); });
    it('should close the dialog host with Ok', () => { state.closeDialog.mock.calls.should.deep.equal([[3]]); });
});

describe('when successful execution settles after unmount with onClose', () => {
    beforeEach(async () => {
        reset();
        let resolveExecution!: (result: { isSuccess: boolean; response: object }) => void;
        state.execute.mockImplementation(() => new Promise(resolve => { resolveExecution = resolve; }));
        const dialog = await mount({ onClose });
        await submit();
        await unmount(dialog);
        await act(async () => resolveExecution({ isSuccess: true, response: {} }));
    });
    it('should call onClose with Ok', () => { onClose.mock.calls.should.deep.equal([[3]]); });
    it('should close the dialog host with Ok', () => { state.closeDialog.mock.calls.should.deep.equal([[3]]); });
});

describe('when an async success callback outlives the stepper dialog', () => {
    beforeEach(async () => {
        reset();
        state.execute.mockResolvedValue({ isSuccess: true, response: {} });
        let resolveSuccess!: () => void;
        onSuccess.mockImplementation(() => new Promise<void>(resolve => { resolveSuccess = resolve; }));
        const dialog = await mount({ onConfirm, onSuccess });
        await submit();
        await unmount(dialog);
        await act(async () => resolveSuccess());
    });
    it('should call onConfirm', () => { onConfirm.mock.calls.length.should.equal(1); });
    it('should close the dialog host with Ok', () => { state.closeDialog.mock.calls.should.deep.equal([[3]]); });
});
