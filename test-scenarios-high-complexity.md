# High-Complexity Task Test Scenarios

## Overview

This document provides detailed test scenarios for validating the enhanced generate-tasks.md template with high-complexity tasks (composite score >5). Each scenario includes expected complexity scoring, decomposition patterns, and validation criteria.

---

## Test Scenario 1: Real-time Collaborative System

### Original Task
```yaml
Task: "Implement real-time multi-user collaborative document editing with conflict resolution and version history"
Context: Building a Google Docs-like editor with operational transforms
```

### Expected Complexity Analysis
```yaml
Complexity Dimensions:
  Technical Depth: 9
    - Operational transforms (advanced algorithm)
    - WebSocket management
    - CRDT or similar conflict resolution
    - Real-time synchronization patterns
    
  Decision Complexity: 8
    - Conflict resolution strategy selection
    - Data structure for document state
    - Network partition handling approach
    - Performance vs consistency trade-offs
    
  Integration Points: 8
    - Frontend editor integration
    - WebSocket server coordination
    - Database persistence layer
    - User authentication system
    - Potential CDN for scaling
    
  Scope Breadth: 8
    - Complete collaborative editing system
    - Version history management
    - Multi-user coordination
    - Conflict resolution UI
    
  Uncertainty Level: 7
    - Performance requirements unclear
    - Scale requirements undefined
    - Browser compatibility needs
    
Composite Score: MAX(9×1.0, 8×0.9, 8×0.8, 8×0.7, 7×1.1) = MAX(9, 7.2, 6.4, 5.6, 7.7) = 9.0
```

### Expected Decomposition (Technology Layering + Integration Isolation Pattern)
```yaml
Decomposition Required: YES (score 9.0 > 6)
Pattern: Technology Layering + Integration Isolation

Subtask 1: "Research and implement operational transform algorithm"
  Technical Depth: 7 (complex algorithm, but focused)
  Decision Complexity: 6 (algorithm selection decisions)
  Integration Points: 2 (isolated research and implementation)
  Scope Breadth: 4 (single algorithm focus)
  Uncertainty Level: 8 (research needed)
  Composite Score: 8 × 1.1 = 8.8 → NEEDS FURTHER DECOMPOSITION

Subtask 2: "Build WebSocket real-time communication layer"
  Technical Depth: 6 (WebSocket implementation)
  Decision Complexity: 4 (connection management patterns)
  Integration Points: 5 (server, client, message handling)
  Scope Breadth: 5 (complete communication system)
  Uncertainty Level: 3 (well-known patterns)
  Composite Score: 6 × 1.0 = 6.0 → NEEDS DECOMPOSITION

Subtask 3: "Create document state management and persistence"
  Technical Depth: 5 (database operations, state management)
  Decision Complexity: 5 (data structure decisions)
  Integration Points: 6 (editor, database, sync system)
  Scope Breadth: 6 (complete state system)
  Uncertainty Level: 4 (some architectural decisions)
  Composite Score: 6 × 0.8 = 4.8 → ACCEPTABLE

Subtask 4: "Implement conflict resolution UI and user feedback"
  Technical Depth: 4 (UI implementation)
  Decision Complexity: 5 (UX decisions for conflicts)
  Integration Points: 4 (editor integration, state system)
  Scope Breadth: 4 (focused UI feature)
  Uncertainty Level: 6 (UX requirements unclear)
  Composite Score: 6 × 1.1 = 6.6 → NEEDS DECOMPOSITION
```

### Second Decomposition Round
```yaml
Subtask 1 Decomposition:
  1a: "Research operational transform algorithms and select approach" (Score: 4.2)
  1b: "Implement core operational transform logic" (Score: 4.8)
  1c: "Add operational transform testing and validation" (Score: 3.6)

Subtask 2 Decomposition:
  2a: "Implement WebSocket server infrastructure" (Score: 4.1)
  2b: "Create client-side WebSocket management" (Score: 3.9)
  2c: "Add connection error handling and reconnection logic" (Score: 4.3)

Subtask 4 Decomposition:
  4a: "Design conflict resolution UI components" (Score: 3.8)
  4b: "Implement conflict notification system" (Score: 4.2)
  4c: "Add user feedback for concurrent edits" (Score: 3.5)
```

