// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { CratisPreset } from '../CratisPreset';
import { primeReactStyles } from '../primeReactStyles';
import { styledMode } from '../styledMode';

describe('when using the legacy styled-mode surface', () => {
    it('should return an empty provider configuration', () => {
        expect(styledMode()).to.deep.equal({});
        expect(styledMode({ preset: { name: 'legacy' } })).to.deep.equal({});
    });

    it('should retain inert legacy exports for migration builds', () => {
        expect(CratisPreset.name).to.equal('cratis');
        expect(primeReactStyles).to.deep.equal({});
    });
});
