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
import { StepperPanel } from '@cratis/components/CommandDialog';
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
- `showSubmit`: Show the built-in submit action on the last step (default: `true`)
- `okLabel`: Submit button label (default: `Submit`)
- `isBusy`: Disables the navigation controls while something is running
- `onSubmit`: Submit callback invoked on the last step
- Any `CommandForm` props, including `initialValues`, `currentValues`, `validateOnInit`, and validation callbacks
- `onBeforeExecute`: Transform command values before execution — it must **return** the values to run with, and it runs only on submit, so it can never satisfy required-field validation (seed those through `initialValues`)
- `linear` (default `true`), `orientation` (`'horizontal'` default / `'vertical'`), `headerPosition` (`'top'` default / `'bottom'`), `start`, `end`, `onChangeStep`, `pt`, `ptOptions`, `unstyled`: the `StepperCustomizationProps` surface. This is a Cratis-owned type mapped onto stable `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, and `panel` parts.

Conditional steps written as `{condition && <StepperPanel/>}` are counted correctly — only the panels that actually render are counted, so navigation and the per-step validation state stay in step with what is on screen. A `<>…</>` fragment wrapping several panels still counts as **one** step.

## Validation Indicators

`CommandStepper` identifies `CommandFormField` children inside each `StepperPanel` and extracts the field names from their `value` accessors.

The step number circles are then styled based on state:

- Red: the step contains at least one field with an error
- Green: the step is visited and has no errors
- Default: not visited and no errors

## See Also

- [StepperCommandDialog](../StepperCommandDialog/index.md)
