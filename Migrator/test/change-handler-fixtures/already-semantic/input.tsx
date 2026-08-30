import { Dropdown } from '@cratis/components/Dropdown';
import { InputTextField } from '@cratis/components/CommandForm';

export const Fields = () => (
    <>
        <Dropdown onChange={(value) => consume(value)} />
        <InputTextField onChange={setValue} />
        <input onChange={(event) => consume(event.target.value)} />
    </>
);