### Final Task List (All ≤5)
1. Research operational transform algorithms and select approach (4.2)
2. Implement core operational transform logic (4.8)
3. Add operational transform testing and validation (3.6)
4. Implement WebSocket server infrastructure (4.1)
5. Create client-side WebSocket management (3.9)
6. Add connection error handling and reconnection logic (4.3)
7. Create document state management and persistence (4.8)
8. Design conflict resolution UI components (3.8)
9. Implement conflict notification system (4.2)
10. Add user feedback for concurrent edits (3.5)

### Expected Dependencies
```yaml
Dependencies:
  2 → 1  # Core logic needs algorithm research
  3 → 2  # Testing needs core implementation
  5 → 4  # Client WebSocket needs server
  6 → 5  # Error handling needs basic client connection
  7 → 2  # State management needs transform logic
  8 → 7  # UI design needs state management understanding
  9 → 8  # Notification system needs UI design
  10 → 9 # User feedback needs notification system
```

---

## Test Scenario 2: Microservices Architecture Implementation

### Original Task
```yaml
Task: "Design and implement microservices architecture with service discovery, API gateway, distributed tracing, and fault tolerance"
Context: Migrating monolithic application to microservices
```

### Expected Complexity Analysis
```yaml
Complexity Dimensions:
  Technical Depth: 8
    - Multiple advanced technologies (Docker, Kubernetes, service mesh)
    - Distributed systems patterns
    - Network configuration and management
    
  Decision Complexity: 9
    - Service boundary decisions
    - Technology stack choices for each component
    - Data consistency strategy
    - Communication patterns (sync vs async)
    
  Integration Points: 9
    - Multiple services coordination
    - External API integrations
    - Database integration per service
    - Monitoring and logging systems
    - Load balancer configuration
    
  Scope Breadth: 9
    - Complete architecture overhaul
    - Multiple subsystem implementations
    - Infrastructure and application concerns
    
  Uncertainty Level: 8
    - Performance impact unclear
    - Migration strategy decisions
    - Resource requirements unknown
    
Composite Score: MAX(8×1.0, 9×0.9, 9×0.8, 9×0.7, 8×1.1) = MAX(8, 8.1, 7.2, 6.3, 8.8) = 8.8
```

### Expected Decomposition (Decision-Implementation Split + Technology Layering Pattern)
```yaml
Decomposition Required: YES (score 8.8 > 6)
Pattern: Decision-Implementation Split + Technology Layering

Phase 1 - Architecture and Planning:
Subtask 1: "Design service boundaries and data ownership model"
  Composite Score: 4.5 (focused on architectural decisions)

Subtask 2: "Select and document technology stack for each component"
  Composite Score: 4.2 (technology research and documentation)

Phase 2 - Infrastructure Implementation:
Subtask 3: "Implement API gateway with routing and authentication"
  Composite Score: 4.8 (single technology focus)

Subtask 4: "Set up service discovery mechanism (Consul/etcd)"
  Composite Score: 4.1 (focused infrastructure component)

Subtask 5: "Configure distributed tracing with Jaeger/Zipkin"
  Composite Score: 4.3 (single monitoring system)

Phase 3 - Service Implementation:
Subtask 6: "Extract user service from monolith with database migration"
  Composite Score: 4.9 (focused service extraction)

Subtask 7: "Extract order service from monolith with database migration"
  Composite Score: 4.7 (similar to user service)

Phase 4 - Cross-cutting Concerns:
Subtask 8: "Implement circuit breaker and fault tolerance patterns"
  Composite Score: 4.4 (focused resilience patterns)

Subtask 9: "Set up centralized logging and monitoring dashboard"
  Composite Score: 3.8 (operational tooling)

Subtask 10: "Create deployment pipeline for microservices"
  Composite Score: 4.6 (CI/CD automation)
```

---

## Test Scenario 3: AI-Powered Feature Implementation

### Original Task
```yaml
Task: "Implement AI-powered content recommendation engine with machine learning model training, real-time inference, and personalization"
Context: E-commerce product recommendation system
```

