# Task Complexity Scoring Algorithm

## Overview

This algorithm evaluates task difficulty across five key dimensions using a 1-10 scale, providing consistent complexity assessment for AI-assisted development. Each dimension contributes to a composite score that guides resource allocation and execution planning.

## The Five Complexity Dimensions

### 1. Technical Depth
**Definition**: Number and sophistication of technical concepts, APIs, frameworks, or specialized knowledge required.

**Scoring Scale (1-10)**:

- **1-2 (Trivial)**: Basic operations, no specialized knowledge
  - Example: Update a text string, change a CSS color value
  - Anchor: "Change button text from 'Submit' to 'Send'"

- **3-4 (Low)**: Single technology/concept, well-documented patterns
  - Example: Add a new field to existing form, basic SQL query
  - Anchor: "Add email validation to contact form"

- **5-6 (Moderate)**: 2-3 technologies, some integration complexity
  - Example: Implement JWT authentication, integrate third-party API
  - Anchor: "Add user login with password hashing and session management"

- **7-8 (High)**: Multiple complex technologies, advanced patterns
  - Example: Implement real-time WebSocket communication, complex database migrations
  - Anchor: "Build real-time collaborative editing with conflict resolution"

- **9-10 (Extreme)**: Cutting-edge technologies, novel implementations, deep system knowledge
  - Example: Custom compiler optimization, distributed consensus algorithm
  - Anchor: "Implement custom memory allocator with garbage collection"

### 2. Decision Complexity
**Definition**: Amount of architectural choices, design decisions, and trade-off evaluations required.

**Scoring Scale (1-10)**:

- **1-2 (Trivial)**: No decisions, follow existing patterns exactly
  - Example: Copy existing component with different props
  - Anchor: "Duplicate product card component for different category"

- **3-4 (Low)**: 1-2 minor decisions with clear best practices
  - Example: Choose between existing UI components, select standard library function
  - Anchor: "Choose between input types for phone number field"

- **5-6 (Moderate)**: Several decisions with trade-offs, multiple viable approaches
  - Example: Database schema design, state management approach
  - Anchor: "Design user preferences storage (local vs database vs cache)"

- **7-8 (High)**: Many interdependent decisions, significant architectural impact
  - Example: Microservices vs monolith, caching strategy design
  - Anchor: "Design scalable notification system architecture"

- **9-10 (Extreme)**: Complex decision trees, novel solutions required, high uncertainty
  - Example: Performance optimization with multiple constraints, greenfield system architecture
  - Anchor: "Design fault-tolerant distributed data processing pipeline"

### 3. Integration Points
**Definition**: Number of external systems, files, components, or dependencies that must be modified or coordinated.

**Scoring Scale (1-10)**:

- **1-2 (Trivial)**: Single file, no external dependencies
  - Example: Internal function modification, standalone utility
  - Anchor: "Add validation function to existing utils file"

- **3-4 (Low)**: 2-3 files in same module, minimal external interaction
  - Example: Update component and its test file
  - Anchor: "Add new method to service class with unit tests"

- **5-6 (Moderate)**: Multiple modules, some external APIs or databases
  - Example: Feature spanning frontend/backend, third-party service integration
  - Anchor: "Add payment processing with Stripe API integration"

- **7-8 (High)**: Many systems, complex data flow, multiple external services
  - Example: Cross-service communication, database + cache + API coordination
  - Anchor: "Implement user analytics with database, Redis, and external tracking"

- **9-10 (Extreme)**: Extensive system modifications, many external dependencies
  - Example: Major refactor affecting entire codebase, multiple external service coordination
  - Anchor: "Migrate from REST to GraphQL across 15+ services"

### 4. Scope Breadth
**Definition**: Range of functionality, features, or user stories encompassed by the task.

**Scoring Scale (1-10)**:

- **1-2 (Trivial)**: Single atomic action, one specific behavior
  - Example: Fix typo, adjust spacing, single bug fix
  - Anchor: "Fix spelling error in error message"

- **3-4 (Low)**: Small feature or focused improvement, clear boundaries
  - Example: Add tooltip, implement single form field
  - Anchor: "Add password strength indicator to registration form"

- **5-6 (Moderate)**: Complete feature with multiple related functions
  - Example: User profile management, basic CRUD operations
  - Anchor: "Implement user profile editing with image upload"

- **7-8 (High)**: Major feature with multiple user workflows
  - Example: Complete authentication system, advanced search functionality
  - Anchor: "Build comprehensive order management system"

- **9-10 (Extreme)**: Multiple major features, entire subsystem or platform
  - Example: Complete e-commerce platform, full CMS implementation
  - Anchor: "Implement complete multi-tenant SaaS platform"

### 5. Uncertainty Level
**Definition**: Degree of ambiguity in requirements, unknown technical challenges, or need for research/experimentation.

**Scoring Scale (1-10)**:

- **1-2 (Trivial)**: Crystal clear requirements, well-known solution path
  - Example: Implement standard form validation, copy existing pattern
  - Anchor: "Add required field validation to existing form"

- **3-4 (Low)**: Minor ambiguities, standard solutions available
  - Example: UI styling with general guidelines, documented API integration
  - Anchor: "Style new component to match design system"

- **5-6 (Moderate)**: Some requirements need clarification, solution approach is known
  - Example: Performance optimization with general goals, feature with edge cases
  - Anchor: "Optimize page load time (no specific target defined)"

