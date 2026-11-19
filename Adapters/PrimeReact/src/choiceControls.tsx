// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { Checkbox as PrimeCheckbox } from '@primereact/ui/checkbox';
import { RadioButton as PrimeRadioButton } from '@primereact/ui/radiobutton';
import { ToggleSwitch as PrimeToggleSwitch } from '@primereact/ui/toggleswitch';
import type {
    CheckboxParts,
    RadioParts,
    RadioProps,
    SwitchParts,
} from '@cratis/components/Common';
import type { stateAttributes } from './choiceState.js';
import type { ChoiceChange, ChoiceKind, ChoiceParts, ChoiceProps, InputPartWithRef } from './choiceTypes.js';

export interface ChoiceControlContext {
    readonly props: ChoiceProps;
    readonly parts: ChoiceParts | undefined;
    readonly selected: boolean;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly invalid: boolean;
    readonly input: InputPartWithRef;
    readonly attributes: ReturnType<typeof stateAttributes>;
    readonly changed: (event: ChoiceChange) => void;
}

const checkboxControl = ({
    props,
    parts,
    selected,
    disabled,
    readOnly,
    invalid,
    input,
    attributes,
    changed,
}: ChoiceControlContext) => (
    <PrimeCheckbox.Root
        checked={selected}
        disabled={disabled}
        readOnly={readOnly}
        required={props.required}
        invalid={invalid}
        name={props.name}
        value={props.value}
        ariaLabel={props['aria-label']}
        ariaLabelledby={props['aria-labelledby']}
        onCheckedChange={changed}
        pt={{ input }}
    >
        <PrimeCheckbox.Box
            {...(parts as CheckboxParts | undefined)?.box}
            as='span'
            data-cratis-part='box'
            {...attributes}
        >
            <PrimeCheckbox.Indicator
                {...(parts as CheckboxParts | undefined)?.indicator}
                data-cratis-part='indicator'
                aria-hidden='true'
                {...attributes}
            >
                {selected ? '✓' : undefined}
            </PrimeCheckbox.Indicator>
        </PrimeCheckbox.Box>
    </PrimeCheckbox.Root>
);

const radioControl = ({
    props,
    parts,
    selected,
    disabled,
    readOnly,
    invalid,
    input,
    attributes,
    changed,
}: ChoiceControlContext) => (
    <PrimeRadioButton.Root
        checked={selected}
        disabled={disabled}
        readOnly={readOnly}
        required={props.required}
        invalid={invalid}
        name={(props as RadioProps).name}
        value={(props as RadioProps).value}
        ariaLabel={props['aria-label']}
        ariaLabelledby={props['aria-labelledby']}
        onCheckedChange={changed}
        pt={{ input }}
    >
        <PrimeRadioButton.Box
            {...(parts as RadioParts | undefined)?.box}
            as='span'
            data-cratis-part='box'
            {...attributes}
        >
            <PrimeRadioButton.Indicator
                {...(parts as RadioParts | undefined)?.indicator}
                as='span'
                data-cratis-part='indicator'
                aria-hidden='true'
                {...attributes}
            />
        </PrimeRadioButton.Box>
    </PrimeRadioButton.Root>
);

const switchControl = ({
    props,
    parts,
    selected,
    disabled,
    invalid,
    input,
    attributes,
    changed,
}: ChoiceControlContext) => (
    <PrimeToggleSwitch.Root
        checked={selected}
        disabled={disabled}
        required={props.required}
        invalid={invalid}
        ariaLabel={props['aria-label']}
        ariaLabelledby={props['aria-labelledby']}
        onCheckedChange={changed}
        pt={{ input }}
    >
        <PrimeToggleSwitch.Control
            {...(parts as SwitchParts | undefined)?.control}
            as='span'
            data-cratis-part='control'
            {...attributes}
        >
            <PrimeToggleSwitch.Handle
                {...(parts as SwitchParts | undefined)?.handle}
                as='span'
                data-cratis-part='handle'
                aria-hidden='true'
                {...attributes}
            />
        </PrimeToggleSwitch.Control>
    </PrimeToggleSwitch.Root>
);

export const controlRenderers: Readonly<
    Record<ChoiceKind, (context: ChoiceControlContext) => ReactNode>
> = {
    checkbox: checkboxControl,
    radio: radioControl,
    switch: switchControl,
};

