// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { setToastDispatch, toast, type ToastDispatch, type ToastOptions } from '../toast';

const calls = {
    success: [] as ToastOptions[],
    error: [] as ToastOptions[],
};

const dispatch: ToastDispatch = {
    show: () => 'shown',
    update: (id) => id,
    dismiss: () => undefined,
    promise: async (promise) => promise,
    success: (options) => {
        calls.success.push(options);
        return 'success';
    },
    info: () => 'info',
    warn: () => 'warn',
    error: (options) => {
        calls.error.push(options);
        return 'error';
    },
    secondary: () => 'secondary',
    contrast: () => 'contrast',
};

let restore: () => void;

beforeEach(() => {
    calls.success = [];
    calls.error = [];
    restore = setToastDispatch(dispatch);
});

afterEach(() => restore());

describe('when using a custom toast dispatch', () => {
    it('should route severity methods through the supplied contract', () => {
        const id = toast.success({ title: 'Saved' });

        expect(id).to.equal('success');
        expect(calls.success).to.deep.equal([{ title: 'Saved' }]);
    });

    it('should not resurrect an outer dispatch restored before the inner dispatch', () => {
        const outerDispatch = { ...dispatch, success: vi.fn(() => 'outer') };
        const innerDispatch = { ...dispatch, success: vi.fn(() => 'inner') };
        const outer = setToastDispatch(outerDispatch);
        const inner = setToastDispatch(innerDispatch);

        outer();
        inner();
        toast.success({ title: 'Default test dispatch' });

        expect(outerDispatch.success.mock.calls).to.have.lengthOf(0);
        expect(innerDispatch.success.mock.calls).to.have.lengthOf(0);
        expect(calls.success).to.deep.equal([{ title: 'Default test dispatch' }]);
    });

    it('should distinguish nested installations of the same dispatch object', () => {
        const nested = setToastDispatch(dispatch);
        const inner = setToastDispatch(dispatch);

        nested();
        toast.success({ title: 'Inner still active' });
        expect(calls.success).to.deep.equal([{ title: 'Inner still active' }]);

        inner();
    });

    it('should restore three nested installations out of order', () => {
        const firstDispatch = { ...dispatch, success: vi.fn(() => 'first') };
        const secondDispatch = { ...dispatch, success: vi.fn(() => 'second') };
        const thirdDispatch = { ...dispatch, success: vi.fn(() => 'third') };
        const first = setToastDispatch(firstDispatch);
        const second = setToastDispatch(secondDispatch);
        const third = setToastDispatch(thirdDispatch);

        second();
        third();
        toast.success({ title: 'First remains' });
        expect(firstDispatch.success.mock.calls).to.have.lengthOf(1);
        expect(secondDispatch.success.mock.calls).to.have.lengthOf(0);
        expect(thirdDispatch.success.mock.calls).to.have.lengthOf(0);

        first();
    });
});
