// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    primeReact11PassThroughSentinelAttribute,
    primeReact11PassThroughSentinelPreset,
} from '../primeReact11PassThroughSentinelPreset';

describe('when components share a global pass-through key', () => {
    it('should retain every component sentinel', () => {
        const inputText = primeReact11PassThroughSentinelPreset.inputtext as Record<
            string,
            Record<string, string>
        >;

        expect(inputText.root[primeReact11PassThroughSentinelAttribute]).to.equal(
            'inputtext.root inputpassword.root',
        );
    });
});
