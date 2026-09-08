import { Dropdown } from '@cratis/components/Dropdown';
import { InputTextField } from '@cratis/components/CommandForm';

export const Fields = () => (
    <>
        <Dropdown onChange={(event) => { event.preventDefault(); consume(event.value); }} />
        <InputTextField onChange={(event) => consume(event.target.value, event)} />
    </>
);
