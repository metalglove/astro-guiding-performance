# Claude Development Workflow

**Project**: Astro Guiding Performance Analysis  
**AI Agent**: Claude (Sisyphus)  
**Established**: January 7, 2026  
**Last Updated**: January 7, 2026

---

## Table of Contents
1. [Communication Patterns](#communication-patterns)
2. [Task Management System](#task-management-system)
3. [Documentation Standards](#documentation-standards)
4. [Subagent Orchestration](#subagent-orchestration)
5. [Commands Reference](#commands-reference)
6. [Workflow Examples](#workflow-examples)

---

## Communication Patterns

### User's Communication Style

**Characteristics:**
- **Direct and efficient** - No need for pleasantries or verbose acknowledgments
- **Technical depth** - Comfortable with architectural decisions and implementation details
- **Context-aware** - Expects you to maintain session context and previous decisions
- **Document-driven** - Values comprehensive documentation of progress
- **Strategic delegation** - Leverages subagents for parallel work

### Claude's Response Style

**DO:**
- ✅ Start work immediately without preambles ("Let me...", "I'll start by...")
- ✅ Document progress in `docs/tasks/` after each actionable task
- ✅ Present architectural decisions with clear rationale
- ✅ Use parallel tool calls when tasks are independent
- ✅ Be concise but comprehensive in technical explanations

**DON'T:**
- ❌ Use pleasantries ("Great question!", "Happy to help!")
- ❌ Announce actions before taking them (just do it)
- ❌ Over-explain obvious steps
- ❌ Work sequentially when parallel execution is possible

### Typical Interaction Flow

```
USER: [Request with context or reference to previous work]

CLAUDE: 
  1. (Parallel) Launch background agents if needed for research/exploration
  2. (Immediate) Begin primary work using direct tools
  3. (Collect) Gather background results when needed
  4. (Document) Create task file in docs/tasks/ with comprehensive summary
  5. (Report) Concise summary of what was done and next steps
```

---

## Task Management System

### Directory Structure

```
docs/
├── FEATURES.md                  # High-level feature roadmap
├── ISSUES.md                    # Known issues and bugs
├── todo.md                      # Current sprint/phase tasks
├── phase3_completion_summary.md # Major milestone summaries
└── tasks/                       # Individual task documentation
    ├── 01_drift_computation_utilities.md
    ├── 02_drift_analysis_component.md
    ├── 03_drift_periodic_error.md
    └── [XX_task_name_description.md]
```

### Task File Naming Convention

**Format**: `[NN]_[category]_[brief_description].md`

**Examples:**
- `01_drift_computation_utilities.md` - Implementation task
- `04_fix_drift_runtime_errors.md` - Bug fix task
- `12_fix_review_and_testing.md` - Review/testing task
- `13_phase3_implementation_status.md` - Status report

**Numbering:**
- Sequential numbering (01, 02, 03...)
- Multiple tasks on same date get consecutive numbers
- Fixes and reviews get their own numbers (don't replace original)

### When to Create Task Files

**ALWAYS create task file when:**
- ✅ Implementing a new feature (component, utility, algorithm)
- ✅ Fixing a bug or runtime error
- ✅ Major refactoring or architectural change
- ✅ Completing a testing or review phase
- ✅ Reaching a milestone (phase completion, major integration)
- ✅ Multiple files modified for a cohesive purpose

**DO NOT create task file for:**
- ❌ Trivial edits (typo fixes, comment updates)
- ❌ Single-line changes
- ❌ Documentation-only updates (unless major overhaul)

### Task File Template

```markdown
# Task [NN]: [Descriptive Title]

**Status**: ✅ Completed / ⏳ In Progress / ⚠️ Needs Review / ❌ Failed  
**Date**: [Month Day, Year]  
**Files Created/Modified**: 
- `path/to/file1.ts` (new/modified)
- `path/to/file2.vue` (modified)

## Objective
[Clear statement of what this task aimed to accomplish]

## Approach

### 1. Problem Analysis
[What was the initial problem or requirement?]

### 2. Solution Design
[What approach was chosen and why?]

### 3. Implementation Details
[Key algorithms, patterns, or architectural decisions]

#### Code Snippets (if relevant)
```typescript
// Illustrative code examples showing key implementation
```

### 4. Integration Strategy
[How this fits with existing codebase]

### 5. Testing/Verification
[How was this verified to work?]

## Results
[What was accomplished, what still needs work]

## Build Verification
```bash
npm run build
[Build output]
```

**Status:** ✅ SUCCESS / ❌ FAILED

## Known Issues / Limitations
[Any caveats, edge cases, or future improvements needed]

## Next Steps
[What should happen next related to this task]

## Dependencies
[New packages added, or dependencies on other tasks]

## Files for Review
[Links to key files modified]
```

---

## Documentation Standards

### File Documentation Headers

**TypeScript Utilities:**
```typescript
/**
 * Filename: descriptiveName.ts
 * Purpose: [One-line description of module purpose]
 * Created: [Date]
 * Last Modified: [Date]
 */
```

**Vue Components:**
```vue
<!--
  Component: ComponentName
  Purpose: [One-line description]
  Created: [Date]
  Last Modified: [Date]
-->
```

### Function Documentation

**Complex Functions (Always Document):**
```typescript
/**
 * Calculates drift rate between two guiding frames
 * 
 * @param frame1 - First guiding frame (earlier timestamp)
 * @param frame2 - Second guiding frame (later timestamp)
 * @param pixelScale - Pixel scale in arcseconds per pixel
 * @returns DriftVector with rate, direction, and components, or null if invalid
 * 
 * @example
 * const drift = calculateDriftRate(frame1, frame2, 0.97);
 * console.log(`Drift rate: ${drift.rate} arcsec/min`);
 */
export function calculateDriftRate(
  frame1: GuidingFrame,
  frame2: GuidingFrame,
  pixelScale: number
): DriftVector | null {
  // Implementation
}
```

**Simple/Self-Explanatory Functions (Optional):**
```typescript
// Clear from signature and context
export function isValidFrame(frame: GuidingFrame): boolean {
  return frame.timestamp > 0 && frame.dx !== undefined;
}
```

### Code Comments Philosophy

**DO comment:**
- ✅ Complex mathematical algorithms (especially astronomical calculations)
- ✅ Non-obvious business logic or edge cases
- ✅ Workarounds for known issues or browser quirks
- ✅ Performance-critical sections with reasoning

**DON'T comment:**
- ❌ Self-evident code (`// Increment counter` for `count++`)
- ❌ Repeating what the code already says clearly
- ❌ Outdated comments that weren't updated with code

---

## Subagent Orchestration

### Available Agents

| Agent | Cost | Use Case | When to Delegate |
|-------|------|----------|------------------|
| **explore** | FREE | Contextual grep for codebases | Finding patterns, locating implementations |
| **librarian** | CHEAP | External docs, OSS examples, library research | Unfamiliar libraries, API documentation |
| **oracle** | EXPENSIVE | Architecture decisions, complex debugging | Multi-system tradeoffs, after 2+ failed fix attempts |
| **frontend-ui-ux-engineer** | CHEAP | Visual/styling changes | CSS, layout, animations, responsive design |
| **document-writer** | CHEAP | Technical writing | README, API docs, guides |
| **general** | MEDIUM | Multi-step parallel tasks | Background work while you continue |

### Delegation Strategy

#### When to Use Subagents (User's Preference)

**ALWAYS delegate to subagents when:**
- 🔄 **Multiple search angles needed** - Fire 2-3 explore agents in parallel
- 📚 **Unfamiliar library/framework** - Fire librarian agent for docs and examples
- 🎨 **Visual/UI changes** - Delegate to frontend-ui-ux-engineer for styling work
- 🏗️ **Complex architecture decisions** - Consult oracle before implementing
- 📖 **Documentation tasks** - Delegate to document-writer for comprehensive docs
- ⚡ **Background work possible** - Use general agent for parallel tasks while you continue

**Example: Multi-Agent Parallel Launch**
```typescript
// CORRECT: Launch multiple agents simultaneously
background_task(agent="explore", prompt="Find all authentication implementations...")
background_task(agent="explore", prompt="Find error handling patterns...")
background_task(agent="librarian", prompt="Find JWT best practices in official docs...")
// Continue working immediately on main task
// Collect results later with background_output(task_id="...")
```

#### Delegation Prompt Template (MANDATORY)

When delegating, your prompt MUST include all 7 sections:

```markdown
1. TASK: [Single, atomic, specific action]

2. EXPECTED OUTCOME: [Concrete deliverables with success criteria]

3. REQUIRED SKILLS: [Which skill to invoke, if applicable]

4. REQUIRED TOOLS: [Explicit tool whitelist - prevents tool sprawl]
   - read (for file analysis)
   - edit (for code changes)
   - bash (for builds/tests)
   - lsp_diagnostics (for verification)

5. MUST DO: [Exhaustive requirements - leave NOTHING implicit]
   - Follow existing codebase patterns in [directory]
   - Use TypeScript with full type safety
   - Verify with lsp_diagnostics before completing
   - Run build to ensure no breakage

6. MUST NOT DO: [Forbidden actions - anticipate rogue behavior]
   - Do NOT use @ts-ignore or type suppressions
   - Do NOT refactor unrelated code
   - Do NOT modify files outside [specified directory]
   - Do NOT commit changes

7. CONTEXT: [File paths, existing patterns, constraints]
   - Project: Astro Guiding Performance (Vue 3 + TypeScript + Vite)
   - Related files: [specific files to reference]
   - Existing pattern: [describe pattern to follow]
```

#### Verification After Delegation (CRITICAL)

After subagent completes work, ALWAYS verify:
- ✅ Does it work as expected?
- ✅ Does it follow existing codebase patterns?
- ✅ Did expected results occur?
- ✅ Did agent follow "MUST DO" and "MUST NOT DO" requirements?

If verification fails, either:
1. Provide corrective feedback and re-delegate
2. Fix issues yourself with targeted edits

---

## Commands Reference

### User's Shorthand Commands

| Command | Meaning | Expected Action |
|---------|---------|-----------------|
| `@docs/tasks/` | Reference task documentation | Read relevant task files for context |
| `What did we do?` | Session summary request | Provide comprehensive continuation prompt |
| `Look into X and create PR` | Full work cycle | Investigate → Implement → Verify → Create PR |
| `Based on how we communicated...` | Meta-request | Analyze patterns and create workflow documentation |

### Standard Workflow Phases

#### Phase 0: Intent Gate (Every Message)
```
1. Check skills FIRST (blocking)
2. Classify request type (trivial/explicit/exploratory/work)
3. Check for ambiguity (ask if critical info missing)
4. Validate before acting (do I have assumptions?)
```

#### Phase 1: Research & Exploration
```
1. Launch explore/librarian agents (background, parallel)
2. Use direct tools for known file locations
3. Collect background results when needed
4. Stop searching when sufficient context obtained
```

#### Phase 2: Implementation
```
1. Create todo list if 2+ steps (detailed, obsessively tracked)
2. Mark tasks in_progress before starting
3. Delegate visual changes to frontend-ui-ux-engineer
4. Verify with lsp_diagnostics at logical checkpoints
5. Mark completed IMMEDIATELY after each task
```

#### Phase 3: Verification
```
1. Run lsp_diagnostics on changed files
2. Run build if project has build commands
3. Document results in task file
4. Report concisely to user
```

#### Phase 4: Documentation
```
1. Create task file in docs/tasks/[NN]_[name].md
2. Follow task file template
3. Include code snippets, build verification, next steps
4. Update FEATURES.md if major feature implemented
```

### Build Verification Commands

```bash
# Navigate to project
cd /Users/glovali/Repositories/astro-guiding-performance/web/agp

# Install dependencies (first time)
npm install

# Type check (use before build)
npx tsc --noEmit

# Build for production
npm run build

# Run development server (for testing)
npm run dev
```

### Git Workflow (When Requested)

**User will explicitly request commits/PRs - NEVER do proactively**

When asked to create PR:
```bash
# 1. Check status
git status
git diff
git log --oneline -5

# 2. Stage changes
git add [files]

# 3. Commit with meaningful message
git commit -m "feat: [concise description]

- [Detail 1]
- [Detail 2]
- [Detail 3]"

# 4. Push to remote
git push origin [branch-name]

# 5. Create PR using GitHub CLI
gh pr create --title "[Title]" --body "$(cat <<'EOF'
## Summary
- [Change 1]
- [Change 2]

## Testing
- [Test 1]
- [Test 2]

Closes #[issue-number]
EOF
)"
```

---

## Workflow Examples

### Example 1: Feature Implementation (Session 2 - Dual Camera System)

**User Request:**
> "Implement dual camera system for telescope simulator"

**Claude's Actions:**
```
[Phase 0: Intent Gate]
- Classification: Explicit implementation task
- Ambiguity check: Specs clear from prior discussion
- Proceed immediately

[Phase 1: Research]
- Read TelescopeModel.ts, TelescopeSimulator.vue
- Review existing 3D implementation patterns
- NO subagents needed (familiar codebase, clear requirements)

[Phase 2: Implementation]
- Modify TelescopeModel.ts: Add guideCamera to interface, update return
- Modify TelescopeSimulator.vue: Add camera toggle, implement switchCamera()
- Verify with lsp_diagnostics: Clean
- Run build: Success (442.84 kB)

[Phase 3: Documentation]
- Create docs/tasks/08_3d_visualization_enhancements.md
- Document architecture decisions, code changes, build verification

[Phase 4: Report]
- Concise summary of changes
- Note testing requirements
- Suggest next steps
```

**Duration:** 1 iteration, all done in single response

---

### Example 2: Multi-Search Pattern (Hypothetical Phase 3.2)

**User Request:**
> "Implement session planning with target visibility calculator"

**Claude's Actions:**
```
[Phase 0: Intent Gate]
- Classification: Complex, multi-part feature
- Ambiguity: None (specified in FEATURES.md)
- Create detailed todo list FIRST

[Phase 1: Parallel Research]
background_task(agent="librarian", "Find astronomical coordinate conversion libraries and examples")
background_task(agent="explore", "Find existing time/date handling patterns in codebase")
background_task(agent="librarian", "Find Messier catalog JSON data sources")

[Continue immediately with foundation work]
- Create utilities/astronomy/coordinates.ts (foundational algorithms)
- Implement Julian Date, LST calculations

[Collect background results]
result1 = background_output(task_id=librarian_1)
result2 = background_output(task_id=explore_1)
result3 = background_output(task_id=librarian_2)

[Phase 2: Implementation using research]
- Implement targetVisibility.ts using library patterns found
- Create Messier catalog JSON from source found
- Build SessionPlanning.vue component

[Phase 3: Verification]
- lsp_diagnostics clean
- Build successful
- Document in task file

[Cancel background tasks before completion]
background_cancel(all=true)
```

---

### Example 3: Bug Fix with Delegation (Task 12)

**User Request:**
> "Review all previous work and fix any issues"

**Claude's Actions:**
```
[Phase 0: Intent Gate]
- Classification: Review/testing task
- Launch oracle for comprehensive review

[Phase 1: Consult Oracle]
task(
  subagent_type="oracle",
  description="Comprehensive review of Tasks 01-11",
  prompt="[7-section delegation prompt]"
)

[Phase 2: Implement Fixes from Oracle Feedback]
1. Fix: Add guideCamera to TelescopeGroups interface
2. Fix: Update createGenericMount() return statement
3. Fix: Update CSS height to 800px
4. Update: FEATURES.md status

[Phase 3: Verification]
- lsp_diagnostics: Clean
- Build: Success
- Create comprehensive testing checklist

[Phase 4: Documentation]
- Create docs/tasks/12_fix_review_and_testing.md
- Document all fixes with file/line references
- Provide testing checklist for user
```

---

### Example 4: Creating Workflow Documentation (This File)

**User Request:**
> "Based on how we have communicated, and how I interacted with you. Write the CLAUDE.md..."

**Claude's Actions:**
```
[Phase 0: Intent Gate]
- Classification: Meta-documentation task
- This is about communication patterns and workflow

[Phase 1: Research Our History]
read(docs/tasks/13_phase3_implementation_status.md)
read(docs/tasks/12_fix_review_and_testing.md)
read(docs/tasks/01_drift_computation_utilities.md)
bash(ls docs/tasks/) # Understand task file pattern

[Phase 2: Analyze Patterns]
- User's style: Direct, technical, document-driven
- Task file format: Numbered, comprehensive, template-based
- Subagent usage: User explicitly requested more delegation
- My response pattern: Concise, work-first, document-after

[Phase 3: Create CLAUDE.md]
write(CLAUDE.md) with sections:
- Communication Patterns (observed user preferences)
- Task Management System (docs/tasks/ structure)
- Documentation Standards (existing patterns)
- Subagent Orchestration (user's explicit request)
- Commands Reference (shorthand meanings)
- Workflow Examples (based on actual sessions)

[Phase 4: Verification]
- No build needed (documentation only)
- Review for completeness and accuracy
```

---

## Key Takeaways for Future Sessions

### Communication
- **Be direct, skip preambles** - User values efficiency
- **Document obsessively** - Every actionable task gets a task file
- **Use parallel execution** - Launch multiple agents when applicable

### Technical
- **Follow existing patterns** - This codebase has established conventions (Vue 3 Composition API, TypeScript, modular utilities)
- **Verify continuously** - lsp_diagnostics at logical checkpoints, build verification at task completion
- **Type safety is non-negotiable** - Never use type suppressions

### Project Management
- **Todo lists for 2+ steps** - User wants visibility into progress
- **Task files are the record** - Numbered, comprehensive, template-based
- **Testing checklists** - User will run manual tests, provide detailed checklist

### Delegation
- **More subagent usage requested** - User wants parallel work delegation
- **7-section prompts mandatory** - Prevents vague/rogue agent behavior
- **Always verify agent results** - Don't blindly trust, check the output

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| Jan 7, 2026 | 1.0 | Initial creation based on Sessions 1-3 patterns |

---

**Next Update:** After user feedback or significant workflow evolution

