// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { Page } from '../Page';

describe('when customizing the Page root', () => {
    let root: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = renderToStaticMarkup(
            <Page title='Example Project' className='custom-page' data-testid='example-page'>Content</Page>,
        );
        root = document.body.firstElementChild as HTMLElement;
    });

    it('should keep the layout classes alongside the caller class', () => {
        expect([...root.classList]).to.include.members([
            'cratis:flex', 'cratis:flex-col', 'cratis:h-full', 'cratis:flex-1', 'custom-page',
        ]);
    });

    it('should forward other root attributes', () => {
        expect(root.getAttribute('data-testid')).to.equal('example-page');
    });
});
