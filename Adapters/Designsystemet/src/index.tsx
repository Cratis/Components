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
    type CSSProperties,
    type ForwardedRef,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactElement,
    type SVGAttributes,
    type ReactNode,
    type Ref,
} from 'react';
import {
    Button as DsButton,
    Card as DsCard,
    Field as DsField,
    Input as DsInput,
    Label as DsLabel,
    Spinner as DsSpinner,
    Textarea as DsTextarea,
    Tooltip as DsTooltip,
} from '@digdir/designsystemet-react';
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
    type CratisPresentationCapabilities,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';

const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

/** Cratis button variants, as resolved from the current and deprecated props. */
type CratisButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

/** Designsystemet button variants. */
type DesignsystemetButtonVariant = 'primary' | 'secondary' | 'tertiary';

/** Designsystemet size modes. `undefined` leaves the inherited size mode in force. */
type DesignsystemetSize = 'sm' | 'lg' | undefined;

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

const colorForTone: Readonly<Record<ButtonTone, string>> = {
    neutral: 'neutral',
    accent: 'accent',
    positive: 'success',
    caution: 'warning',
    critical: 'danger',
};

const variantForCratis: Readonly<Record<CratisButtonVariant, DesignsystemetButtonVariant>> = {
    solid: 'primary',
    outline: 'secondary',
    ghost: 'tertiary',
    link: 'tertiary',
};

/**
 * Maps a Cratis button size to a Designsystemet size mode. `normal` is left unset on purpose so a
 * `data-size` on an enclosing container (a form, a toolbar) keeps governing the button.
 */
const sizeMode = (size: 'small' | 'normal' | 'large' | undefined): DesignsystemetSize => {
    if (size === 'small') return 'sm';
    if (size === 'large') return 'lg';
    return undefined;
};

/** Maps a Cratis tone to a Designsystemet `data-color` value; `undefined` keeps the inherited color. */
const colorForCratisTone = (tone: ButtonTone | undefined) =>
    tone ? colorForTone[tone] : undefined;

/** Maps a Cratis variant to the Designsystemet variant. */
const designsystemetVariant = (variant: CratisButtonVariant) => variantForCratis[variant];

/** The button appearance resolved from the current and deprecated Cratis props. */
interface ResolvedButtonAppearance {
    readonly variant: CratisButtonVariant;
    readonly tone: ButtonTone | undefined;
    readonly shape: 'default' | 'pill';
    readonly severity: ButtonSeverity | undefined;
}

type AppearanceOptions = Pick<
    ButtonProps,
    'variant' | 'tone' | 'shape' | 'text' | 'link' | 'outlined' | 'rounded' | 'severity'
>;

const resolveVariant = ({ variant, link, text, outlined }: AppearanceOptions): CratisButtonVariant => {
    if (variant) return variant;
    if (link) return 'link';
    if (text) return 'ghost';
    if (outlined) return 'outline';
    return 'solid';
};

/** Resolves the Cratis variant, tone and shape, honouring the deprecated boolean props. */
const resolveButtonAppearance = (options: AppearanceOptions): ResolvedButtonAppearance => {
    const { tone, shape, rounded, severity } = options;
    return {
        variant: resolveVariant(options),
        tone: tone ?? (severity ? toneForSeverity[severity] : undefined),
        shape: shape ?? (rounded ? 'pill' : 'default'),
        severity: tone ? severityForTone[tone] : severity,
    };
};

const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

const warnedDeprecatedProps = new Set<string>();

const warnForDeprecatedProps = (props: Readonly<Record<string, unknown>>) => {
    const environment = (
        globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }
    ).process?.env?.NODE_ENV;
    if (environment === 'production') return;
    for (const prop of ['text', 'link', 'outlined', 'rounded', 'severity']) {
        if (props[prop] === undefined || warnedDeprecatedProps.has(prop)) continue;
        warnedDeprecatedProps.add(prop);
        console.warn(
            `Button prop "${prop}" is deprecated and will be removed in 5.0. Use variant, tone, or shape instead.`,
        );
    }
};

const withTooltip = (
    element: ReactElement,
    tooltip: string | undefined,
    options: ButtonProps['tooltipOptions'],
) =>
    tooltip ? (
        <DsTooltip content={tooltip} placement={options?.position}>
            {element}
        </DsTooltip>
    ) : (
        element
    );

const spinnerFor = (pt: ButtonProps['pt']) => (
    <DsSpinner
        {...(pt?.spinner as SVGAttributes<SVGSVGElement> | undefined)}
        className={classNames('cratis-designsystemet-button__spinner', pt?.spinner?.className)}
        data-cratis-part='spinner'
        aria-hidden='true'
    />
);

const iconFor = (icon: ReactNode, pt: ButtonProps['pt']) => (
    <span
        {...pt?.icon}
        className={classNames('cratis-designsystemet-button__icon', pt?.icon?.className)}
        data-cratis-part='icon'
        aria-hidden={pt?.icon?.['aria-hidden'] ?? true}
    >
        {renderIcon(icon)}
    </span>
);

