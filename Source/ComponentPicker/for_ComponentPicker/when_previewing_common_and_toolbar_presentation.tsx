// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { Breadcrumbs } from '../../Common/Breadcrumbs';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Message } from '../../Display/Message';
import { Toolbar } from '../../Toolbar/Toolbar';
import { previewPresentationChanges } from '../../configuration/identity/componentInstances';
import { mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const key = async (element: Element, name: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    });
};

describe('when previewing common and toolbar presentation details', () => {
    let screen: ScreenInTheDom;

    afterEach(async () => { await unmountScreen(screen); });

    it('should preserve opted-out live regions and hidden icons when previewing message severity', async () => {
        screen = await mountScreen(<Message severity='error' live={false} icon={false}><strong>Example status</strong></Message>);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Message"]')!;
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [{ property: 'severity', from: 'error', to: 'info' }]);
        });
        element.dataset.severity!.should.equal('info');
        [element.getAttribute('role'), element.querySelector('[data-cratis-part="icon"]')].should.deep.equal([null, null]);
        element.querySelector('strong')!.textContent!.should.equal('Example status');
        await act(async () => revert());
        element.dataset.severity!.should.equal('error');
        [element.getAttribute('role')].should.deep.equal([null]);
    });

    it('should preserve breadcrumb content and destinations when previewing the landmark name', async () => {
        screen = await mountScreen(<Breadcrumbs aria-label='Example trail' separator={<span>›</span>} items={[
            { label: <strong>Example Project</strong>, href: 'https://example.invalid/project' },
            { label: 'Example page' },
        ]} />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Breadcrumbs"]')!;
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [{ property: 'aria-label', from: 'Example trail', to: 'Preview trail' }]);
        });
        element.parentElement!.getAttribute('aria-label')!.should.equal('Preview trail');
        element.querySelector('a')!.getAttribute('href')!.should.equal('https://example.invalid/project');
        element.querySelector('strong')!.textContent!.should.equal('Example Project');
        element.querySelector('[aria-current="page"]')!.textContent!.should.equal('Example page');
        element.querySelector('[data-cratis-part="separator"]')!.textContent!.should.equal('›');
        await act(async () => revert());
        element.parentElement!.getAttribute('aria-label')!.should.equal('Example trail');
    });

    it('should restore the provider toolbar name after reverting a label preview', async () => {
        screen = await mountScreen(
            <CratisComponentsProvider value={{ messages: { toolbar: { label: 'Example tools' } } }}>
                <Toolbar><button>Example tool</button></Toolbar>
                <Toolbar aria-labelledby='example-heading'><button>Another tool</button></Toolbar>
            </CratisComponentsProvider>,
        );
        const elements = screen.container.querySelectorAll<HTMLElement>('[data-cratis-component="Toolbar"]');
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(elements[0], [{ property: 'aria-label', from: undefined, to: 'Preview tools' }]);
            previewPresentationChanges(elements[1], [{ property: 'aria-label', from: undefined, to: 'Preview tools' }]);
        });
        elements[0].getAttribute('aria-label')!.should.equal('Preview tools');
        [elements[1].getAttribute('aria-label')].should.deep.equal([null]);
        elements[1].getAttribute('aria-labelledby')!.should.equal('example-heading');
        await act(async () => revert());
        elements[0].getAttribute('aria-label')!.should.equal('Example tools');
    });

    it('should keep toolbar keyboard navigation aligned with the previewed orientation', async () => {
        screen = await mountScreen(<Toolbar><button>First tool</button><button>Second tool</button></Toolbar>);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Toolbar"]')!;
        const [first, second] = element.querySelectorAll('button');
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [{ property: 'orientation', from: undefined, to: 'horizontal' }]);
            first.focus();
        });
        await key(first, 'ArrowRight');
        (document.activeElement === second).should.equal(true);
        await act(async () => { revert(); first.focus(); });
        await key(first, 'ArrowDown');
        (document.activeElement === second).should.equal(true);
    });
});
