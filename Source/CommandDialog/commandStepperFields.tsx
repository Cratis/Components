// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { CommandFormFieldWrapper } from '@cratis/arc.react/commands';
import { isCommandFormField } from '../CommandForm/commandFormMarkers';

/** Extracts the property name from an accessor function like `c => c.name`. */
const getPropertyName = (accessor: ((obj: unknown) => unknown) | unknown): string => {
    if (typeof accessor !== 'function') return '';
    const fnStr = accessor.toString();
    const match = fnStr.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
};

const fieldNameOf = (child: React.ReactElement): string => {
    const component = child.type as React.ComponentType<unknown>;
    if (!isCommandFormField(component)) return '';
    const fieldProps = child.props as { value?: (obj: unknown) => unknown };
    return getPropertyName(fieldProps.value);
};

/** Recursively collects all CommandFormField property names from a React node tree. */
export const extractFieldNamesFromNode = (nodes: React.ReactNode): string[] => {
    const names: string[] = [];
    React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child)) return;
        const name = fieldNameOf(child);
        if (name) names.push(name);

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            names.push(
                ...extractFieldNamesFromNode(childProps.children as React.ReactNode),
            );
        }
    });
    return names;
};

/** Wraps every CommandFormField in the tree with the Arc field wrapper. */
export const processChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (child) => {
        if (!React.isValidElement(child)) return child;

        const component = child.type as React.ComponentType<unknown>;
        if (isCommandFormField(component)) {
            type FieldElement = Parameters<typeof CommandFormFieldWrapper>[0]['field'];
            // SAFETY: displayName identifies the Arc command field shape before it reaches the wrapper.
            return <CommandFormFieldWrapper field={child as unknown as FieldElement} />;
        }

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            return React.cloneElement(
                child as React.ReactElement<Record<string, unknown>>,
                {
                    children: processChildren(childProps.children as React.ReactNode),
                },
            );
        }

        return child;
    });
};
