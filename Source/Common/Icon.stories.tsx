// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { FaHouse, FaRocket } from 'react-icons/fa6';
import { IconDisplay } from './Icon';

const meta: Meta<typeof IconDisplay> = {
    title: 'Common/IconDisplay',
    component: IconDisplay,
    parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof IconDisplay>;

/** Renders a consumer-owned CSS class without inferring an icon provider. */
export const StringIcon: Story = {
    render: () => (
        <>
            <style>{'.story-product-home::before { content: "⌂"; font-size: 1.5rem; }'}</style>
            <IconDisplay icon='story-product-home' />
        </>
    ),
};

/** Adds consumer layout classes to the `<i>` element used by string icons. */
export const StringIconWithExtraClass: Story = {
    render: () => (
        <>
            <style>{'.story-product-home::before { content: "⌂"; font-size: 1.5rem; }'}</style>
            <IconDisplay icon='story-product-home' className='text-3xl' />
        </>
    ),
};

/** Renders an icon-library React node directly without a wrapping `<i>`. */
export const ReactIconNode: Story = {
    render: () => <IconDisplay icon={<FaHouse aria-hidden='true' />} />,
};

/** Renders any React node, including product-owned SVG or content. */
export const ArbitraryReactNode: Story = {
    render: () => <IconDisplay icon={<FaRocket aria-hidden='true' />} />,
};

/** Shows the provider-owned CSS-class and React-node contracts side by side. */
export const StringVsReactNode: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <style>{'.story-product-home::before { content: "⌂"; font-size: 1.5rem; }'}</style>
            <div style={{ textAlign: 'center' }}>
                <IconDisplay icon='story-product-home' />
                <p>consumer CSS class</p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <IconDisplay icon={<FaHouse aria-hidden='true' />} />
                <p>React node</p>
            </div>
        </div>
    ),
};
