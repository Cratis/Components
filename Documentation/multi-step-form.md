---
title: "Build a multi-step form with Cratis Components"
description: Use StepperCommandDialog in Cratis Components to gather one Arc command across named form steps, with per-step feedback and validation before submit.
---

`StepperCommandDialog` in Cratis Components collects one Arc command across named form steps and executes it at the end. Use it when the input falls into distinct stages or is too long for one dialog. Moving between steps does not execute separate commands.

Start with the providers and styles from [Getting started](getting-started.mdx). This example assumes a generated `RegisterMember` proxy with a required `memberId` and `name`, `email`, and `tier` properties, plus a running backend that handles that command. It illustrates that contract rather than adding a command to the library tutorial.

## Use StepperCommandDialog

Group fields into `StepperPanel`s. They all bind to the same command instance, so **Previous** and **Next** navigate the input without submitting it:

```tsx title="RegisterMemberWizard.tsx"
import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';
import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
import { DropdownField, InputTextField } from '@cratis/components/CommandForm';
import { RegisterMember } from './RegisterMember'; // generated proxy

const tiers = [
    { id: 'standard', name: 'Standard' },
    { id: 'premium', name: 'Premium' },
];

export const RegisterMemberWizard = () => {
    const [memberId] = useState(() => Guid.create());
    return (
        <StepperCommandDialog<RegisterMember>
            command={RegisterMember}
            title='Register member'
            initialValues={{ memberId }}
        >
            <StepperPanel header='Details'>
                <InputTextField<RegisterMember> value={(command) => command.name} title='Name' />
                <InputTextField<RegisterMember> value={(command) => command.email} title='Email' type='email' />
            </StepperPanel>
            <StepperPanel header='Membership'>
                <DropdownField<RegisterMember>
                    value={(command) => command.tier}
                    title='Tier'
                    options={tiers}
                    optionValue='id'
                    optionLabel='name'
                />
            </StepperPanel>
        </StepperCommandDialog>
    );
};
```

In the membership step, `optionValue='id'` stores `standard` or `premium` on the command; `optionLabel='name'` displays **Standard** or **Premium**. The generated `memberId` goes through `initialValues` because it is required before the user submits. Open the wizard with `useDialog`, just like a single-step [CommandDialog](building-a-form.md#show-the-dialog).

## Notes

Navigation uses the current step's validation feedback. **Next** is disabled while a field on that step shows an error, and a visited step with an error is marked invalid. By default, a field validates on blur, so an untouched required field can still let the user advance. Set `validateOnInit` if errors should be visible as soon as the wizard opens.

Submission checks the whole command. On the last step, the submit button is only rendered once the command is valid, including fields on earlier panels. Supply required non-input values through `initialValues`; `onBeforeExecute` runs too late to satisfy that validity check. See [Building a form](building-a-form.md#tips).

When checking the form, try advancing past an untouched required field, then blur an invalid field and check **Next** again. Complete every step and confirm that submission becomes available only when the whole command is valid.

## When to use a wizard vs. a plain dialog

Steps help when users need to consider one group of inputs before the next. They also add navigation and can hide earlier input from view. For a short form whose fields belong together, keep a single [CommandDialog](CommandDialog/index.md). If the staged form belongs on the page rather than in a modal, use [CommandStepper](CommandStepper/index.md).

## Next

- [Building a form](building-a-form.md) — the single-step recipe and the field set
- [StepperCommandDialog](StepperCommandDialog/index.md) — modal navigation, validation, callbacks, cancellation, and busy state
- [CommandStepper](CommandStepper/index.md) — execute the same kind of multi-step command inline
