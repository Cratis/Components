// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, it } from 'vitest';
import * as submission from '../given/a_submission';

describe('when an unguarded submission handler is invoked after unmount', () => {
    beforeEach(async () => {
        await submission.mount();
        const run = submission.run;
        await submission.unmount();
        await act(async () => { await run(); });
    });
    it('should execute as it did without confirmation', () => { submission.execute.mock.calls.length.should.equal(1); });
});
