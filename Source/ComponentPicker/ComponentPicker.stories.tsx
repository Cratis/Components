// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../Common/Button';
import { Page } from '../Common/Page';
import { TextInput } from '../Common/TextInput';
import { Dialog } from '../Dialogs/Dialog';
import type { PresentationChange } from '../configuration/identity/PresentationChange';
import { ComponentHighlight } from './ComponentHighlight';
import { ComponentPicker } from './ComponentPicker';
import type { PickedComponent } from './PickedComponent';
import { PresentationPropertyEditor } from './PresentationPropertyEditor';
import { useComponentPicker } from './useComponentPicker';

const meta: Meta<typeof ComponentPicker> = {
    title: 'ComponentPicker/ComponentPicker',
    component: ComponentPicker,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ComponentPicker>;

const summary = (picked: PickedComponent) =>
    JSON.stringify(
        {
            component: picked.component,
            id: picked.id,
            part: picked.part,
            ancestors: picked.ancestors.map((ancestor) => ancestor.component),
            context: picked.context,
            properties: picked.presentationProperties.map((property) => `${property.name}=${String(property.value)}`),
        },
        null,
        2,
    );

const ExampleScreen = () => {
    const { start, picker, isPicking } = useComponentPicker({
        resolve: () => ({ screen: 'example-screen' }),
    });
    const [picked, setPicked] = useState<PickedComponent | null>(null);

    return (
        <Page title='Example screen' showTitle id='example-screen'>
            <div className='cratis:flex cratis:gap-2 cratis:items-center'>
                <Button id='save' label='Save' tooltip='Saves the example' />
                <Button id='discard' label='Discard' variant='outline' />
                <TextInput name='email' placeholder='Email address' aria-label='Email address' />
            </div>
            <div className='cratis:mt-4'>
                <Button
                    label={isPicking ? 'Picking…' : 'Pick a component'}
                    variant='ghost'
                    onClick={async () => setPicked(await start())}
                />
            </div>
            {picked && <pre data-testid='picked'>{summary(picked)}</pre>}
            <ComponentHighlight target={picked} />
            {picker}
        </Page>
    );
};

/**
 * Click Pick a component, then point at anything on the screen. The component under the pointer is
 * outlined and named; click or press Enter to confirm, Escape to cancel. Arrow Up and Down move
 * to the enclosing and first child component, Arrow Left and Right to the neighbours. The picked
 * component is kept outlined by a passive `ComponentHighlight`.
 */
export const Default: Story = {
    render: () => <ExampleScreen />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /pick a component/i }));
        await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}');
        await expect(await canvas.findByTestId('picked')).toBeTruthy();
    },
};

const DialogScreen = () => {
    const { start, picker } = useComponentPicker();
    const [picked, setPicked] = useState<PickedComponent | null>(null);
    return (
        <>
            <Dialog title='Example dialog' dismissable>
                <div className='cratis:flex cratis:gap-2'>
                    <Button id='inside' label='Inside the dialog' />
                    <Button label='Pick a component' variant='ghost' onClick={async () => setPicked(await start())} />
                </div>
                {picked && <pre data-testid='picked'>{summary(picked)}</pre>}
            </Dialog>
            {picker}
        </>
    );
};

/** Picking works inside an open dialog: the overlay stacks above it, and Escape cancels the pick without closing the dialog. */
export const InsideADialog: Story = {
    render: () => <DialogScreen />,
};

const EditorScreen = () => {
    const [picked, setPicked] = useState<PickedComponent | null>(null);
    const [changes, setChanges] = useState<PresentationChange[]>([]);
    const { start, picker } = useComponentPicker();
    return (
        <div className='cratis:flex cratis:flex-col cratis:gap-4'>
            <div className='cratis:flex cratis:gap-2'>
                <Button id='save' label='Save' />
                <Button label='Pick a button' variant='ghost' onClick={async () => setPicked(await start())} />
            </div>
            {picked && (
                <>
                    <PresentationPropertyEditor picked={picked} onChange={setChanges} preview />
                    <pre data-testid='changes'>{JSON.stringify(changes, null, 2)}</pre>
                </>
            )}
            {picker}
        </div>
    );
};

/**
 * Pick the Save button, then edit its properties. The editor reports the proposed changes as
 * `{ property, from, to }` and shows them live on the page. Nothing is applied for good; the
 * button returns to how it was when the editor goes away.
 */
export const WithPropertyEditor: Story = {
    render: () => <EditorScreen />,
};
