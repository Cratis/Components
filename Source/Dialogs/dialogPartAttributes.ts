// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { classNames } from '../ClassNames/classNames';

interface PartAttributes {
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Merges a consumer's `pt` part attributes over a dialog part's own class and style.
 * @param part The consumer's attributes for the part, when any.
 * @param className The part's own class name.
 * @param style A style that replaces the consumer's, when the part computes one.
 * @param extraClassName A trailing class name, such as the host's `className`.
 * @returns The attributes to spread onto the part element.
 */
export const dialogPartAttributes = <T extends PartAttributes>(
    part: T | undefined,
    className: string,
    style?: React.CSSProperties,
    extraClassName?: string,
) => ({
    ...part,
    className: classNames(className, part?.className, extraClassName),
    style: style ?? part?.style,
});
