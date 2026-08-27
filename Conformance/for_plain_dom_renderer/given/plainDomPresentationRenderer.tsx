// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ForwardedRef,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import type {
    ButtonProps,
    CheckboxParts,
    CheckboxProps,
    IconButtonProps,
    RadioParts,
    RadioProps,
    SurfaceProps,
    SwitchParts,
    SwitchProps,
    TextAreaProps,
    TextInputProps,
} from '@cratis/components/Common';
import type { ProgressBarProps } from '@cratis/components/Display';
import {
    unstable_CRATIS_UI_ABI_VERSION,
    unstable_defineUiLibrary,
    type unstable_CapabilityId,
    type unstable_SlotDeclaration,
    type unstable_SlotId,
} from '@cratis/components/renderer';

const profileSlots = Object.freeze([
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
] satisfies readonly unstable_SlotId[]);

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'form.validationMessage',
    'ssr.staticRender',
    'rtl',
    'forcedColors',
    'motion.reduced',
] satisfies readonly unstable_CapabilityId[]);

const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

const assignRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
};

const stateAttributes = (
    disabled: boolean | undefined,
    invalid: boolean,
    readOnly: boolean | undefined,
    selected: boolean,
) => ({
    'data-disabled': disabled || undefined,
    'data-invalid': invalid || undefined,
    'data-readonly': readOnly || undefined,
    'data-selected': selected || undefined,
});

interface CheckableState {
    readonly ref: (element: HTMLInputElement | null) => void;
    readonly selected: boolean;
    readonly setSelected: (selected: boolean) => void;
}

