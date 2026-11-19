// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type ChangeEvent,
    type ForwardedRef,
    type ReactNode,
} from 'react';
import type { CheckboxProps, RadioProps, SwitchProps } from '@cratis/components/Common';
import { controlRenderers } from './choiceControls.js';
import { stateAttributes, useNativeCheckedState } from './choiceState.js';
import type {
    ChoiceKind,
    ChoiceParts,
    ChoiceProps,
    InputPart,
    PrimeBooleanChangeEvent,
} from './choiceTypes.js';
import { classNames } from './shared.js';

const inputPartOf = (props: ChoiceProps) =>
    (props.pt as ChoiceParts | undefined)?.input as InputPart | undefined;

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

type ResolvedChoiceState = ReturnType<typeof resolveChoiceState>;

interface ChoiceInputOptions {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly resolved: ResolvedChoiceState;
    readonly attributes: ReturnType<typeof stateAttributes>;
}

const buildInput = ({ kind, props, resolved, attributes }: ChoiceInputOptions) => {
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
        id,
        'aria-invalid': _ariaInvalid,
        ...nativeProps
    } = props;
    const {
        onClick: partOnClick,
        onChange: _partOnChange,
        className: inputClassName,
        style: inputStyle,
        checked: _partChecked,
        defaultChecked: _partDefaultChecked,
        disabled: _partDisabled,
        readOnly: _partReadOnly,
        id: partId,
        ...inputPartRest
    } = inputPartOf(props) ?? {};
    const radio = props as RadioProps;
    const inputId = id ?? partId;
    const input: InputPart = {
        ...inputPartRest,
        ...nativeProps,
        id: inputId,
        name: kind === 'radio' ? radio.name : nativeProps.name,
        value: kind === 'radio' ? radio.value : nativeProps.value,
        defaultChecked: kind === 'radio' ? resolved.defaultChecked : undefined,
        'aria-invalid': resolved.ariaInvalid,
        'aria-readonly': kind === 'radio' ? undefined : resolved.readOnly || undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-primereact10-choice__input', inputClassName),
        style: inputStyle,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            partOnClick?.(event);
            onClick?.(event);
            if (resolved.readOnly) event.preventDefault();
        },
    };
    return { input, inputId };
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
            className={classNames('cratis-primereact10-choice__label', part?.className)}
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
        resolved: ResolvedChoiceState,
        synchronize: (next: boolean) => void,
    ) =>
    (event: PrimeBooleanChangeEvent) => {
        const originalEvent = event.originalEvent;
        if (originalEvent) {
            // SAFETY: PrimeReact 10 boolean controls originate this callback from the native
            // input change event; its public legacy type erases the specific ChangeEvent subtype.
            (inputPartOf(props)?.onChange as
                | ((event: ChangeEvent<HTMLInputElement>) => void)
                | undefined)?.(originalEvent as ChangeEvent<HTMLInputElement>);
        }
        const nextChecked = Boolean(kind === 'switch' ? event.value : event.checked);
        if (ignoresChange(kind, resolved.readOnly, nextChecked)) return;
        synchronize(nextChecked);
        props.onChange?.(nextChecked, {
            source: 'user',
            nativeEvent: originalEvent?.nativeEvent,
        });
    };

const choiceRootProps = (props: ChoiceProps, parts: ChoiceParts | undefined) => ({
    ...parts?.root,
    className: classNames(
        'cratis-primereact10-choice',
        parts?.root?.className,
        props.className,
    ),
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
    const { input, inputId } = buildInput({ kind, props, resolved, attributes });
    return (
        <label {...choiceRootProps(props, parts)} {...attributes}>
            {controlRenderers[kind]({
                props,
                parts,
                selected: state.selected,
                disabled: resolved.disabled,
                readOnly: resolved.readOnly,
                invalid: resolved.invalid,
                input,
                inputId,
                inputRef: state.ref,
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
