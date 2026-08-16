// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Avatar as PrimeAvatar } from 'primereact/avatar';

/** Props for {@link Avatar}. */
export interface AvatarProps {
    /** Image URL. When present, the image is shown; otherwise the label/icon fallback is used. */
    image?: string;
    /** Text fallback (e.g. initials) shown when no image is available. */
    label?: string;
    /** Icon fallback shown when no image/label is available. */
    icon?: React.ReactNode;
    /** Alt text for the image. */
    alt?: string;
    /** Avatar size. */
    size?: 'normal' | 'large' | 'xlarge';
    /** Extra class name. */
    className?: string;
}

/**
 * A user/entity avatar built on PrimeReact 11's compositional `Avatar`. Shows
 * an image when available and falls back to initials or an icon otherwise.
 */
export const Avatar = ({ image, label, icon, alt, size, className }: AvatarProps) => (
    <PrimeAvatar.Root size={size} className={className}>
        {image
            ? <PrimeAvatar.Image src={image} alt={alt} />
            : <PrimeAvatar.Fallback>{icon ?? label}</PrimeAvatar.Fallback>}
    </PrimeAvatar.Root>
);
