export interface SeedTemplate {
  id: string;
  label: string;
  description: string;
  readme: string;
}

const EDP_README = `# Event Driven Programming — Course Repository

## Required Accounts

- [ ] Slack account (with profile photo)
- [ ] GitHub account
- [ ] Gmail account
- [ ] Medium.org account
- [ ] n8n.io account
- [ ] Account on [student-hub.base44.app](https://student-hub.base44.app)

## Course Requirements

- Minimum **80% attendance**
- Pass each exam (group and 1-on-1)
- Personal website built with Lovable or Base44
- n8n workflow project
- EDP project on GitHub
- Article about Event Driven Programming on Medium.org

## Initial Skills

Know how to:

- Use Markdown format (\`# Heading\`, \`## Subheading\`, etc.)
- Use the terminal (\`ls\`, \`cd\`, \`touch\`, \`nano\`)
- Fork a repository
- Add / edit a file
- Run GitHub Codespace
- Commit changes:
  - \`git add .\`
  - \`git commit -m 'My comment'\`
  - \`git push origin main\`
- Check repository status: \`git status\`

## Resources

- [Course syllabus](./syllabus.md)
- [Contributing guide](./CONTRIBUTING.md)
`;

const OOP_README = `# Object Oriented Programming — Course Repository

## Required Accounts

- [ ] GitHub account
- [ ] Gmail account
- [ ] Account on [student-hub.base44.app](https://student-hub.base44.app)

## Course Requirements

- Minimum **80% attendance**
- Pass each exam (group and 1-on-1)
- OOP project on GitHub (with documentation)
- Code review participation (at least 2 reviews per semester)

## Initial Skills

Know how to:

- Use Markdown format (\`# Heading\`, \`## Subheading\`, etc.)
- Use the terminal (\`ls\`, \`cd\`, \`touch\`, \`nano\`)
- Fork a repository
- Add / edit a file
- Run GitHub Codespace
- Commit changes:
  - \`git add .\`
  - \`git commit -m 'My comment'\`
  - \`git push origin main\`
- Check repository status: \`git status\`

## Resources

- [Course syllabus](./syllabus.md)
- [Contributing guide](./CONTRIBUTING.md)
`;

const DEFAULT_README = `# Course Repository

Welcome to this course repository. This repository contains course materials, assignments, and resources.

## Getting Started

Please read the [syllabus](./syllabus.md) and [contributing guide](./CONTRIBUTING.md) before submitting any work.
`;

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    id: 'edp',
    label: 'Event Driven Programming',
    description: 'Accounts checklist, EDP-specific requirements (n8n, Medium article, Base44), and initial Git skills.',
    readme: EDP_README,
  },
  {
    id: 'oop',
    label: 'Object Oriented Programming',
    description: 'GitHub-focused checklist, OOP project requirements, code review expectations.',
    readme: OOP_README,
  },
  {
    id: 'default',
    label: 'Default',
    description: 'Minimal README pointing to syllabus and contributing guide.',
    readme: DEFAULT_README,
  },
];

export function getTemplateReadme(templateId: string | null | undefined): string {
  if (!templateId) return DEFAULT_README;
  return SEED_TEMPLATES.find((t) => t.id === templateId)?.readme ?? DEFAULT_README;
}
