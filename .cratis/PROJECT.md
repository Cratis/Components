# Components — project context

The canonical project context for this repository. It opens with the public-repository policy every contribution here must satisfy.

## Consumer confidentiality and provenance

This is a public framework repository. Its implementation, examples, fixtures, screenshots, documentation, and review evidence must be independently authored for Components.

- Never copy, port, adapt, paraphrase, or derive source code, designs, names, vocabulary, data, screenshots, domains, identifiers, or behavior from a consuming product or its repository.
- Treat every consuming product and repository as confidential, regardless of whether an individual name or example appears generic.
- Never mention consumer products in public files, commits, pull requests, issues, build logs, screenshots, artifact metadata, or test output.
- Use explicitly synthetic examples such as `Sample User`, `Example Project`, `Demo Assistant`, reserved `example.invalid` URLs, and generated identifiers.
- Do not use names of real people, customer-like organizations, or product-specific scenarios in stories and documentation.
- Repository-local evidence may describe consumers only as anonymous counts or capability profiles and must never contain identifying details.
- If consumer material is discovered, stop any server or publication exposing it, remove it from the current tree, notify the repository owner, and treat history/log cleanup as a coordinated security action. Never rewrite git history without explicit human authorization.

Before committing public examples, verify their provenance and confirm that every identity, message, URL, identifier, and scenario was created solely for this repository.

## AI-assisted development

This repository uses the Cratis AI contract:

- **`.cratis/ai.json`** records the subscription — `cratis/documentation` plus the `cratis/engineering/react` and `cratis/engineering/typescript` maintainer cells for this React + TypeScript component library.
- **`.cratis/PROJECT.md`** (this file) is the canonical project context; the root `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` are minimal bootstraps that point here and do nothing else.
- There is **no local AI corpus and no generated tool adapters** in this repository. Shared skills arrive through the Cratis AI marketplace plugins (Claude Code, Codex, GitHub Copilot, Cursor, and Pi are installable today — see the [harness guide](https://www.cratis.io/ai/harnesses/)).

For contributors:

1. Install the Cratis plugin for your harness once (per the harness guide); the subscribed profiles' skills then load automatically when tasks match.
2. General, reusable improvements are proposed in [`Cratis/AI`](https://github.com/Cratis/AI) — never copied into, or synchronized from, this repository.
3. Repository-specific facts and conventions belong in this file; repository-local skills live under `.agents/skills/`.
4. AI session work records (plans, handovers, session notes, scratch analyses) stay in the untracked `.ai-work/` folder and never enter git; a durable follow-up becomes a GitHub issue.
## Commands

```bash
yarn install
yarn ci                                  # the workspace CI gate
yarn workspace @cratis/components.storybook ci:preflight   # Storybook preflight
# or all of the above at once:
bash .agents/scripts/run-components-ci.sh
```
