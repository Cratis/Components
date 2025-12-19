import { CommandFormFields, ColumnInfo } from './CommandFormFields';
import { Constructor } from '@cratis/fundamentals';
import { useCommand, SetCommandValues } from '@cratis/arc.react/commands';
import { ICommandResult } from '@cratis/arc/commands';
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Panel } from 'primereact/panel';

export type BeforeExecuteCallback<TCommand> = (values: TCommand) => TCommand;

export interface CommandFormProps<TCommand> {
    command: Constructor<TCommand>;
    initialValues?: Partial<TCommand>;
    currentValues?: any;
    onFieldValidate?: (command: TCommand, fieldName: string, oldValue: any, newValue: any) => string | undefined;
    onFieldChange?: (command: TCommand, fieldName: string, oldValue: any, newValue: any) => void;
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    children?: React.ReactNode;
}

interface CommandFormContextValue<TCommand> {
    command: Constructor<TCommand>;
    commandInstance: TCommand;
    setCommandValues: SetCommandValues<TCommand>;
    commandResult?: ICommandResult<any>;
    setCommandResult: (result: ICommandResult<any>) => void;
    getFieldError: (propertyName: string) => string | undefined;
    isValid: boolean;
    setFieldValidity: (fieldName: string, isValid: boolean) => void;
    onFieldValidate?: (command: TCommand, fieldName: string, oldValue: any, newValue: any) => string | undefined;
    onFieldChange?: (command: TCommand, fieldName: string, oldValue: any, newValue: any) => void;
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    customFieldErrors: Record<string, string>;
    setCustomFieldError: (fieldName: string, error: string | undefined) => void;
}

const CommandFormContext = createContext<CommandFormContextValue<any> | undefined>(undefined);

export const useCommandFormContext = <TCommand,>() => {
    const context = useContext(CommandFormContext);
    if (!context) {
        throw new Error('useCommandFormContext must be used within a CommandForm');
    }
    return context as CommandFormContextValue<TCommand>;
};

// Hook to get just the command instance for easier access
export const useCommandInstance = <TCommand,>() => {
    const { commandInstance } = useCommandFormContext<TCommand>();
    return commandInstance;
};

// Hook to get setCommandResult for easier access
export const useSetCommandResult = () => {
    const { setCommandResult } = useCommandFormContext();
    return setCommandResult;
};

const CommandFormFieldsWrapper = (props: { children: React.ReactNode }) => {
    React.Children.forEach(props.children, child => {
        if (React.isValidElement(child)) {
            const component = child.type as any;
            if (component.displayName !== 'CommandFormField') {
                throw new Error(`Only CommandFormField components are allowed as children of CommandForm.Fields. Got: ${component.displayName || component.name || 'Unknown'}`);
            }
        }
    });

    return <></>;
};

CommandFormFieldsWrapper.displayName = 'CommandFormFieldsWrapper';

const getCommandFormFields = <TCommand,>(props: { children?: React.ReactNode }): { fieldsOrColumns: React.ReactElement[] | ColumnInfo[], otherChildren: React.ReactNode[], initialValuesFromFields: Partial<TCommand> } => {
    if (!props.children) {
        return { fieldsOrColumns: [], otherChildren: [], initialValuesFromFields: {} };
    }
    let fields: React.ReactElement[] = [];
    let columns: ColumnInfo[] = [];
    let hasColumns = false;
    let otherChildren: React.ReactNode[] = [];
    let initialValuesFromFields: Partial<TCommand> = {};

    const extractInitialValue = (field: React.ReactElement) => {
        const fieldProps = field.props as any;
        if (fieldProps.currentValue !== undefined && fieldProps.value) {
            const propertyAccessor = fieldProps.value;
            const propertyName = getPropertyNameFromAccessor(propertyAccessor);
            if (propertyName) {
                initialValuesFromFields = { ...initialValuesFromFields, [propertyName]: fieldProps.currentValue } as Partial<TCommand>;
            }
        }
    };

    React.Children.toArray(props.children).forEach(child => {
        if (!React.isValidElement(child)) {
            otherChildren.push(child);
            return;
        }

        const component = child.type as any;

        // Check if child is a CommandFormColumn
        if (component.displayName === 'CommandFormColumn') {
            hasColumns = true;
            const childProps = child.props as { children?: React.ReactNode };
            const columnFields = React.Children.toArray(childProps.children).filter(child => {
                if (React.isValidElement(child)) {
                    const comp = child.type as any;
                    if (comp.displayName === 'CommandFormField') {
                        extractInitialValue(child as React.ReactElement);
                        return true;
                    }
                }
                return false;
            }) as React.ReactElement[];
            columns.push({ fields: columnFields });
        }
        // Check if child is a CommandFormField (direct child)
        else if (component.displayName === 'CommandFormField') {
            extractInitialValue(child as React.ReactElement);
            fields.push(child as React.ReactElement);
        }
        // Check if child is Fields wrapper (backwards compatibility)
        else if (component === CommandFormFieldsWrapper || component.displayName === 'CommandFormFieldsWrapper') {
            const childProps = child.props as { children: React.ReactNode };
            const relevantChildren = React.Children.toArray(childProps.children).filter(child => {
                if (React.isValidElement(child)) {
                    const component = child.type as any;
                    if (component.displayName === 'CommandFormField') {
                        extractInitialValue(child as React.ReactElement);
                        return true;
                    }
                }
                return false;
            }) as React.ReactElement[];
            fields = [...fields, ...relevantChildren];
        }
        // Everything else is not a field, keep it as other children
        else {
            otherChildren.push(child);
        }
    });

    return { fieldsOrColumns: hasColumns ? columns : fields, otherChildren, initialValuesFromFields };
};

