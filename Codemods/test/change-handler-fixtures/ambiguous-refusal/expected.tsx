import { Dropdown } from '@cratis/components/Dropdown';
import { InputTextField } from '@cratis/components/CommandForm';

export const Fields = () => (
    <>
        <Dropdown onChange={/* TODO(cratis-codemod): review ambiguous Components change handler. */ (event) => { event.preventDefault(); consume(event.value); }} />
        <InputTextField onChange={/* TODO(cratis-codemod): review ambiguous Components change handler. */ (event) => consume(event.target.value, event)} />
    </>
);
