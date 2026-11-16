// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useMemo } from 'react';
import type { StepperPanelProps } from './StepperPanel';
import { extractFieldNamesFromNode } from './commandStepperFields';

/**
 * Derives the per-step error flags from the step panels' fields and reports them upward.
 */
export const useStepValidation = (
    panels: React.ReactElement<StepperPanelProps>[],
    getFieldError: ((fieldName: string) => unknown) | undefined,
    onStepErrorsChange: ((stepErrors: boolean[]) => void) | undefined,
) => {
    const stepFieldNames = useMemo(
        () => panels.map((panel) => extractFieldNamesFromNode(panel.props.children)),
        [panels],
    );

    const stepErrors = useMemo(
        () =>
            stepFieldNames.map((fields) =>
                fields.some((fieldName) => !!getFieldError?.(fieldName)),
            ),
        [stepFieldNames, getFieldError],
    );

    useEffect(() => {
        onStepErrorsChange?.(stepErrors);
    }, [onStepErrorsChange, stepErrors]);

    return stepErrors;
};