### Expected Complexity Analysis
```yaml
Complexity Dimensions:
  Technical Depth: 9
    - Machine learning model implementation
    - Real-time inference infrastructure
    - Data pipeline construction
    - Model deployment and versioning
    
  Decision Complexity: 8
    - Algorithm selection (collaborative filtering, content-based, hybrid)
    - Feature engineering decisions
    - Model architecture choices
    - Performance vs accuracy trade-offs
    
  Integration Points: 7
    - Frontend recommendation display
    - User behavior tracking
    - Product catalog integration
    - Analytics and feedback loops
    - Model training infrastructure
    
  Scope Breadth: 8
    - Complete ML pipeline
    - Data collection and processing
    - Model training and deployment
    - Real-time recommendation serving
    
  Uncertainty Level: 9
    - Model performance requirements unclear
    - Data quality and availability unknown
    - Scaling requirements undefined
    - Business metrics for success unclear
    
Composite Score: MAX(9×1.0, 8×0.9, 7×0.8, 8×0.7, 9×1.1) = MAX(9, 7.2, 5.6, 5.6, 9.9) = 9.9
```

### Expected Decomposition (Research-Implementation Split Pattern)
```yaml
Decomposition Required: YES (score 9.9 > 6, multiple dimensions ≥8)
Pattern: Research-Implementation Split

Research Phase:
Subtask 1: "Research and prototype recommendation algorithms"
  Composite Score: 4.9 (focused research, reduced uncertainty)

Subtask 2: "Analyze existing user data and define feature engineering approach"
  Composite Score: 4.1 (data analysis focus)

Subtask 3: "Define model evaluation metrics and success criteria"
  Composite Score: 3.4 (business requirements definition)

Implementation Phase:
Subtask 4: "Build data pipeline for user behavior collection"
  Composite Score: 4.6 (data engineering focus)

Subtask 5: "Implement model training infrastructure with MLflow"
  Composite Score: 4.8 (ML infrastructure focus)

Subtask 6: "Create real-time inference API with model serving"
  Composite Score: 4.7 (API development focus)

Subtask 7: "Integrate recommendation display in frontend"
  Composite Score: 3.9 (frontend integration)

Validation Phase:
Subtask 8: "Implement A/B testing framework for recommendation evaluation"
  Composite Score: 4.3 (testing infrastructure)

Subtask 9: "Set up model performance monitoring and alerting"
  Composite Score: 3.8 (monitoring focus)
```

---

## Test Scenario 4: Legacy System Migration

### Original Task
```yaml
Task: "Migrate legacy PHP monolith to modern Node.js architecture with database migration, API modernization, and zero-downtime deployment"
Context: Large e-commerce platform migration
```

### Expected Complexity Analysis
```yaml
Complexity Dimensions:
  Technical Depth: 7
    - Multiple technology stacks (PHP → Node.js)
    - Database migration strategies
    - API redesign and implementation
    
  Decision Complexity: 8
    - Migration strategy decisions (big bang vs incremental)
    - API versioning and backward compatibility
    - Data migration approach
    - Zero-downtime deployment strategy
    
  Integration Points: 8
    - Frontend application updates
    - Third-party service integrations
    - Database schema migrations
    - Existing API client impacts
    
  Scope Breadth: 9
    - Complete system rewrite
    - Multiple subsystem migrations
    - Infrastructure changes
    - Business continuity requirements
    
  Uncertainty Level: 7
    - Legacy code complexity unknown
    - Data quality issues unclear
    - Performance impact uncertain
    - Timeline and resource constraints
    
Composite Score: MAX(7×1.0, 8×0.9, 8×0.8, 9×0.7, 7×1.1) = MAX(7, 7.2, 6.4, 6.3, 7.7) = 7.7
```

### Expected Decomposition (Functional Decomposition + Integration Isolation Pattern)
```yaml
Decomposition Required: YES (score 7.7 > 6)
Pattern: Functional Decomposition + Integration Isolation

Analysis Phase:
Subtask 1: "Analyze legacy codebase and create migration assessment"
  Composite Score: 4.2 (analysis focus, reduced uncertainty)

Subtask 2: "Design new Node.js architecture and API structure"
  Composite Score: 4.5 (architecture design focus)

Data Migration:
Subtask 3: "Plan and implement database schema migration strategy"
  Composite Score: 4.8 (database focus)

Subtask 4: "Create data migration scripts and validation processes"
  Composite Score: 4.1 (data processing focus)

Application Migration:
Subtask 5: "Implement core business logic in Node.js"
  Composite Score: 4.9 (application development)

Subtask 6: "Create new REST API with backward compatibility layer"
  Composite Score: 4.6 (API development)

Subtask 7: "Update frontend to consume new API endpoints"
  Composite Score: 3.8 (frontend integration)

Deployment Strategy:
Subtask 8: "Implement blue-green deployment infrastructure"
  Composite Score: 4.4 (deployment automation)

Subtask 9: "Create monitoring and rollback procedures"
  Composite Score: 3.9 (operational procedures)
```

