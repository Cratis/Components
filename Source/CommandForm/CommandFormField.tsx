// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyAccessor } from '@cratis/fundamentals';

export interface CommandFormFieldProps<TCommand = unknown> {
    icon: React.ReactElement;
    propertyAccessor?: PropertyAccessor<TCommand>;
    onChange?: (value: unknown) => void;
    value?: unknown;
    required?: boolean;
    title?: string;
    description?: string;
}

export const CommandFormField = <TCommand,>(_props?: CommandFormFieldProps<TCommand>) => {
    void _props;
    return <></>;
};

CommandFormField.displayName = 'CommandFormField';
