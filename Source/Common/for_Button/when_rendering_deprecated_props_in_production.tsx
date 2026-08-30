// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, it, vi } from 'vitest';
import { Button } from '../Button';

describe('when rendering deprecated Button props in production', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('should not warn', () => {
        vi.stubEnv('NODE_ENV', 'production');
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        renderToStaticMarkup(<Button severity='danger' />);

        expect(warning.mock.calls.length).to.equal(0);
    });
});
