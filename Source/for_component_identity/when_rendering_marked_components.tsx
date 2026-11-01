// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Breadcrumbs } from '../Common/Breadcrumbs';
import { Button } from '../Common/Button';
import { IconButton } from '../Common/IconButton';
import { Page } from '../Common/Page';
import { TextArea } from '../Common/TextArea';
import { TextInput } from '../Common/TextInput';
import { Avatar } from '../Display/Avatar';
import { Badge } from '../Display/Badge';
import { ProgressSpinner } from '../Display/ProgressSpinner';
import { Skeleton } from '../Display/Skeleton';
import { Tag } from '../Display/Tag';

const examples: Record<string, React.ReactElement> = {
    Button: <Button label='Example' />,
    IconButton: <IconButton icon='*' aria-label='Example' />,
    TextInput: <TextInput aria-label='Example' />,
    TextArea: <TextArea aria-label='Example' />,
    Page: <Page title='Example page' />,
    Badge: <Badge value='3' />,
    Tag: <Tag value='Example' />,
    Avatar: <Avatar label='EX' />,
    ProgressSpinner: <ProgressSpinner />,
    Skeleton: <Skeleton />,
    Breadcrumbs: <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Example' }]} />,
};

describe('when rendering marked components', () => {
    const render = async (element: React.ReactElement) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () => root.render(element));
        return { container, dispose: async () => { await act(async () => root.unmount()); container.remove(); } };
    };

    for (const [name, element] of Object.entries(examples)) {
        it(`should mark the ${name} root with its component name`, async () => {
            const mounted = await render(element);
            mounted.container.querySelectorAll(`[data-cratis-component="${name}"]`).length.should.equal(1);
            await mounted.dispose();
        });
    }

    it('should carry the consumer id on the marker', async () => {
        const mounted = await render(<Button id='save' label='Save' />);
        mounted.container.querySelector('[data-cratis-component="Button"]')!
            .getAttribute('data-cratis-component-id')!.should.equal('save');
        await mounted.dispose();
    });

    it('should fall back to the name for a field', async () => {
        const mounted = await render(<TextInput name='email' />);
        mounted.container.querySelector('[data-cratis-component="TextInput"]')!
            .getAttribute('data-cratis-component-id')!.should.equal('email');
        await mounted.dispose();
    });

    it('should not render an id attribute when there is none', async () => {
        const mounted = await render(<Button label='Save' />);
        expect(
            mounted.container.querySelector('[data-cratis-component="Button"]')!.hasAttribute('data-cratis-component-id'),
        ).to.equal(false);
        await mounted.dispose();
    });
});
