// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ChangeEvent, type InputHTMLAttributes, type ReactElement } from 'react';
import MuiCheckbox from '@mui/material/Checkbox';
import MuiRadio from '@mui/material/Radio';
import MuiSwitch from '@mui/material/Switch';
import type {
    CheckboxParts,
    CheckboxProps,
    RadioParts,
    RadioProps,
    SwitchParts,
    SwitchProps,
} from '@cratis/components/Common';
import {
    useResolvedMuiChoice,
    type ChoiceKind,
    type ChoiceParts,
    type ChoiceProps,
    type ChoiceStateAttributes,
    type MuiChoiceProps,
    type NativeInputSlotProps,
    type ResolvedMuiChoice,
} from './choiceState.js';
import { classNames } from './shared.js';

interface ChoiceControlProps {
    readonly checked: boolean | undefined;
    readonly defaultChecked: boolean | undefined;
    readonly disabled: boolean | undefined;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly input: NativeInputSlotProps;
    readonly parts: ChoiceParts | undefined;
    readonly attributes: ChoiceStateAttributes;
}

interface MuiChoiceControlProps extends ChoiceControlProps {
    readonly kind: ChoiceKind;
}

/** A part's attributes merged with the adapter's class, part name and state attributes. */
const partProps = (
    part: { className?: string } | undefined,
    baseClassName: string,
    partName: string,
    attributes: ChoiceStateAttributes,
) => ({
    ...part,
    className: classNames(baseClassName, part?.className),
    'data-cratis-part': partName,
    ...attributes,
});

const choiceIndicator = (
    kind: 'checkbox' | 'radio',
    parts: CheckboxParts | RadioParts | undefined,
    attributes: ChoiceStateAttributes,
    selected: boolean,
) => (
    <span
        {...parts?.indicator}
        className={classNames(
            `cratis-mui-${kind}__indicator`,
            parts?.indicator?.className,
        )}
        data-cratis-part='indicator'
        aria-hidden='true'
        {...attributes}
    >
        {kind === 'checkbox' && selected ? '✓' : undefined}
    </span>
);

const uncontrolledDefault = ({ checked, defaultChecked }: ChoiceControlProps) =>
    checked === undefined ? defaultChecked : undefined;

const renderSwitchControl = (control: ChoiceControlProps) => {
    const { checked, disabled, onChange, input, attributes } = control;
    const parts = control.parts as SwitchParts | undefined;
    return (
        <MuiSwitch
            checked={checked}
            defaultChecked={uncontrolledDefault(control)}
            disabled={disabled}
            onChange={onChange}
            slotProps={{
                root: partProps(parts?.control, 'cratis-mui-switch__control', 'control', attributes),
                input,
                thumb: partProps(parts?.handle, 'cratis-mui-switch__handle', 'handle', attributes),
            }}
        />
    );
};

const renderRadioControl = (control: ChoiceControlProps) => {
    const { checked, disabled, onChange, input, attributes } = control;
    const parts = control.parts as RadioParts | undefined;
    return (
        <MuiRadio
            checked={checked}
            defaultChecked={uncontrolledDefault(control)}
            disabled={disabled}
            onChange={onChange}
            icon={choiceIndicator('radio', parts, attributes, false)}
            checkedIcon={choiceIndicator('radio', parts, attributes, true)}
            slotProps={{
                root: partProps(parts?.box, 'cratis-mui-radio__box', 'box', attributes),
                input,
            }}
        />
    );
};

const renderCheckboxControl = (control: ChoiceControlProps) => {
    const { checked, disabled, onChange, input, attributes } = control;
    const parts = control.parts as CheckboxParts | undefined;
    return (
        <MuiCheckbox
            checked={checked}
            defaultChecked={uncontrolledDefault(control)}
            disabled={disabled}
            onChange={onChange}
            icon={choiceIndicator('checkbox', parts, attributes, false)}
            checkedIcon={choiceIndicator('checkbox', parts, attributes, true)}
            slotProps={{
                root: partProps(parts?.box, 'cratis-mui-checkbox__box', 'box', attributes),
                input,
            }}
        />
    );
};

const controlRenderers: Readonly<
    Record<ChoiceKind, (control: ChoiceControlProps) => ReactElement>
> = {
    switch: renderSwitchControl,
    radio: renderRadioControl,
    checkbox: renderCheckboxControl,
};

