import { Button } from '@cratis/components/Common';

export const Buttons = ({ flags, severity }) => (
    <>
        <Button text={flags.text} severity={severity} />
        <Button {...flags} outlined />
    </>
);
