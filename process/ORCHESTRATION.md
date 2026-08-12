# ORCHESTRATION — obligations indexed by trigger event

Re-consult this file at each event, not once. A trigger not listed here is not
necessarily covered elsewhere: if you cannot find the answer to "what am I now
obliged to do", that is a doctrine gap to flag, not one to fill by improvising.

| Trigger event                                     | Obligation                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| You are starting a fresh session                  | Read the documentation map in `AGENTS.md`, in order.                                                                                                        |
| You are about to write code for a new component   | STOP unless its RFC status is `approved` and you claimed ownership in the state manifest first. (Circuit active from Milestone 4.)                          |
| You are about to commit                           | Run `git branch --show-current`; confirm it matches intent. Regenerate any artefact whose source you touched, in the same commit.                           |
| You are about to open a PR                        | Run the format gate (and, once they exist, the full conformity pipeline) and quote the executed verdict — one line. Body follows the five-section template. |
| You renamed / changed the value of a colour token | Re-run the full contrast audit before committing (active from Milestone 3).                                                                                 |
| You are asked to review someone else's work       | Rights calibration FIRST: zero write by default on another author's branch. Deliverable is a report in the conversation only.                               |
| Your CI went red                                  | Classify: needs-fixing-red (fix it) vs expected-red (token gate awaiting the human label — wait). Never work around; never report one as the other.         |
| You are about to add a dependency                 | Declare it in every manifest the consumer path reads (root proxy + package). Flag the bump policy question in the PR if ambiguous.                          |
| A required external input is unavailable          | STOP and report. Never improvise the value it would have given.                                                                                             |
| You finished a major session (pipeline, refactor) | Propose a hygiene audit (inventory → plan → human approval → execute).                                                                                      |
| You learned something generalisable in review     | Write it to `LEARNINGS-ACTIVE.md` before the review is done, with the gate that does not exist yet.                                                         |
| You are ending the session                        | Report in three blocks: To understand / To decide / To paste, including Decisions made autonomously.                                                        |
