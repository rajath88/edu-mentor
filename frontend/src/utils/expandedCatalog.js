const catalog = [
  ["operating-systems", "Operating Systems", "OS", "Computer Science", "Intermediate", [
    ["Processes and threads", "A process owns an address space and resources; a thread is an execution path within that process. Threads share process memory, so synchronization is needed when they update shared state.", "An editor can keep its UI responsive while a background thread indexes files."],
    ["Scheduling and concurrency", "Schedulers allocate CPU time among runnable work. Preemption improves responsiveness, while locks, semaphores, and condition variables coordinate concurrent access and can introduce deadlocks.", "A round-robin scheduler gives each ready process a time slice before rotating."],
    ["Virtual memory", "Virtual memory maps each process's addresses onto physical memory and storage. Paging enables isolation and demand loading; page faults are normal when a needed page must be fetched.", "A process can use a private virtual address 0x1000 that maps to a different physical page than another process's 0x1000."],
    ["Filesystems and I/O", "Filesystems organize names and metadata over storage blocks. Buffering and caching reduce device waits, while journaling helps restore consistency after interruption.", "A journal records intended metadata updates before the filesystem applies them."],
  ]],
  ["database-management-systems", "Database Management Systems", "DB", "Computer Science", "Intermediate", [
    ["Relational modeling", "Relations organize records into tables with keys. Normalization separates facts that change independently, reducing update anomalies while joins reconstruct related views.", "Store each course once and link enrollments through course_id and student_id."],
    ["SQL queries and joins", "SQL selects rows with predicates, groups aggregates, and joins tables through related columns. A join condition must reflect the intended relationship to avoid accidental row multiplication.", "Join orders to customers on customer_id, then group by customer to compute totals."],
    ["Transactions and ACID", "Transactions group operations into atomic work. ACID describes atomicity, consistency, isolation, and durability; isolation level determines which concurrent changes a transaction can observe.", "A bank transfer debits one account and credits another inside one transaction."],
    ["Indexes and query plans", "Indexes trade extra storage and write work for faster lookup. A query planner estimates costs and chooses scans or index paths using predicates, row counts, and available statistics.", "An index on (student_id, taken_on) can support a student's date-ordered mark history."],
  ]],
  ["computer-networks", "Computer Networks", "NET", "Computer Science", "Intermediate", [
    ["Layered network models", "Layering separates responsibilities: link delivery, IP routing, transport, and application protocols. Encapsulation wraps application data with headers added at each layer.", "An HTTPS request travels in TCP segments, IP packets, then link frames."],
    ["IP addressing and routing", "IP addresses identify interfaces within a network; routers forward packets using destination prefixes and routing tables. Subnets divide address space into manageable boundaries.", "A /24 IPv4 subnet has 256 addresses before network and broadcast reservations."],
    ["TCP, UDP, and reliability", "TCP provides ordered byte delivery with retransmission and congestion control. UDP sends datagrams without those guarantees, fitting applications that handle timing or recovery themselves.", "A file transfer uses TCP reliability; a live voice stream may prefer timely UDP packets."],
    ["DNS, HTTP, and TLS", "DNS resolves names to records, HTTP defines web request semantics, and TLS authenticates a server and encrypts a connection. These protocols compose into the browser's secure web request.", "A browser resolves a hostname, negotiates TLS, then sends an HTTP request."],
  ]],
  ["object-oriented-programming", "Object-Oriented Programming", "OOP", "Computer Science", "Beginner to intermediate", [
    ["Objects, state, and behavior", "Objects combine state with operations that preserve rules around that state. Encapsulation exposes a small public interface while hiding representation details.", "A bank account exposes deposit and withdraw operations instead of letting callers edit its balance directly."],
    ["Abstraction and interfaces", "Abstraction describes what a component promises without binding callers to one implementation. Interfaces let multiple implementations satisfy the same contract.", "A repository interface can have in-memory and database implementations."],
    ["Composition and inheritance", "Composition builds behavior by combining collaborating objects; inheritance models a genuine subtype relationship. Favor composition when reuse does not represent substitutability.", "A car contains an engine rather than inheriting from Engine."],
    ["Polymorphism and design", "Polymorphism lets code call a shared contract while runtime behavior varies by concrete type. Small cohesive classes and explicit dependencies make these variations easier to test.", "A renderer can call draw() on circles and rectangles through one Shape interface."],
  ]],
  ["python-programming", "Python Programming", "PY", "Software Engineering", "Beginner", [
    ["Values, types, and control flow", "Python binds names to objects and uses indentation to delimit blocks. Conditions and loops express control flow; type behavior is determined by the objects involved at runtime.", "Use enumerate(items) to loop over both each value and its index."],
    ["Functions and modules", "Functions package reusable behavior and may accept defaults or keyword-only arguments. Modules define namespaces; importing code executes its module body once per interpreter process.", "Put parsing helpers in a module and import them from the command-line entry point."],
    ["Collections and comprehensions", "Lists preserve order, tuples are immutable sequences, sets hold unique values, and dictionaries map keys to values. Comprehensions construct a collection from an iterable and optional filter.", "{name: len(name) for name in names} maps each name to its length."],
    ["Exceptions, testing, and environments", "Exceptions communicate failures that callers can handle. Unit tests check behavior, and isolated virtual environments keep project dependencies separate.", "Raise ValueError for invalid input and assert that behavior in a focused test."],
  ]],
  ["javascript-programming", "JavaScript Programming", "JS", "Software Engineering", "Beginner to intermediate", [
    ["Values, scope, and functions", "JavaScript distinguishes primitive values from object references. Lexical scope determines where a name is available; closures retain access to the scope where a function was created.", "A callback can close over a request ID to reject stale results."],
    ["Objects, arrays, and modules", "Objects map property keys to values, arrays are ordered indexed collections, and ES modules expose explicit imports and exports. Prefer const for bindings that are not reassigned.", "Export a pure formatDate function and import it where the view needs it."],
    ["Promises and async work", "Promises represent eventual completion or failure. async/await makes promise chains easier to read, but rejected work still needs deliberate error handling.", "try { await fetchData() } catch (error) { showError(error) }"],
    ["DOM events and browser APIs", "The DOM represents the document tree, and events report user or browser actions. Event handlers should clean up subscriptions when their owning component is removed.", "Register a keydown handler on mount and remove the same handler on cleanup."],
  ]],
  ["typescript-programming", "TypeScript Programming", "TS", "Software Engineering", "Intermediate", [
    ["Types and inference", "TypeScript checks JavaScript programs using inferred and declared types, then erases those types during compilation. Types improve feedback but do not validate untrusted runtime input.", "Parse JSON and verify its shape before treating it as a typed Student object."],
    ["Unions, narrowing, and generics", "Union types describe alternatives; control-flow checks narrow a value to a safe member. Generics preserve relationships between input and output types.", "A Result<T> can be Success<T> or Failure and be narrowed by its kind field."],
    ["Interfaces and utility types", "Interfaces and type aliases describe object contracts. Utility types such as Pick and Partial derive a new shape while retaining relationships to an existing type.", "Pick<Student, 'id' | 'name'> models a safe public list item."],
    ["Typed async APIs", "Typing request and response boundaries documents expected data. Runtime validation remains essential because a remote service can return malformed or unexpected values.", "Fetch unknown JSON, validate required fields, then construct a typed response."],
  ]],
  ["react-programming", "React.js", "RE", "Software Engineering", "Intermediate", [
    ["Components and rendering", "React components describe UI from props and state. Rendering should remain pure: the same inputs should produce the same element tree without mutating external systems.", "Extract a reusable CourseCard that receives course and progress props."],
    ["State and events", "State stores information that changes over time; event handlers request updates rather than mutating state directly. Functional updates avoid stale values when an update depends on prior state.", "setCount(value => value + 1) derives the next count from the latest value."],
    ["Effects and lifecycle", "Effects synchronize a component with external systems such as timers or subscriptions. Cleanup undoes that setup; effects are not a replacement for derived render values.", "Start a polling interval in an effect and clear it when the component unmounts."],
    ["Forms, accessibility, and performance", "Controlled forms keep input values in state. Semantic elements and labels help assistive technology; memoization is useful only when measured work is costly.", "Associate a visible label with an input using matching htmlFor and id values."],
  ]],
  ["spring-boot", "Spring Boot", "SB", "Software Engineering", "Intermediate", [
    ["Application configuration", "Spring Boot assembles application components and externalizes configuration. Profiles and environment variables let the same artifact run in different environments without embedding secrets.", "Bind a database URL from an environment variable and keep the default local-only."],
    ["Dependency injection and services", "The container constructs beans and injects their dependencies. Constructor injection makes required collaborators explicit and supports simple unit testing.", "A controller delegates a request to a service that owns business rules."],
    ["REST controllers and validation", "Controllers map HTTP routes to typed inputs and outputs. Bean Validation checks request fields before service logic runs; errors should use clear status codes.", "Reject an empty course name with a validation response instead of persisting it."],
    ["Persistence, migrations, and tests", "Spring Data repositories abstract common persistence operations, while Flyway records ordered schema changes. Integration tests should verify the real database mapping and migration path.", "Add a new migration rather than editing a migration already applied elsewhere."],
  ]],
  ["rest-apis", "REST APIs", "API", "Software Engineering", "Intermediate", [
    ["Resources and HTTP semantics", "REST APIs expose resources through stable identifiers and use HTTP methods according to their intent. Status codes communicate outcomes without relying on ambiguous response text.", "GET retrieves a course; POST creates an enrollment."],
    ["Representations and validation", "JSON representations transfer resource data, while validation enforces shape and business constraints. Responses should avoid exposing internal entities or sensitive fields.", "Return an enrollment DTO rather than a database entity with private fields."],
    ["Errors, pagination, and idempotency", "Consistent error shapes help clients recover; pagination bounds large collections. Idempotency keys let a retry avoid repeating a non-idempotent action.", "A payment-like create request can use a client request key to prevent duplicate processing."],
    ["Compatibility and API testing", "Backward-compatible changes preserve existing fields and behavior while adding optional capabilities. Contract tests verify request and response expectations between clients and services.", "Add an optional response field without renaming the existing property."],
  ]],
  ["microservices", "Microservices", "MS", "Software Engineering", "Advanced", [
    ["Service boundaries", "A service should own a cohesive business capability and its data. Boundaries based on stable domain responsibilities reduce cross-service coordination and shared-schema coupling.", "Enrollment owns registration state while a catalog service owns course descriptions."],
    ["Communication and resilience", "Synchronous calls are simple but couple availability and latency. Timeouts, bounded retries, circuit breakers, and asynchronous messages limit failure propagation.", "Retry a transient GET with a limit; do not blindly retry a non-idempotent POST."],
    ["Data consistency and events", "Separate databases improve ownership but prevent one ACID transaction across services. Events and sagas coordinate eventual consistency and require idempotent consumers.", "An EnrollmentCreated event can trigger a notification without sharing the enrollment database."],
    ["Observability and deployment", "Distributed traces connect work across services; metrics reveal rates and latency while structured logs explain events. Deployment automation must preserve compatibility during rollout.", "Add a trace ID to gateway and service logs for one request path."],
  ]],
  ["system-design", "System Design", "SD", "Software Engineering", "Advanced", [
    ["Requirements and estimation", "Design begins with user requirements, constraints, and rough workload estimates. Explicit assumptions expose which throughput, latency, durability, and privacy goals shape the design.", "Estimate daily events, peak request rate, and data retained before choosing a database."],
    ["Data models and APIs", "Data ownership, access patterns, and consistency requirements guide storage choices. API boundaries define how components evolve and what they can depend on.", "A read-heavy course catalog can use a different access strategy from a mutable enrollment record."],
    ["Scaling and caching", "Horizontal scaling adds instances, while caches reduce repeated work at the cost of freshness and invalidation complexity. Bottleneck measurement should guide each optimization.", "Cache a public course description but fetch a student's current progress from its authoritative store."],
    ["Reliability and trade-offs", "Reliable systems define failure modes, recovery objectives, redundancy, and safe degradation. Every design choice trades cost, complexity, consistency, and operational risk.", "A queue can absorb a short traffic spike but adds delivery and retry semantics."],
  ]],
  ["git-github", "Git and GitHub", "GIT", "Software Engineering", "Beginner to intermediate", [
    ["Snapshots, commits, and branches", "Git commits form a content-addressed history of project snapshots. Branches are movable references that let work progress independently before it is integrated.", "Create a feature branch and commit a focused change before opening a review."],
    ["Merge and rebase", "Merging combines histories while preserving branch structure; rebasing replays commits onto another base. Shared published history should not be rewritten without coordination.", "Rebase a private feature branch to update it before merging."],
    ["Remotes and pull requests", "Remotes connect local repository references to hosted repositories. Pull requests provide review, discussion, automated checks, and an auditable integration path.", "Push a branch to a remote and request review without changing the production branch."],
    ["Recovery and collaboration", "The reflog records local reference movement and can help recover commits. Small changes, clear messages, and conflict resolution reduce collaboration risk.", "Use git status and git diff before staging to avoid committing unrelated files."],
  ]],
  ["software-testing", "Software Testing", "TEST", "Software Engineering", "Intermediate", [
    ["Test levels and boundaries", "Unit tests isolate small logic; integration tests verify collaborators; end-to-end tests exercise a user workflow. Choose the narrowest test that gives reliable evidence.", "Test a score calculation as a unit, then test saving it through the repository integration."],
    ["Assertions and test data", "A useful test states a behavior with clear input and expected output. Independent, minimal fixtures make failures easier to diagnose.", "Give an invalid date and assert the API returns a validation error."],
    ["Mocks and integration testing", "Mocks isolate external collaborators but can mirror implementation assumptions. Integration tests exercise real adapters where persistence or protocol behavior matters.", "Use a disposable database to test a Flyway migration and JPA mapping."],
    ["Regression and test quality", "Regression tests preserve a reproduced bug as an executable rule. Deterministic tests avoid timing, shared state, and environment assumptions where possible.", "Capture the original request that caused a duplicate award and assert a retry awards zero XP."],
  ]],
  ["artificial-intelligence-fundamentals", "Artificial Intelligence Fundamentals", "AI", "Artificial Intelligence", "Beginner", [
    ["Agents, states, and goals", "An AI agent observes an environment and selects actions toward an objective. A clear state, action set, and performance measure make an agent problem well-defined.", "A route-planning agent observes its location and road graph before choosing the next turn."],
    ["Search and heuristics", "Search explores possible states; uninformed strategies use only structure, while heuristics estimate distance to a goal. An admissible heuristic does not overestimate the remaining cost.", "Straight-line distance can guide route search without exceeding road travel distance."],
    ["Knowledge and reasoning", "Knowledge representations encode facts and relations so inference rules can derive consequences. Uncertain domains require probabilities rather than treating every fact as certain.", "If every enrolled student has an ID and Mira is enrolled, infer Mira has an ID."],
    ["Evaluation and responsible use", "AI systems should be evaluated against task-relevant data and failure costs. Privacy, bias, transparency, and human oversight belong in the design rather than being afterthoughts.", "Check error rates across groups before relying on an automated grading aid."],
  ]],
  ["deep-learning", "Deep Learning", "DL", "Artificial Intelligence", "Intermediate", [
    ["Neurons and forward passes", "Neural networks transform inputs through layers of weighted operations and nonlinear activations. A forward pass produces predictions from current parameters.", "A classifier maps image pixel values through layers to class probabilities."],
    ["Loss and backpropagation", "A loss function measures prediction error; backpropagation applies the chain rule to compute parameter gradients. An optimizer uses those gradients to update weights.", "Cross-entropy loss penalizes assigning low probability to the correct class."],
    ["Architectures and representations", "Convolutional layers exploit local spatial structure; recurrent and attention-based layers model relationships across sequences. Architecture should reflect the data and objective.", "A convolution detects local image patterns before deeper layers combine them."],
    ["Generalization and training", "Training performance alone does not establish generalization. Validation data, regularization, suitable learning rates, and careful data splits help diagnose overfitting.", "A model with low training loss and rising validation loss may be memorizing the training set."],
  ]],
  ["generative-ai", "Generative AI", "GEN", "Artificial Intelligence", "Beginner to intermediate", [
    ["Generative model basics", "Generative models learn patterns in training data and sample new outputs conditioned on inputs. Plausible output is not proof that a generated claim is true.", "A language model continues a prompt by predicting a sequence of tokens."],
    ["Diffusion and language models", "Diffusion models iteratively denoise a representation; language models generate token sequences autoregressively. Their training objectives explain different strengths and failure modes.", "A diffusion image model refines noise toward a prompt-conditioned image."],
    ["Grounding and evaluation", "Grounding supplies relevant evidence to generation; evaluation measures factuality, utility, safety, and consistency for a defined task.", "Compare an answer to retrieved course notes and flag unsupported claims."],
    ["Safety and responsible workflows", "Generated material can reproduce bias, private data, or incorrect details. Human review, access boundaries, provenance, and clear user expectations reduce risk.", "Ask a student to verify a generated summary before treating it as course material."],
  ]],
  ["large-language-models", "Large Language Models", "LLM", "Artificial Intelligence", "Intermediate", [
    ["Tokens and context windows", "Language models process tokenized text, not whole words in a guaranteed one-token mapping. Context windows bound the conversation and evidence available for one generation.", "A long chat may need selective recent history rather than sending every prior message."],
    ["Pretraining and instruction tuning", "Pretraining learns next-token patterns from large corpora; instruction tuning adapts behavior to follow examples and preferences. Neither guarantees current or factual knowledge.", "An instruction-tuned model can format a response but still misstate a recent API change."],
    ["Decoding and response behavior", "Sampling temperature and token limits influence output diversity and length. Prompt structure can guide a task, but does not replace validation or access control.", "Use a restrained output budget for a simple definition request."],
    ["Hallucinations and evaluation", "A model may produce a confident unsupported completion when evidence is missing. Retrieval, citations, abstention rules, and task-specific evaluation help manage this limitation.", "Ask the model to say when a supplied reading does not contain the answer."],
  ]],
  ["prompt-engineering", "Prompt Engineering", "PROMPT", "Artificial Intelligence", "Beginner to intermediate", [
    ["Task framing and constraints", "A useful prompt states the objective, audience, input, constraints, and desired output. Specific requirements reduce ambiguity without adding irrelevant context.", "Request a 3-bullet explanation for a beginner and require no unsupported claims."],
    ["Examples and structured output", "Examples demonstrate the pattern expected from the model; a schema constrains machine-readable output. Applications must still validate generated structure before use.", "Require JSON fields title and summary, parse them, then reject missing values."],
    ["Grounding and context selection", "Relevant, bounded context improves answers and reduces distraction. Retrieved content should be treated as data, not trusted instructions.", "Provide the student's selected lesson rather than unrelated conversation history."],
    ["Testing prompts", "Prompt evaluation uses representative cases, edge cases, and measurable criteria. Versioning prompts makes regressions easier to detect.", "Test one greeting, one factual question, one follow-up, and one out-of-scope request."],
  ]],
  ["retrieval-augmented-generation", "Retrieval-Augmented Generation", "RAG", "Artificial Intelligence", "Advanced", [
    ["Document preparation and chunking", "RAG prepares source documents, divides them into retrievable passages, and preserves metadata such as section and provenance. Chunk size affects context and retrieval precision.", "Keep a heading and page number with each paragraph chunk from a course PDF."],
    ["Embeddings and vector search", "Embeddings map text into vectors whose distance can approximate semantic similarity. Approximate nearest-neighbor indexes speed lookup but require suitable filtering and recall evaluation.", "Search for 'heap priority queue' can retrieve a passage that says 'binary heap'."],
    ["Retrieval, ranking, and context", "Retrieval selects candidates; reranking can improve relevance before evidence is placed into the model context. Metadata filters limit results to authorized sources.", "Restrict a student's study query to documents they are allowed to read."],
    ["Faithful generation and evaluation", "The generation step should answer from retrieved evidence and indicate missing support. Evaluate retrieval recall and answer faithfulness separately.", "Measure whether the correct passage appears before checking the final answer citation."],
  ]],
  ["ai-agents", "AI Agents", "AGENT", "Artificial Intelligence", "Advanced", [
    ["Tools and action boundaries", "Agents can call tools to retrieve or change external state. Tool schemas, authorization, and least privilege define what actions are possible.", "Expose a read-only course lookup tool rather than arbitrary database access."],
    ["Planning and state", "An agent can break a goal into steps and carry state between them. Explicit state transitions and bounded iteration prevent unending or inconsistent workflows.", "Track which planning step completed and cap tool calls for one user request."],
    ["Memory and context", "Memory stores selected facts or prior interactions for later use; relevance, recency, and user separation matter. Stored memory should not be treated as verified identity without a trusted source.", "Retrieve only the current student's recent conversation by their authorized account ID."],
    ["Evaluation and guardrails", "Agent traces reveal decisions and tool outcomes. Test successful, malformed, denied, timeout, and adversarial cases; validate every tool result before the next action.", "If a deletion tool times out, report uncertainty rather than claiming success."],
  ]],
  ["docker", "Docker", "DCK", "Cloud and DevOps", "Beginner to intermediate", [
    ["Images, layers, and containers", "An image is a layered filesystem and metadata; a container is a process created from that image with isolated namespaces. Reusable layers make builds efficient.", "Two containers can share the same immutable application image but use different configuration."],
    ["Dockerfiles and build context", "A Dockerfile defines build steps, and the build context is the set of files available to those steps. Small contexts and multi-stage builds reduce exposure and image size.", "Copy package manifests first to reuse dependency layers when source files change."],
    ["Networks, volumes, and configuration", "Container networks provide service-to-service connectivity; volumes persist data beyond a container's lifetime. Configuration and secrets should be injected at runtime, not baked into images.", "An app reaches PostgreSQL by Compose service name on a private network."],
    ["Health, logs, and safe deployment", "Health checks report service readiness; logs expose runtime behavior. Reproducible tags and graceful shutdown improve operational reliability.", "Wait for the database health check before starting a dependent API."],
  ]],
  ["kubernetes", "Kubernetes", "K8S", "Cloud and DevOps", "Advanced", [
    ["Pods and workload controllers", "A Pod is the smallest scheduled unit and may contain cooperating containers. Deployments maintain a desired replica count and manage rolling updates.", "A Deployment restores a web Pod after a node failure."],
    ["Services and ingress", "Services give a stable virtual endpoint for matching Pods. Ingress or a gateway routes external HTTP traffic according to host and path rules.", "A ClusterIP Service exposes an API to other workloads without a public node port."],
    ["Configuration, secrets, and storage", "ConfigMaps hold non-sensitive settings; Secrets represent sensitive values but still require access controls and encryption at rest. Persistent volumes decouple data from Pod lifetimes.", "Mount a database password from a managed secret rather than committing it in YAML."],
    ["Probes, scaling, and rollouts", "Readiness probes govern traffic eligibility; liveness probes detect stuck containers. Resource requests, limits, and autoscaling influence scheduling and capacity.", "A readiness failure removes a starting Pod from Service endpoints until it is ready."],
  ]],
  ["cicd", "CI/CD", "CI/CD", "Cloud and DevOps", "Intermediate", [
    ["Continuous integration", "CI runs repeatable checks against each change so integration problems surface early. Fast unit checks and targeted integration checks give contributors useful feedback.", "Run lint and unit tests on every pull request."],
    ["Build artifacts and provenance", "A pipeline should build a known artifact from reviewed source and retain traceable version metadata. Rebuilding from the same inputs should be reproducible where practical.", "Label an image with a commit SHA and record its source build."],
    ["Deployment strategies", "Rolling, blue-green, and canary releases control how new versions receive traffic. Compatibility and health signals determine whether rollout proceeds or rolls back.", "Send a small traffic fraction to a canary and compare error rates before expanding."],
    ["Secrets and pipeline security", "Pipelines often hold deployment credentials and therefore need least privilege, short lifetimes, protected environments, and careful log redaction.", "A build job needs registry push access but should not receive database administrator credentials."],
  ]],
  ["linux", "Linux", "LNX", "Cloud and DevOps", "Beginner to intermediate", [
    ["Filesystem and shell", "Linux exposes files and devices through a hierarchical filesystem. Shell commands compose tools through arguments, pipes, and redirection; quote paths that contain spaces.", "Use find with a narrow directory and name pattern to locate project files."],
    ["Users, groups, and permissions", "Ownership and permission bits control read, write, and execute access for users and groups. Least privilege limits the impact of mistakes and compromise.", "Give a service account read access to configuration without write access to source."],
    ["Processes, services, and logs", "Processes have identifiers and resource usage; service managers supervise long-running units. Logs and exit status help distinguish startup, permission, and dependency failures.", "Inspect a unit's recent logs after a failed service restart."],
    ["Networking and package management", "Interfaces, routes, DNS settings, and firewall rules shape connectivity. Package managers verify and install signed software from configured repositories.", "Check name resolution separately from whether a TCP service port accepts connections."],
  ]],
  ["aws-fundamentals", "AWS Fundamentals", "AWS", "Cloud and DevOps", "Beginner to intermediate", [
    ["Accounts, regions, and IAM", "AWS accounts separate billing and security boundaries; regions contain separate infrastructure locations. IAM identities and policies should grant the smallest required actions.", "A read-only learner role can inspect an S3 bucket without deleting objects."],
    ["Compute and networking", "EC2 provides virtual machines, while VPC networking defines subnets, routes, and security groups. Public reachability is a deliberate routing and firewall decision.", "Place a database instance in private subnets and expose only the application tier."],
    ["Storage and managed databases", "S3 stores objects; EBS offers block volumes; RDS manages relational database operations. Durability, latency, access pattern, and backup needs inform the choice.", "Store uploaded course files as S3 objects and query structured enrollments in RDS."],
    ["Monitoring, reliability, and cost", "CloudWatch gathers metrics and logs; alarms connect signals to action. Availability zones and backups help recovery, while budgets and tagging expose cost ownership.", "Alarm on elevated API errors and review per-environment spend tags."],
  ]],
  ["network-security", "Network Security", "NSEC", "Cybersecurity", "Intermediate", [
    ["Threat modeling and boundaries", "Network threat models identify assets, trust boundaries, entry points, and likely adversaries. Segmentation limits lateral movement when one layer is compromised.", "Keep the database on a private subnet reachable only from the API tier."],
    ["Firewalls and access control", "Firewalls apply rules to traffic based on addresses, ports, protocols, or identity. Narrow allow rules reduce exposure; default-deny policies require explicit service paths.", "Allow HTTPS to a public gateway while denying direct database ingress."],
    ["TLS, VPNs, and secure transport", "TLS authenticates endpoints and protects data in transit; VPNs create protected network paths over an untrusted network. Encryption does not replace authorization.", "A VPN can protect administrative access, but application users still need account checks."],
    ["Detection and response", "Network telemetry such as flow records and DNS events helps detect unusual access. Response procedures preserve evidence, contain activity, and restore trusted service.", "Investigate unexpected outbound connections from a web service before blocking blindly."],
  ]],
  ["ethical-hacking-fundamentals", "Ethical Hacking Fundamentals", "ETH", "Cybersecurity", "Intermediate", [
    ["Authorization and scope", "Security testing is ethical only with explicit authorization, defined systems, time windows, and permitted techniques. Scope protects unrelated users and infrastructure.", "Test a designated lab host rather than scanning an employer's network."],
    ["Reconnaissance and attack surface", "Reconnaissance maps exposed services and software within approved scope. An inventory helps prioritize weak or unnecessary entry points before exploitation.", "Compare a lab's intended service list with its observed listening ports."],
    ["Vulnerability validation", "A finding needs reproducible evidence, impact analysis, and minimal-risk validation. Avoid destructive payloads and never access data outside the authorized test account.", "Use a harmless test record to confirm an access-control flaw in a local lab."],
    ["Reporting and remediation", "A useful report explains affected assets, reproduction steps, impact, and a verifiable remediation. Retest the same condition after a fix.", "Document the vulnerable route and confirm another student's record is no longer returned."],
  ]],
  ["cryptography", "Cryptography", "CRYPTO", "Cybersecurity", "Intermediate", [
    ["Hashing and password storage", "Cryptographic hashes map input to fixed-size digests, but general-purpose hashes are too fast for password storage. Password-specific KDFs use salts and work factors to raise guessing cost.", "Use a unique salt and Argon2id or bcrypt rather than storing SHA-256(password)."],
    ["Symmetric and public-key encryption", "Symmetric encryption uses a shared secret for efficient data protection. Public-key cryptography uses a key pair for operations such as key agreement or signatures.", "Use authenticated symmetric encryption for a file after securely establishing its key."],
    ["Digital signatures and certificates", "Digital signatures bind a message to a private key and let others verify integrity and signer possession. Certificates bind public keys to identities through a trust chain.", "A browser validates a server certificate chain before trusting its HTTPS identity."],
    ["Key management and protocols", "Cryptographic security depends on key generation, storage, rotation, and protocol composition. Prefer reviewed libraries and protocols over custom primitives.", "Store a service key in a secret manager and restrict which workload can retrieve it."],
  ]],
  ["web-application-security", "Web Application Security", "WEBSEC", "Cybersecurity", "Intermediate", [
    ["Input handling and injection", "Untrusted input must be validated for shape and context. Parameterized queries and context-aware output encoding prevent data from becoming executable SQL or markup.", "Bind a search term as a SQL parameter instead of concatenating it into a query."],
    ["Authentication and session safety", "Authentication establishes an account identity; sessions must be protected with secure cookie settings, expiration, and rotation. Authorization still decides what that identity may access.", "After login, rotate the session identifier to prevent fixation."],
    ["Authorization and access control", "Every protected operation should verify ownership or permission at the server boundary. Hiding a button does not prevent a caller from sending the underlying request.", "Check that a requested exam belongs to the authenticated student before deleting it."],
    ["CSRF, XSS, and secure defaults", "CSRF abuses ambient browser credentials; XSS executes attacker-controlled content in a trusted origin. SameSite cookies, anti-CSRF controls, escaping, CSP, and safe defaults reduce these risks.", "Render untrusted notes as text or sanitize allowed markup before display."],
  ]],
  ["owasp-top-10", "OWASP Top 10", "OWASP", "Cybersecurity", "Intermediate", [
    ["Broken access control", "Access control failures expose data or actions beyond a user's permissions. Enforce authorization on every server request and test cross-account boundaries.", "Change a record ID in a test request and verify another account's record stays inaccessible."],
    ["Injection and insecure design", "Injection occurs when data changes interpreter meaning; insecure design misses necessary security controls before implementation. Parameterization and threat modeling address different parts of the problem.", "Model abuse cases before building a student profile deletion flow."],
    ["Configuration and vulnerable components", "Unsafe defaults and unnecessary services increase attack surface. Known vulnerable dependencies require inventory, prioritization, and timely updates.", "Disable an unneeded management endpoint and track transitive library versions."],
    ["Logging, monitoring, and integrity", "Useful security logs capture relevant events without leaking credentials or private content. Monitoring detects patterns; integrity checks protect software and data from unauthorized changes.", "Log a failed access decision with a request ID but never include the password."],
  ]],
  ["coding-interview-preparation", "Coding Interview Preparation", "CODE", "Career Preparation", "Intermediate", [
    ["Clarify and model the problem", "Restate inputs, outputs, constraints, and edge cases before choosing an algorithm. A small example can expose ambiguity and guide a correct model.", "Ask whether a sorted input or duplicate values are guaranteed before choosing a search strategy."],
    ["Data structures and complexity", "Select structures that support the needed operations, then state time and space complexity. Average-case and worst-case claims should be distinguished.", "A hash map can count frequencies in expected O(n) time using O(k) space."],
    ["Problem-solving patterns", "Two pointers, sliding windows, graph search, and dynamic programming are reusable patterns tied to specific invariants. Explain why the invariant remains true after each step.", "A sliding window updates counts as its left and right boundaries move."],
    ["Testing and communication", "Test empty, minimal, typical, and boundary cases; then explain a concise correctness argument. Clear communication is part of the solution, not an afterthought.", "Check a binary search on one item, a missing target, and duplicate values."],
  ]],
  ["aptitude-logical-reasoning", "Aptitude and Logical Reasoning", "APT", "Career Preparation", "Beginner to intermediate", [
    ["Numerical reasoning", "Ratios, percentages, averages, and unit conversions translate quantities while preserving relationships. Estimate first to catch arithmetic or scale mistakes.", "If a value rises from 80 to 100, the increase is 25% of the original 80."],
    ["Sequences and patterns", "Sequence problems ask for a rule consistent with observed terms. Check common differences, ratios, alternating subsequences, and simple recurrences before guessing.", "For 2, 5, 8, 11, test a constant difference of three."],
    ["Deduction and constraints", "Logical reasoning derives only conclusions supported by premises. Constraint tables can track who, what, or when remains possible without assuming unstated facts.", "If A precedes B and B precedes C, infer A precedes C."],
    ["Time management and checking", "Break a timed problem into reading, setup, solution, and verification. Prioritize items with clear approaches and reserve time to check units and assumptions.", "Estimate whether a result can fit the stated range before submitting it."],
  ]],
  ["sql-interview-questions", "SQL Interview Questions", "SQL", "Career Preparation", "Intermediate", [
    ["Filtering, grouping, and aggregates", "WHERE filters rows before grouping; HAVING filters grouped results. Aggregate functions summarize values, and NULL behavior should be handled intentionally.", "Use HAVING COUNT(*) > 1 to find duplicate groups."],
    ["Joins and relational reasoning", "Joins combine rows according to a relationship. Understand inner versus outer joins and check whether one-to-many relationships multiply aggregate results.", "A left join keeps every department even when it has no employees."],
    ["Subqueries, CTEs, and windows", "CTEs name intermediate relations for clarity; window functions compute across related rows without collapsing them. Choose the construct that preserves the needed granularity.", "ROW_NUMBER() over each student partition selects the latest mark."],
    ["Indexes and query analysis", "Indexes speed selected access paths but add storage and write cost. Query plans reveal scans, joins, and estimates that should be interpreted against actual workload.", "An index on exam_date may help a date-range query but not a filter on an unrelated column."],
  ]],
  ["technical-interview-questions", "Technical Interview Questions", "TECH", "Career Preparation", "Intermediate", [
    ["Core computer science", "Explain data structures, complexity, memory, and concurrency by connecting definitions to trade-offs. Precise examples show understanding beyond memorized terms.", "Compare a queue and stack by removal order and a real use case."],
    ["API and database design", "Discuss resource boundaries, validation, transactions, and ownership. A good design explains both the normal request and how failures preserve data integrity.", "Describe how an API prevents one student from deleting another student's exam."],
    ["Reliability and security", "Reliability depends on timeouts, observability, recovery, and capacity; security depends on verified identity, authorization, and safe data handling. State assumptions and failure boundaries.", "Explain what the client sees if the database is unavailable during a save."],
    ["Behavioral technical communication", "Use a structured account of context, decisions, trade-offs, and evidence when discussing past work. Distinguish what you measured from what you inferred.", "Describe a bug, its reproduction, the root cause, and the regression check."],
  ]],
];

