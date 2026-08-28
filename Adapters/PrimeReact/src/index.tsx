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
} from 'react';
import { PrimeReactContext } from '@primereact/core/config';
import { Button as PrimeButton } from '@primereact/ui/button';
import { Card as PrimeCard } from '@primereact/ui/card';
import { Checkbox as PrimeCheckbox } from '@primereact/ui/checkbox';
import { InputText as PrimeInputText } from '@primereact/ui/inputtext';
import { ProgressBar as PrimeProgressBar } from '@primereact/ui/progressbar';
import { RadioButton as PrimeRadioButton } from '@primereact/ui/radiobutton';
import { Textarea as PrimeTextarea } from '@primereact/ui/textarea';
import { ToggleSwitch as PrimeToggleSwitch } from '@primereact/ui/toggleswitch';
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
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type CratisPresentationCapabilityId,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
    type CratisPresentationUiLibraryProviderProps,
} from '@cratis/components/renderer';

declare module '@cratis/components/renderer' {
    interface CratisRendererSetupExtensions {
        /** Application attests that its outer PrimeReactProvider received a license key. */
        'cratis-primereact.license-configured': boolean;
    }
}

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies readonly CratisPresentationCapabilityId[]);

const licenseConfiguredAttestation = 'cratis-primereact.license-configured';

