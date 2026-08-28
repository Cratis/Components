// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ForwardedRef,
    type InputHTMLAttributes,
    type ReactNode,
    type SyntheticEvent,
} from 'react';
import { PrimeReactContext, PrimeReactProvider } from 'primereact/api';
import { Button as PrimeButton } from 'primereact/button';
import { Card as PrimeCard } from 'primereact/card';
import {
    Checkbox as PrimeCheckbox,
    type CheckboxPassThroughOptions,
} from 'primereact/checkbox';
import { InputSwitch as PrimeInputSwitch } from 'primereact/inputswitch';
import { InputText as PrimeInputText } from 'primereact/inputtext';
import { InputTextarea as PrimeInputTextarea } from 'primereact/inputtextarea';
import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar';
import {
    RadioButton as PrimeRadioButton,
    type RadioButtonPassThroughOptions,
} from 'primereact/radiobutton';
import type {
    ButtonProps,
    ButtonSeverity,
    ButtonTone,
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
    type unstable_UiLibrary,
    type unstable_UiLibraryProviderProps,
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
    'ssr.staticRender',
] satisfies readonly unstable_CapabilityId[]);

const PrimeReact10AdapterProvider = ({
    children,
}: unstable_UiLibraryProviderProps) => {
    const applicationConfiguration = useContext(PrimeReactContext);
    if (applicationConfiguration !== undefined) return children;
    return <PrimeReactProvider>{children}</PrimeReactProvider>;
};

const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

const toneForSeverity: Readonly<Record<ButtonSeverity, ButtonTone>> = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

const severityForTone: Readonly<Record<ButtonTone, ButtonSeverity>> = {
    neutral: 'secondary',
    accent: 'info',
    positive: 'success',
    caution: 'warn',
    critical: 'danger',
};

type DeprecatedButtonProp = 'severity' | 'text' | 'link' | 'outlined' | 'rounded';
const warnedDeprecatedProps = new Set<DeprecatedButtonProp>();

const warnForDeprecatedProp = (prop: DeprecatedButtonProp) => {
    const environment = (
        globalThis as typeof globalThis & {
            process?: { env?: { NODE_ENV?: string } };
        }
    ).process?.env?.NODE_ENV;
    if (environment === 'production' || warnedDeprecatedProps.has(prop)) return;
    warnedDeprecatedProps.add(prop);
    console.warn(
        `Button prop "${prop}" is deprecated and will be removed in 5.0. Use variant, tone, or shape instead.`,
    );
};

interface ResolvedButtonAppearance {
    readonly variant: 'solid' | 'outline' | 'ghost' | 'link';
    readonly tone: ButtonTone | undefined;
    readonly shape: 'default' | 'pill';
    readonly severity: ButtonSeverity | undefined;
}

interface ButtonAppearanceOptions {
    readonly variant: ButtonProps['variant'];
    readonly tone: ButtonProps['tone'];
    readonly shape: ButtonProps['shape'];
    readonly text: ButtonProps['text'];
    readonly link: ButtonProps['link'];
    readonly outlined: ButtonProps['outlined'];
    readonly rounded: ButtonProps['rounded'];
    readonly severity: ButtonProps['severity'];
}

const resolveButtonVariant = ({
    variant,
    link,
    text,
    outlined,
}: ButtonAppearanceOptions): ResolvedButtonAppearance['variant'] => {
    if (variant) return variant;
    if (link) return 'link';
    if (text) return 'ghost';
    if (outlined) return 'outline';
    return 'solid';
};

