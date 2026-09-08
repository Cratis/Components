// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, vi } from 'vitest';
import { Dialog } from '../Dialog';

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

const html = renderToStaticMarkup(
    React.createElement(Dialog, {
        title: 'Example dialog',
        visible: true,
        buttons: 2,
        children: React.createElement('p', null, 'Dialog content'),
    }),
);

describe('when rendered without busy state', () => {
    it('should omit inactive busy and disabled states', () => {
        expect(html).not.to.contain('data-busy=');
        expect(html).not.to.contain('data-disabled=');
    });

    it('should retain the authoritative open state', () => {
        expect(html.match(/data-open="true"/g)).to.have.lengthOf(4);
        expect(html).not.to.contain('data-open="false"');
    });
});
