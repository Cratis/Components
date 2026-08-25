// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Tag } from './Tag';
import { Badge } from './Badge';
import { Chip } from './Chip';
import { Skeleton } from './Skeleton';
import { Avatar } from './Avatar';
import { ProgressBar } from './ProgressBar';
import { Message } from './Message';
import { ProgressSpinner } from './ProgressSpinner';

const meta = {
    title: 'Display/Overview',
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
        <span style={{ width: '8rem', color: 'var(--cratis-text-color-secondary)' }}>{label}</span>
        {children}
    </div>
);

/** All status & display components at a glance. */
export const Overview: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '640px' }}>
            <Row label="Tag">
                <Tag value="Registered" severity="success" />
                <Tag value="Pending" severity="warn" />
                <Tag value="Rejected" severity="danger" />
                <Tag value="Draft" severity="secondary" rounded />
            </Row>
            <Row label="Badge">
                <Badge value={8} severity="info" />
                <Badge value={99} severity="danger" />
                <Badge value="NEW" severity="success" />
            </Row>
            <Row label="Chip">
                <Chip label="Design" />
                <Chip label="Removable" removable onRemove={fn()} />
                <Chip label="With icon" icon={<span aria-hidden='true'>◆</span>} />
            </Row>
            <Row label="Avatar">
                <Avatar label="JD" />
                <Avatar icon={<span aria-hidden='true'>◆</span>} size="large" />
            </Row>
            <Row label="ProgressBar">
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <ProgressBar value={65} />
                </div>
            </Row>
            <Row label="Message">
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Message severity="info" text="An informational notice." />
                    <Message severity="warn" text="Something needs attention." />
                    <Message severity="error">Something went wrong.</Message>
                </div>
            </Row>
            <Row label="ProgressSpinner">
                <ProgressSpinner style={{ width: '2rem', height: '2rem' }} />
            </Row>
            <Row label="ProgressBar (indeterminate)">
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <ProgressBar mode="indeterminate" />
                </div>
            </Row>
            <Row label="Skeleton">
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Skeleton width="100%" height="1rem" />
                    <Skeleton width="70%" height="1rem" />
                </div>
                <Skeleton circle height="3rem" />
            </Row>
        </div>
    ),
};
