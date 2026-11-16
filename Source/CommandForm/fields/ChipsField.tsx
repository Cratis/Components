// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { ChipsInput } from './ChipsInput';
import { ChipsItem } from './ChipsItem';
import { ChipsRoot } from './ChipsRoot';
import { useChipsDraft } from './useChipsDraft';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link ChipsField}. */
export interface ChipsParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** One selected chip. */
    item?: HTMLAttributes<HTMLSpanElement>;
    /** Chip removal button. */
    remove?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    /** Native draft-value input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
}

const chipsPartsMatchManifest: ExactPartKeys<ChipsParts, PartsOf<'ChipsField'>> = true;
void chipsPartsMatchManifest;

interface ChipsFieldComponentProps
    extends WrappedFieldProps<string[]>, FieldAccessibilityProps {
    placeholder?: string;
    max?: number;
    separator?: string;
    addOnBlur?: boolean;
    allowDuplicate?: boolean;
    /** Builds a remove-button label, or supplies one shared localized label. */
    removeAriaLabel?: string | ((item: string, index: number) => string);
    className?: string;
    pt?: ChipsParts;
    ptOptions?: object;
    unstyled?: boolean;
}

const ChipsControl = (props: ChipsFieldComponentProps) => {
    const { draft, setDraft, commit } = useChipsDraft(props);
    const accessibility = useFieldAccessibility(props, {
        id: props.pt?.input?.id,
        ariaLabel: props.pt?.input?.['aria-label'],
        ariaDescribedBy: props.pt?.input?.['aria-describedby'],
    });

    return (
        <ChipsRoot
            parts={props.pt}
            className={props.className}
            invalid={props.invalid}
            addOnBlur={props.addOnBlur}
            onBlur={props.onBlur}
            onCommit={commit}
        >
            {props.value.map((item, index) => (
                <ChipsItem
                    key={`${item}-${index}`}
                    item={item}
                    index={index}
                    removeAriaLabel={props.removeAriaLabel}
                    parts={props.pt}
                    onRemove={() =>
                        props.onChange(props.value.filter((_, itemIndex) => itemIndex !== index))
                    }
                />
            ))}
            <ChipsInput
                id={accessibility.controlId}
                ariaLabel={accessibility.ariaLabel}
                ariaDescribedBy={accessibility.ariaDescribedBy}
                draft={draft}
                onDraftChange={setDraft}
                onCommit={commit}
                placeholder={props.placeholder}
                invalid={props.invalid}
                parts={props.pt}
            />
            {accessibility.hiddenError}
        </ChipsRoot>
    );
};

/** A token input bound to a string array property on an Arc command. */
export const ChipsField = asCommandFormField<ChipsFieldComponentProps>(ChipsControl, {
    defaultValue: [],
});
