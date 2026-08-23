// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { beforeEach, describe, it } from 'vitest';
import { assertPrimeReact11PassThroughCompatibility } from '../assertPrimeReact11PassThroughCompatibility';

describe('when a required pass-through slot is missing', () => {
    let root: HTMLDivElement;

    beforeEach(() => {
        root = document.createElement('div');
        root.innerHTML = '<button data-scope="button" data-part="root"></button>';
    });

    it('should report the component and slot with a likely cause', () => {
        expect(() =>
            assertPrimeReact11PassThroughCompatibility(root, ['button']),
        ).to.throw(
            Error,
            'button.root: pass-through sentinel was not rendered; the slot may have been removed, renamed',
        );
    });
});
