import { Dropdown as Select } from '@cratis/components/Dropdown';
import * as Fields from '@cratis/components/CommandForm';
import { CheckboxField as Check } from '@cratis/components/CommandForm/fields';

export const FieldsView = () => (
    <>
        <Select onChange={(e) => consume(e.value)} />
        <Fields.InputTextField onChange={(event) => consume(event.target.value)} />
        <Fields.NumberField onChange={(event: React.ChangeEvent<HTMLInputElement>) => consume(event.currentTarget.valueAsNumber)} />
        <Check onChange={({ target: { checked } }) => consume(checked)} />
        <Select onChange={({ value: selected }) => consume(selected)} />
    </>
);
