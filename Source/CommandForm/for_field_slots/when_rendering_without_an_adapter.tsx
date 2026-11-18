// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it, vi } from 'vitest';
import type {} from 'chai/register-should';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: unknown) => component,
}));

import { arcProps, asDirectComponent, fieldCases } from './given/field_cases';
import golden from './given/goldenMarkup.json';
import { normalizeIds } from './given/normalizeIds';

// The golden markup was captured from the fields before they were routed through presentation
// slots. renderToStaticMarkup is attribute-order sensitive, so equality proves the zero-config DOM,
// classes, data-cratis-* markers and accessibility attributes are unchanged.
const goldenMarkup: Record<string, string> = golden;

fieldCases.forEach((fieldCase) => {
    describe(`when rendering the ${fieldCase.name} field without an adapter`, () => {
        let html: string;

        beforeEach(() => {
            const Field = asDirectComponent(fieldCase.component);
            html = normalizeIds(renderToStaticMarkup(<Field {...arcProps} {...fieldCase.props} />));
        });

        it('should render exactly as before slot routing', () => html.should.equal(goldenMarkup[fieldCase.name]));
    });
});
