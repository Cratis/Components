// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { Button, type ButtonSeverity } from '../Button';

const severities: Array<[ButtonSeverity, string]> = [
    ['secondary', 'neutral'],
    ['info', 'accent'],
    ['success', 'positive'],
    ['warn', 'caution'],
    ['help', 'accent'],
    ['danger', 'critical'],
    ['contrast', 'neutral'],
];

describe('when using deprecated Button props', () => {
    beforeAll(() => vi.spyOn(console, 'warn').mockImplementation(() => undefined));
    afterAll(() => vi.restoreAllMocks());

    for (const [severity, tone] of severities) {
        it(`should map ${severity} to ${tone} and preserve the exact legacy severity`, () => {
            const html = renderToStaticMarkup(
                <Button label='Action' severity={severity} />,
            );

            expect(html).to.contain(`data-tone="${tone}"`);
            expect(html).to.contain(`data-severity="${severity}"`);
        });
    }

    it('should map text to ghost', () => {
        const html = renderToStaticMarkup(<Button label='Action' text />);

        expect(html).to.contain('data-variant="ghost"');
    });

    it('should map link to link', () => {
        const html = renderToStaticMarkup(<Button label='Action' link />);

        expect(html).to.contain('data-variant="link"');
    });

    it('should map outlined to outline', () => {
        const html = renderToStaticMarkup(<Button label='Action' outlined />);

        expect(html).to.contain('data-variant="outline"');
    });

    it('should map rounded to pill', () => {
        const html = renderToStaticMarkup(<Button label='Action' rounded />);

        expect(html).to.contain('data-shape="pill"');
    });

    it('should retain the legacy variant precedence', () => {
        const html = renderToStaticMarkup(
            <Button label='Action' outlined text link />,
        );

        expect(html).to.contain('data-variant="link"');
    });
});
