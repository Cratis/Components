// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import {
    Checkbox as PrimeCheckbox,
    type CheckboxPassThroughOptions,
} from 'primereact/checkbox/checkbox.cjs.js';
import { InputSwitch as PrimeInputSwitch } from 'primereact/inputswitch/inputswitch.cjs.js';
import {
    RadioButton as PrimeRadioButton,
    type RadioButtonPassThroughOptions,
} from 'primereact/radiobutton/radiobutton.cjs.js';
import type {
    CheckboxParts,
    RadioParts,
    RadioProps,
    SwitchParts,
} from '@cratis/components/Common';
import type { stateAttributes } from './choiceState.js';
import type {
    ChoiceKind,
    ChoiceParts,
    ChoiceProps,
    InputPart,
    PrimeBooleanChangeEvent,
} from './choiceTypes.js';
import { classNames } from './shared.js';

export interface ChoiceControlContext {
    readonly props: ChoiceProps;
    readonly parts: ChoiceParts | undefined;
    readonly selected: boolean;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly invalid: boolean;
    readonly input: InputPart;
    readonly inputId: string | undefined;
    readonly inputRef: (input: HTMLInputElement | null) => void;
    readonly attributes: ReturnType<typeof stateAttributes>;
    readonly changed: (event: PrimeBooleanChangeEvent) => void;
}

const checkboxControl = ({
    props,
    parts,
    selected,
    disabled,
    readOnly,
    invalid,
    input,
    inputId,
    inputRef,
    attributes,
    changed,
}: ChoiceControlContext) => {
    const checkboxParts = parts as CheckboxParts | undefined;
    // SAFETY: PrimeReact 10 renders the verified checkbox box and indicator destinations as
    // native div/SVG elements. Portable part values contain only shared DOM attributes.
    const passThrough = {
        input,
        box: {
            ...checkboxParts?.box,
            'data-cratis-part': 'box',
            ...attributes,
        },
    } as unknown as CheckboxPassThroughOptions;
    const indicator = (
        <span
            {...checkboxParts?.indicator}
            className={classNames('p-checkbox-icon', checkboxParts?.indicator?.className)}
            data-cratis-part='indicator'
            aria-hidden='true'
            hidden={!selected}
            {...attributes}
        >
            {selected ? '✓' : undefined}
        </span>
    );
    return (
        <>
            <PrimeCheckbox
                checked={selected}
                disabled={disabled}
                readOnly={readOnly}
                required={props.required}
                invalid={invalid}
                name={props.name}
                value={props.value}
                inputId={inputId}
                inputRef={inputRef}
                aria-label={props['aria-label']}
                aria-labelledby={props['aria-labelledby']}
                onChange={changed}
                icon={indicator}
                pt={passThrough}
            />
            {selected ? null : indicator}
        </>
    );
};

const radioControl = ({
    props,
    parts,
    selected,
    disabled,
    readOnly,
    invalid,
    input,
    inputId,
    inputRef,
    attributes,
    changed,
}: ChoiceControlContext) => {
    const radio = props as RadioProps;
    const radioParts = parts as RadioParts | undefined;
    // SAFETY: PrimeReact 10 renders the verified radio box and indicator destinations as native
    // div elements. Portable part values contain only attributes valid on those destinations.
    const passThrough = {
        input,
        box: {
            ...radioParts?.box,
            'data-cratis-part': 'box',
            ...attributes,
        },
        icon: {
            ...radioParts?.indicator,
            'data-cratis-part': 'indicator',
            'aria-hidden': true,
            ...attributes,
        },
    } as unknown as RadioButtonPassThroughOptions;
    return (
        <PrimeRadioButton
            checked={selected}
            disabled={disabled}
            readOnly={readOnly}
            required={props.required}
            invalid={invalid}
            name={radio.name}
            value={radio.value}
            inputId={inputId}
            inputRef={inputRef}
            aria-label={props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            onChange={changed}
            pt={passThrough}
        />
    );
};

const switchControl = ({
    props,
    parts,
    selected,
    disabled,
    input,
    inputId,
    inputRef,
    attributes,
    changed,
}: ChoiceControlContext) => {
    const switchParts = parts as SwitchParts | undefined;
    return (
        <PrimeInputSwitch
            checked={selected}
            disabled={disabled}
            name={props.name}
            inputId={inputId}
            inputRef={inputRef}
            aria-label={props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            onChange={changed}
            pt={{
                root: {
                    role: 'presentation',
                    'aria-checked': undefined,
                    'aria-label': undefined,
                    'aria-labelledby': undefined,
                },
                input,
                slider: {
                    ...switchParts?.control,
                    'data-cratis-part': 'control',
                    ...attributes,
                    children: (
                        <span
                            {...switchParts?.handle}
                            data-cratis-part='handle'
                            aria-hidden='true'
                            {...attributes}
                        />
                    ),
                },
            }}
        />
    );
};

export const controlRenderers: Readonly<
    Record<ChoiceKind, (context: ChoiceControlContext) => ReactNode>
> = {
    checkbox: checkboxControl,
    radio: radioControl,
    switch: switchControl,
};