const resolveButtonAppearance = (
    options: ButtonAppearanceOptions,
): ResolvedButtonAppearance => {
    const { tone, shape, text, link, outlined, rounded, severity } = options;
    if (text !== undefined) warnForDeprecatedProp('text');
    if (link !== undefined) warnForDeprecatedProp('link');
    if (outlined !== undefined) warnForDeprecatedProp('outlined');
    if (rounded !== undefined) warnForDeprecatedProp('rounded');
    if (severity !== undefined) warnForDeprecatedProp('severity');
    return {
        variant: resolveButtonVariant(options),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};

const primeSeverity = (severity: ButtonSeverity | undefined) =>
    severity === 'warn' ? 'warning' : severity;

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const PrimeButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(
    function PrimeButtonSlot(
        {
            label,
            icon,
            loading = false,
            tooltip,
            tooltipOptions: _tooltipOptions,
            pt,
            variant,
            tone,
            shape,
            text,
            link,
            outlined,
            rounded,
            severity,
            size = 'normal',
            disabled,
            type = 'button',
            title,
            className,
            style,
            children,
            ...nativeProps
        },
        ref,
    ) {
        const appearance = resolveButtonAppearance({
            variant,
            tone,
            shape,
            text,
            link,
            outlined,
            rounded,
            severity,
        });
        const effectiveDisabled = Boolean(disabled || loading);
        const iconOnly = Boolean(icon) && label === undefined && !children;
        const nativeButtonRef = useCallback(
            (value: unknown) => {
                // SAFETY: PrimeReact 10.9.8's Button runtime forwards its ref to the native
                // button although its legacy declaration still describes a class component.
                // Only that verified native node crosses the Cratis ref boundary.
                const button =
                    typeof HTMLButtonElement !== 'undefined' &&
                    value instanceof HTMLButtonElement
                        ? value
                        : null;
                assignRef(ref, button);
            },
            [ref],
        );
        return (
            <PrimeButton
                {...pt?.root}
                {...nativeProps}
                ref={nativeButtonRef}
                type={type}
                title={title ?? tooltip}
                disabled={effectiveDisabled}
                text={appearance.variant === 'ghost'}
                link={appearance.variant === 'link'}
                outlined={appearance.variant === 'outline'}
                severity={primeSeverity(appearance.severity)}
                rounded={appearance.shape === 'pill'}
                size={size === 'normal' ? undefined : size}
                className={classNames(
                    'cratis-primereact10-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                aria-busy={loading || undefined}
                data-cratis-part='root'
                data-variant={appearance.variant}
                data-tone={appearance.tone}
                data-severity={appearance.severity}
                data-shape={appearance.shape}
                data-size={size}
                data-disabled={effectiveDisabled || undefined}
                data-loading={loading || undefined}
                data-icon-only={iconOnly || undefined}
            >
                {loading ? (
                    <span
                        {...pt?.spinner}
                        className={classNames(
                            'cratis-primereact10-button__spinner',
                            pt?.spinner?.className,
                        )}
                        data-cratis-part='spinner'
                        aria-hidden='true'
                    />
                ) : icon ? (
                    <span
                        {...pt?.icon}
                        className={classNames(
                            'cratis-primereact10-button__icon',
                            pt?.icon?.className,
                        )}
                        data-cratis-part='icon'
                        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                    >
                        {renderIcon(icon)}
                    </span>
                ) : null}
                {label !== undefined || children !== undefined ? (
                    <span
                        {...pt?.label}
                        className={classNames(
                            'cratis-primereact10-button__label',
                            pt?.label?.className,
                        )}
                        data-cratis-part='label'
                    >
                        {label}
                        {children}
                    </span>
                ) : null}
            </PrimeButton>
        );
    },
);

const PrimeIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function PrimeIconButtonSlot(props, ref) {
        return (
            <PrimeButtonSlot
                {...props}
                ref={ref}
                shape={props.shape ?? 'pill'}
                label={undefined}
            />
        );
    },
);

const PrimeTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function PrimeTextInputSlot(
        {
            type = 'text',
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            size: nativeSize,
            value,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const { size: partSize, ...rootPart } = pt?.root ?? {};
        const effectiveDisabled = disabled ?? rootPart.disabled;
        const effectiveReadOnly = readOnly ?? rootPart.readOnly;
        const effectiveAriaInvalid =
            ariaInvalid ?? rootPart['aria-invalid'] ?? (invalid || undefined);
        const effectiveInvalid =
            invalid ||
            effectiveAriaInvalid === true ||
            effectiveAriaInvalid === 'true';
        return (
            <PrimeInputText
                {...rootPart}
                {...nativeProps}
                ref={ref}
                type={type}
                value={
                    value === undefined
                        ? undefined
                        : Array.isArray(value)
                          ? value.join(',')
                          : String(value)
                }
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                invalid={effectiveInvalid}
                aria-invalid={effectiveAriaInvalid}
                size={nativeSize ?? partSize}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    rootPart.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames(
                    'cratis-primereact10-text-input',
                    rootPart.className,
                    className,
                )}
                style={{ ...rootPart.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
            />
        );
    },
);

const PrimeTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function PrimeTextAreaSlot(
        {
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            value,
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
            invalid ||
            effectiveAriaInvalid === true ||
            effectiveAriaInvalid === 'true';
        return (
            <PrimeInputTextarea
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                value={
                    value === undefined
                        ? undefined
                        : Array.isArray(value)
                          ? value.join(',')
                          : String(value)
                }
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                invalid={effectiveInvalid}
                aria-invalid={effectiveAriaInvalid}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames(
                    'cratis-primereact10-text-area',
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

const assignRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
};

const useNativeCheckedState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
    observeRadioGroup = false,
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState(Boolean(defaultChecked));
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
        const synchronize = () => queueMicrotask(() => setSelected(input.checked));
        input.form?.addEventListener('reset', synchronize);
        if (observeRadioGroup)
            input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            input.form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup)
                input.ownerDocument.removeEventListener('change', synchronize);
        };
    }, [controlled, observeRadioGroup]);
    return {
        ref,
        selected: checked ?? selected,
        synchronize: (next: boolean) => {
            if (!controlled) setSelected(next);
        },
    };
};

type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
type ChoiceKind = 'checkbox' | 'radio' | 'switch';
type DataAttributes = {
    [name: `data-${string}`]: string | number | boolean | undefined;
};
type InputPart = InputHTMLAttributes<HTMLInputElement> & DataAttributes;

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

interface PrimeBooleanChangeEvent {
    readonly checked?: boolean;
    readonly originalEvent?: SyntheticEvent;
}

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
    const inputPart = parts?.input as InputPart | undefined;
    const checked = props.checked ?? inputPart?.checked;
    const defaultChecked = props.defaultChecked ?? inputPart?.defaultChecked;
    const disabled = props.disabled ?? inputPart?.disabled;
    const readOnly = props.readOnly ?? inputPart?.readOnly;
    const ariaInvalid =
        props['aria-invalid'] ??
        inputPart?.['aria-invalid'] ??
        (props.invalid || undefined);
    const invalid =
        Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true';
    const state = useNativeCheckedState(
        checked,
        defaultChecked,
        forwardedRef,
        kind === 'radio',
    );
    const attributes = stateAttributes(disabled, invalid, readOnly, state.selected);
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
        id,
        'aria-invalid': _ariaInvalid,
        ...nativeProps
    } = props;
    const {
        onClick: partOnClick,
        onChange: partOnChange,
        className: inputClassName,
        style: inputStyle,
        checked: _partChecked,
        defaultChecked: _partDefaultChecked,
        disabled: _partDisabled,
        readOnly: _partReadOnly,
        id: partId,
        ...inputPartRest
    } = inputPart ?? {};
    const radio = props as RadioProps;
    const inputId = id ?? partId;
    const input: InputPart = {
        ...inputPartRest,
        ...nativeProps,
        id: inputId,
        name: kind === 'radio' ? radio.name : nativeProps.name,
        value: kind === 'radio' ? radio.value : nativeProps.value,
        defaultChecked: kind === 'radio' ? defaultChecked : undefined,
        'aria-invalid': ariaInvalid,
        'aria-readonly': readOnly || undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-primereact10-choice__input', inputClassName),
        style: inputStyle,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            partOnClick?.(event);
            onClick?.(event);
            if (readOnly) event.preventDefault();
        },
    };
    const changed = (event: PrimeBooleanChangeEvent) => {
        const originalEvent = event.originalEvent;
        if (originalEvent) {
            // SAFETY: PrimeReact 10 boolean controls originate this callback from the native
            // input change event; its public legacy type erases the specific ChangeEvent subtype.
            partOnChange?.(originalEvent as ChangeEvent<HTMLInputElement>);
        }
        const nextChecked = Boolean(event.checked);
        if (readOnly || (kind === 'radio' && !nextChecked)) return;
        state.synchronize(nextChecked);
        onChange?.(nextChecked, {
            source: 'user',
            nativeEvent: originalEvent?.nativeEvent,
        });
    };
    const checkboxParts = parts as CheckboxParts | undefined;
    const radioParts = parts as RadioParts | undefined;
    const switchParts = parts as SwitchParts | undefined;
    return (
        <label
            {...parts?.root}
            className={classNames(
                'cratis-primereact10-choice',
                parts?.root?.className,
                className,
            )}
            style={{ ...parts?.root?.style, ...style }}
            data-cratis-part='root'
            {...attributes}
        >
            {kind === 'checkbox' ? (
                <>
                    <PrimeCheckbox
                    checked={state.selected}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={nativeProps.required}
                    invalid={invalid}
                    name={nativeProps.name}
                    value={nativeProps.value}
                    inputId={inputId}
                    inputRef={state.ref}
                    aria-label={nativeProps['aria-label']}
                    aria-labelledby={nativeProps['aria-labelledby']}
                    onChange={changed}
                    pt={
                        {
                            input,
                            box: {
                                ...checkboxParts?.box,
                                'data-cratis-part': 'box',
                                ...attributes,
                            },
                            icon: {
                                ...checkboxParts?.indicator,
                                'data-cratis-part': 'indicator',
                                'aria-hidden': true,
                                ...attributes,
                            },
                        } as unknown as CheckboxPassThroughOptions
                    }
                    />
                    <span
                        {...checkboxParts?.indicator}
                        className={classNames(
                            'p-checkbox-icon',
                            checkboxParts?.indicator?.className,
                        )}
                        data-cratis-part='indicator'
                        aria-hidden='true'
                        {...attributes}
                    >
                        ✓
                    </span>
                </>
            ) : kind === 'radio' ? (
                <PrimeRadioButton
                    checked={state.selected}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={nativeProps.required}
                    invalid={invalid}
                    name={radio.name}
                    value={radio.value}
                    inputId={inputId}
                    inputRef={state.ref}
                    aria-label={nativeProps['aria-label']}
                    aria-labelledby={nativeProps['aria-labelledby']}
                    onChange={changed}
                    pt={
                        {
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
                        } as unknown as RadioButtonPassThroughOptions
                    }
                />
            ) : (
                <PrimeInputSwitch
                    checked={state.selected}
                    disabled={disabled}
                    name={nativeProps.name}
                    inputId={inputId}
                    inputRef={state.ref}
                    aria-label={nativeProps['aria-label']}
                    aria-labelledby={nativeProps['aria-labelledby']}
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
            )}
            {label === undefined ? null : (
                <span
                    {...parts?.label}
                    className={classNames(
                        'cratis-primereact10-choice__label',
                        parts?.label?.className,
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

const PrimeCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function PrimeCheckboxSlot(props, ref) {
        return <PrimeChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

const PrimeRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function PrimeRadioSlot(props, ref) {
        return <PrimeChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

const PrimeSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function PrimeSwitchSlot(props, ref) {
        return <PrimeChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);

const PrimeProgressSlot = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    const busy = !determinate || boundedValue < 100;
    return (
        <PrimeProgressBar
            value={boundedValue}
            mode={mode}
            showValue={showValue}
            className={classNames('cratis-primereact10-progress', className)}
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
            pt={{
                value: { 'data-cratis-part': 'indicator' },
                label: {
                    'data-cratis-part': 'label',
                    'aria-hidden': true,
                },
            }}
        />
    );
};

const PrimeSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(
    function PrimeSurfaceSlot(
        { as: Element = 'div', pt, className, style, children, ...nativeProps },
        ref,
    ) {
        const surfaceRef = useCallback(
            (element: HTMLElement | null) => assignRef(ref, element),
            [ref],
        );
        return (
            <Element
                {...pt?.root}
                {...nativeProps}
                ref={surfaceRef}
                className={classNames(
                    'cratis-primereact10-surface',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
            >
                <PrimeCard>{children}</PrimeCard>
            </Element>
        );
    },
);

const declaration = <SlotId extends unstable_SlotId>(
    render: unstable_SlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies unstable_SlotDeclaration<SlotId>;

const slots = Object.freeze({
    'common.button': declaration<'common.button'>(PrimeButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(PrimeIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(PrimeTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(PrimeTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(PrimeCheckboxSlot),
    'common.radio': declaration<'common.radio'>(PrimeRadioSlot),
    'common.switch': declaration<'common.switch'>(PrimeSwitchSlot),
    'common.progress': declaration<'common.progress'>(PrimeProgressSlot),
    'common.surface': declaration<'common.surface'>(PrimeSurfaceSlot),
});

/** PrimeReact 10 implementation of the stable Cratis presentation profile. */
export const primeReact10UiLibrary: unstable_UiLibrary = unstable_defineUiLibrary({
    id: 'cratis-primereact10',
    displayName: 'Cratis PrimeReact 10 renderer',
    abi: unstable_CRATIS_UI_ABI_VERSION,
    level: 'primitive',
    profile: 'stable-presentation/v1',
    profileSlots,
    capabilities,
    slots,
    Provider: PrimeReact10AdapterProvider,
});
