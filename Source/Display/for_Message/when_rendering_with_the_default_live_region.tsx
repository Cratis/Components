// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { Message } from '../Message';

const render = (element: React.ReactElement) => {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(element);
    return container.firstElementChild as Element;
};

describe('when rendering with the default live region', () => {
    it('should render an error message as an alert', () => {
        render(<Message severity='error' text='Failed.' />).getAttribute('role')!.should.equal('alert');
    });

    it('should render an info message as a status', () => {
        render(<Message text='Note.' />).getAttribute('role')!.should.equal('status');
    });

    it('should render a warning message as a status', () => {
        render(<Message severity='warn' text='Careful.' />).getAttribute('role')!.should.equal('status');
    });

    it('should render the same role when live is explicitly true', () => {
        render(<Message severity='error' text='Failed.' live />).getAttribute('role')!.should.equal('alert');
    });
});
