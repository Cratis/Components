// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type ForwardedRef,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type MouseEvent,
} from 'react';
import { Field as DsField, Input as DsInput, Label as DsLabel } from '@digdir/designsystemet-react';
import type {
    CheckboxParts,
    CheckboxProps,
    RadioParts,
    RadioProps,
    SwitchParts,
    SwitchProps,
} from '@cratis/components/Common';
import { classNames } from './classNames.js';

const assignRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
};

const useNativeCheckedState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
    observeRadioGroup: boolean,
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked));
    const controlled = checked !== undefined;
    const ref = useCallback(
        (input: HTMLInputElement | null) => {
            inputRef.current = input;
            assignRef(forwardedRef, input);
        },
        [forwardedRef],
    );
    useEffect(() => {
        const input = inputRef.current;
        if (!input || controlled) return;
        const synchronize = () => queueMicrotask(() => setUncontrolledChecked(input.checked));
        const form = input.form;
        form?.addEventListener('reset', synchronize);
        if (observeRadioGroup) input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup) input.ownerDocument.removeEventListener('change', synchronize);
        };
    }, [controlled, observeRadioGroup]);
    return {
        ref,
        selected: checked ?? uncontrolledChecked,
        synchronize: (nextChecked: boolean) => {
            if (!controlled) setUncontrolledChecked(nextChecked);
        },
    };
};

type DataAttributes = {
    [name: `data-${string}`]: string | number | boolean | undefined;
};

type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
type ChoiceKind = 'checkbox' | 'radio' | 'switch';
type VisualParts = Readonly<Record<string, HTMLAttributes<HTMLElement> | undefined>>;

/** Names of the two decorative parts that Designsystemet paints on the native input itself. */
const visualPartNames: Readonly<Record<ChoiceKind, readonly [string, string]>> = {
    checkbox: ['box', 'indicator'],
    radio: ['box', 'indicator'],
    switch: ['control', 'handle'],
};

const stateAttributes = (
    disabled: boolean | undefined,
    invalid: boolean,
    readOnly: boolean | undefined,
    selected: boolean,
): DataAttributes => ({
    'data-disabled': disabled || undefined,
    'data-invalid': invalid || undefined,
    'data-readonly': readOnly || undefined,
    'data-selected': selected || undefined,
});

/**
 * Designsystemet draws the box, indicator, control and handle with CSS on the native input, so
 * these four parts are rendered as hidden structural hooks that keep the Cratis part contract.
 */
const VisualPart = ({
    kind,
    parts,
    attributes,
}: {
    readonly kind: ChoiceKind;
    readonly parts: ChoiceParts | undefined;
    readonly attributes: DataAttributes;
}) => {
    const [outer, inner] = visualPartNames[kind];
    const visual = parts as VisualParts | undefined;
    return (
        <span
            {...visual?.[outer]}
            className={classNames(`cratis-designsystemet-${kind}__${outer}`, visual?.[outer]?.className)}
            data-cratis-part={outer}
            aria-hidden='true'
            hidden
            {...attributes}
        >
            <span
                {...visual?.[inner]}
                className={classNames(`cratis-designsystemet-${kind}__${inner}`, visual?.[inner]?.className)}
                data-cratis-part={inner}
                aria-hidden='true'
                {...attributes}
            />
        </span>
    );
};

const resolveChoiceInvalid = (props: ChoiceProps, inputPart: InputHTMLAttributes<HTMLInputElement> | undefined) => {
    const ariaInvalid = props['aria-invalid'] ?? inputPart?.['aria-invalid'] ?? (props.invalid || undefined);
    return {
        ariaInvalid,
        invalid: Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true',
    };
};

const resolveChoiceInputState = (props: ChoiceProps, inputPart: InputHTMLAttributes<HTMLInputElement> | undefined) => ({
    checked: props.checked ?? inputPart?.checked,
    defaultChecked: props.defaultChecked ?? inputPart?.defaultChecked,
    disabled: props.disabled ?? inputPart?.disabled,
    readOnly: props.readOnly ?? inputPart?.readOnly,
});

const useChoiceInput = (props: ChoiceProps, forwardedRef: ForwardedRef<HTMLInputElement>, kind: ChoiceKind) => {
    const generatedId = useId();
    const parts = props.pt as ChoiceParts | undefined;
    const inputPart = parts?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
    const inputState = resolveChoiceInputState(props, inputPart);
    const { ariaInvalid, invalid } = resolveChoiceInvalid(props, inputPart);
    const state = useNativeCheckedState(inputState.checked, inputState.defaultChecked, forwardedRef, kind === 'radio');
    return {
        parts,
        inputPart,
        inputId: props.id ?? inputPart?.id ?? generatedId,
        inputState,
        ariaInvalid,
        state,
        attributes: stateAttributes(inputState.disabled, invalid, inputState.readOnly, state.selected),
    };
};

