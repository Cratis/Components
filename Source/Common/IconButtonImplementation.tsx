// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import { ButtonImplementation } from './ButtonImplementation';
import type { IconButtonProps } from './IconButton';

/** Core implementation for the icon-button presentation slot. */
export const IconButtonImplementation = forwardRef<
    HTMLButtonElement,
    IconButtonProps
>(function IconButtonImplementation({ shape = 'pill', ...props }, ref) {
    return <ButtonImplementation {...props} ref={ref} shape={shape} />;
});
