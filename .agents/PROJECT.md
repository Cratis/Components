# Components Public-Repository Policy

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
