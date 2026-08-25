// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Fragment, type ReactNode } from 'react';
import { Button, type ButtonParts, type ButtonSeverity } from './Button';

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

/** A horizontal, accessible toolbar of command actions. */
export const ActionMenubar = ({
    model,
    className,
    pt,
    'aria-label': ariaLabel,
}: ActionMenubarProps) => (
    <div
        role='toolbar'
        className={['cratis-action-menubar', className].filter(Boolean).join(' ')}
        data-cratis-part='root'
        aria-label={ariaLabel}
    >
        {model.map((item, index) => {
            if (item.template)
                return <Fragment key={index}>{item.template(item)}</Fragment>;

            return (
                <Button
                    key={index}
                    text
                    severity={item.severity}
                    onClick={item.command}
                    disabled={item.disabled}
                    className={item.className}
                    icon={item.icon}
                    label={item.label}
                    pt={pt}
                />
            );
        })}
    </div>
);
