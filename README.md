# De Heus - Smart Vehicle Booking System

---

## Project Team

**WAO Team – RMIT University Vietnam**  
- **Project Manager**: Phan Nhat Minh – *s3978598*  
- **Technical Leader**: Tran Manh Cuong – *s3974735*  
- Hoang Thai Phuc – *s3978081*  
- Truong Quang Bao Loc – *s3965528*  
- Le Nguyen Khoi – *s3975162*

**Academic Supervisor(s)**: Dr. Tran Minh Tuan

**De Heus's Supervisor(s)**:
- Truong Hong Anh (Allen)
- Phan Thi Minh Khoa (Katherine)

---

## 1. Project Structure

Our project is organized into a clear and logical directory structure to facilitate development, testing, and deployment.

```
Capstone (root)/
├── client/              # Frontend application code
├── server/              # Backend API and business logic
├── test/                # Automation test suites
└── trip-optimizer/      # Dedicated service/API for trip optimization logic
```

### Directory Descriptions:
- `client/`: Contains all the source code for our frontend application. This typically includes UI components, assets, and frontend-specific configurations.
- `server/`: Houses the backend application code and its related components. This includes API endpoints, database interactions, and core business logic.
- `test/`: Dedicated to automated test suites. This directory should contain various types of tests, such as end-to-end (E2E) tests, integration tests, and potentially shared test utilities. Unit tests typically reside within their respective client/ or server/ modules.
- `trip-optimizer/`: This directory is specifically for the trip optimization API or service. It encapsulates the specialized logic and code related to optimizing trip routes and plans.

---

## 2. Naming Convention Guide

To maintain a clean, organized, and collaborative repository, please follow these conventions for branch naming, commit messages, and pull requests. These guidelines ensure consistency, improve traceability, and streamline our development workflow.

### 2.1 Branch Naming Convention

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

### 2.2 Commit Message Convention

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

### 2.3 Pull Request Naming Convention

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