- **7-8 (High)**: Significant unknowns, research required, multiple solution paths
  - Example: Integration with undocumented API, novel performance requirements
  - Anchor: "Implement real-time features (specific latency requirements TBD)"

- **9-10 (Extreme)**: Major unknowns, experimental solutions, high research component
  - Example: Proof of concept for new technology, solving unprecedented problems
  - Anchor: "Evaluate feasibility of AI-powered feature (no existing examples)"

## Composite Scoring Methodology

### Primary Calculation Method: Weighted Maximum
The composite score uses a weighted approach that prevents extreme scores from being diminished by averaging:

```
Composite Score = MAX(
  Technical Depth × 1.0,
  Decision Complexity × 0.9,
  Integration Points × 0.8,
  Scope Breadth × 0.7,
  Uncertainty Level × 1.1
)
```

**Rationale**: 
- Uncertainty Level gets highest weight (1.1) as it most strongly predicts task difficulty
- Technical Depth gets full weight (1.0) as core complexity driver
- Other dimensions weighted by their impact on execution difficulty

### Alternative: Tiered Scoring
For more nuanced assessment, use tiered calculation:

```
Primary Driver = MAX(Technical Depth, Decision Complexity, Uncertainty Level)
Secondary Factors = AVERAGE(Integration Points, Scope Breadth)
Composite Score = (Primary Driver × 0.7) + (Secondary Factors × 0.3)
```

## Calibration Examples

### Score 1-2: Trivial Tasks
- "Change button color from blue to green"
- "Fix typo in user documentation"
- "Update copyright year in footer"

### Score 3-4: Simple Tasks
- "Add email validation to contact form"
- "Create new page using existing template"
- "Add logging to existing function"

### Score 5-6: Moderate Tasks
- "Implement user password reset functionality"
- "Add search filtering to product list"
- "Create responsive mobile layout for dashboard"

### Score 7-8: Complex Tasks
- "Build real-time chat system with message history"
- "Implement advanced user permissions system"
- "Create automated deployment pipeline"

### Score 9-10: Extreme Tasks
- "Design and implement custom database engine"
- "Build machine learning recommendation system from scratch"
- "Create distributed microservices architecture"

## Edge Case Handling

### High Single Dimension, Low Others
**Scenario**: Task scores 9 on Technical Depth but 2-3 on other dimensions
**Approach**: Use weighted maximum to ensure high complexity is recognized
**Example**: "Implement custom cryptographic algorithm (simple interface, clear requirements)"

### Balanced Medium Scores
**Scenario**: Task scores 5-6 across all dimensions
**Approach**: Apply slight upward adjustment (+0.5) to account for cumulative complexity
**Example**: Multi-step feature with moderate complexity in each area

### Uncertainty Dominance
**Scenario**: High uncertainty but otherwise straightforward task
**Approach**: Uncertainty Level gets 1.1 weight multiplier to reflect planning difficulty
**Example**: "Integrate with third-party API (documentation incomplete)"

## Implementation Guidelines for AI Agents

### Step-by-Step Scoring Process

1. **Analyze Task Description**: Break down requirements and identify key components

2. **Score Each Dimension**: 
   - Compare against anchor examples
   - Use calibration examples for reference
   - Document reasoning for scores ≥7

3. **Calculate Composite Score**:
   - Apply weighted maximum formula
   - Round to nearest 0.5 for final score
   - Validate against calibration examples

4. **Quality Check**:
   - Ensure score aligns with intuitive difficulty assessment
   - Check for edge cases requiring special handling
   - Document any scoring rationale for complex cases

### Common Scoring Pitfalls to Avoid

- **Scope Confusion**: Don't conflate task size with complexity
- **Technology Bias**: Don't automatically score familiar technologies as low complexity
- **Requirements Clarity**: Factor uncertainty appropriately - unclear requirements increase complexity
- **Integration Underestimation**: Count all affected systems, not just primary ones
- **Decision Invisibility**: Account for implicit architectural decisions

### Validation Prompts

Before finalizing scores, ask:
- "Would a senior developer estimate similar effort for this complexity level?"
- "Are there hidden integration points or decisions not accounted for?"
- "Does the uncertainty level reflect actual unknowns vs. documentation gaps?"
- "Would this task require specialized knowledge beyond the stated technical depth?"

## Integration with Task Management

### Task Subdivision Triggers
- Composite Score ≥ 8: Consider splitting into smaller tasks
- Any dimension score ≥ 9: Mandatory subdivision review
- Multiple dimensions ≥ 7: Evaluate task atomic nature

### Resource Allocation Guidelines
- Score 1-3: Junior developer, 2-4 hours
- Score 4-6: Mid-level developer, 0.5-2 days
- Score 7-8: Senior developer, 2-5 days
- Score 9-10: Expert/team effort, 1+ weeks

### Risk Assessment Integration
Complexity scores inform risk planning:
- Score ≥ 7: Require explicit risk mitigation
- High Uncertainty (≥ 7): Add research/spike tasks
- High Integration (≥ 7): Add integration testing tasks
- High Technical Depth (≥ 8): Add knowledge transfer tasks

This algorithm provides a systematic, calibrated approach to task complexity assessment that can be reliably applied by AI agents while maintaining consistency across different types of development tasks.