const PrimeReactAdapterProvider = ({
    children,
    setup,
}: CratisPresentationUiLibraryProviderProps) => {
    const primeReact = useContext(PrimeReactContext);
    if (!primeReact || setup[licenseConfiguredAttestation] !== true) {
        throw new unstable_AdapterError({
            code: unstable_adapterErrorCodes.missingLicenseKey,
            adapterId: 'cratis-primereact',
            message:
                'PrimeReact 11 requires an application-owned outer PrimeReactProvider and a non-secret license-configuration attestation.',
            remedy: "Mount PrimeReactProvider outside CratisComponentsProvider with its license prop, then set rendererSetup['cratis-primereact.license-configured'] to true only when the application supplied the key.",
        });
    }
    return children;
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

const primeVariant = (variant: ResolvedButtonAppearance['variant']) => {
    switch (variant) {
        case 'outline':
            return 'outlined';
        case 'ghost':
            return 'text';
        case 'link':
            return 'link';
        case 'solid':
            return undefined;
        default:
            throw new Error(`Unsupported Button variant '${String(variant)}'.`);
    }
};

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
        return (
            <PrimeButton
                {...pt?.root}
                {...nativeProps}
                as='button'
                ref={ref}
                type={type}
                title={title ?? tooltip}
                disabled={effectiveDisabled}
                className={classNames(
                    'cratis-primereact-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                variant={primeVariant(appearance.variant)}
                severity={appearance.severity}
                rounded={appearance.shape === 'pill'}
                size={size}
                iconOnly={iconOnly}
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
                            'cratis-primereact-button__spinner',
                            pt?.spinner?.className,
                        )}
                        data-cratis-part='spinner'
                        aria-hidden='true'
                    />
                ) : icon ? (
                    <span
                        {...pt?.icon}
                        className={classNames(
                            'cratis-primereact-button__icon',
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
                            'cratis-primereact-button__label',
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
            invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
        return (
            <PrimeInputText
                {...rootPart}
                {...nativeProps}
                as='input'
                ref={ref}
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                invalid={effectiveInvalid}
                aria-invalid={effectiveAriaInvalid}
                pt={{ root: { size: nativeSize ?? partSize } }}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    rootPart.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames(
                    'cratis-primereact-text-input',
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
            <PrimeTextarea
                {...pt?.root}
                {...nativeProps}
                as='textarea'
                ref={ref}
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
                    'cratis-primereact-text-area',
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
type InputPartWithRef = InputHTMLAttributes<HTMLInputElement> &
    DataAttributes & { ref: (input: HTMLInputElement | null) => void };

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
    const inputPart = parts?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
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
        'aria-invalid': _ariaInvalid,
        ...nativeProps
    } = props;
    const {
        onClick: partOnClick,
        onChange: _partOnChange,
        className: inputClassName,
        style: inputStyle,
        ...inputPartRest
    } = inputPart ?? {};
    const radio = props as RadioProps;
    const input: InputPartWithRef = {
        ...inputPartRest,
        ...nativeProps,
        ref: state.ref,
        name: kind === 'radio' ? radio.name : nativeProps.name,
        value: kind === 'radio' ? radio.value : nativeProps.value,
        'aria-invalid': ariaInvalid,
        'aria-readonly': kind === 'switch' ? readOnly || undefined : undefined,
        role: kind === 'switch' ? 'switch' : nativeProps.role,
        className: classNames('cratis-primereact-choice__input', inputClassName),
        style: inputStyle,
        'data-cratis-part': 'input',
        ...attributes,
        onClick: (event) => {
            partOnClick?.(event);
            onClick?.(event);
            if (readOnly) event.preventDefault();
        },
    };
    const changed = (event: {
        readonly checked: boolean;
        readonly originalEvent: ChangeEvent<HTMLInputElement>;
    }) => {
        if (readOnly || (kind === 'radio' && !event.checked)) return;
        state.synchronize(event.checked);
        onChange?.(event.checked, {
            source: 'user',
            nativeEvent: event.originalEvent.nativeEvent,
        });
    };
    const root = (
        <label
            {...parts?.root}
            className={classNames(
                'cratis-primereact-choice',
                parts?.root?.className,
                className,
            )}
            style={{ ...parts?.root?.style, ...style }}
            data-cratis-part='root'
            {...attributes}
        >
            {kind === 'checkbox' ? (
                <PrimeCheckbox.Root
                    checked={state.selected}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={nativeProps.required}
                    invalid={invalid}
                    name={nativeProps.name}
                    value={nativeProps.value}
                    ariaLabel={nativeProps['aria-label']}
                    ariaLabelledby={nativeProps['aria-labelledby']}
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
                            ✓
                        </PrimeCheckbox.Indicator>
                    </PrimeCheckbox.Box>
                </PrimeCheckbox.Root>
            ) : kind === 'radio' ? (
                <PrimeRadioButton.Root
                    checked={state.selected}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={nativeProps.required}
                    invalid={invalid}
                    name={radio.name}
                    value={radio.value}
                    ariaLabel={nativeProps['aria-label']}
                    ariaLabelledby={nativeProps['aria-labelledby']}
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
            ) : (
                <PrimeToggleSwitch.Root
                    checked={state.selected}
                    disabled={disabled}
                    required={nativeProps.required}
                    invalid={invalid}
                    ariaLabel={nativeProps['aria-label']}
                    ariaLabelledby={nativeProps['aria-labelledby']}
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
            )}
            {label === undefined ? null : (
                <span
                    {...parts?.label}
                    className={classNames(
                        'cratis-primereact-choice__label',
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
    return root;
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
        <div
            className={classNames('cratis-primereact-progress', className)}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            <PrimeProgressBar.Root
                as='div'
                value={determinate ? boundedValue : undefined}
                mode={mode}
                pt={{
                    root: {
                        'aria-label': ariaLabelledBy ? undefined : ariaLabel,
                        'aria-labelledby': ariaLabelledBy,
                        ...(determinate
                            ? {}
                            : {
                                  'aria-valuemin': undefined,
                                  'aria-valuenow': undefined,
                                  'aria-valuemax': undefined,
                              }),
                    },
                }}
            >
                <PrimeProgressBar.Track data-cratis-part='indicator'>
                    <PrimeProgressBar.Indicator />
                </PrimeProgressBar.Track>
                {determinate && showValue ? (
                    <PrimeProgressBar.Label data-cratis-part='label'>
                        {boundedValue}%
                    </PrimeProgressBar.Label>
                ) : null}
            </PrimeProgressBar.Root>
        </div>
    );
};

const PrimeSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(function PrimeSurfaceSlot(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
    return (
        <PrimeCard.Root
            {...pt?.root}
            {...nativeProps}
            as={Element}
            ref={ref}
            className={classNames(
                'cratis-primereact-surface',
                pt?.root?.className,
                className,
            )}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
        />
    );
});

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies CratisPresentationSlotDeclaration<SlotId>;

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

/** PrimeReact 11 implementation of the stable Cratis presentation profile. */
export const primeReactUiLibrary: CratisPresentationUiLibrary =
    definePresentationUiLibrary({
        id: 'cratis-primereact',
        displayName: 'Cratis PrimeReact renderer',
        abi: CRATIS_PRESENTATION_ABI_VERSION,
        level: 'primitive',
        profile: CRATIS_PRESENTATION_PROFILE,
        profileSlots: cratisPresentationSlotIds,
        capabilities,
        slots,
        Provider: PrimeReactAdapterProvider,
    });
