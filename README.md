# De Heus - Smart Vehicle Booking System

Smart Vehicle Booking System provides a centralized, user-friendly platform to solve these challenges. Employees can log in with their Microsoft accounts to submit booking requests quickly and accurately. Coordinators can review requests, assign drivers and vehicles, and manage leave schedules or maintenance in one place. Drivers also interact with the system by confirming trips or submitting leave and service requests, creating transparency across all parties. Administrators benefit from a comprehensive dashboard to manage data on users, drivers, vehicles, and vendors. Automated vehicle assignment and optimization logic reduce booking time and improve utilization, while reporting tools provide valuable insights for better decision-making.

---

## Project Team

**WAO Team – RMIT University Vietnam**  
- **Project Manager**: Phan Nhat Minh – *s3978598*  
- **Technical Leader**: Tran Manh Cuong – *s3974735*  
- Hoang Thai Phuc – *s3978081*  
- Truong Quang Bao Loc – *s3965528*  
- Le Nguyen Khoi – *s3975162*

**Academic Supervisor(s)**:
- Dr. Tran Minh Tuan

**De Heus's Supervisor(s)**:
- Truong Hong Anh (Allen)
- Phan Thi Minh Khoa (Katherine)

---

## Tech Stack

- **Client:** Next.js, TailwindCSS, Shadcn
- **Server:** Node.js, Express.js, TypeORM
- **Trip Optimizer:** FastAPI, OR-Tools 
- **Database:** PostgreSQL
- **CI/CD:** Azure DevOps

---

## Project Structure

Our project is organized into a clear and logical directory structure to facilitate development, testing, and deployment.

```
smart-vehicle-booking-system (root)/
├── .pipeline/           # CI/CD pipelines
├── client/              # Frontend application code
├── server/              # Backend API and business logic
└── trip-optimizer/      # Dedicated service/API for trip optimization logic
```

---

## Naming Convention Guide

To maintain a clean, organized, and collaborative repository, please follow these conventions for branch naming, commit messages, and pull requests. These guidelines ensure consistency, improve traceability, and streamline our development workflow.

### Branch Naming Convention

We use a structured branch naming convention to clearly identify the purpose and associated Jira ticket for each branch.

Format: `<type>/SVB-ID/short-description`
- `<type>`: Indicates the nature of the work.
- `SVB-ID`: The Jira ticket ID associated with the task (e.g., SVB-102).
- `short-description`: A concise, hyphen-separated description of the branch's purpose.

#### Examples:
- `feature/SVB-102/create-booking-form`
- `bugfix/SVB-89/fix-date-validation`

#### Prefix Legend for `<type>`:

| Prefix    | Description |
| -------- | ------- |
| `feature`   | New feature development    |
| `bugfix` | Fixing a bug     |
| `hotfix`    | Urgent fix for production issues    |
| `refactor`  | Refactoring code without feature change    |
| `chore` | Maintenance tasks, configureations, documentation updates     |
| `test`    | Test improvements or new test cases    |

*If there is new prefix that you want to have, please let Technical Leader knows!*

---

### Commit Message Convention

You should add clear and consistent commit messages, this is crucial for understanding the history of our codebase.

Format: `<type>: short, imperative summary`
- `<type>`: Categorizes the commit (see "Prefix Legend" below).
- `short, imperative summary`: A brief, present-tense description of the change (e.g., "add," "fix," "update").

**Optional**: Add a body message with more context, if necessary.

#### Examples: 
- `feat`: add booking form layout with validations
- `fix`: correct timezone bug in trip scheduler
- `docs`: update API usage section in README
- `refactor`: simplify session management logic
- `test`: add unit tests for user authentication

#### Prefix Legend (Conventional Commits):

| Prefix    | Description |
| -------- | ------- |
| `feat`   | New feature |
| `fix` | Bug fix |
| `docs`    | Documentation Changes |
| `style`  | Code style (formatting, linting, etc.) |
| `refactor` | Code refactoring |
| `test`    | Add or update tests |
| `chore`    | Build, tooling, or configuration tasks |

*If there is new prefix that you want to have, please let Technical Leader knows!*

---

### Pull Request Naming Convention

Pull requests (PRs) should be easy to understand and link directly to the work being done.

Format: `[SVB-XXX] Short, descriptive title using sentence case`
- `[SVB-XXX]`: The Jira ticket ID associated with the PR.
- `Short, descriptive title`: A clear, concise summary of the PR's content, written in sentence case.

#### Examples:
- `[SVB-102] Create booking form UI`
- `[SVB-89] Fix date validation logic for request form`
- `[SVB-123] Patch security issue in auth middleware`

#### Description (Inside the PR):
The PR description is crucial for reviewers to understand your changes. Please include the following:
- **What was changed and why**: Explain the problem you solved or the feature you implemented.
- **Link to Jira**: Provide a direct link to the Jira ticket: https://wao-team.atlassian.net/browse/SVB-XXX (replace SVB-XXX with the actual ID).

---

## License

This project is developed as part of the academic capstone at **RMIT University Vietnam** and is intended for internal use by **De Heus Vietnam**. Licensing may be restricted.

---

<p align="center">
  <em>Developed as part of the 2025 Capstone Project at RMIT University Vietnam by WAO Team</em>
</p>
