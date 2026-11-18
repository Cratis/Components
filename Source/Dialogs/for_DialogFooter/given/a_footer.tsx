// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { DialogFooter, type DialogFooterProps } from '../../DialogFooter';

/** Default footer props: an OK/Cancel footer that is idle and valid. */
export const footerProps = (overrides: Partial<DialogFooterProps> = {}): DialogFooterProps => ({
    buttons: DialogButtons.OkCancel,
    labels: { ok: 'Ok', cancel: 'Cancel', yes: 'Yes', no: 'No', closeAria: 'Close', refused: 'Refused' },
    focus: { confirm: true, dismissing: false },
    isBusy: false,
    isValid: true,
    pt: undefined,
    confirmRef: createRef<HTMLButtonElement>(),
    cancelRef: createRef<HTMLButtonElement>(),
    onResult: () => undefined,
    ...overrides,
});

/** Renders the footer to static markup and returns the markup of the button row. */
export const renderFooter = (overrides: Partial<DialogFooterProps> = {}): string =>
    renderToStaticMarkup(<DialogFooter {...footerProps(overrides)} />);
