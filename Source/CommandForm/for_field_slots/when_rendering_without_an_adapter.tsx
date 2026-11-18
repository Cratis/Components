// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, vi } from 'vitest';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: ComponentType<Record<string, unknown>>) => component,
}));

import { arcProps, asDirectComponent, fieldCases } from './given/field_cases';
import golden from './given/goldenMarkup.json';
import { normalizeIds } from './given/normalizeIds';

// The golden markup was captured from the fields before they were routed through presentation
// slots. renderToStaticMarkup is attribute-order sensitive, so equality proves the zero-config DOM,
// classes, data-cratis-* markers and accessibility attributes are unchanged.
describe('when rendering without an adapter', () => {
    const goldenMarkup: Record<string, string> = golden;

    fieldCases.forEach((fieldCase) => {
        it(`should render the ${fieldCase.name} field exactly as before`, () => {
            const Field = asDirectComponent(fieldCase.component);
            const html = renderToStaticMarkup(<Field {...arcProps} {...fieldCase.props} />);
            normalizeIds(html).should.equal(goldenMarkup[fieldCase.name]);
        });
    });
});
