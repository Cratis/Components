// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { Dialog } from '../Dialog';

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.footer, props.children),
}));

vi.mock('primereact/button', () => ({
    Button: (props: { icon?: string; label?: string; onClick?: () => void | Promise<void>; disabled?: boolean; loading?: boolean }) => {
        if (props.icon === 'pi pi-check' && props.onClick) {
            props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.label);
    },
}));

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

    it('should_disable_all_buttons', () => {
        const disabledCount = (html.match(/disabled=""/g) || []).length;
        disabledCount.should.equal(2);
    });
});

