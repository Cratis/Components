// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Button } from 'primereact/button';
import './ActionMenubar.css';

/** A single action in an {@link ActionMenubar}. */
export interface ActionMenuItem {
    /** The visible label. */
    label?: string;
    /** An icon element rendered before the label. */
    icon?: React.ReactNode;
    /** Invoked when the item is activated. */
    command?: () => void;
    /** When true, the item is greyed out and not clickable. */
    disabled?: boolean;
    /** Extra class name for the item. */
    className?: string;
    /** Severity styling for the underlying button (e.g. `danger`). */
    severity?: 'secondary' | 'info' | 'success' | 'warn' | 'help' | 'danger' | 'contrast';
    /** Fully custom render for this item; when present it replaces the default button. */
    template?: (item: ActionMenuItem) => React.ReactNode;
}

/** Props for {@link ActionMenubar}. */
export interface ActionMenubarProps {
    /** The actions to render, left to right. */
    model: ActionMenuItem[];
    /** Extra class name for the toolbar container. */
    className?: string;
    /** Accessible label for the toolbar. */
    'aria-label'?: string;
}

/**
 * A horizontal bar of command actions. Replaces the PrimeReact 10 `Menubar`
 * (removed in PrimeReact 11, and never a great fit for a bar of *actions*
 * rather than navigation) with a simple button toolbar driven by the same
 * `model` array shape. Each item is a text `Button` unless it supplies a
 * `template`.
 */
export const ActionMenubar = ({ model, className, ...rest }: ActionMenubarProps) => (
    <div
        role="toolbar"
        className={className ? `cratis-action-menubar ${className}` : 'cratis-action-menubar'}
        {...rest}>
        {model.map((item, index) => {
            if (item.template) {
                return <React.Fragment key={index}>{item.template(item)}</React.Fragment>;
            }

            return (
                <Button
                    key={index}
                    variant="text"
                    severity={item.severity}
                    onClick={item.command}
                    disabled={item.disabled}
                    className={item.className}>
                    {item.icon}
                    {item.label && <span>{item.label}</span>}
                </Button>
            );
        })}
    </div>
);
