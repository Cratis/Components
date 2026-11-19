// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from 'react';
import type { CratisDialogSlotProps } from '@cratis/components/Dialogs';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleDialog = ({ title, pt, host }: CratisDialogSlotProps) => (
    <dialog
        {...(pt?.root as HTMLAttributes<HTMLDialogElement> | undefined)}
        open
        aria-labelledby={`${host.id}-title`}
        data-cratis-part='root'
        data-open
    >
        <h2 id={`${host.id}-title`} ref={host.titleRef} data-cratis-part='title'>
            {title}
        </h2>
        <button
            type='button'
            aria-label={host.closeAriaLabel}
            data-cratis-part='close'
            onClick={() => host.dismiss('closeButton')}
        >
            {host.closeIcon}
        </button>
        {host.content}
        {host.footer}
        <div ref={host.registerOverlayContainer} />
    </dialog>
);

export const atomicSlots = {
    'dialogs.dialog': { mode: 'atomic', fidelity: 'native', render: ExampleDialog },
} satisfies CratisAtomicSlotMap;
