import { Button as Action } from '@cratis/components/Common';
import * as Common from '@cratis/components/Common';

export const Buttons = () => (
    <>
        <Action   variant='link' shape='pill' tone='neutral' />
        <Common.Button variant='outline'  tone='caution' />
        <Action variant='ghost'   tone='positive'  shape='default'  />
        <Action tone='neutral' variant='solid' />
    </>
);
