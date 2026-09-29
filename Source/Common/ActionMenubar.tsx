// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Fragment, type ReactNode } from 'react';
import { Button, type ButtonParts, type ButtonSeverity, type ButtonTone } from './Button';
import { ToolbarFocusMode } from './ToolbarFocusMode';
import { useToolbarKeyboardNavigation } from './useToolbarKeyboardNavigation';
import { ToolbarRovingContext, useRovingTool } from './ToolbarRovingContext';

/** A single action in an {@link ActionMenubar}. */
export interface ActionMenuItem {
    /** The visible label. */
    label?: string;
    /** An icon element rendered before the label. */
    icon?: ReactNode;
    /** Invoked when the item is activated. */
    command?: () => void;
    /** When true, the item is greyed out and not clickable. */
    disabled?: boolean;
    /** Extra class name for the item. */
    className?: string;
    /** Severity styling for the action. */
    severity?: ButtonSeverity;
    /** Fully custom render for this item. */
    template?: (item: ActionMenuItem) => ReactNode;
}

/** Props for {@link ActionMenubar}. */
export interface ActionMenubarProps {
    /** Keyboard focus behavior (default: {@link ToolbarFocusMode.Arrows}). */
    focusMode?: ToolbarFocusMode;
    /** Actions to render from left to right. */
    model: ActionMenuItem[];
    /** Extra class name for the toolbar container. */
    className?: string;
    /** Accessible label for the toolbar. */
    'aria-label'?: string;
    /** Cratis-owned per-part attributes applied to each action button. */
    pt?: ButtonParts;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
}

const buttonToneForSeverity: Record<ButtonSeverity, ButtonTone> = {
    secondary: 'neutral',
    info: 'accent',
    help: 'accent',
    success: 'positive',
    warn: 'caution',
    danger: 'critical',
    contrast: 'neutral',
};

/** One Components-owned action button, which takes part in the menubar's single Tab stop. */
const ActionMenubarButton = ({ item, pt }: { item: ActionMenuItem; pt: ActionMenubarProps['pt'] }) => {
    // The consumer's pt.root tab index and focus handler are composed, because props passed
    // directly to Button take precedence over pt.root.
    const rovingTool = useRovingTool<HTMLButtonElement>(pt?.root?.tabIndex, pt?.root?.onFocus);
    return (
        <Button
            variant='ghost'
            tone={item.severity ? buttonToneForSeverity[item.severity] : undefined}
            onClick={item.command}
            disabled={item.disabled}
            className={item.className}
            icon={item.icon}
            label={item.label}
            pt={pt}
            ref={rovingTool.ref}
            tabIndex={rovingTool.tabIndex}
            onFocus={rovingTool.onFocus}
        />
    );
};

/** A horizontal, accessible toolbar of command actions. */
export const ActionMenubar = ({
    model,
    focusMode = ToolbarFocusMode.Arrows,
    className,
    pt,
    'aria-label': ariaLabel,
}: ActionMenubarProps) => {
    const { rootRef, onKeyDown, roving } = useToolbarKeyboardNavigation('horizontal', focusMode);
    return <div
        ref={rootRef}
        onKeyDown={onKeyDown}
        role='toolbar'
        className={['cratis-action-menubar', className].filter(Boolean).join(' ')}
        data-cratis-part='root'
        aria-label={ariaLabel}
    >
        <ToolbarRovingContext.Provider value={roving}>
        {model.map((item, index) => {
            if (item.template)
                return <Fragment key={index}>{item.template(item)}</Fragment>;

            return <ActionMenubarButton key={index} item={item} pt={pt} />;
        })}
        </ToolbarRovingContext.Provider>
    </div>;
};
