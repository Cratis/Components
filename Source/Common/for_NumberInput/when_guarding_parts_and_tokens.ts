// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

const commonDirectory = path.dirname(fileURLToPath(new URL('../NumberInput.tsx', import.meta.url)));
const sourceDirectory = path.dirname(commonDirectory);
const styles = readFileSync(path.join(commonDirectory, 'NumberInput.css'), 'utf8');
const tokens = readFileSync(path.join(sourceDirectory, 'tokens.css'), 'utf8');

describe('when guarding NumberInput parts and tokens', () => {
    it('should keep the exact public part inventory for standalone and command surfaces', () => {
        expect(cratisParts.NumberInput).to.deep.equal([
            'root',
            'input',
            'prefix',
            'suffix',
            'step',
            'description',
            'error',
        ]);
        expect(cratisParts.NumberInputField).to.deep.equal(cratisParts.NumberInput);
        expect(cratisPartStates.NumberInput.input).to.deep.equal([
            'disabled',
            'invalid',
            'readonly',
            'focused',
        ]);
    });

    it('should keep the component stylesheet reachable and token-owned', () => {
        expect(styles).to.contain('var(--cratis-number-input-adornment-color)');
        expect(styles).to.contain('var(--cratis-number-input-step-background)');
        expect(styles).to.contain('var(--cratis-number-input-step-background-hover)');
        expect(tokens).to.contain('--cratis-number-input-adornment-color:');
        expect(tokens).to.contain('--cratis-number-input-step-background:');
        expect(tokens).to.contain('--cratis-number-input-step-background-hover:');
    });
});
