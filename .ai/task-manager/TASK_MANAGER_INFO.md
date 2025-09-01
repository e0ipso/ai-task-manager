# Task Manager General Information

This document contains important information that is common to all the /task:*
commands for Claude Code.

## Types of Documents

Work orders (abbreviated as WO) are complex prompts for programming, 
organizational, or management tasks created by a user. Work orders are
independent of each other and cannot share any context. By definition 
different work orders can be worked on independently.

Each work order has plan associated to it. The plan is a comprehensive document
highlighting all the aspects of the work necessary to accomplish the goals from
the work order.

Each plan will be broken into tasks. Each task is a logical unit of work that 
has a single purpose, and is solved using a single skill. All tasks exist as 
part of a plan. Tasks can have dependencies on other tasks. This happens when a
task cannot be worked on (or completed) before some other task(s) are completed.

## Directory Structure

Plans, and tasks are stored as MarkDown files with a YAML front-matter. They are
all filed under the `.ai/task-manager/` folder at the root of the repository.

Plans are organized as follows:

```
.ai/
  task-manager/
    plans/
      001--authentication-provider/
        plan--authentication-provider.md
        tasks/
          01--create-project-structure.md
          02--implement-authorization.md
          03--this-example-task.md
          04--create-tests.md
          05--update-documentation.md
```

Note how in the `.ai/task-manager/plans/` folder we have a sub-folder per plan.
Each sub-folder will contain the plan document and has a name following a naming 
pattern `[incremental-ID]--[plan-short-name]`. The plan document has a name
following the pattern `plan--[plan-short-name].md`. Finally, all tasks are under
a `tasks` sub-folder. Each task has a name according to the pattern
`[incremental-ID]--[task-short-name].md`. IDs for tasks are auto-incremental 
within a plan. Each plan starts their tasks' IDs from 01.
