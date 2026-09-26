// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { Page } from '../Page';

describe('when using the Page panel hook', () => {
    let main: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = renderToStaticMarkup(<Page title='Example Project' panel>Content</Page>);
        main = document.body.querySelector('main') as HTMLElement;
    });

    it('should add the panel class to the content region', () => {
        expect(main.classList.contains('panel')).to.equal(true);
    });
});
