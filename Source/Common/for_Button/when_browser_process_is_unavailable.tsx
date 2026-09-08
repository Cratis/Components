// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, it, vi } from 'vitest';
import { Button } from '../Button';

describe('when the browser process global is unavailable', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should safely render a deprecated Button prop', () => {
        vi.stubGlobal('process', undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(() => renderToStaticMarkup(<Button text />)).not.to.throw();
    });
});
