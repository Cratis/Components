// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisPartStates, cratisParts } from '../../types/parts';

describe('when guarding ComboBox parts', () => {
    it('should keep the exact public part inventory', () => {
        expect(cratisParts.ComboBox).to.deep.equal([
            'root',
            'input',
            'trigger',
            'popover',
            'listbox',
            'option',
            'optionLabel',
            'optionDescription',
            'loading',
            'empty',
            'failure',
            'action',
            'description',
            'error',
        ]);
        expect(cratisPartStates.ComboBox.root).to.deep.equal([
            'disabled',
            'invalid',
            'readonly',
            'loading',
        ]);
        expect(cratisPartStates.ComboBox.option).to.deep.equal(['disabled', 'selected']);
    });

    it('should keep the component stylesheet reachable from the styles manifest', () => {
        const manifest = readFileSync(
            fileURLToPath(new URL('../../styles.css', import.meta.url)),
            'utf8',
        );
        expect(manifest).to.contain("@import './Common/ComboBox.css';");
    });
});