const makeUnit = (courseId, courseName, [title, description, example], index) => ({
  id: `${courseId}-lesson-${index + 1}`,
  title,
  description,
  difficulty: index < 2 ? "Core" : index === 2 ? "Applied" : "Challenge",
  example: { language: "Scenario", code: example, explanation: description },
  objectives: [`Explain the central idea behind ${title.toLowerCase()}.`, `Apply it to a practical ${courseName.toLowerCase()} scenario.`],
  sections: [{ heading: "Core idea", body: description }, { heading: "Worked application", body: example }],
  takeaways: [description, `Apply ${title.toLowerCase()} to one concrete ${courseName.toLowerCase()} example.`, `Practice by stating the input, expected result, and one relevant trade-off.`],
  practiceTopic: `${courseName}: ${title}`,
});

export const EXPANDED_COURSES = catalog.map(([id, name, code, category, level, topics]) => ({
  id,
  name,
  code,
  category,
  level,
  color: "bg-amber-500",
  lessons: topics.map(([title, description], index) => ({
    id: `${id}-lesson-${index + 1}`,
    title,
    description,
    difficulty: index < 2 ? "Core" : index === 2 ? "Applied" : "Challenge",
  })),
}));

export const EXPANDED_COURSE_DETAILS = Object.fromEntries(catalog.map(([id, name, , category, level]) => [id, {
  overview: `${name} learning path in ${category}. Progress from core principles to applied reasoning with four structured lessons and practice access through EDU-AI.`,
  outcomes: [`Explain key ${name.toLowerCase()} concepts`, `Apply ${name.toLowerCase()} principles to practical scenarios`, `Evaluate common trade-offs and failure cases`],
  level,
  category,
} ]));

export const EXPANDED_COURSE_LESSONS = Object.fromEntries(catalog.map(([id, name, , , , topics]) => [
  id,
  Object.fromEntries(topics.map((topic, index) => [`${id}-lesson-${index + 1}`, makeUnit(id, name, topic, index)])),
]));

export const EXPANDED_COURSE_COUNT = catalog.length;
