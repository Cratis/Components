// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { DropdownProps } from './Dropdown';

export type DropdownParts = DropdownProps['pt'];

/** A data attribute value that is present only when its state is on. */
export const flag = (on: boolean | undefined): true | undefined => on || undefined;

/** The first value that is neither null nor undefined. */
export const firstDefined = <V,>(...values: Array<V | null | undefined>): V | undefined =>
    values.find((candidate) => candidate !== null && candidate !== undefined) ?? undefined;

export const popoverClassName = (pt: DropdownParts, panelClassName: string | undefined) =>
    classNames('cratis-dropdown__popover', pt?.popover?.className, panelClassName);

export const popoverStyle = (pt: DropdownParts, zIndex: string) => ({ zIndex, ...pt?.popover?.style });
