// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import {
    CratisComponentsProvider,
    useCratisComponentsConfig,
} from './CratisComponentsProvider';

const MessageProbe = () => {
    const config = useCratisComponentsConfig();
    return (
        <dl>
            <dt>Locale</dt>
            <dd>{config.locale}</dd>
            <dt>Paginator next</dt>
            <dd>{config.messages?.paginator?.next}</dd>
            <dt>Open calendar</dt>
            <dd>{config.messages?.datePicker?.openCalendar}</dd>
        </dl>
    );
};

const meta = {
    title: 'Common/CratisComponentsProvider',
    component: CratisComponentsProvider,
    args: {
        value: {
            locale: 'nb-NO',
            messages: {
                paginator: { next: 'Neste side' },
                datePicker: { openCalendar: 'Åpne kalender' },
            },
        },
        children: <MessageProbe />,
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof CratisComponentsProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LocalizedMessages: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('nb-NO')).toBeTruthy();
        await expect(canvas.getByText('Neste side')).toBeTruthy();
        await expect(canvas.getByText('Åpne kalender')).toBeTruthy();
    },
};
