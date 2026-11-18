// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { CratisComponentsProvider } from '@cratis/components';
import {
    Button,
    Checkbox,
    IconButton,
    Radio,
    Surface,
    Switch,
    TextArea,
    TextInput,
} from '@cratis/components/Common';
import { ProgressBar } from '@cratis/components/Display';
import { designsystemetUiLibrary } from '../src/index.js';

export type ColorScheme = 'light' | 'dark';
export type SizeMode = 'sm' | 'md' | 'lg';

export interface SlotGalleryProps {
    readonly colorScheme: ColorScheme;
    readonly size: SizeMode;
    readonly onActivate?: (name: string) => void;
}

const galleryStyle = {
    width: 720,
    padding: 16,
    boxSizing: 'border-box',
    display: 'grid',
    gap: 12,
    backgroundColor: 'var(--ds-color-neutral-background-default)',
    color: 'var(--ds-color-neutral-text-default)',
} as const;

const rowStyle = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 } as const;

const Row = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
    <section aria-label={title} style={rowStyle}>
        {children}
    </section>
);

const Buttons = ({ onActivate }: Pick<SlotGalleryProps, 'onActivate'>) => (
    <>
        <Row title='Button variants'>
            <Button label='Solid' onClick={() => onActivate?.('Solid')} />
            <Button label='Outline' variant='outline' />
            <Button label='Ghost' variant='ghost' />
            <Button label='Link' variant='link' />
            <Button label='Disabled' disabled />
            <Button label='Loading' loading />
        </Row>
        <Row title='Button tones'>
            <Button label='Accent' tone='accent' />
            <Button label='Positive' tone='positive' />
            <Button label='Caution' tone='caution' />
            <Button label='Critical' tone='critical' />
        </Row>
        <Row title='Button sizes'>
            <Button label='Small' size='small' />
            <Button label='Normal' size='normal' />
            <Button label='Large' size='large' />
            <IconButton icon={<span aria-hidden='true'>+</span>} aria-label='Add item' onClick={() => onActivate?.('Add item')} />
        </Row>
    </>
);

const Fields = () => (
    <>
        <Row title='Text fields'>
            <label htmlFor='gallery-name'>Name</label>
            <TextInput id='gallery-name' defaultValue='Ada' />
            <label htmlFor='gallery-disabled'>Disabled</label>
            <TextInput id='gallery-disabled' defaultValue='Locked' disabled />
            <label htmlFor='gallery-invalid'>Invalid</label>
            <TextInput id='gallery-invalid' defaultValue='Wrong' invalid />
        </Row>
        <Row title='Text area'>
            <label htmlFor='gallery-notes'>Notes</label>
            <TextArea id='gallery-notes' defaultValue='Some notes' rows={2} />
        </Row>
    </>
);

const Choices = ({ onActivate }: Pick<SlotGalleryProps, 'onActivate'>) => (
    <>
        <Row title='Checkboxes'>
            <Checkbox label='Include archived' name='archived' onChange={() => onActivate?.('Include archived')} />
            <Checkbox label='Selected' name='selected' defaultChecked />
            <Checkbox label='Disabled' name='disabled' disabled />
            <Checkbox label='Invalid' name='invalid' invalid />
        </Row>
        <div role='radiogroup' aria-label='Frequency' style={rowStyle}>
            <Radio label='Daily' name='frequency' value='daily' defaultChecked />
            <Radio label='Weekly' name='frequency' value='weekly' />
            <Radio label='Monthly' name='frequency' value='monthly' disabled />
        </div>
        <Row title='Switches'>
            <Switch label='Notifications' name='notifications' onChange={() => onActivate?.('Notifications')} />
            <Switch label='Enabled' name='enabled' defaultChecked />
            <Switch label='Disabled' name='switch-disabled' disabled />
        </Row>
    </>
);

const Display = () => (
    <>
        <Row title='Progress'>
            <ProgressBar value={65} aria-label='Upload progress' />
            <ProgressBar mode='indeterminate' aria-label='Working' />
        </Row>
        <Surface as='article' aria-label='Summary'>
            <p style={{ margin: 0 }}>Surface content</p>
        </Surface>
    </>
);

/** One fixture rendering every Designsystemet slot through the public Cratis components. */
export const SlotGallery = ({ colorScheme, size, onActivate }: SlotGalleryProps) => (
    <CratisComponentsProvider library={designsystemetUiLibrary} libraryMode='strict'>
        <div
            id='slot-gallery'
            data-color-scheme={colorScheme}
            data-size={size === 'md' ? undefined : size}
            style={galleryStyle}
        >
            <Buttons onActivate={onActivate} />
            <Fields />
            <Choices onActivate={onActivate} />
            <Display />
        </div>
    </CratisComponentsProvider>
);
