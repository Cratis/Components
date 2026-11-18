// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { footerMarkup } from './given/the_footer_markup';
import { renderFooter } from './given/a_footer';

describe('when rendering a busy footer without an adapter', () => {
    let html: string;

    beforeEach(() => {
        html = renderFooter({ isBusy: true });
    });

    it('should render the legacy footer markup', () => {
        html.should.equal(
            footerMarkup(
                '<button type="button" class="cratis-dialog__button cratis-dialog__button--primary" aria-disabled="true" aria-busy="true" data-cratis-part="confirm" data-disabled="true" data-busy="true" autofocus=""><span class="cratis-dialog__spinner" aria-hidden="true"></span><span>Ok</span></button>' +
                '<button type="button" class="cratis-dialog__button cratis-dialog__button--secondary" data-cratis-part="cancel" data-disabled="true" data-busy="true" disabled=""><span>Cancel</span></button>',
                ' data-busy="true" aria-busy="true"'
            ),
        );
    });
});
