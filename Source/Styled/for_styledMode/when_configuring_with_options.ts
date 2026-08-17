// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { primeReactStyles } from '../primeReactStyles';
import { styledMode } from '../styledMode';

describe('when configuring with options', () => {
    const preset = { primitive: {}, semantic: {} };

    it('should style with the given preset', () => {
        styledMode({ preset }).theme!.preset!.should.equal(preset);
    });

    it('should switch dark mode on the given selector', () => {
        styledMode({ darkModeSelector: '.app-dark' }).theme!.options!.darkModeSelector!.should.equal('.app-dark');
    });

    it('should follow the system scheme when asked to', () => {
        styledMode({ darkModeSelector: 'system' }).theme!.options!.darkModeSelector!.should.equal('system');
    });

    it('should name the cascade layer from a string', () => {
        (styledMode({ cssLayer: 'ui' }).theme!.options!.cssLayer as { name: string }).name.should.equal('ui');
    });

    it('should keep the default order with the layer renamed', () => {
        (styledMode({ cssLayer: 'ui' }).theme!.options!.cssLayer as { order: string }).order.should.equal('theme, base, ui, components, utilities');
    });

    it('should pass a layer with an order through untouched', () => {
        const cssLayer = { name: 'ui', order: 'reset, ui, app' };
        styledMode({ cssLayer }).theme!.options!.cssLayer!.should.equal(cssLayer);
    });

    it('should emit the theme unlayered when asked to', () => {
        styledMode({ cssLayer: false }).theme!.options!.cssLayer!.should.equal(false);
    });

    it('should still hand every primitive its PrimeReact styles', () => {
        styledMode({ preset }).defaults!.should.equal(primeReactStyles);
    });
});