const useCheckableState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
): CheckableState => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
        Boolean(defaultChecked),
    );
    const controlled = checked !== undefined;
    const ref = useCallback(
        (element: HTMLInputElement | null) => {
            inputRef.current = element;
            assignRef(forwardedRef, element);
        },
        [forwardedRef],
    );

    useEffect(() => {
        const input = inputRef.current;
        if (!input || controlled) return;
        const synchronizeReset = () => {
            queueMicrotask(() => setUncontrolledChecked(input.checked));
        };
        input.form?.addEventListener('reset', synchronizeReset);
        return () => input.form?.removeEventListener('reset', synchronizeReset);
    }, [controlled]);

    return {
        ref,
        selected: checked ?? uncontrolledChecked,
        setSelected: (selected) => {
            if (!controlled) setUncontrolledChecked(selected);
        },
    };
};

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const PlainButton = forwardRef<HTMLButtonElement, ButtonProps>(function PlainButton(
    {
        label,
        icon,
        loading = false,
        pt,
        variant = 'solid',
        tone,
        shape = 'default',
        size = 'normal',
        disabled,
        type = 'button',
        className,
        style,
        children,
        ...nativeProps
    },
    ref,
) {
    const effectiveDisabled = Boolean(disabled || loading);
    return (
        <button
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            disabled={effectiveDisabled}
            className={classNames('plain-dom-button', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-variant={variant}
            data-tone={tone}
            data-shape={shape}
            data-size={size}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            aria-busy={loading || undefined}
        >
            {loading ? (
                <span
                    {...pt?.spinner}
                    className={classNames(
                        'plain-dom-button__spinner',
                        pt?.spinner?.className,
                    )}
                    data-cratis-part='spinner'
                    aria-hidden='true'
                />
            ) : icon ? (
                <span
                    {...pt?.icon}
                    className={classNames('plain-dom-button__icon', pt?.icon?.className)}
                    data-cratis-part='icon'
                    aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                >
                    {renderIcon(icon)}
                </span>
            ) : null}
            {(label !== undefined || children !== undefined) && (
                <span
                    {...pt?.label}
                    className={classNames(
                        'plain-dom-button__label',
                        pt?.label?.className,
                    )}
                    data-cratis-part='label'
                >
                    {label}
                    {children}
                </span>
            )}
        </button>
    );
});

const PlainIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function PlainIconButton({ shape = 'pill', ...props }, ref) {
        return <PlainButton {...props} ref={ref} shape={shape} />;
    },
);

const PlainTextInput = forwardRef<HTMLInputElement, TextInputProps>(
    function PlainTextInput(
        {
            type = 'text',
            invalid = false,
            onChange,
            pt,
            disabled,
            readOnly,
            className,
            style,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const effectiveDisabled = disabled ?? pt?.root?.disabled;
        const effectiveReadOnly = readOnly ?? pt?.root?.readOnly;
        const effectiveAriaInvalid =
            ariaInvalid ?? pt?.root?.['aria-invalid'] ?? (invalid || undefined);
        const effectiveInvalid =
            invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
        return (
            <input
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                aria-invalid={effectiveAriaInvalid}
                onChange={(event) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames(
                    'plain-dom-text-input',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
            />
        );
    },
);

const PlainTextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function PlainTextArea(
        {
            invalid = false,
            onChange,
            pt,
            disabled,
            readOnly,
            className,
            style,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const effectiveDisabled = disabled ?? pt?.root?.disabled;
        const effectiveReadOnly = readOnly ?? pt?.root?.readOnly;
        const effectiveAriaInvalid =
            ariaInvalid ?? pt?.root?.['aria-invalid'] ?? (invalid || undefined);
        const effectiveInvalid =
            invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
        return (
            <textarea
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                aria-invalid={effectiveAriaInvalid}
                onChange={(event) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames(
                    'plain-dom-text-area',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
            />
        );
    },
);

type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
type ChoiceKind = 'checkbox' | 'radio' | 'switch';

interface PlainChoiceProps {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}

const PlainChoice = ({ kind, props, forwardedRef }: PlainChoiceProps) => {
    const {
        label,
        readOnly,
        invalid = false,
        onChange,
        className,
        style,
        pt: choiceParts,
        checked,
        defaultChecked,
        disabled,
        onClick,
        'aria-invalid': ariaInvalid,
        ...nativeProps
    } = props;
    const pt = choiceParts as ChoiceParts | undefined;
    const inputPt = pt?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
    const effectiveChecked = checked ?? inputPt?.checked;
    const effectiveDefaultChecked = defaultChecked ?? inputPt?.defaultChecked;
    const effectiveDisabled = disabled ?? inputPt?.disabled;
    const effectiveReadOnly = readOnly ?? inputPt?.readOnly;
    const effectiveAriaInvalid =
        ariaInvalid ?? inputPt?.['aria-invalid'] ?? (invalid || undefined);
    const effectiveInvalid =
        invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
    const state = useCheckableState(
        effectiveChecked,
        effectiveDefaultChecked,
        forwardedRef,
    );
    const attributes = stateAttributes(
        effectiveDisabled,
        effectiveInvalid,
        effectiveReadOnly,
        state.selected,
    );
    const rootPt = pt?.root;
    const labelPt = pt?.label;
    const boxPt = kind === 'switch' ? undefined : (pt as CheckboxParts | undefined)?.box;
    const indicatorPt =
        kind === 'switch' ? undefined : (pt as CheckboxParts | undefined)?.indicator;
    const controlPt =
        kind === 'switch' ? (pt as SwitchParts | undefined)?.control : undefined;
    const handlePt =
        kind === 'switch' ? (pt as SwitchParts | undefined)?.handle : undefined;
    const radioProps = props as RadioProps;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        inputPt?.onChange?.(event);
        if (effectiveReadOnly || (kind === 'radio' && !event.currentTarget.checked))
            return;
        state.setSelected(event.currentTarget.checked);
        onChange?.(event.currentTarget.checked, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

    return (
        <label
            {...rootPt}
            className={classNames('plain-dom-choice', rootPt?.className, className)}
            style={{ ...rootPt?.style, ...style }}
            data-cratis-part='root'
            {...attributes}
        >
            <input
                {...inputPt}
                {...nativeProps}
                ref={state.ref}
                type={kind === 'radio' ? 'radio' : 'checkbox'}
                role={kind === 'switch' ? 'switch' : undefined}
                name={kind === 'radio' ? radioProps.name : nativeProps.name}
                value={kind === 'radio' ? radioProps.value : nativeProps.value}
                checked={effectiveChecked}
                defaultChecked={
                    effectiveChecked === undefined ? effectiveDefaultChecked : undefined
                }
                disabled={effectiveDisabled}
                readOnly={undefined}
                aria-invalid={effectiveAriaInvalid}
                aria-readonly={effectiveReadOnly || undefined}
                onClick={(event) => {
                    inputPt?.onClick?.(event);
                    onClick?.(event);
                    if (effectiveReadOnly) event.preventDefault();
                }}
                onChange={handleChange}
                className={classNames('plain-dom-choice__input', inputPt?.className)}
                data-cratis-part='input'
                {...attributes}
            />
            {kind === 'switch' ? (
                <span
                    {...controlPt}
                    className={classNames(
                        'plain-dom-switch__control',
                        controlPt?.className,
                    )}
                    data-cratis-part='control'
                    aria-hidden='true'
                    {...attributes}
                >
                    <span
                        {...handlePt}
                        className={classNames(
                            'plain-dom-switch__handle',
                            handlePt?.className,
                        )}
                        data-cratis-part='handle'
                        {...attributes}
                    />
                </span>
            ) : (
                <span
                    {...boxPt}
                    className={classNames(
                        kind === 'radio'
                            ? 'plain-dom-radio__box'
                            : 'plain-dom-checkbox__box',
                        boxPt?.className,
                    )}
                    data-cratis-part='box'
                    aria-hidden='true'
                    {...attributes}
                >
                    <span
                        {...indicatorPt}
                        className={classNames(
                            kind === 'radio'
                                ? 'plain-dom-radio__indicator'
                                : 'plain-dom-checkbox__indicator',
                            indicatorPt?.className,
                        )}
                        data-cratis-part='indicator'
                        {...attributes}
                    >
                        {kind === 'checkbox' ? '✓' : undefined}
                    </span>
                </span>
            )}
            {label !== undefined && (
                <span
                    {...labelPt}
                    className={classNames('plain-dom-choice__label', labelPt?.className)}
                    data-cratis-part='label'
                    {...attributes}
                >
                    {label}
                </span>
            )}
        </label>
    );
};

const PlainCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
    function PlainCheckbox(props, ref) {
        return <PlainChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

const PlainRadio = forwardRef<HTMLInputElement, RadioProps>(
    function PlainRadio(props, ref) {
        return <PlainChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

const PlainSwitch = forwardRef<HTMLInputElement, SwitchProps>(
    function PlainSwitch(props, ref) {
        return <PlainChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);

const PlainProgress = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    return (
        <div
            role='progressbar'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={determinate ? 0 : undefined}
            aria-valuemax={determinate ? 100 : undefined}
            aria-valuenow={determinate ? boundedValue : undefined}
            className={classNames('plain-dom-progress', className)}
            data-cratis-part='root'
            data-busy={!determinate || boundedValue < 100 || undefined}
            data-loading={!determinate || undefined}
            data-mode={mode}
        >
            <span
                className='plain-dom-progress__indicator'
                data-cratis-part='indicator'
                style={determinate ? { width: `${boundedValue}%` } : undefined}
            >
                {determinate && showValue && (
                    <span className='plain-dom-progress__label' data-cratis-part='label'>
                        {boundedValue}%
                    </span>
                )}
            </span>
        </div>
    );
};

const PlainSurface = forwardRef<HTMLElement, SurfaceProps>(function PlainSurface(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
    return (
        <Element
            {...pt?.root}
            {...nativeProps}
            ref={(element) => assignRef(ref, element)}
            className={classNames('plain-dom-surface', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
        />
    );
});

const declaration = <SlotId extends unstable_SlotId>(
    render: unstable_SlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies unstable_SlotDeclaration<SlotId>;

const slots = Object.freeze({
    'common.button': declaration<'common.button'>(PlainButton),
    'common.iconButton': declaration<'common.iconButton'>(PlainIconButton),
    'common.textInput': declaration<'common.textInput'>(PlainTextInput),
    'common.textArea': declaration<'common.textArea'>(PlainTextArea),
    'common.checkbox': declaration<'common.checkbox'>(PlainCheckbox),
    'common.radio': declaration<'common.radio'>(PlainRadio),
    'common.switch': declaration<'common.switch'>(PlainSwitch),
    'common.progress': declaration<'common.progress'>(PlainProgress),
    'common.surface': declaration<'common.surface'>(PlainSurface),
});

/** Private, test-only renderer proving the nine stable presentation slots are independently implementable. */
export const plainDomPresentationRenderer = unstable_defineUiLibrary({
    id: 'plain-dom-falsification-fixture',
    displayName: 'Plain DOM falsification fixture',
    abi: unstable_CRATIS_UI_ABI_VERSION,
    level: 'primitive',
    profile: 'stable-presentation/v1',
    profileSlots,
    capabilities,
    slots,
});
