// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SyntheticEvent } from 'react';
import { Button } from '../Common/Button';
import { classNames } from '../ClassNames/classNames';
import type { ColumnFilterMenuLabels, ColumnFilterMenuParts } from './ColumnFilterMenu';

interface ColumnFilterActionsProps {
    labels: ColumnFilterMenuLabels;
    apply: (event?: SyntheticEvent) => void;
    clear: (event?: SyntheticEvent) => void;
    pt?: ColumnFilterMenuParts;
}

export const ColumnFilterActions = ({ labels, apply, clear, pt }: ColumnFilterActionsProps) => (
    <div
        {...pt?.actions}
        className={classNames('cratis-filter-menu-actions', pt?.actions?.className)}
        data-cratis-part='filter-actions'
    >
        <Button variant='outline' onClick={clear} label={labels.clear} pt={pt?.clear} />
        <Button onClick={apply} label={labels.apply} pt={pt?.apply} />
    </div>
);
