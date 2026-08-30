// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, it, vi } from 'vitest';
import { Button } from '../Button';

describe('when warning for deprecated Button props', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should warn once for each deprecated prop during the module session', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const deprecatedButtons = [
            <Button key='severity' severity='danger' />,
            <Button key='text' text />,
            <Button key='link' link />,
            <Button key='outlined' outlined />,
            <Button key='rounded' rounded />,
        ];

        for (const button of deprecatedButtons) {
            renderToStaticMarkup(button);
            renderToStaticMarkup(button);
        }

        expect(warning.mock.calls.length).to.equal(5);
        for (const prop of ['severity', 'text', 'link', 'outlined', 'rounded']) {
            expect(
                warning.mock.calls.some(([message]) =>
                    String(message).includes(`"${prop}"`),
                ),
            ).to.equal(true);
        }
    });

    it('should not warn for new props', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        renderToStaticMarkup(
            <Button variant='outline' tone='critical' shape='pill' />,
        );

        expect(warning.mock.calls.length).to.equal(0);
    });
});
