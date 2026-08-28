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
} from '@cratis/components/renderer';

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
    'rtl',
    'forcedColors',
    'motion.reduced',
] satisfies readonly CratisPresentationCapabilityId[]);

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

interface PlainButtonContentProps {
    readonly loading: boolean;
    readonly icon: ReactNode;
    readonly label: ReactNode;
    readonly children: ReactNode;
    readonly pt: ButtonProps['pt'];
}

const PlainButtonContent = ({
    loading,
    icon,
    label,
    children,
    pt,
}: PlainButtonContentProps) => {
    const leading = loading ? (
        <span
            {...pt?.spinner}
            className={classNames('plain-dom-button__spinner', pt?.spinner?.className)}
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
    ) : null;
    const content =
        label !== undefined || children !== undefined ? (
            <span
                {...pt?.label}
                className={classNames('plain-dom-button__label', pt?.label?.className)}
                data-cratis-part='label'
            >
                {label}
                {children}
            </span>
        ) : null;
    return (
        <>
            {leading}
            {content}
        </>
    );
};

const PlainButton = forwardRef<HTMLButtonElement, ButtonProps>(function PlainButton(
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
    const selectedVariant =
        variant ?? (link ? 'link' : text ? 'ghost' : outlined ? 'outline' : 'solid');
    const selectedTone = tone ?? (severity ? toneForSeverity[severity] : undefined);
    const selectedShape = shape ?? (rounded ? 'pill' : 'default');
    const legacySeverity = tone ? severityForTone[tone] : severity;
    const effectiveDisabled = Boolean(disabled || loading);
    const iconOnly = Boolean(icon) && label === undefined && !children;
    return (
        <button
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type={type}
            title={title ?? tooltip}
            disabled={effectiveDisabled}
            className={classNames('plain-dom-button', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-variant={selectedVariant}
            data-tone={selectedTone}
            data-severity={legacySeverity}
            data-shape={selectedShape}
            data-size={size}
            data-disabled={effectiveDisabled || undefined}
            data-loading={loading || undefined}
            data-icon-only={iconOnly || undefined}
            aria-busy={loading || undefined}
        >
            <PlainButtonContent loading={loading} icon={icon} label={label} pt={pt}>
                {children}
            </PlainButtonContent>
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

interface ResolvedChoiceState {
    readonly input: CheckableState;
    readonly attributes: ReturnType<typeof stateAttributes>;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: InputHTMLAttributes<HTMLInputElement>['aria-invalid'];
    readonly checked: boolean | undefined;
    readonly defaultChecked: boolean | undefined;
}

const useResolvedChoiceState = (
    props: ChoiceProps,
    inputPt: InputHTMLAttributes<HTMLInputElement> | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
): ResolvedChoiceState => {
    const checked = props.checked ?? inputPt?.checked;
    const defaultChecked = props.defaultChecked ?? inputPt?.defaultChecked;
    const disabled = props.disabled ?? inputPt?.disabled;
    const readOnly = props.readOnly ?? inputPt?.readOnly;
    const ariaInvalid =
        props['aria-invalid'] ??
        inputPt?.['aria-invalid'] ??
        (props.invalid || undefined);
    const invalid = props.invalid || ariaInvalid === true || ariaInvalid === 'true';
    const input = useCheckableState(checked, defaultChecked, forwardedRef);
    return {
        input,
        attributes: stateAttributes(disabled, invalid, readOnly, input.selected),
        disabled,
        readOnly,
        ariaInvalid,
        checked,
        defaultChecked,
    };
};

interface PlainChoiceVisualProps {
    readonly kind: ChoiceKind;
    readonly parts: ChoiceParts | undefined;
    readonly attributes: ReturnType<typeof stateAttributes>;
    readonly label: ReactNode;
}

const PlainChoiceVisual = ({
    kind,
    parts,
    attributes,
    label,
}: PlainChoiceVisualProps) => {
    const labelPt = parts?.label;
    if (kind === 'switch') {
        const switchParts = parts as SwitchParts | undefined;
        return (
            <>
                <span
                    {...switchParts?.control}
                    className={classNames(
                        'plain-dom-switch__control',
                        switchParts?.control?.className,
                    )}
                    data-cratis-part='control'
                    aria-hidden='true'
                    {...attributes}
                >
                    <span
                        {...switchParts?.handle}
                        className={classNames(
                            'plain-dom-switch__handle',
                            switchParts?.handle?.className,
                        )}
                        data-cratis-part='handle'
                        {...attributes}
                    />
                </span>
                {label !== undefined && (
                    <span
                        {...labelPt}
                        className={classNames(
                            'plain-dom-choice__label',
                            labelPt?.className,
                        )}
                        data-cratis-part='label'
                        {...attributes}
                    >
                        {label}
                    </span>
                )}
            </>
        );
    }

    const checkableParts = parts as CheckboxParts | RadioParts | undefined;
    return (
        <>
            <span
                {...checkableParts?.box}
                className={classNames(
                    kind === 'radio' ? 'plain-dom-radio__box' : 'plain-dom-checkbox__box',
                    checkableParts?.box?.className,
                )}
                data-cratis-part='box'
                aria-hidden='true'
                {...attributes}
            >
                <span
                    {...checkableParts?.indicator}
                    className={classNames(
                        kind === 'radio'
                            ? 'plain-dom-radio__indicator'
                            : 'plain-dom-checkbox__indicator',
                        checkableParts?.indicator?.className,
                    )}
                    data-cratis-part='indicator'
                    {...attributes}
                >
                    {kind === 'checkbox' ? '✓' : undefined}
                </span>
            </span>
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
        </>
    );
};

const PlainChoice = ({ kind, props, forwardedRef }: PlainChoiceProps) => {
    const pt = props.pt as ChoiceParts | undefined;
    const inputPt = pt?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
    const resolved = useResolvedChoiceState(props, inputPt, forwardedRef);
    const {
        label,
        readOnly: _readOnly,
        invalid: _invalid,
        onChange,
        className,
        style,
        pt: _choiceParts,
        checked: _checked,
        defaultChecked: _defaultChecked,
        disabled: _disabled,
        onClick,
        'aria-invalid': _ariaInvalid,
        ...nativeProps
    } = props;
    const rootPt = pt?.root;
    const radioProps = props as RadioProps;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        inputPt?.onChange?.(event);
        if (resolved.readOnly || (kind === 'radio' && !event.currentTarget.checked))
            return;
        resolved.input.setSelected(event.currentTarget.checked);
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
            {...resolved.attributes}
        >
            <input
                {...inputPt}
                {...nativeProps}
                ref={resolved.input.ref}
                type={kind === 'radio' ? 'radio' : 'checkbox'}
                role={kind === 'switch' ? 'switch' : undefined}
                name={kind === 'radio' ? radioProps.name : nativeProps.name}
                value={kind === 'radio' ? radioProps.value : nativeProps.value}
                checked={resolved.checked}
                defaultChecked={
                    resolved.checked === undefined ? resolved.defaultChecked : undefined
                }
                disabled={resolved.disabled}
                readOnly={undefined}
                aria-invalid={resolved.ariaInvalid}
                aria-readonly={resolved.readOnly || undefined}
                onClick={(event) => {
                    inputPt?.onClick?.(event);
                    onClick?.(event);
                    if (resolved.readOnly) event.preventDefault();
                }}
                onChange={handleChange}
                className={classNames('plain-dom-choice__input', inputPt?.className)}
                data-cratis-part='input'
                {...resolved.attributes}
            />
            <PlainChoiceVisual
                kind={kind}
                parts={pt}
                attributes={resolved.attributes}
                label={label}
            />
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

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies CratisPresentationSlotDeclaration<SlotId>;

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
export const plainDomPresentationRenderer = definePresentationUiLibrary({
    id: 'plain-dom-falsification-fixture',
    displayName: 'Plain DOM falsification fixture',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities,
    slots,
});
