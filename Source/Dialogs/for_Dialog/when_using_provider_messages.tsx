// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog } from '../Dialog';

/**
 * Precedence coverage for the `dialog` provider message group shared by `Dialog`,
 * `CommandDialog`, and `StepperCommandDialog`: a named component prop (`okLabel`,
 * `cancelLabel`, `yesLabel`, `noLabel`, `closeAriaLabel`) wins, then the provider message,
 * then the English fallback. `CommandDialog`/`StepperCommandDialog` forward these props
 * straight through to this same `Dialog`, so wiring the precedence here covers every
 * dialog surface without duplicating the resolution logic per component.
 */
describe('when the Dialog uses provider messages', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (element: React.ReactElement) => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(element);
        });
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const buttonLabeled = (label: string) =>
        Array.from(document.querySelectorAll('button')).find(
            (button) => button.textContent === label,
        );

    it('should use the English fallback with no provider and no prop override', async () => {
        await render(
            <CratisComponentsProvider>
                <Dialog title='Confirm' buttons={DialogButtons.OkCancel}>
                    Body
                </Dialog>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Ok')).not.to.equal(undefined);
        expect(buttonLabeled('Cancel')).not.to.equal(undefined);
        expect(document.querySelector('[data-cratis-part="close"]')?.getAttribute(
            'aria-label',
        )).to.equal('Close');
    });

    it('should use the provider message when no prop override is given', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        dialog: {
                            ok: 'Provider Ok',
                            cancel: 'Provider Cancel',
                            close: 'Provider Close',
                        },
                    },
                }}
            >
                <Dialog title='Confirm' buttons={DialogButtons.OkCancel}>
                    Body
                </Dialog>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Provider Ok')).not.to.equal(undefined);
        expect(buttonLabeled('Provider Cancel')).not.to.equal(undefined);
        expect(document.querySelector('[data-cratis-part="close"]')?.getAttribute(
            'aria-label',
        )).to.equal('Provider Close');
    });

    it('should prefer a named prop override over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dialog: { ok: 'Provider Ok' } } }}
            >
                <Dialog
                    title='Confirm'
                    buttons={DialogButtons.OkCancel}
                    okLabel='Explicit Ok'
                >
                    Body
                </Dialog>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Explicit Ok')).not.to.equal(undefined);
        expect(buttonLabeled('Provider Ok')).to.equal(undefined);
    });

    it('should resolve Yes/No labels through the same precedence', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dialog: { yes: 'Provider Yes', no: 'Provider No' } } }}
            >
                <Dialog title='Confirm' buttons={DialogButtons.YesNo}>
                    Body
                </Dialog>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Provider Yes')).not.to.equal(undefined);
        expect(buttonLabeled('Provider No')).not.to.equal(undefined);
    });
});
