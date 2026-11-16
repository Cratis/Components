// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { toast, type ToastRecord } from './toast';
import type { ToasterPassThrough } from './Toaster';

/** Props for {@link ToastCloseButton}. */
export interface ToastCloseButtonProps {
    item: ToastRecord;
    dismissAriaLabel: string;
    pt?: ToasterPassThrough;
}

/** The dismiss button of a toast, absent when the toast is not dismissible. */
export const ToastCloseButton = ({ item, dismissAriaLabel, pt }: ToastCloseButtonProps) => {
    const icon = useCratisIcon();
    if (item.dismissible === false) return null;

    return (
        <button
            {...pt?.close}
            type='button'
            className={classNames('cratis-toast__close', pt?.close?.className)}
            data-cratis-part='close'
            aria-label={pt?.close?.['aria-label'] ?? dismissAriaLabel}
            onClick={() => toast.dismiss(item.id)}
        >
            <span aria-hidden='true'>{icon('close', '×')}</span>
        </button>
    );
};
