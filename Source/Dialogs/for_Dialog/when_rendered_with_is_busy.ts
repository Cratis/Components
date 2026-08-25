// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it, vi } from 'vitest';
import { Dialog } from '../Dialog';

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

describe('when rendered with is busy', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(Dialog, {
            title: 'Save changes',
            visible: true,
            isBusy: true,
            buttons: 2,
            children: React.createElement('p', null, 'Dialog content'),
        });

        html = renderToStaticMarkup(element);
    });

    it('should disable footer and header dismissal buttons', () => {
        const disabledButtons = html.match(/<button[^>]*disabled=""/g) ?? [];
        expect(disabledButtons).to.have.length(3);
    });

    it('should disable content and footer custom-action scopes', () => {
        const disabledScopes = html.match(/<fieldset[^>]*disabled=""/g) ?? [];
        expect(disabledScopes).to.have.length(2);
    });
});

