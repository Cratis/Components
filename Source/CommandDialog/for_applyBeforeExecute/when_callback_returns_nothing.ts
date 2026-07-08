// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { applyBeforeExecute, type BeforeExecuteCallback } from '../applyBeforeExecute';

describe('when applyBeforeExecute is given a callback that returns nothing', () => {
    const current = { id: 'original' };
    let result: { id: string };
    let warnSpy: ReturnType<typeof vi.spyOn>;

    // A JavaScript consumer using onBeforeExecute as a side-effect hook — it forgets to
    // return the values. The typed contract forbids this; the cast simulates the untyped
    // call site the runtime guard exists to protect.
    const sideEffectOnly = ((values: { id: string }) => { void values; }) as unknown as BeforeExecuteCallback<{ id: string }>;

    beforeEach(async () => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence during the spec */ });
        result = await applyBeforeExecute(sideEffectOnly, current);
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('should_keep_the_current_values', () => {
        result.should.equal(current);
    });

    it('should_never_return_undefined', () => {
        (result === undefined).should.be.false;
    });

    it('should_warn_about_the_missing_return', () => {
        warnSpy.mock.calls.length.should.equal(1);
    });
});
