// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import { Button as AriaButton } from 'react-aria-components/Button';
import { asReactAriaButtonProps } from '../Common/reactAriaProps';
import { classNames } from '../ClassNames/classNames';
import type { ColumnFilterMenuParts } from './ColumnFilterMenu';

interface ColumnFilterTriggerProps {
    label: string;
    hasConstraint: boolean;
    isOpen: boolean;
    triggerRef: RefObject<HTMLButtonElement | null>;
    pt?: ColumnFilterMenuParts;
}

export const ColumnFilterTrigger = ({ label, hasConstraint, isOpen, triggerRef, pt }: ColumnFilterTriggerProps) => (
    <AriaButton
        {...asReactAriaButtonProps(pt?.trigger)}
        ref={triggerRef}
        aria-label={label}
        className={classNames('cratis-filter-trigger', pt?.trigger?.className)}
        data-active={hasConstraint || undefined}
        data-selected={hasConstraint || undefined}
        data-open={isOpen || undefined}
        data-cratis-part='filter-trigger'
        data-cratis-component='ColumnFilterMenu'
    >
        <svg
            className='cratis-filter-trigger__icon'
            viewBox='0 0 16 16'
            fill='currentColor'
            aria-hidden='true'
            focusable='false'
        >
            <path d='M1.5 2.5A.5.5 0 0 1 2 2h12a.5.5 0 0 1 .38.82L10 8.1v4.52a.5.5 0 0 1-.24.43l-3 1.8A.5.5 0 0 1 6 14.42V8.1L1.62 2.82a.5.5 0 0 1-.12-.32Z' />
        </svg>
    </AriaButton>
);
