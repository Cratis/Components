// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import type { ButtonProps } from 'react-aria-components/Button';
import type { ListBoxItemProps, ListBoxProps } from 'react-aria-components/Select';

// React Aria redeclares native DOM event callbacks (onBlur, onClick, ...) against wider
// element types than the concrete HTML element they end up rendering, so under strict
// function-parameter variance a Cratis-owned `pt` part typed against the real element
// (e.g. `ButtonHTMLAttributes<HTMLButtonElement>`) is not directly assignable to the
// matching React Aria props. The runtime event target is unchanged; only the declared
// callback parameter type is wider. These conversions exist to keep that mismatch behind
// one internal boundary per React Aria primitive, spread only onto the React Aria
// component that renders that same native element, so the Components-owned public part
// types never surface React Aria's own types.
export const asReactAriaButtonProps = (
    attributes: ButtonHTMLAttributes<HTMLButtonElement> | undefined,
): ButtonProps | undefined =>
    // SAFETY: spread only onto a React Aria Button, which renders an HTMLButtonElement —
    // the same element `attributes` is already typed against.
    attributes as unknown as ButtonProps | undefined;

export const asReactAriaListBoxProps = <T>(
    attributes: HTMLAttributes<HTMLDivElement> | undefined,
): ListBoxProps<T> | undefined =>
    // SAFETY: spread only onto a React Aria ListBox, which renders an HTMLDivElement —
    // the same element `attributes` is already typed against.
    attributes as unknown as ListBoxProps<T> | undefined;

export const asReactAriaListBoxItemProps = <T>(
    attributes: HTMLAttributes<HTMLDivElement> | undefined,
): ListBoxItemProps<T> | undefined =>
    // SAFETY: spread only onto a React Aria ListBoxItem, which renders an HTMLDivElement —
    // the same element `attributes` is already typed against.
    attributes as unknown as ListBoxItemProps<T> | undefined;
