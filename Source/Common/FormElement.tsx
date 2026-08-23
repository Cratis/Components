// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Props for {@link FormElement}.
 */
export interface FormElementProps {
    /** The form control rendered to the right of the icon addon. */
    children: React.ReactNode;

    /**
     * Icon node displayed inside the leading addon. Prefer an SVG or React icon
     * component. Consumer-owned icon-font elements also work when their stylesheet
     * is installed separately.
     */
    icon: React.ReactNode;
}

/**
 * Lightweight wrapper that places an icon addon to the left of a form input,
 * styled with the `--cratis-*` token layer (background, border, radius). Use
 * it to give input fields a leading icon without pulling in a renderer-specific input-group abstraction.
 *
 * ```tsx
 * import { useState } from 'react';
 * import { FaUser } from 'react-icons/fa6';
 * import { FormElement } from '@cratis/components/Common';
 *
 * function NameField() {
 *     const [name, setName] = useState('');
 *     return (
 *         <FormElement icon={<FaUser aria-hidden='true' />}>
 *             <input
 *                 className='cratis-field-input'
 *                 value={name}
 *                 onChange={(event) => setName(event.currentTarget.value)}
 *             />
 *         </FormElement>
 *     );
 * }
 * ```
 */
export const FormElement = (props: FormElementProps) => {
    return (
        <div className='flex flex-col md:flex-row gap-3'>
            <div className='cratis-form-element'>
                <span className='cratis-form-element__addon'>{props.icon}</span>
                {props.children}
            </div>
        </div>
    );
};
