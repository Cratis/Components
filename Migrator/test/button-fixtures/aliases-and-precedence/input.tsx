import { Button as Action } from '@cratis/components/Common';
import * as Common from '@cratis/components/Common';

export const Buttons = () => (
    <>
        <Action outlined text link rounded severity='contrast' />
        <Common.Button text={false} outlined severity={'warn'} />
        <Action variant='ghost' link text tone='positive' severity={severity} shape='default' rounded />
        <Action severity='contrast' />
    </>
);
