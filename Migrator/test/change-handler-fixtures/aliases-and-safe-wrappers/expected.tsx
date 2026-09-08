import { Dropdown as Select } from '@cratis/components/Dropdown';
import * as Fields from '@cratis/components/CommandForm';
import { CheckboxField as Check } from '@cratis/components/CommandForm/fields';

export const FieldsView = () => (
    <>
        <Select onChange={(value) => consume(value)} />
        <Fields.InputTextField onChange={(value) => consume(value)} />
        <Fields.NumberField onChange={(value) => consume(value)} />
        <Check onChange={(value) => consume(value)} />
        <Select onChange={(value) => consume(value)} />
    </>
);
