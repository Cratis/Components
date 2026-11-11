// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button as AriaButton, SelectValue } from 'react-aria-components/Select';
import { asReactAriaButtonProps } from '../Common/reactAriaProps';
import { classNames } from '../ClassNames/classNames';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { flag } from './dropdownAttributes';
import { renderTriggerWithOpenState } from './renderTriggerWithOpenState';

/** The Select trigger: the button holding the selected value and the expand indicator. */
export const SingleSelectTrigger = <T,>({ props, state, handlers }: DropdownBranchProps<T>) => {
    const { pt, placeholder, disabled, tabIndex } = props;
    const { selectedKey, selectedOption, isOpen, effectiveInvalid } = state;
    const selected = selectedKey !== null;

    return (
        <AriaButton
            {...asReactAriaButtonProps(pt?.trigger)}
            ref={handlers.applyTriggerState}
            id={state.triggerId}
            excludeFromTabOrder={tabIndex === -1}
            aria-invalid={flag(effectiveInvalid)}
            className={classNames('cratis-dropdown__trigger', pt?.input?.className, pt?.trigger?.className)}
            style={{ ...pt?.input?.style, ...pt?.trigger?.style }}
            data-cratis-part='trigger'
            data-disabled={flag(disabled)}
            data-invalid={flag(effectiveInvalid)}
            data-selected={flag(selected)}
            render={renderTriggerWithOpenState}
        >
            <SelectValue
                {...pt?.value}
                className={classNames('cratis-dropdown__value', pt?.value?.className)}
                data-cratis-part='value'
                data-disabled={flag(disabled)}
                data-invalid={flag(effectiveInvalid)}
                data-open={flag(isOpen)}
                data-selected={flag(selected)}
            >
                {selectedOption?.label ?? placeholder}
            </SelectValue>
            <span
                {...pt?.indicator}
                className={classNames('cratis-dropdown__indicator', pt?.indicator?.className)}
                data-cratis-part='indicator'
                data-disabled={flag(disabled)}
                data-invalid={flag(effectiveInvalid)}
                data-open={flag(isOpen)}
                aria-hidden='true'
            >
                {state.expandIcon}
            </span>
        </AriaButton>
    );
};
