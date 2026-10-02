// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useState } from 'react';
import { PropertyControls } from '../PropertyControls';
import type { PropertyControlsProps } from '../PropertyControls';
import type { PropertyChangeProposal } from '../PropertyChangeProposal';
import type { PropertyGroup } from '../PropertyGroup';

/** Synthetic descriptors for an ordered flow, a grid placement and a freeform placement. */
export const flowGroup: PropertyGroup = {
    id: 'flow',
    title: 'Flow',
    properties: [
        { kind: 'number', name: 'gap', label: 'Gap', min: 0, max: 64, step: 4, unit: 'px' },
        { kind: 'choice', name: 'align', label: 'Alignment', options: [{ value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }] },
        { kind: 'boolean', name: 'grow', label: 'Grow to fill' },
        { kind: 'text', name: 'name', label: 'Name', placeholder: 'Optional' },
    ],
};

export const gridGroup: PropertyGroup = {
    id: 'grid',
    title: 'Grid placement',
    description: 'Applies inside a grid.',
    properties: [
        { kind: 'number', name: 'columns', label: 'Columns', min: 1, max: 12, required: true },
        { kind: 'number', name: 'span', label: 'Column span', min: 1, editable: false, unavailableReason: 'Set by the template.' },
    ],
};

export const freeformGroup: PropertyGroup = {
    id: 'freeform',
    title: 'Freeform placement',
    properties: [{ kind: 'number', name: 'x', label: 'Left', unit: 'px' }, { kind: 'number', name: 'y', label: 'Top', unit: 'px' }],
};

export const Harness = ({
    proposals,
    initial = {},
    apply = true,
    ...rest
}: Partial<PropertyControlsProps> & { proposals: PropertyChangeProposal[]; initial?: Record<string, unknown>; apply?: boolean }) => {
    const [values, setValues] = useState<Record<string, unknown>>(initial);
    return (
        <PropertyControls
            groups={[flowGroup, gridGroup, freeformGroup]}
            values={values}
            onChange={(proposal) => {
                proposals.push(proposal);
                if (apply) setValues({ ...proposal.values });
            }}
            aria-label='Layout settings'
            {...rest}
        />
    );
};
