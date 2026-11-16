// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { ToastRecord } from './toast';
import type { ToasterPassThrough } from './Toaster';

/** Props for {@link ToastContent}. */
export interface ToastContentProps {
    item: ToastRecord;
    pt?: ToasterPassThrough;
}

/** The title, description and action of a toast, or its custom body. */
export const ToastContent = ({ item, pt }: ToastContentProps) =>
    item.render ?? (
        <>
            {item.title && (
                <div
                    {...pt?.title}
                    className={classNames('cratis-toast__title', pt?.title?.className)}
                    data-cratis-part='title'
                >
                    {item.title}
                </div>
            )}
            {item.description && (
                <div
                    {...pt?.description}
                    className={classNames(
                        'cratis-toast__description',
                        pt?.description?.className,
                    )}
                    data-cratis-part='description'
                >
                    {item.description}
                </div>
            )}
            {item.action && (
                <button
                    {...item.action}
                    {...pt?.action}
                    type='button'
                    className={classNames(
                        'cratis-toast__action',
                        item.action.className,
                        pt?.action?.className,
                    )}
                    data-cratis-part='action'
                />
            )}
        </>
    );