const choiceSemantics = (kind: ChoiceKind, role: ChoiceProps['role']) => ({
    type: kind === 'radio' ? 'radio' : 'checkbox',
    role: kind === 'switch' ? 'switch' : role,
} as const);

const choiceAriaReadOnly = (kind: ChoiceKind, readOnly: boolean | undefined) =>
    kind === 'radio' ? undefined : readOnly || undefined;

const createChoiceChangeHandler = ({
    partOnChange,
    onChange,
    readOnly,
    kind,
    synchronize,
}: {
    readonly partOnChange: InputHTMLAttributes<HTMLInputElement>['onChange'];
    readonly onChange: ChoiceProps['onChange'];
    readonly readOnly: boolean | undefined;
    readonly kind: ChoiceKind;
    readonly synchronize: (checked: boolean) => void;
}) => (event: ChangeEvent<HTMLInputElement>) => {
    partOnChange?.(event);
    if (readOnly || (kind === 'radio' && !event.currentTarget.checked)) return;
    synchronize(event.currentTarget.checked);
    onChange?.(event.currentTarget.checked, {
        source: 'user',
        nativeEvent: event.nativeEvent,
    });
};

const createChoiceClickHandler = (
    partOnClick: InputHTMLAttributes<HTMLInputElement>['onClick'],
    onClick: ChoiceProps['onClick'],
    readOnly: boolean | undefined,
) => (event: MouseEvent<HTMLInputElement>) => {
    partOnClick?.(event);
    onClick?.(event);
    if (readOnly) event.preventDefault();
};

const ChoiceLabel = ({
    label,
    parts,
    inputId,
    attributes,
}: {
    readonly label: ChoiceProps['label'];
    readonly parts: ChoiceParts | undefined;
    readonly inputId: string;
    readonly attributes: DataAttributes;
}) => {
    const labelPart = parts?.label as HTMLAttributes<HTMLLabelElement> | undefined;
    return label !== undefined && (
        <DsLabel
            {...labelPart}
            htmlFor={inputId}
            weight='regular'
            className={classNames('cratis-designsystemet-choice__label', labelPart?.className)}
            data-cratis-part='label'
            {...attributes}
        >
            {label}
        </DsLabel>
    );
};

const DesignsystemetChoice = ({
    kind,
    props,
    forwardedRef,
}: {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}) => {
    const { parts, inputPart, inputId, inputState, ariaInvalid, state, attributes } = useChoiceInput(props, forwardedRef, kind);
    const { checked, defaultChecked, disabled, readOnly } = inputState;
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
        id: _id,
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
    const handleChange = createChoiceChangeHandler({
        partOnChange, onChange, readOnly, kind, synchronize: state.synchronize,
    });
    return (
        <DsField
            {...(parts?.root as HTMLAttributes<HTMLElement>)}
            className={classNames('cratis-designsystemet-choice', parts?.root?.className, className)}
            style={{ ...parts?.root?.style, ...style }}
            data-cratis-part='root'
            {...attributes}
        >
            <DsInput
                {...inputPartRest}
                {...nativeProps}
                id={inputId}
                ref={state.ref}
                {...choiceSemantics(kind, nativeProps.role)}
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                readOnly={readOnly}
                aria-invalid={ariaInvalid}
                aria-readonly={choiceAriaReadOnly(kind, readOnly)}
                className={classNames('cratis-designsystemet-choice__input', inputClassName)}
                style={inputStyle}
                data-cratis-part='input'
                {...attributes}
                onChange={handleChange}
                onClick={createChoiceClickHandler(partOnClick, onClick, readOnly)}
            />
            <VisualPart kind={kind} parts={parts} attributes={attributes} />
            <ChoiceLabel label={label} parts={parts} inputId={inputId} attributes={attributes} />
        </DsField>
    );
};

/** Designsystemet implementation of `common.checkbox`. */
export const DesignsystemetCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function DesignsystemetCheckboxSlot(props, ref) {
        return <DesignsystemetChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

/** Designsystemet implementation of `common.radio`. */
export const DesignsystemetRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function DesignsystemetRadioSlot(props, ref) {
        return <DesignsystemetChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

/** Designsystemet implementation of `common.switch`. */
export const DesignsystemetSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function DesignsystemetSwitchSlot(props, ref) {
        return <DesignsystemetChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);
