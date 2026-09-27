// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { Tooltip } from '../Tooltip';

describe.each([['empty string', ''], ['undefined', undefined], ['null', null], ['false', false], ['true', true]] as const)(
    'when rendering tooltip content of %s', (_description, content) => {
        let html: string;

        beforeEach(() => {
            html = renderToStaticMarkup(
                <CratisComponentsProvider>
                    <Tooltip content={content}>
                        <button type='button'>Count</button>
                    </Tooltip>
                </CratisComponentsProvider>,
            );
        });

        it('should leave the trigger without a tooltip', () => {
            html.should.not.include('cratis-tooltip-trigger');
        });
    },
);
