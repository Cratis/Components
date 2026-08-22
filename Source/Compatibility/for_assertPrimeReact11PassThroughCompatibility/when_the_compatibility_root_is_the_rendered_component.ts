// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { beforeEach, describe, it } from 'vitest';
import { assertPrimeReact11PassThroughCompatibility } from '../assertPrimeReact11PassThroughCompatibility';

describe('when the compatibility root is the rendered component', () => {
    let root: HTMLButtonElement;

    beforeEach(() => {
        root = document.createElement('button');
        root.dataset.scope = 'button';
        root.dataset.cratisPtSlot = 'button.root';
    });

    it('should include the root in the compatibility check', () => {
        expect(() =>
            assertPrimeReact11PassThroughCompatibility(root, ['button']),
        ).not.to.throw();
    });
});
