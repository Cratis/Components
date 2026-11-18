// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { arcProps, asDirectComponent } from '../given/field_cases';
import { InputTextField } from '../../fields/InputTextField';

const Field = asDirectComponent(InputTextField);
const strictlyRender = (type: string) =>
    renderToStaticMarkup(
        <CratisComponentsProvider rendererFallback='throw'>
            <Field {...arcProps} value='2024-01-01' type={type} />
        </CratisComponentsProvider>,
    );

['date', 'color', 'time', 'datetime-local'].forEach((type) => {
    describe(`when a ${type} text field meets rendererFallback throw without a textInput declaration`, () => {
        let markup: string;

        beforeEach(() => {
            markup = strictlyRender(type);
        });

        it('should keep the native markup', () => markup.should.contain(`type="${type}"`));
    });
});

describe('when a slot-covered text field meets rendererFallback throw without a textInput declaration', () => {
    let thrown = false;

    beforeEach(() => {
        try {
            strictlyRender('text');
        } catch {
            thrown = true;
        }
    });

    it('should still reject the missing slot', () => thrown.should.equal(true));
});
