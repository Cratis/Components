import { PropertyAccessor } from '@cratis/fundamentals';

export interface CommandFormFieldProps<TCommand = any> {
    icon: React.ReactElement;
    propertyAccessor?: PropertyAccessor<TCommand>;
    onChange?: (value: any) => void;
    value?: any;
    required?: boolean;
    title?: string;
    description?: string;
}

export const CommandFormField = <TCommand,>(_props: CommandFormFieldProps<TCommand>) => {
    return (
        <></>
    )
}

CommandFormField.displayName = 'CommandFormField';
