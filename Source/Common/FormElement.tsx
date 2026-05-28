// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import './FormElement.css';

/**
 * Props for {@link FormElement}.
 */
export interface FormElementProps {
    /** The form input rendered to the right of the icon addon (typically an `InputText`, `Dropdown`, etc.). */
    children: React.ReactNode;

    /**
     * Icon node displayed inside the leading addon. Can be any React node —
     * a PrimeIcons `<i className="pi pi-…" />`, an `<svg>`, or a `react-icons`
     * component.
     */
    icon: React.ReactNode;
}

/**
 * Lightweight wrapper that places an icon addon to the left of a form input,
 * styled with the `--cratis-*` token layer (background, border, radius). Use
 * it to give input fields a leading icon without pulling in PrimeReact's
 * `InputGroup` chrome.
 *
 * ```tsx
 * <FormElement icon={<i className="pi pi-user" />}>
 *     <InputText value={name} onChange={…} />
 * </FormElement>
 * ```
 */
export const FormElement = (props: FormElementProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <div className="cratis-form-element">
                <span className="cratis-form-element__addon">
                    {props.icon}
                </span>
                {props.children}
            </div>
        </div>
    );
};