const labelFor = (label: ReactNode, children: ReactNode, pt: ButtonProps['pt']) =>
    label !== undefined || children !== undefined ? (
        <span
            {...pt?.label}
            className={classNames('cratis-designsystemet-button__label', pt?.label?.className)}
            data-cratis-part='label'
        >
            {label}
            {children}
        </span>
    ) : null;

/**
 * Designsystemet owns `data-size` as an inherited size mode and `data-variant`/`data-color` as its
 * own appearance vocabulary. The Cratis values for those attributes (`normal`, `solid`, ...) are
 * therefore never forwarded; they are translated by {@link sizeMode} and friends.
 */
const MappedButton = forwardRef<
    HTMLButtonElement,
    ButtonProps & { readonly iconOnly: boolean; readonly rootClassName: string }
>(function MappedButton(props, ref) {
    const {
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
        size,
        disabled,
        type = 'button',
        className,
        style,
        children,
        iconOnly,
        rootClassName,
        ...nativeProps
    } = props;
    warnForDeprecatedProps({ text, link, outlined, rounded, severity });
    const appearance = resolveButtonAppearance({ variant, tone, shape, text, link, outlined, rounded, severity });
    const effectiveDisabled = Boolean(disabled || loading);
    const button = (
        <DsButton
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            disabled={effectiveDisabled}
            className={classNames(rootClassName, pt?.root?.className, className)}
            style={{
                ...pt?.root?.style,
                ...style,
                ...(appearance.shape === 'pill' ? { borderRadius: '9999px' } : undefined),
            }}
            variant={designsystemetVariant(appearance.variant)}
            icon={iconOnly}
            loading={loading ? spinnerFor(pt) : false}
            data-size={sizeMode(size)}
            data-color={colorForCratisTone(appearance.tone)}
            data-cratis-part='root'
            data-cratis-variant={appearance.variant}
            data-tone={appearance.tone}
            data-severity={appearance.severity}
            data-shape={appearance.shape}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            data-icon-only={iconOnly || undefined}
        >
            {icon && !loading ? iconFor(icon, pt) : null}
            {labelFor(label, children, pt)}
        </DsButton>
    );
    return withTooltip(button, tooltip, tooltipOptions);
});

/** Designsystemet implementation of `common.button`. */
const DesignsystemetButtonSlot = forwardRef<HTMLButtonElement, ButtonProps>(
    function DesignsystemetButtonSlot(props, ref) {
        const iconOnly = Boolean(props.icon) && props.label === undefined && !props.children;
        return (
            <MappedButton
                {...props}
                ref={ref}
                iconOnly={iconOnly}
                rootClassName='cratis-designsystemet-button'
            />
        );
    },
);

/** Designsystemet implementation of `common.iconButton`. */
const DesignsystemetIconButtonSlot = forwardRef<HTMLButtonElement, IconButtonProps>(
    function DesignsystemetIconButtonSlot(props, ref) {
        return (
            <MappedButton
                {...props}
                ref={ref}
                shape={props.shape ?? 'pill'}
                label={undefined}
                iconOnly
                rootClassName='cratis-designsystemet-icon-button'
            />
        );
    },
);

type AriaInvalid = TextInputProps['aria-invalid'];

const resolveInvalid = (
    invalid: boolean,
    ariaInvalid: AriaInvalid,
    partAriaInvalid: AriaInvalid,
) => {
    const effective = ariaInvalid ?? partAriaInvalid ?? (invalid || undefined);
    return {
        ariaInvalid: effective,
        invalid: invalid || effective === true || effective === 'true',
    };
};

/** Designsystemet implementation of `common.textInput`. */
const DesignsystemetTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function DesignsystemetTextInputSlot(
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
        const state = resolveInvalid(invalid, ariaInvalid, pt?.root?.['aria-invalid']);
        return (
            <DsInput
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                aria-invalid={state.ariaInvalid}
                onChange={(event) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames('cratis-designsystemet-text-input', pt?.root?.className, className)}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={state.invalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
            />
        );
    },
);

