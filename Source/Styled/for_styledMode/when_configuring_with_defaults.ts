// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { CratisPreset } from '../CratisPreset';
import { primeReactStyles } from '../primeReactStyles';
import { cratisDarkModeSelector, primeReactCssLayer, primeReactCssLayerOrder, styledMode } from '../styledMode';

describe('when configuring with defaults', () => {
    let config: ReturnType<typeof styledMode>;

    beforeEach(() => {
        config = styledMode();
    });

    it('should style with the Cratis preset', () => {
        config.theme!.preset!.should.equal(CratisPreset);
    });

    it('should switch dark mode on the Cratis dark class', () => {
        config.theme!.options!.darkModeSelector!.should.equal(cratisDarkModeSelector);
    });

    it('should emit the theme into the primereact cascade layer', () => {
        (config.theme!.options!.cssLayer as { name: string }).name.should.equal(primeReactCssLayer);
    });

    it('should order the layer above the base reset and below utilities', () => {
        (config.theme!.options!.cssLayer as { order: string }).order.should.equal(primeReactCssLayerOrder);
    });

    it('should hand every primitive its PrimeReact styles', () => {
        config.defaults!.should.equal(primeReactStyles);
    });
});
