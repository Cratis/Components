// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ForwardedRef,
    type InputHTMLAttributes,
    type ReactElement,
    type ReactNode,
    type TextareaHTMLAttributes,
} from 'react';
import MuiButton from '@mui/material/Button';
import MuiCheckbox from '@mui/material/Checkbox';
import MuiIconButton from '@mui/material/IconButton';
import MuiInputBase from '@mui/material/InputBase';
import MuiLinearProgress from '@mui/material/LinearProgress';
import MuiPaper from '@mui/material/Paper';
import MuiRadio from '@mui/material/Radio';
import MuiSwitch from '@mui/material/Switch';
import MuiTooltip from '@mui/material/Tooltip';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
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
    type CratisPresentationCapabilityId,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies readonly CratisPresentationCapabilityId[]);

const MuiAdapterProvider = ({ children }: { readonly children: ReactNode }) => {
    const outerTheme = useTheme();
    const theme = useMemo(
        () =>
            outerTheme.vars
                ? outerTheme
                : createTheme({ ...outerTheme, cssVariables: true }),
        [outerTheme],
    );
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
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

const muiColorForTone = (tone: ButtonTone | undefined) => {
    switch (tone) {
        case 'neutral':
            return 'secondary';
        case 'positive':
            return 'success';
        case 'caution':
            return 'warning';
        case 'critical':
            return 'error';
        case 'accent':
        default:
            return 'primary';
    }
};

const muiVariant = (variant: 'solid' | 'outline' | 'ghost' | 'link') => {
    switch (variant) {
        case 'solid':
            return 'contained';
        case 'outline':
            return 'outlined';
        case 'ghost':
        case 'link':
            return 'text';
        default:
            throw new Error(`Unsupported Button variant '${String(variant)}'.`);
    }
};

const muiSize = (size: 'small' | 'normal' | 'large') =>
    size === 'normal' ? 'medium' : size;

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

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

interface MuiButtonContentProps {
    readonly icon: ReactNode;
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly pt: ButtonProps['pt'];
}

const MuiButtonContent = ({ icon, label, children, pt }: MuiButtonContentProps) => (
    <>
        {icon ? (
            <span
                {...pt?.icon}
                className={classNames('cratis-mui-button__icon', pt?.icon?.className)}
                data-cratis-part='icon'
                aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
            >
                {renderIcon(icon)}
            </span>
        ) : null}
        {label !== undefined || children !== undefined ? (
            <span
                {...pt?.label}
                className={classNames('cratis-mui-button__label', pt?.label?.className)}
                data-cratis-part='label'
            >
                {label}
                {children}
            </span>
        ) : null}
    </>
);

const muiButtonStyles = (appearance: ResolvedButtonAppearance) => ({
    borderRadius: appearance.shape === 'pill' ? 9999 : undefined,
    textTransform: appearance.variant === 'link' ? 'none' : undefined,
    padding: appearance.variant === 'link' ? 0 : undefined,
    minWidth: appearance.variant === 'link' ? 0 : undefined,
});

const muiLoadingIndicator = (pt: ButtonProps['pt']) => (
    <span
        {...pt?.spinner}
        className={classNames('cratis-mui-button__spinner', pt?.spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const withMuiTooltip = (
    element: ReactElement,
    tooltip: string | undefined,
    options: ButtonProps['tooltipOptions'],
) => {
    if (!tooltip) return element;
    return (
        <MuiTooltip
            title={tooltip}
            placement={options?.position}
            classes={{ tooltip: options?.className ?? '' }}
        >
            {element}
        </MuiTooltip>
    );
};

const MuiButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(function MuiButtonSlot(
    {
        label,
        icon,
        loading = false,
        tooltip,
        tooltipOptions,
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
        autoFocus,
        onClick,
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
    const button = (
        <MuiButton
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            title={title}
            autoFocus={autoFocus}
            disabled={effectiveDisabled}
            onClick={onClick}
            className={classNames('cratis-mui-button', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            variant={muiVariant(appearance.variant)}
            color={muiColorForTone(appearance.tone)}
            size={muiSize(size)}
            loading={loading}
            loadingIndicator={muiLoadingIndicator(pt)}
            sx={muiButtonStyles(appearance)}
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
            <MuiButtonContent icon={loading ? undefined : icon} label={label} pt={pt}>
                {children}
            </MuiButtonContent>
        </MuiButton>
    );
    return withMuiTooltip(button, tooltip, tooltipOptions);
});

const MuiIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function MuiIconButtonSlot(
        {
            icon,
            loading = false,
            tooltip,
            tooltipOptions,
            pt,
            variant,
            tone,
            shape = 'pill',
            text,
            link,
            outlined,
            rounded,
            severity,
            size = 'normal',
            disabled,
            type = 'button',
            title,
            autoFocus,
            onClick,
            className,
            style,
            'aria-label': ariaLabel,
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
        const button = (
            <MuiIconButton
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                type={type}
                title={title}
                autoFocus={autoFocus}
                disabled={effectiveDisabled}
                onClick={onClick}
                className={classNames(
                    'cratis-mui-icon-button',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                color={muiColorForTone(appearance.tone)}
                size={muiSize(size)}
                loading={loading}
                loadingIndicator={muiLoadingIndicator(pt)}
                sx={{ borderRadius: appearance.shape === 'pill' ? '50%' : 1 }}
                aria-label={ariaLabel}
                aria-busy={loading || undefined}
                data-cratis-part='root'
                data-variant={appearance.variant}
                data-tone={appearance.tone}
                data-severity={appearance.severity}
                data-shape={appearance.shape}
                data-size={size}
                data-disabled={effectiveDisabled || undefined}
                data-loading={loading || undefined}
                data-icon-only='true'
            >
                {!loading && (
                    <span
                        {...pt?.icon}
                        className={classNames(
                            'cratis-mui-button__icon',
                            pt?.icon?.className,
                        )}
                        data-cratis-part='icon'
                        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
                    >
                        {renderIcon(icon)}
                    </span>
                )}
            </MuiIconButton>
        );
        return withMuiTooltip(button, tooltip, tooltipOptions);
    },
);

const MuiTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function MuiTextInputSlot(
        {
            type = 'text',
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
        const inputProps: InputHTMLAttributes<HTMLInputElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            type,
            disabled: effectiveDisabled,
            readOnly: effectiveReadOnly,
            'aria-invalid': effectiveAriaInvalid,
            onChange: (event) => {
                pt?.root?.onChange?.(event);
                onChange?.(event.currentTarget.value, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            },
            className: classNames(
                'cratis-mui-text-input',
                pt?.root?.className,
                className,
            ),
            style: { ...pt?.root?.style, ...style },
            'data-cratis-part': 'root',
            'data-disabled': effectiveDisabled || undefined,
            'data-invalid': effectiveInvalid || undefined,
            'data-readonly': effectiveReadOnly || undefined,
        };
        return (
            <MuiInputBase
                inputRef={ref}
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                error={effectiveInvalid}
                inputProps={inputProps}
            />
        );
    },
);

const MuiTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function MuiTextAreaSlot(
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
        const inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            disabled: effectiveDisabled,
            readOnly: effectiveReadOnly,
            'aria-invalid': effectiveAriaInvalid,
            onChange: (event) => {
                pt?.root?.onChange?.(event);
                onChange?.(event.currentTarget.value, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            },
            className: classNames('cratis-mui-text-area', pt?.root?.className, className),
            style: { ...pt?.root?.style, ...style },
            'data-cratis-part': 'root',
            'data-disabled': effectiveDisabled || undefined,
            'data-invalid': effectiveInvalid || undefined,
            'data-readonly': effectiveReadOnly || undefined,
        };
        return (
            <MuiInputBase
                inputRef={ref}
                multiline
                inputComponent='textarea'
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                error={effectiveInvalid}
                inputProps={inputProps}
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
    options: { readonly observeRadioGroup?: boolean } = {},
) => {
    const observeRadioGroup = options.observeRadioGroup ?? false;
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
        Boolean(defaultChecked),
    );
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
        const synchronize = () =>
            queueMicrotask(() => setUncontrolledChecked(input.checked));
        const form = input.form;
        form?.addEventListener('reset', synchronize);
        if (observeRadioGroup)
            input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup)
                input.ownerDocument.removeEventListener('change', synchronize);
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

type NativeInputSlotProps = InputHTMLAttributes<HTMLInputElement> &
    React.RefAttributes<HTMLInputElement> &
    DataAttributes;

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

type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
type ChoiceKind = 'checkbox' | 'radio' | 'switch';

interface MuiChoiceProps {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}

type ChoiceStateAttributes = ReturnType<typeof stateAttributes>;

interface ResolvedMuiChoice {
    readonly parts: ChoiceParts | undefined;
    readonly inputPart: InputHTMLAttributes<HTMLInputElement> | undefined;
    readonly checked: boolean | undefined;
    readonly defaultChecked: boolean | undefined;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: InputHTMLAttributes<HTMLInputElement>['aria-invalid'];
    readonly state: ReturnType<typeof useNativeCheckedState>;
    readonly attributes: ChoiceStateAttributes;
}

const useResolvedMuiChoice = (
    kind: ChoiceKind,
    props: ChoiceProps,
    forwardedRef: ForwardedRef<HTMLInputElement>,
): ResolvedMuiChoice => {
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
    const state = useNativeCheckedState(checked, defaultChecked, forwardedRef, {
        observeRadioGroup: kind === 'radio',
    });
    return {
        parts,
        inputPart,
        checked,
        defaultChecked,
        disabled,
        readOnly,
        ariaInvalid,
        state,
        attributes: stateAttributes(disabled, invalid, readOnly, state.selected),
    };
};

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
        'aria-readonly': kind === 'switch' ? readOnly || undefined : undefined,
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

const MuiCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function MuiCheckboxSlot(props, ref) {
        return <MuiChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

const MuiRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function MuiRadioSlot(props, ref) {
        return <MuiChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

const MuiSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function MuiSwitchSlot(props, ref) {
        return <MuiChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);

const MuiProgressSlot = ({
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
            role='progressbar'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={determinate ? 0 : undefined}
            aria-valuemax={determinate ? 100 : undefined}
            aria-valuenow={determinate ? boundedValue : undefined}
            className={classNames('cratis-mui-progress', className)}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            <MuiLinearProgress
                variant={determinate ? 'determinate' : 'indeterminate'}
                value={determinate ? boundedValue : undefined}
                role='presentation'
                aria-hidden='true'
                data-cratis-part='indicator'
            />
            {determinate && showValue && (
                <span data-cratis-part='label'>{boundedValue}%</span>
            )}
        </div>
    );
};

const MuiSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(function MuiSurfaceSlot(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
    return (
        <MuiPaper
            {...pt?.root}
            {...nativeProps}
            component={Element}
            ref={ref}
            className={classNames('cratis-mui-surface', pt?.root?.className, className)}
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
    'common.button': declaration<'common.button'>(MuiButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(MuiIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(MuiTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(MuiTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(MuiCheckboxSlot),
    'common.radio': declaration<'common.radio'>(MuiRadioSlot),
    'common.switch': declaration<'common.switch'>(MuiSwitchSlot),
    'common.progress': declaration<'common.progress'>(MuiProgressSlot),
    'common.surface': declaration<'common.surface'>(MuiSurfaceSlot),
});

/** Material UI implementation of the stable Cratis presentation profile. */
export const muiUiLibrary: CratisPresentationUiLibrary = definePresentationUiLibrary({
    id: 'cratis-mui',
    displayName: 'Cratis Material UI renderer',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities,
    slots,
    Provider: MuiAdapterProvider,
});
