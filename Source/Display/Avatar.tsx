// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Props for {@link Avatar}. */
export interface AvatarProps {
    /** Image URL. When present, the image is shown; otherwise the label/icon fallback is used. */
    image?: string;
    /** Text fallback (e.g. initials) shown when no image is available. */
    label?: string;
    /** Icon fallback shown when no image/label is available. */
    icon?: ReactNode;
    /** Alt text for the image. */
    alt?: string;
    /** Avatar size. */
    size?: 'normal' | 'large' | 'xlarge';
    /** Extra class name. */
    className?: string;
}

const avatarDescriptor = describeComponent<AvatarProps>('Avatar', [
    { name: 'label', label: 'Label', type: 'string' },
    { name: 'alt', label: 'Alternative text', type: 'string', defaultValue: '' },
    { name: 'size', label: 'Size', type: 'enum', values: ['normal', 'large', 'xlarge'] satisfies NonNullable<AvatarProps['size']>[], defaultValue: 'normal' },
]);

/** A user or entity avatar with an image and text/icon fallback. */
export const Avatar = (props: AvatarProps) => {
    const [presentation, marker] = useComponentPresentation(avatarDescriptor, props);
    const { image, label, icon, alt = '', size = 'normal', className } = presentation;
    return (
        <span
            {...marker}
            className={['cratis-avatar', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-size={size}
        >
            {image ? (
                <img
                    className='cratis-avatar__image'
                    data-cratis-part='image'
                    src={image}
                    alt={alt}
                />
            ) : (
                <span
                    className='cratis-avatar__fallback'
                    data-cratis-part='fallback'
                    aria-hidden={!label}
                >
                    {icon ?? label}
                </span>
            )}
        </span>
    );
};
