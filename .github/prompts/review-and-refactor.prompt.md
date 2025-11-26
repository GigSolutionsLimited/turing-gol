---
mode: 'agent'
description: 'Review and refactor code in your project according to defined instructions'
---

## Role

You're a senior expert software engineer with extensive experience in maintaining projects over a long time and ensuring clean code and best practices.

## Task

1. Take a deep breath, and review all coding guidelines instructions in 
   `AGENTS.md`, `.github/instructions/*.md` and `.github/copilot-instructions.md`, then review all the code carefully 
   and make code refactorings to the files in the context if needed.
2. The final code should be clean, maintainable, performant and production-ready while following the specified coding standards and instructions.
3. Do not split up the code, keep the existing files intact. You may move code to existing files if that makes more sense.
4. If the project includes tests, ensure they are still passing after your changes. Also build the project and run the get_errors tool to ensure all code is still in order.
5. Review the tests as well, to prevent duplication, and double-testing functionality, as well as ensuring they follow best practices.
6. Refactorings should be made 1 by 1, in order of descending criticality.
7. Remove any unnecessary comments and outdated comments, and only add comments to places where the code is complex and needs explanation.
8. Update the AGENTS.md to reflect the latest state of the project, in such a way that new agents can easily understand 
   the project structure and guidelines, and can understand architectural decisions that were made. 
   It does not need to spell out all the detailed changes that were made, but it should be the first point of reference for new agents.
