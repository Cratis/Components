// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IconDisplay } from '../../Icon';

describe('when IconDisplay is given a pi class missing its base class and rendered', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(IconDisplay, { icon: 'pi-home' });
        html = renderToStaticMarkup(element);
    });

    it('should_render_an_i_element', () => {
        html.should.include('<i');
    });

    it('should_apply_the_repaired_class_with_base_pi', () => {
        html.should.include('pi pi-home');
    });
});
