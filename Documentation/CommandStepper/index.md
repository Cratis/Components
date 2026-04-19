# CommandStepper

The `CommandStepper` component is a command-scoped stepper foundation for wizard-style flows.

## Purpose

`CommandStepper` establishes a `CommandForm` context and focuses on step rendering and validation-driven navigation.

Use it when you want to:

- Render `StepperPanel` steps with built-in previous and next navigation
- Color step number circles based on validation state
- Keep form validation and step transitions scoped to a single command

`StepperCommandDialog` is built on top of `CommandStepper` and adds command execution, submission flow, and dialog behavior.

## Basic Usage

```tsx
import { CommandStepper } from '@cratis/components/CommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';
import { InputTextField } from '@cratis/components/CommandForm/fields';
import { CreateProject } from '../api/projects/CreateProject';

export const ProjectWizard = () => {
    return (
        <CommandStepper<CreateProject>
            command={CreateProject}
            autoServerValidate={false}
            validateOnInit
        >
            <StepperPanel header="Basic Info">
                <InputTextField<CreateProject> value={c => c.name} title="Project Name" />
            </StepperPanel>
            <StepperPanel header="Details">
                {/* CommandForm fields */}
            </StepperPanel>
        </CommandStepper>
    );
};
```

## Props

- `command`: Command constructor used to establish `CommandForm`
- `children`: `StepperPanel` elements
- `nextLabel`: Next button label (default: `Next`)
- `previousLabel`: Previous button label (default: `Previous`)
- `showNavigation`: Show built-in navigation controls (default: `true`)
- `onStepErrorsChange`: Callback receiving a boolean array of per-step validation errors
- Any `CommandForm` props, including `initialValues`, `currentValues`, `validateOnInit`, and validation callbacks
- `orientation`, `headerPosition`, `linear`, `onChangeStep`, `start`, `end`, `pt`, `ptOptions`, `unstyled`: Passed to PrimeReact Stepper

## Validation Indicators

`CommandStepper` identifies `CommandFormField` children inside each `StepperPanel` and extracts the field names from their `value` accessors.

The step number circles are then styled based on state:

- Red: the step contains at least one field with an error
- Green: the step is visited and has no errors
- Default: not visited and no errors

## See Also

- [StepperCommandDialog](../StepperCommandDialog/index.md)
