// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { should } from 'chai';
import { Page } from '../Page';

should();

describe('when disabling the Page landmark', () => {
    const render = (landmark?: boolean) => {
        const container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(<Page title='Example Project' panel landmark={landmark}>Content</Page>);
        return container;
    };

    it('should keep the default main output identical to an explicit landmark', () => {
        render().innerHTML.should.equal(render(true).innerHTML);
        render().querySelectorAll('main').length.should.equal(1);
    });

    it('should render a div with identical layout and content when disabled', () => {
        const defaultContent = render().querySelector('main')!;
        const disabled = render(false);
        disabled.querySelectorAll('main').length.should.equal(0);
        const content = disabled.firstElementChild!.firstElementChild!;
        content.tagName.should.equal('DIV');
        content.className.should.equal(defaultContent.className);
        content.innerHTML.should.equal(defaultContent.innerHTML);
        disabled.firstElementChild!.hasAttribute('landmark').should.equal(false);
    });
});
