// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { Tooltip } from '../Tooltip';

describe('when rendering zero as tooltip content', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <Tooltip content={0}><button type='button'>Count</button></Tooltip>
            </CratisComponentsProvider>,
        );
    });

    it('should attach the tooltip trigger', () => {
        html.should.include('cratis-tooltip-trigger');
    });
});
