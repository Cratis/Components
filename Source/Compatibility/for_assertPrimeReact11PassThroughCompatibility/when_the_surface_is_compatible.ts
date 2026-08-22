// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { beforeEach, describe, it } from 'vitest';
import { assertPrimeReact11PassThroughCompatibility } from '../assertPrimeReact11PassThroughCompatibility';

describe('when the pass-through surface is compatible', () => {
    let root: HTMLDivElement;

    beforeEach(() => {
        root = document.createElement('div');
        root.innerHTML = `
            <button data-scope="button" data-part="root" data-cratis-pt-slot="button.root"></button>
            <span data-scope="button" data-part="addition" data-cratis-pt-slot="button.addition"></span>`;
    });

    it('should allow additive slots and markers', () => {
        expect(() =>
            assertPrimeReact11PassThroughCompatibility(root, ['button']),
        ).not.to.throw();
    });
});