const MuiChoiceControl = ({ kind, ...control }: MuiChoiceControlProps) => {
    const renderControl = controlRenderers[kind];
    if (!renderControl) throw new Error(`Unsupported choice kind '${String(kind)}'.`);
    return renderControl(control);
};

/** The consumer props that are not consumed by the choice itself and flow to the native input. */
const splitChoiceProps = (props: ChoiceProps) => {
    const {
        label,
        readOnly: _readOnly,
        invalid: _invalid,
        onChange,
        className,
        style,
        pt: _parts,
        checked: _checked,
        defaultChecked: _defaultChecked,
        disabled: _disabled,
        onClick,
        'aria-invalid': _ariaInvalid,
        ...nativeProps
    } = props;
    return { label, onChange, className, style, onClick, nativeProps };
};

/** The input part attributes that are handled explicitly; the rest flow to the native input. */
const splitInputPart = (inputPart: InputHTMLAttributes<HTMLInputElement> | undefined) => {
    const {
        onClick,
        onChange,
        className,
        style,
        readOnly: _partReadOnly,
        checked: _partChecked,
        defaultChecked: _partDefaultChecked,
        disabled: _partDisabled,
        ...rest
    } = inputPart ?? {};
    return { onClick, onChange, className, style, rest };
};

type NativeChoiceProps = ReturnType<typeof splitChoiceProps>['nativeProps'];

const choiceIdentity = (kind: ChoiceKind, props: ChoiceProps, nativeProps: NativeChoiceProps) => {
    const radioProps = props as RadioProps;
    const isRadio = kind === 'radio';
    return {
        name: isRadio ? radioProps.name : nativeProps.name,
        value: isRadio ? radioProps.value : nativeProps.value,
    };
};

interface ChoiceInputOptions {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly resolved: ResolvedMuiChoice;
}

const choiceInputProps = ({ kind, props, resolved }: ChoiceInputOptions): NativeInputSlotProps => {
    const { inputPart, ariaInvalid, readOnly, state, attributes } = resolved;
    const { onClick, nativeProps } = splitChoiceProps(props);
    const part = splitInputPart(inputPart);
    return {
        ...part.rest,
        ...nativeProps,
        ref: state.ref,
        ...choiceIdentity(kind, props, nativeProps),
        'aria-invalid': ariaInvalid,
        'aria-readonly': kind === 'radio' ? undefined : readOnly || undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-mui-choice__input', part.className),
        style: part.style,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            part.onClick?.(event);
            onClick?.(event);
            if (readOnly) event.preventDefault();
        },
    };
};

const choiceChangeHandler =
    ({ kind, props, resolved }: ChoiceInputOptions) =>
    (event: ChangeEvent<HTMLInputElement>) => {
        const { state, readOnly } = resolved;
        splitInputPart(resolved.inputPart).onChange?.(event);
        if (readOnly || (kind === 'radio' && !event.currentTarget.checked)) return;
        state.synchronize(event.currentTarget.checked);
        splitChoiceProps(props).onChange?.(event.currentTarget.checked, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

const choiceLabel = (
    label: ChoiceProps['label'],
    parts: ChoiceParts | undefined,
    attributes: ChoiceStateAttributes,
) =>
    label !== undefined && (
        <span
            {...parts?.label}
            className={classNames('cratis-mui-choice__label', parts?.label?.className)}
            data-cratis-part='label'
            {...attributes}
        >
            {label}
        </span>
    );

const MuiChoice = ({ kind, props, forwardedRef }: MuiChoiceProps) => {
    const resolved = useResolvedMuiChoice(kind, props, forwardedRef);
    const { parts, checked, defaultChecked, disabled, attributes } = resolved;
    const { label, className, style } = splitChoiceProps(props);
    const options = { kind, props, resolved };
    return (
        <label
            {...parts?.root}
            className={classNames('cratis-mui-choice', parts?.root?.className, className)}
            style={{ ...parts?.root?.style, ...style }}
            data-cratis-part='root'
            {...attributes}
        >
            <MuiChoiceControl
                kind={kind}
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                onChange={choiceChangeHandler(options)}
                input={choiceInputProps(options)}
                parts={parts}
                attributes={attributes}
            />
            {choiceLabel(label, parts, attributes)}
        </label>
    );
};

export const MuiCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function MuiCheckboxSlot(props, ref) {
        return <MuiChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

export const MuiRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function MuiRadioSlot(props, ref) {
        return <MuiChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

export const MuiSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function MuiSwitchSlot(props, ref) {
        return <MuiChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);
