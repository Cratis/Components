// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ChangeEvent } from 'react';
import MuiCheckbox from '@mui/material/Checkbox';
import MuiRadio from '@mui/material/Radio';
import MuiSwitch from '@mui/material/Switch';
import type { CheckboxParts, CheckboxProps, RadioParts, RadioProps, SwitchParts, SwitchProps } from '@cratis/components/Common';
import { useResolvedMuiChoice, type ChoiceKind, type ChoiceParts, type ChoiceStateAttributes, type MuiChoiceProps, type NativeInputSlotProps } from './choiceState.js';
import { classNames } from './shared.js';

interface MuiChoiceControlProps {
    readonly kind: ChoiceKind;
    readonly checked: boolean | undefined;
    readonly defaultChecked: boolean | undefined;
    readonly disabled: boolean | undefined;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly input: NativeInputSlotProps;
    readonly parts: ChoiceParts | undefined;
    readonly attributes: ChoiceStateAttributes;
}

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

const MuiChoiceControl = ({
    kind,
    checked,
    defaultChecked,
    disabled,
    onChange,
    input,
    parts,
    attributes,
}: MuiChoiceControlProps) => {
    const uncontrolledDefault = checked === undefined ? defaultChecked : undefined;
    switch (kind) {
        case 'switch': {
            const switchParts = parts as SwitchParts | undefined;
            const root = {
                ...switchParts?.control,
                className: classNames(
                    'cratis-mui-switch__control',
                    switchParts?.control?.className,
                ),
                'data-cratis-part': 'control',
                ...attributes,
            };
            const thumb = {
                ...switchParts?.handle,
                className: classNames(
                    'cratis-mui-switch__handle',
                    switchParts?.handle?.className,
                ),
                'data-cratis-part': 'handle',
                ...attributes,
            };
            return (
                <MuiSwitch
                    checked={checked}
                    defaultChecked={uncontrolledDefault}
                    disabled={disabled}
                    onChange={onChange}
                    slotProps={{ root, input, thumb }}
                />
            );
        }
        case 'radio': {
            const radioParts = parts as RadioParts | undefined;
            const root = {
                ...radioParts?.box,
                className: classNames(
                    'cratis-mui-radio__box',
                    radioParts?.box?.className,
                ),
                'data-cratis-part': 'box',
                ...attributes,
            };
            return (
                <MuiRadio
                    checked={checked}
                    defaultChecked={uncontrolledDefault}
                    disabled={disabled}
                    onChange={onChange}
                    icon={choiceIndicator('radio', radioParts, attributes, false)}
                    checkedIcon={choiceIndicator('radio', radioParts, attributes, true)}
                    slotProps={{ root, input }}
                />
            );
        }
        case 'checkbox': {
            const checkboxParts = parts as CheckboxParts | undefined;
            const root = {
                ...checkboxParts?.box,
                className: classNames(
                    'cratis-mui-checkbox__box',
                    checkboxParts?.box?.className,
                ),
                'data-cratis-part': 'box',
                ...attributes,
            };
            return (
                <MuiCheckbox
                    checked={checked}
                    defaultChecked={uncontrolledDefault}
                    disabled={disabled}
                    onChange={onChange}
                    icon={choiceIndicator('checkbox', checkboxParts, attributes, false)}
                    checkedIcon={choiceIndicator(
                        'checkbox',
                        checkboxParts,
                        attributes,
                        true,
                    )}
                    slotProps={{ root, input }}
                />
            );
        }
        default:
            throw new Error(`Unsupported choice kind '${String(kind)}'.`);
    }
};

const MuiChoice = ({ kind, props, forwardedRef }: MuiChoiceProps) => {
    const {
        parts,
        inputPart,
        checked,
        defaultChecked,
        disabled,
        readOnly,
        ariaInvalid,
        state,
        attributes,
    } = useResolvedMuiChoice(kind, props, forwardedRef);
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
    const {
        onClick: partOnClick,
        onChange: partOnChange,
        className: inputClassName,
        style: inputStyle,
        readOnly: _partReadOnly,
        checked: _partChecked,
        defaultChecked: _partDefaultChecked,
        disabled: _partDisabled,
        ...inputPartRest
    } = inputPart ?? {};
    const radioProps = props as RadioProps;
    const input: NativeInputSlotProps = {
        ...inputPartRest,
        ...nativeProps,
        ref: state.ref,
        name: kind === 'radio' ? radioProps.name : nativeProps.name,
        value: kind === 'radio' ? radioProps.value : nativeProps.value,
        'aria-invalid': ariaInvalid,
        'aria-readonly': kind === 'radio' ? undefined : readOnly || undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-mui-choice__input', inputClassName),
        style: inputStyle,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            partOnClick?.(event);
            onClick?.(event);
            if (readOnly) event.preventDefault();
        },
    };
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        partOnChange?.(event);
        if (readOnly || (kind === 'radio' && !event.currentTarget.checked)) return;
        state.synchronize(event.currentTarget.checked);
        onChange?.(event.currentTarget.checked, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };
    const labelPart = parts?.label;
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
                onChange={handleChange}
                input={input}
                parts={parts}
                attributes={attributes}
            />
            {label !== undefined && (
                <span
                    {...labelPart}
                    className={classNames(
                        'cratis-mui-choice__label',
                        labelPart?.className,
                    )}
                    data-cratis-part='label'
                    {...attributes}
                >
                    {label}
                </span>
            )}
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
