// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { footerMarkup } from './given/the_footer_markup';
import { renderFooter } from './given/a_footer';

describe('when rendering an invalid footer without an adapter', () => {
    let html: string;

    beforeEach(() => {
        html = renderFooter({ isValid: false });
    });

    it('should render the legacy footer markup', () => {
        html.should.equal(
            footerMarkup(
                '<button type="button" class="cratis-dialog__button cratis-dialog__button--primary" data-cratis-part="confirm" data-disabled="true" disabled="" autofocus=""><span>Ok</span></button>' +
                '<button type="button" class="cratis-dialog__button cratis-dialog__button--secondary" data-cratis-part="cancel"><span>Cancel</span></button>',
            ),
        );
    });
});
