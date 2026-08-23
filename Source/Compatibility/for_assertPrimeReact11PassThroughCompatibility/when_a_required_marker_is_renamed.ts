// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { beforeEach, describe, it } from 'vitest';
import { assertPrimeReact11PassThroughCompatibility } from '../assertPrimeReact11PassThroughCompatibility';

describe('when a required structural marker is renamed', () => {
    let root: HTMLDivElement;

    beforeEach(() => {
        root = document.createElement('div');
        root.innerHTML =
            '<button data-scope="renamed-button" data-cratis-pt-slot="button.root"></button>';
    });

    it('should report the expected selector with a likely cause', () => {
        expect(() =>
            assertPrimeReact11PassThroughCompatibility(root, ['button']),
        ).to.throw(
            Error,
            'button marker [data-scope="button"]: structural marker was not rendered; it may have been removed, renamed',
        );
    });
});
