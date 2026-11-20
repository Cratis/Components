// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type ForwardedRef,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import type { CheckboxProps, RadioProps, SwitchProps } from '@cratis/components/Common';
import { controlRenderers } from './choiceControls.js';
import { stateAttributes, useNativeCheckedState } from './choiceState.js';
import type {
    ChoiceChange,
    ChoiceKind,
    ChoiceParts,
    ChoiceProps,
    InputPartWithRef,
} from './choiceTypes.js';
import { classNames } from './shared.js';

const inputPartOf = (props: ChoiceProps) =>
    (props.pt as ChoiceParts | undefined)?.input as
        | InputHTMLAttributes<HTMLInputElement>
        | undefined;

const resolveChoiceState = (props: ChoiceProps) => {
    const inputPart = inputPartOf(props);
    const ariaInvalid =
        props['aria-invalid'] ??
        inputPart?.['aria-invalid'] ??
        (props.invalid || undefined);
    return {
        checked: props.checked ?? inputPart?.checked,
        defaultChecked: props.defaultChecked ?? inputPart?.defaultChecked,
        disabled: props.disabled ?? inputPart?.disabled,
        readOnly: props.readOnly ?? inputPart?.readOnly,
        ariaInvalid,
        invalid: Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true',
    };
};

interface ChoiceInputOptions {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly resolved: ReturnType<typeof resolveChoiceState>;
    readonly ref: (input: HTMLInputElement | null) => void;
    readonly attributes: ReturnType<typeof stateAttributes>;
}

const buildInput = ({
    kind,
    props,
    resolved,
    ref,
    attributes,
}: ChoiceInputOptions): InputPartWithRef => {
    const {
        label: _label,
        readOnly: _readOnly,
        invalid: _invalid,
        onChange: _onChange,
        className: _className,
        style: _style,
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
        onChange: _partOnChange,
        className: inputClassName,
        style: inputStyle,
        ...inputPartRest
    } = inputPartOf(props) ?? {};
    const radio = props as RadioProps;
    return {
        ...inputPartRest,
        ...nativeProps,
        ref,
        name: kind === 'radio' ? radio.name : nativeProps.name,
        value: kind === 'radio' ? radio.value : nativeProps.value,
        'aria-invalid': resolved.ariaInvalid,
        'aria-readonly': kind === 'radio' ? undefined : resolved.readOnly || undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-primereact-choice__input', inputClassName),
        style: inputStyle,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            partOnClick?.(event);
            onClick?.(event);
            if (resolved.readOnly) event.preventDefault();
        },
    };
};

const ChoiceLabel = ({
    label,
    part,
    attributes,
}: {
    readonly label: ReactNode;
    readonly part: ChoiceParts['label'];
    readonly attributes: ReturnType<typeof stateAttributes>;
}) =>
    label === undefined ? null : (
        <span
            {...part}
            className={classNames('cratis-primereact-choice__label', part?.className)}
            data-cratis-part='label'
            {...attributes}
        >
            {label}
        </span>
    );

const ignoresChange = (
    kind: ChoiceKind,
    readOnly: boolean | undefined,
    checked: boolean,
) => Boolean(readOnly) || (kind === 'radio' && !checked);

const choiceChangeHandler =
    (
        kind: ChoiceKind,
        props: ChoiceProps,
        resolved: ReturnType<typeof resolveChoiceState>,
        synchronize: (next: boolean) => void,
    ) =>
    (event: ChoiceChange) => {
        if (ignoresChange(kind, resolved.readOnly, event.checked)) return;
        synchronize(event.checked);
        props.onChange?.(event.checked, {
            source: 'user',
            nativeEvent: event.originalEvent.nativeEvent,
        });
    };

const choiceRootProps = (props: ChoiceProps, parts: ChoiceParts | undefined) => ({
    ...parts?.root,
    className: classNames('cratis-primereact-choice', parts?.root?.className, props.className),
    style: { ...parts?.root?.style, ...props.style },
    'data-cratis-part': 'root',
});

const PrimeChoice = ({
    kind,
    props,
    forwardedRef,
}: {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}) => {
    const parts = props.pt as ChoiceParts | undefined;
    const resolved = resolveChoiceState(props);
    const state = useNativeCheckedState(
        resolved.checked,
        resolved.defaultChecked,
        forwardedRef,
        kind === 'radio',
    );
    const attributes = stateAttributes(
        resolved.disabled,
        resolved.invalid,
        resolved.readOnly,
        state.selected,
    );
    return (
        <label {...choiceRootProps(props, parts)} {...attributes}>
            {controlRenderers[kind]({
                props,
                parts,
                selected: state.selected,
                disabled: resolved.disabled,
                readOnly: resolved.readOnly,
                invalid: resolved.invalid,
                input: buildInput({ kind, props, resolved, ref: state.ref, attributes }),
                attributes,
                changed: choiceChangeHandler(kind, props, resolved, state.synchronize),
            })}
            <ChoiceLabel label={props.label} part={parts?.label} attributes={attributes} />
        </label>
    );
};

export const PrimeCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function PrimeCheckboxSlot(props, ref) {
        return <PrimeChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

export const PrimeRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function PrimeRadioSlot(props, ref) {
        return <PrimeChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

export const PrimeSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function PrimeSwitchSlot(props, ref) {
        return <PrimeChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);
