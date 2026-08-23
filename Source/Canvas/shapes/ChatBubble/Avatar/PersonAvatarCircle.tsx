// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Guid } from '@cratis/fundamentals';
import { getInitials } from './getInitials';
import { getAvatarColor } from './getAvatarColor';

/** The parameters {@link PersonAvatarCircleProps.buildAvatarUrl} resolves into an image URL. */
export interface BuildAvatarUrlParams {

    /** The identifier of the person, as a string. */
    userId: string;

    /** The kind of owner the avatar belongs to, matching the storage layout. */
    ownerType: 'Users' | 'Personas' | 'Agents';

    /** The avatar rendition requested. */
    avatarSize: 'Small' | 'Medium';

    /** A value that changes whenever the avatar image changes, for cache-busting. */
    version?: number | string;
}

export interface PersonAvatarCircleProps {

    /** The identifier of the person, used to build the avatar image URL. */
    userId: Guid | string;

    /** The person's display name, used for initials and accessibility text. */
    name: string;

    /** Whether the person has an uploaded avatar image. */
    hasAvatar: boolean;

    /** The rendered size, in pixels. */
    size: number;

    /** The kind of owner the avatar belongs to, matching the storage layout. Defaults to 'Users'. */
    ownerType?: 'Users' | 'Personas' | 'Agents';

    /** The avatar rendition to request from the server. Defaults to 'Small'. */
    avatarSize?: 'Small' | 'Medium';

    /**
     * A value that changes whenever the avatar image changes (e.g. the upload timestamp). Passed on to
     * {@link buildAvatarUrl} so a re-uploaded avatar can bust the aggressive HTTP cache on the old URL.
     */
    version?: number | string;

    /**
     * Builds the avatar image URL from the resolved parameters. Omit to always show the initials
     * fallback - this library ships no avatar storage convention of its own, so a host with an avatar
     * endpoint passes this to opt into images; one without simply never renders a broken `<img>`.
     */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /** Additional class name applied to the circle, for context-specific styling (borders, cursor, ...). */
    className?: string;
}

/**
 * Renders a person's avatar image when one has been uploaded and a URL can be built for it, falling
 * back to their initials on a color derived from their identifier so the same person always shows the
 * same fallback color.
 */
export const PersonAvatarCircle = ({ userId, name, hasAvatar, size, ownerType = 'Users', avatarSize = 'Small', version, buildAvatarUrl, className }: PersonAvatarCircleProps) => {
    const initials = getInitials(name);
    const dimension = `${size}px`;
    const src = buildAvatarUrl?.({ userId: userId.toString(), ownerType, avatarSize, version });

    // The "has avatar" signal can outlive the stored image (e.g. a persona flag that stays set
    // after the blob is gone), which otherwise leaves a broken image and a stream of 404s.
    // Track the src that failed and fall back to initials for it — a new src (re-upload bumps the
    // version) is retried.
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const showImage = hasAvatar && !!src && src !== failedSrc;

    return (
        <span
            className={className ? `person-avatar-circle ${className}` : 'person-avatar-circle'}
            style={{ width: dimension, height: dimension, background: showImage ? undefined : getAvatarColor(userId.toString()) }}
            aria-label={name}
            title={name}
        >
            {showImage
                ? <img className='person-avatar-circle-image' src={src} alt={name} draggable={false} onError={() => setFailedSrc(src)} />
                : <span className='person-avatar-circle-initials' style={{ fontSize: `${Math.max(8, Math.round(size * 0.4))}px` }}>{initials}</span>}
        </span>
    );
};
