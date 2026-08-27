// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ReactNode } from 'react';
import { Button, type ButtonParts, type ButtonProps } from './Button';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Stable Cratis-owned parts for styling an {@link IconButton}. */
export type IconButtonParts = ButtonParts;

const iconButtonPartsMatchManifest: ExactPartKeys<
    IconButtonParts,
    PartsOf<'IconButton'>
> = true;
void iconButtonPartsMatchManifest;

/** Props for {@link IconButton}. */
export interface IconButtonProps extends Omit<
    ButtonProps,
    'aria-label' | 'children' | 'icon' | 'label' | 'pt'
> {
    /** Icon content displayed by the button. */
    icon: ReactNode;
    /** Required accessible name for the icon-only action. */
    'aria-label': string;
    /** Cratis-owned per-part attributes inherited from {@link Button}. */
    pt?: IconButtonParts;
}

/** An icon-only specialization of {@link Button} with one native interaction owner. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function IconButton({ shape = 'pill', ...props }, ref) {
        return <Button {...props} ref={ref} shape={shape} />;
    },
);