---

## Test Scenario 5: Edge Case - Extremely High Complexity

### Original Task
```yaml
Task: "Build quantum-resistant cryptographic system with custom algorithms, hardware security module integration, and formal verification"
Context: High-security financial system
```

### Expected Complexity Analysis
```yaml
Complexity Dimensions:
  Technical Depth: 10
    - Quantum cryptography algorithms
    - Hardware security integration
    - Formal verification tools
    - Custom cryptographic implementation
    
  Decision Complexity: 9
    - Algorithm selection for quantum resistance
    - Security model design
    - Performance vs security trade-offs
    - Compliance requirements
    
  Integration Points: 7
    - HSM hardware integration
    - Existing security infrastructure
    - Application layer integration
    - Key management systems
    
  Scope Breadth: 8
    - Complete cryptographic system
    - Multiple algorithm implementations
    - Hardware and software components
    
  Uncertainty Level: 10
    - Quantum threat timeline unknown
    - Performance requirements unclear
    - Regulatory compliance evolving
    - Algorithm standardization in progress
    
Composite Score: MAX(10×1.0, 9×0.9, 7×0.8, 8×0.7, 10×1.1) = MAX(10, 8.1, 5.6, 5.6, 11) = 11.0
```

### Expected Result: Escalation After Maximum Iterations
```yaml
Iteration 1: Score 11.0 → Decomposition attempted
Iteration 2: Subtasks still >6 due to inherent complexity
Iteration 3: Minimal improvement, scores remain high

Expected Outcome:
- Mark as status: "needs-clarification"
- Add escalation note: "Task complexity remains high after maximum decomposition attempts"
- Document in complexity_notes: "Requires senior architect review - inherent complexity exceeds decomposition capabilities"
- Recommend breaking into research phase and implementation phase at project planning level
```

---

## Validation Criteria for All Test Scenarios

### Complexity Scoring Validation
- [ ] All scoring follows rubric guidelines consistently
- [ ] Composite scores calculated correctly using weighted maximum formula
- [ ] Similar complexity tasks score within ±1 point variance
- [ ] Scoring rationale documented for high-complexity tasks

### Decomposition Validation
- [ ] Tasks >6 composite score trigger decomposition
- [ ] Tasks ≤5 composite score do not trigger decomposition  
- [ ] Appropriate decomposition patterns selected based on primary complexity drivers
- [ ] Subtasks achieve meaningful complexity reduction

### Safety Controls Validation
- [ ] Maximum 3 iteration limit enforced
- [ ] Tasks scoring ≤3 never decomposed (over-decomposition protection)
- [ ] Convergence monitoring prevents infinite loops
- [ ] Escalation procedures followed for non-converging tasks

### Dependency Integrity Validation
- [ ] No circular dependencies created during decomposition
- [ ] All dependencies reference valid, achievable tasks
- [ ] Dependency relationships remain logically consistent
- [ ] Orphaned tasks prevented or properly flagged

### Documentation Requirements
- [ ] Complexity scores documented for all complex tasks
- [ ] Decomposition rationale included in complexity_notes
- [ ] Iteration history tracked for audit purposes
- [ ] Escalation documentation complete for edge cases

---

## Expected Test Execution Results

### Success Metrics
- **100% Complexity Constraint Compliance**: All final tasks ≤5 composite score
- **Effective Decomposition**: Average 3.2 subtasks per decomposed task
- **Dependency Integrity**: 0 circular dependencies across all test scenarios
- **Safety Control Effectiveness**: 100% compliance with iteration limits and protection thresholds
- **Consistency**: <10% variance in complexity scores for similar tasks

### Performance Benchmarks
- **Scenario 1 (Collaborative System)**: ~8 minutes processing time
- **Scenario 2 (Microservices)**: ~6 minutes processing time
- **Scenario 3 (AI-Powered Feature)**: ~7 minutes processing time
- **Scenario 4 (Legacy Migration)**: ~5 minutes processing time
- **Scenario 5 (Extreme Complexity)**: ~3 minutes before escalation

### Quality Assurance
- All decomposed tasks maintain skill coherence (1-2 skills maximum)
- Scope preservation maintained throughout decomposition process
- Error handling procedures effectively manage edge cases
- Template instructions remain clear and actionable for AI agents