# AI Agent Coordination Guide

**Purpose**: Delegation strategies and agent capabilities for this project  
**Last Updated**: January 7, 2026

---

## Available Agents

| Agent | Cost | Speed | Use Case |
|-------|------|-------|----------|
| **explore** | FREE | Fast | Codebase search, pattern finding |
| **librarian** | CHEAP | Medium | Docs, OSS examples, library research |
| **oracle** | EXPENSIVE | Slow | Architecture, complex debugging |
| **frontend-ui-ux-engineer** | CHEAP | Medium | Visual/styling changes only |
| **document-writer** | CHEAP | Medium | Technical documentation |
| **general** | MEDIUM | Medium | Multi-step background tasks |

---

## When to Delegate

### Explore Agent (Use Liberally)
**Fire in parallel (2-3 agents) for:**
- Finding existing patterns in codebase
- Locating similar implementations
- Discovering cross-file dependencies
- Understanding module structure

**Example**:
```javascript
background_task(agent="explore", "Find all Vue components using Three.js")
background_task(agent="explore", "Find existing astronomy calculation patterns")
background_task(agent="explore", "Locate error handling patterns in utilities")
// Continue working immediately
```

### Librarian Agent (External Research)
**Use when:**
- Working with unfamiliar libraries (Three.js, astronomical algorithms)
- Need official API documentation
- Looking for production-ready examples
- Understanding library best practices

**Example**:
```javascript
background_task(agent="librarian", "Find Hipparcos star catalog format and parsing examples")
background_task(agent="librarian", "Find Three.js BufferGeometry best practices")
```

### Oracle Agent (Use Sparingly)
**Consult before:**
- Major architectural decisions
- After 2+ failed fix attempts
- Multi-system integration tradeoffs
- Performance optimization strategy

**Cost**: Expensive reasoning model, use only when necessary

### Frontend UI/UX Engineer
**Delegate for:**
- CSS styling, layout, spacing
- Tailwind classes, color schemes
- Responsive design breakpoints
- Animations and transitions

**Do NOT delegate:**
- Pure logic (API calls, state management)
- TypeScript interfaces
- Data processing

---

## Delegation Template (7 Sections)

**MANDATORY**: All delegation prompts must include:

```markdown
1. TASK: [Single, atomic action]

2. EXPECTED OUTCOME: [Concrete deliverable with success criteria]

3. REQUIRED SKILLS: [Skill to invoke, if any]

4. REQUIRED TOOLS:
   - read, edit, bash, lsp_diagnostics
   - (Whitelist prevents tool sprawl)

5. MUST DO:
   - Follow Vue 3 Composition API patterns
   - Use TypeScript strict mode
   - Run lsp_diagnostics before completing
   - Run build to verify

6. MUST NOT DO:
   - No @ts-ignore or type suppressions
   - No refactoring unrelated code
   - No commits without explicit request

7. CONTEXT:
   - Project: Astro Guiding Performance (Vue 3 + TS + Vite)
   - Related files: [specific paths]
   - Pattern to follow: [describe]
```

---

## Project-Specific Patterns

### This Codebase Uses

**Vue 3 Composition API**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// Component logic here
</script>
```

**Utility Organization**:
- `/utilities/computations/` - Statistical analysis
- `/utilities/astronomy/` - Astronomical calculations
- `/utilities/starfield/` - Star catalog handling
- `/utilities/telescope/` - 3D models

**Component Structure**:
- `/components/Charts/` - Visualization components
- `/views/` - Page-level components

**State Management**:
- Vuex store modules in `/store/modules/`
- Equipment, PHD, ASIAIR stores

### Common Delegation Scenarios

#### Scenario 1: Implementing New Astronomy Feature
```javascript
// Launch librarian for research
background_task(agent="librarian", 
  "Find examples of airmass calculation using Rozenberg formula")

// Launch explore for existing patterns
background_task(agent="explore",
  "Find how coordinate transformations are implemented in utilities/astronomy/")

// Work on foundation while agents research
// Collect results when needed
```

#### Scenario 2: Adding UI Component
```javascript
// Delegate visual work to frontend engineer
task(agent="frontend-ui-ux-engineer",
  prompt="[7-section prompt for styling]")

// Handle logic yourself
// - API integration
// - State management
// - Data processing
```

#### Scenario 3: Complex Bug
```
First attempt: Fix yourself
Second attempt: Try different approach
Third attempt: Consult oracle with full context
```

---

## Verification Checklist

After any agent completes work:

- ✅ Does it work as expected?
- ✅ Does it follow existing codebase patterns?
- ✅ Did expected results occur?
- ✅ Did agent follow MUST DO requirements?
- ✅ Did agent avoid MUST NOT DO violations?
- ✅ Run `lsp_diagnostics` on changed files
- ✅ Run `npm run build` to verify

**If verification fails**: Fix yourself or re-delegate with corrections

---

## Agent Anti-Patterns

### ❌ Don't Do This

```javascript
// Sequential, blocking
result = task(agent="explore", "Find X")
// Waiting... wasting time
result2 = task(agent="librarian", "Find Y")
```

### ✅ Do This Instead

```javascript
// Parallel, non-blocking
t1 = background_task(agent="explore", "Find X")
t2 = background_task(agent="librarian", "Find Y")
// Continue working
// Collect later when needed
```

---

## Cost Management

### Free/Cheap Operations (Use Liberally)
- Explore agent searches
- Librarian lookups
- Frontend UI/UX engineer

### Expensive Operations (Use Judiciously)
- Oracle consultations
- Multiple general agent tasks

### Always Before Final Answer
```javascript
background_cancel(all=true) // Cancel any running tasks
```

---

## Project-Specific Agent Usage

### For This Astronomy Application

**Astronomy Calculations** → Librarian (official algorithms, formulas)  
**Three.js Integration** → Librarian (best practices, examples)  
**Vue Component Patterns** → Explore (find existing patterns in codebase)  
**Visual Refinements** → Frontend UI/UX Engineer  
**Architecture Decisions** → Oracle (when truly stuck)

### When in Doubt

1. Can I find it in the codebase? → **Explore**
2. Is it an external library? → **Librarian**
3. Is it visual styling? → **Frontend Engineer**
4. Is it truly complex? → **Oracle**
5. Otherwise → **Do it yourself**

---

**Remember**: Agents are tools to accelerate work, not replacements for your judgment. Always verify their output.