// Helper function to extract property name from accessor function
function getPropertyNameFromAccessor<T>(accessor: (obj: T) => any): string {
    const fnStr = accessor.toString();
    const match = fnStr.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
}

const CommandFormComponent = <TCommand,>(props: CommandFormProps<TCommand>) => {
    const { fieldsOrColumns, otherChildren, initialValuesFromFields } = useMemo(() => getCommandFormFields<TCommand>(props), [props.children]);

    // Extract matching properties from currentValues
    const valuesFromCurrentValues = useMemo(() => {
        if (!props.currentValues) return {};

        const tempCommand = new props.command();
        const commandProperties = (tempCommand as any).properties || [];
        const extracted: Partial<TCommand> = {};

        commandProperties.forEach((propertyName: string) => {
            if (props.currentValues[propertyName] !== undefined) {
                (extracted as any)[propertyName] = props.currentValues[propertyName];
            }
        });

        return extracted;
    }, [props.currentValues, props.command]);

    // Merge initialValues prop with values extracted from field currentValue props and currentValues
    const mergedInitialValues = useMemo(() => ({
        ...valuesFromCurrentValues,
        ...initialValuesFromFields,
        ...props.initialValues
    }), [valuesFromCurrentValues, initialValuesFromFields, props.initialValues]);

    const [commandInstance, setCommandValues] = useCommand<any, TCommand>(props.command as any, mergedInitialValues as any);
    const [commandResult, setCommandResult] = useState<ICommandResult<any> | undefined>(undefined);
    const [fieldValidities, setFieldValidities] = useState<Record<string, boolean>>({});
    const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

    // Update command values when mergedInitialValues changes (e.g., when data loads asynchronously)
    React.useEffect(() => {
        if (mergedInitialValues && Object.keys(mergedInitialValues).length > 0) {
            setCommandValues(mergedInitialValues as TCommand);
        }
    }, [mergedInitialValues, setCommandValues]);

    const isValid = Object.values(fieldValidities).every(valid => valid);

    const setFieldValidity = useCallback((fieldName: string, isFieldValid: boolean) => {
        setFieldValidities(prev => ({ ...prev, [fieldName]: isFieldValid }));
    }, []);

    const setCustomFieldError = useCallback((fieldName: string, error: string | undefined) => {
        setCustomFieldErrors(prev => {
            if (error === undefined) {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            }
            return { ...prev, [fieldName]: error };
        });
    }, []);

    const getFieldError = (propertyName: string): string | undefined => {
        // Check custom field errors first
        if (customFieldErrors[propertyName]) {
            return customFieldErrors[propertyName];
        }

        if (!commandResult || !commandResult.validationResults) {
            return undefined;
        }

        for (const validationResult of commandResult.validationResults) {
            if (validationResult.members && validationResult.members.includes(propertyName)) {
                return validationResult.message;
            }
        }

        return undefined;
    };

    const exceptionMessages = commandResult?.exceptionMessages || [];
    const hasColumns = fieldsOrColumns.length > 0 && 'fields' in fieldsOrColumns[0];

    return (
        <CommandFormContext.Provider value={{ command: props.command, commandInstance, setCommandValues, commandResult, setCommandResult, getFieldError, isValid, setFieldValidity, onFieldValidate: props.onFieldValidate, onFieldChange: props.onFieldChange, onBeforeExecute: props.onBeforeExecute, customFieldErrors, setCustomFieldError }}>
            <CommandFormFields fields={hasColumns ? undefined : fieldsOrColumns as React.ReactElement[]} columns={hasColumns ? fieldsOrColumns as ColumnInfo[] : undefined} />
            {exceptionMessages.length > 0 && (
                <div className="card flex flex-row gap-3 mt-3">
                    <Panel header="The server responded with" className="w-full">
                        <ul>
                            {exceptionMessages.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            )}
            {otherChildren}
        </CommandFormContext.Provider>
    )
}

const CommandFormColumnComponent = (props: { children: React.ReactNode }) => {
    return <></>;
};

CommandFormColumnComponent.displayName = 'CommandFormColumn';

CommandFormComponent.Fields = CommandFormFieldsWrapper;
CommandFormComponent.Column = CommandFormColumnComponent;

export const CommandForm = CommandFormComponent;
