import { Button } from '@cratis/components/Common';

export const Buttons = ({ flags, severity }) => (
    <>
        <Button text={/* TODO(cratis-codemod): review unsupported Button appearance props. */ flags.text} severity={severity} />
        <Button {.../* TODO(cratis-codemod): review unsupported Button appearance props. */ flags} outlined />
    </>
);
