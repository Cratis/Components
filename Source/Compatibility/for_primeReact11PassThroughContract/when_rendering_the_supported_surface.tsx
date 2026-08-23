// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { parseColor } from '@primereact/headless/inputcolor';
import { expect } from 'chai';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { DatePicker } from 'primereact/datepicker';
import { InputColor } from 'primereact/inputcolor';
import { InputNumber } from 'primereact/inputnumber';
import { InputPassword } from 'primereact/inputpassword';
import { InputTags } from 'primereact/inputtags';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Rating } from 'primereact/rating';
import { Select } from 'primereact/select';
import { Slider } from 'primereact/slider';
import { Stepper } from 'primereact/stepper';
import { Textarea } from 'primereact/textarea';
import { Timeline } from 'primereact/timeline';
import { ToggleSwitch } from 'primereact/toggleswitch';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog as CratisDialog } from '../../Dialogs/Dialog';
import { assertPrimeReact11PassThroughCompatibility } from '../assertPrimeReact11PassThroughCompatibility';
import { primeReact11PassThroughSentinelPreset } from '../primeReact11PassThroughSentinelPreset';

const SupportedSurface = () => (
    <>
        <Button>Save</Button>
        <InputText value='Ada' readOnly />
        <Textarea value='Notes' readOnly />
        <InputNumber.Root value={44}>
            <InputNumber.Input />
        </InputNumber.Root>
        <Select.Root
            open
            value='ada'
            options={[{ label: 'Ada', value: 'ada' }]}
            optionLabel='label'
            optionValue='value'
        >
            <Select.Trigger>
                <Select.Value />
                <Select.Clear />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Portal>
                <Select.Positioner>
                    <Select.Popup>
                        <Select.Filter />
                        <Select.List />
                    </Select.Popup>
                </Select.Positioner>
            </Select.Portal>
        </Select.Root>
        <Checkbox.Root checked>
            <Checkbox.Box>
                <Checkbox.Indicator />
            </Checkbox.Box>
        </Checkbox.Root>
        <RadioButton.Root checked value='ada'>
            <RadioButton.Box>
                <RadioButton.Indicator />
            </RadioButton.Box>
        </RadioButton.Root>
        <DatePicker.Root value={new Date(2026, 7, 22, 12, 30)} open showTime>
            <DatePicker.Input as={InputText} />
            <DatePicker.Trigger>Open</DatePicker.Trigger>
            <DatePicker.Portal>
                <DatePicker.Positioner>
                    <DatePicker.Popup>
                        <DatePicker.Calendar>
                            <DatePicker.Header>
                                <DatePicker.Prev>Previous</DatePicker.Prev>
                                <DatePicker.Title>
                                    <DatePicker.SelectMonth />
                                    <DatePicker.SelectYear />
                                    <DatePicker.Decade />
                                </DatePicker.Title>
                                <DatePicker.Next>Next</DatePicker.Next>
                            </DatePicker.Header>
                            <DatePicker.Table>
                                <DatePicker.TableHead />
                                <DatePicker.TableBody />
                                <DatePicker.TableBody view='month' />
                                <DatePicker.TableBody view='year' />
                            </DatePicker.Table>
                        </DatePicker.Calendar>
                        <DatePicker.Time />
                    </DatePicker.Popup>
                </DatePicker.Positioner>
            </DatePicker.Portal>
        </DatePicker.Root>
        <Slider.Root value={44}>
            <Slider.Track>
                <Slider.Range />
            </Slider.Track>
            <Slider.Handle />
        </Slider.Root>
        <InputTags.Root value={['Ada']}>
            <InputTags.Items>
                {({ item, index, itemProps }) => (
                    <span {...itemProps} key={index}>
                        {item}
                    </span>
                )}
            </InputTags.Items>
            <InputTags.Control>
                {({ controlProps }) => <input {...controlProps} />}
            </InputTags.Control>
        </InputTags.Root>
        <InputColor.Root value={parseColor('#60a5fa')}>
            <InputColor.Area>
                <InputColor.AreaBackground />
                <InputColor.AreaHandle />
            </InputColor.Area>
            <InputColor.Slider>
                <InputColor.SliderTrack />
                <InputColor.SliderHandle />
            </InputColor.Slider>
            <InputColor.Swatch>
                <InputColor.SwatchBackground />
            </InputColor.Swatch>
        </InputColor.Root>
        <Timeline.Root>
            <Timeline.Event>
                <Timeline.Separator>
                    <Timeline.Marker />
                    <Timeline.Connector />
                </Timeline.Separator>
                <Timeline.Content>Event</Timeline.Content>
            </Timeline.Event>
        </Timeline.Root>
        <Rating.Root value={1}>
            <Rating.Option value={1} index={0}>
                <Rating.On>On</Rating.On>
                <Rating.Off>Off</Rating.Off>
            </Rating.Option>
        </Rating.Root>
        <ToggleSwitch.Root checked>
            <ToggleSwitch.Control>
                <ToggleSwitch.Handle />
            </ToggleSwitch.Control>
        </ToggleSwitch.Root>
        <InputPassword value='secret' readOnly />
        <CratisDialog title='Compatibility' unstyled>
            Content
        </CratisDialog>
        <DataTable.Root data={[{ name: 'Ada' }]}>
            <DataTable.TableContainer>
                <DataTable.Table>
                    <DataTable.THead>
                        <DataTable.THeadRow>
                            <DataTable.THeadCell>Name</DataTable.THeadCell>
                        </DataTable.THeadRow>
                    </DataTable.THead>
                    <DataTable.TBody>
                        {({ item, index }) => (
                            <DataTable.Row index={index}>
                                <DataTable.Cell>{item.name}</DataTable.Cell>
                            </DataTable.Row>
                        )}
                    </DataTable.TBody>
                </DataTable.Table>
            </DataTable.TableContainer>
        </DataTable.Root>
        <Stepper.Root value='contract'>
            <Stepper.List>
                <Stepper.Step value='contract'>
                    <Stepper.Header>
                        <Stepper.Number>1</Stepper.Number>
                        <Stepper.Title>Contract</Stepper.Title>
                    </Stepper.Header>
                    <Stepper.Separator />
                </Stepper.Step>
            </Stepper.List>
            <Stepper.Panels>
                <Stepper.Panel value='contract'>Panel</Stepper.Panel>
            </Stepper.Panels>
        </Stepper.Root>
    </>
);

describe('when rendering the supported PrimeReact 11 pass-through surface', () => {
    let root: Root;
    let container: HTMLDivElement;

    beforeEach(async () => {
        // SAFETY: Vitest's jsdom global exposes React's test-only act hook at runtime.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom may omit ResizeObserver, and PrimeReact only calls this standard observer shape.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };

        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider
                    value={{
                        unstyled: true,
                        pt: primeReact11PassThroughSentinelPreset,
                    }}
                >
                    <SupportedSurface />
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should honor every committed slot and structural marker', () => {
        expect(() => assertPrimeReact11PassThroughCompatibility(document)).not.to.throw();
    });
});
