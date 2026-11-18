// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { footerMarkup } from './given/the_footer_markup';
import { renderFooter } from './given/a_footer';

describe('when rendering part attributes without an adapter', () => {
    let html: string;

    beforeEach(() => {
        html = renderFooter({
            pt: {
                confirm: { className: 'x', title: 't', id: 'c' },
                cancel: { className: 'y', 'aria-label': 'z' },
            },
        });
    });

    it('should render the legacy footer markup', () => {
        html.should.equal(
            footerMarkup(
                '<button class="cratis-dialog__button cratis-dialog__button--primary x" title="t" id="c" type="button" data-cratis-part="confirm" autofocus=""><span>Ok</span></button>' +
                '<button class="cratis-dialog__button cratis-dialog__button--secondary y" aria-label="z" type="button" data-cratis-part="cancel"><span>Cancel</span></button>',
            ),
        );
    });
});
