// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import {
    Button,
    type ButtonShape,
    type ButtonTone,
    type ButtonVariant,
} from '../Button';

const variants: ButtonVariant[] = ['solid', 'outline', 'ghost', 'link'];
const tones: Array<[ButtonTone, string]> = [
    ['neutral', 'secondary'],
    ['accent', 'info'],
    ['positive', 'success'],
    ['caution', 'warn'],
    ['critical', 'danger'],
];
const shapes: ButtonShape[] = ['default', 'pill'];

describe('when using semantic Button props', () => {
    for (const variant of variants) {
        it(`should emit the ${variant} variant`, () => {
            const html = renderToStaticMarkup(<Button label='Action' variant={variant} />);

            expect(html).to.contain(`data-variant="${variant}"`);
        });
    }

    for (const [tone, legacySeverity] of tones) {
        it(`should emit the ${tone} tone and its legacy severity`, () => {
            const html = renderToStaticMarkup(<Button label='Action' tone={tone} />);

            expect(html).to.contain(`data-tone="${tone}"`);
            expect(html).to.contain(`data-severity="${legacySeverity}"`);
        });
    }

    for (const shape of shapes) {
        it(`should emit the ${shape} shape`, () => {
            const html = renderToStaticMarkup(<Button label='Action' shape={shape} />);

            expect(html).to.contain(`data-shape="${shape}"`);
        });
    }
});