/** Designsystemet implementation of `common.textArea`. */
const DesignsystemetTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function DesignsystemetTextAreaSlot(
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
        const state = resolveInvalid(invalid, ariaInvalid, pt?.root?.['aria-invalid']);
        return (
            <DsTextarea
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                aria-invalid={state.ariaInvalid}
                onChange={(event) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={classNames('cratis-designsystemet-text-area', pt?.root?.className, className)}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={state.invalid || undefined}
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

const DesignsystemetChoice = ({
    kind,
    props,
    forwardedRef,
}: {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}) => {
    const generatedId = useId();
    const parts = props.pt as ChoiceParts | undefined;
    const inputPart = parts?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
    const checked = props.checked ?? inputPart?.checked;
    const defaultChecked = props.defaultChecked ?? inputPart?.defaultChecked;
    const disabled = props.disabled ?? inputPart?.disabled;
    const readOnly = props.readOnly ?? inputPart?.readOnly;
    const ariaInvalid =
        props['aria-invalid'] ?? inputPart?.['aria-invalid'] ?? (props.invalid || undefined);
    const invalid = Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true';
    const state = useNativeCheckedState(checked, defaultChecked, forwardedRef, kind === 'radio');
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
        id,
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
    const inputId = id ?? inputPart?.id ?? generatedId;
    const labelPart = parts?.label as HTMLAttributes<HTMLLabelElement> | undefined;
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        partOnChange?.(event);
        if (readOnly || (kind === 'radio' && !event.currentTarget.checked)) return;
        state.synchronize(event.currentTarget.checked);
        onChange?.(event.currentTarget.checked, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };
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
                type={kind === 'radio' ? 'radio' : 'checkbox'}
                role={kind === 'switch' ? 'switch' : nativeProps.role}
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                readOnly={readOnly}
                aria-invalid={ariaInvalid}
                aria-readonly={kind === 'radio' ? undefined : readOnly || undefined}
                className={classNames('cratis-designsystemet-choice__input', inputClassName)}
                style={inputStyle}
                data-cratis-part='input'
                {...attributes}
                onChange={handleChange}
                onClick={(event) => {
                    partOnClick?.(event);
                    onClick?.(event);
                    if (readOnly) event.preventDefault();
                }}
            />
            <VisualPart kind={kind} parts={parts} attributes={attributes} />
            {label !== undefined && (
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
            )}
        </DsField>
    );
};

/** Designsystemet implementation of `common.checkbox`. */
const DesignsystemetCheckboxSlot = forwardRef<HTMLInputElement, CheckboxProps>(
    function DesignsystemetCheckboxSlot(props, ref) {
        return <DesignsystemetChoice kind='checkbox' props={props} forwardedRef={ref} />;
    },
);

/** Designsystemet implementation of `common.radio`. */
const DesignsystemetRadioSlot = forwardRef<HTMLInputElement, RadioProps>(
    function DesignsystemetRadioSlot(props, ref) {
        return <DesignsystemetChoice kind='radio' props={props} forwardedRef={ref} />;
    },
);

/** Designsystemet implementation of `common.switch`. */
const DesignsystemetSwitchSlot = forwardRef<HTMLInputElement, SwitchProps>(
    function DesignsystemetSwitchSlot(props, ref) {
        return <DesignsystemetChoice kind='switch' props={props} forwardedRef={ref} />;
    },
);

const trackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--ds-size-2)',
};

const barStyle: CSSProperties = {
    flex: 1,
    height: 'var(--ds-size-2)',
    borderRadius: 'var(--ds-border-radius-full)',
    background: 'var(--ds-color-neutral-surface-tinted)',
    overflow: 'hidden',
};

const fillStyle = (value: number): CSSProperties => ({
    width: `${value}%`,
    height: '100%',
    background: 'var(--ds-color-accent-base-default)',
});

/**
 * Designsystemet ships no progress bar, so the determinate indicator is a token-styled track and
 * the indeterminate one is the Designsystemet Spinner.
 */
const DesignsystemetProgressSlot = ({
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
            className={classNames('cratis-designsystemet-progress', className)}
            style={trackStyle}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            {determinate ? (
                <div style={barStyle} aria-hidden='true' data-cratis-part='indicator'>
                    <div style={fillStyle(boundedValue)} />
                </div>
            ) : (
                <DsSpinner aria-hidden='true' data-cratis-part='indicator' />
            )}
            {determinate && showValue && <span data-cratis-part='label'>{boundedValue}%</span>}
        </div>
    );
};

/** Designsystemet implementation of `common.surface`. */
const DesignsystemetSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(
    function DesignsystemetSurfaceSlot(
        { as: Element = 'div', pt, className, style, ...nativeProps },
        ref,
    ) {
        return (
            <DsCard asChild ref={ref as Ref<HTMLDivElement>}>
                <Element
                    {...pt?.root}
                    {...nativeProps}
                    className={classNames('cratis-designsystemet-surface', pt?.root?.className, className)}
                    style={{ ...pt?.root?.style, ...style }}
                    data-cratis-part='root'
                />
            </DsCard>
        );
    },
);

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies CratisPresentationCapabilities);

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies CratisPresentationSlotDeclaration<SlotId>;

const slots = Object.freeze({
    'common.button': declaration<'common.button'>(DesignsystemetButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(DesignsystemetIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(DesignsystemetTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(DesignsystemetTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(DesignsystemetCheckboxSlot),
    'common.radio': declaration<'common.radio'>(DesignsystemetRadioSlot),
    'common.switch': declaration<'common.switch'>(DesignsystemetSwitchSlot),
    'common.progress': declaration<'common.progress'>(DesignsystemetProgressSlot),
    'common.surface': declaration<'common.surface'>(DesignsystemetSurfaceSlot),
});

/** Digdir Designsystemet implementation of the stable Cratis presentation profile. */
export const designsystemetUiLibrary: CratisPresentationUiLibrary = definePresentationUiLibrary({
    id: 'cratis-designsystemet',
    displayName: 'Cratis Designsystemet renderer',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities,
    slots,
});
