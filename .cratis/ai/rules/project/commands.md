---
applyTo: "**/*"
---

## Commands

```bash
yarn install
yarn ci                                  # the workspace CI gate
yarn workspace @cratis/components.storybook ci:preflight   # Storybook preflight
# or all of the above at once:
bash .agents/scripts/run-components-ci.sh
```
