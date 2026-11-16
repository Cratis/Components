// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button } from '../Common/Button';

interface CommandStepperNavigationProps {
    isFirstStep: boolean;
    isLastStep: boolean;
    showSubmit: boolean;
    isBusy: boolean;
    isSubmitting: boolean;
    isSubmitDisabled: boolean;
    isCurrentStepInvalid: boolean;
    hasAnyStepErrors: boolean;
    previousLabel: string;
    nextLabel: string;
    okLabel: string;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit?: () => void | Promise<void>;
}

/** The built-in Previous / Next / Submit buttons of the stepper. */
export const CommandStepperNavigation = ({
    isFirstStep,
    isLastStep,
    showSubmit,
    isBusy,
    isSubmitting,
    isSubmitDisabled,
    isCurrentStepInvalid,
    hasAnyStepErrors,
    previousLabel,
    nextLabel,
    okLabel,
    onPrevious,
    onNext,
    onSubmit,
}: CommandStepperNavigationProps) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '0.75rem',
        }}
    >
        {!isFirstStep && (
            <Button
                variant='outline'
                onClick={onPrevious}
                disabled={isBusy}
                style={{ width: 'auto' }}
            >
                <span>{previousLabel}</span>
            </Button>
        )}
        <div style={{ flex: 1 }} />
        {!isLastStep && (
            <Button
                onClick={onNext}
                disabled={isBusy || isSubmitting || isCurrentStepInvalid}
                style={{ width: 'auto' }}
            >
                <span>{nextLabel}</span>
            </Button>
        )}
        {isLastStep && showSubmit && (
            <Button
                onClick={() => void onSubmit?.()}
                disabled={
                    isBusy ||
                    isSubmitting ||
                    isSubmitDisabled ||
                    hasAnyStepErrors
                }
                autoFocus
                style={{ width: 'auto' }}
            >
                {isSubmitting && (
                    <span
                        className='cratis-dialog__spinner'
                        aria-hidden='true'
                    />
                )}
                <span>{okLabel}</span>
            </Button>
        )}
    </div>
);
