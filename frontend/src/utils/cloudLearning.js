export const CLOUD_COURSE = {
  id: "cloud-computing",
  name: "Cloud Computing Fundamentals",
  code: "CC",
  color: "bg-amber-500",
  level: "Beginner to intermediate",
  lessons: [
    { id: "cloud-intro", title: "Cloud computing foundations", description: "Define cloud computing and compare it with traditional infrastructure." },
    { id: "cloud-service-models", title: "IaaS, PaaS, and SaaS", description: "Choose a service model based on how much infrastructure you want to manage." },
    { id: "cloud-deployment-models", title: "Deployment models", description: "Compare public, private, hybrid, and multi-cloud environments." },
    { id: "cloud-virtualization", title: "Virtualization and containers", description: "Understand virtual machines, containers, Docker, and Kubernetes." },
    { id: "cloud-network-storage", title: "Cloud networking and storage", description: "Connect services and select suitable storage and delivery options." },
    { id: "cloud-providers", title: "Cloud providers", description: "Compare AWS, Azure, and Google Cloud using provider-neutral concepts." },
    { id: "cloud-security", title: "Security and shared responsibility", description: "Apply IAM, least privilege, encryption, and safe credential handling." },
    { id: "cloud-serverless", title: "Serverless and event-driven systems", description: "Recognize when managed functions and event triggers fit a workload." },
    { id: "cloud-reliability", title: "Scaling and reliability", description: "Plan for elasticity, availability, and fault tolerance." },
    { id: "cloud-deployment", title: "A practical cloud deployment", description: "Plan hosting, managed data, configuration, monitoring, and costs." },
  ],
};

export const CLOUD_COURSE_DETAILS = {
  "cloud-computing": {
    overview: "Learn how cloud platforms deliver computing, storage, networking, and managed services. Build from core service models to secure, reliable deployment decisions.",
    outcomes: [
      "Compare cloud service and deployment models",
      "Select suitable compute, network, and storage patterns",
      "Apply shared responsibility and least-privilege security",
    ],
  },
};

export const CLOUD_COURSE_LESSONS = {
  "cloud-computing": {
    "cloud-intro": {
      objectives: ["Define cloud computing in terms of on-demand access and measured use.", "Compare cloud benefits with its operational limitations."],
      sections: [
        { heading: "What makes a service cloud computing?", body: "Cloud computing provides configurable resources such as virtual machines, databases, and storage over a network. Customers can provision them on demand and pay according to a subscription or measured usage instead of purchasing every server in advance." },
        { heading: "Trade-offs to understand", body: "Cloud services can reduce upfront cost and make scaling faster, but introduce provider dependency, network reliance, usage charges, and shared-responsibility security. A traditional server room can still suit strict locality, specialized hardware, or predictable long-running workloads." },
      ],
      example: { language: "Scenario", code: "Peak week: provision 4 app instances\nQuiet week: scale back to 1\nStore backups in durable object storage", explanation: "Elastic capacity can match demand instead of requiring the school to own enough hardware for the busiest week all year." },
      takeaways: ["Cloud describes a delivery and operating model, not just someone else's computer.", "Elasticity and measured billing are benefits only when use is monitored.", "Availability, privacy, and provider dependence must be part of the decision."],
    },
    "cloud-service-models": {
      objectives: ["Distinguish infrastructure, platform, and software services.", "Identify who manages each layer in a given service model."],
      sections: [
        { heading: "Three levels of managed service", body: "Infrastructure as a Service (IaaS) supplies virtual machines, networks, and disks; you manage the operating system and application. Platform as a Service (PaaS) also manages much of the runtime and deployment platform. Software as a Service (SaaS) delivers a complete application that the provider operates." },
        { heading: "Choose by responsibility", body: "More managed service usually means less infrastructure work, but less control over the underlying platform. The customer still manages data, user access, and appropriate configuration in every model." },
      ],
      example: { language: "Decision guide", code: "Need OS-level control?       IaaS\nWant to deploy app code?     PaaS\nNeed a finished email tool?  SaaS", explanation: "These are common fits, not strict rules. Compare required control, operational effort, and portability." },
      takeaways: ["IaaS offers the most infrastructure control and operational responsibility.", "PaaS focuses teams on application code and data.", "SaaS delivers a complete product; customer access and data governance still matter."],
    },
    "cloud-deployment-models": {
      objectives: ["Explain public, private, hybrid, and multi-cloud deployment.", "Select a model based on workload constraints rather than fashion."],
      sections: [
        { heading: "Where the environment runs", body: "A public cloud uses provider-operated infrastructure shared securely among customers. A private cloud is dedicated to one organization. Hybrid combines private infrastructure with public cloud services, while multi-cloud uses services from more than one cloud provider." },
        { heading: "Architecture follows constraints", body: "Hybrid and multi-cloud can address locality, resilience, or specialized service needs, but increase integration, networking, identity, and operations work. They are not automatically more reliable: teams must deliberately design and test the cross-environment path." },
      ],
      example: { language: "Planning example", code: "Private: regulated student records\nPublic: public course catalogue\nHybrid link: narrowly scoped service API", explanation: "This arrangement may fit a specific policy constraint, but requires careful access control and network design." },
      takeaways: ["Public, private, hybrid, and multi-cloud describe different deployment arrangements.", "Hybrid or multi-cloud adds coordination and failure modes.", "Choose the least complex model that meets verified requirements."],
    },
    "cloud-virtualization": {
      objectives: ["Describe how a hypervisor hosts virtual machines.", "Contrast a VM with a container and explain where orchestration fits."],
      sections: [
        { heading: "Virtual machines", body: "A hypervisor allocates virtual CPU, memory, storage, and network interfaces to VMs. Each VM runs its own operating system kernel, giving strong isolation but using more resources than a process-level container." },
        { heading: "Containers and orchestration", body: "Containers package an application and its dependencies while sharing the host kernel. Docker builds and runs container images. Kubernetes orchestrates groups of containers, handling scheduling and desired-state operations; it does not remove the need to understand networking, storage, or security." },
      ],
      example: { language: "Deployment choice", code: "One legacy app needing its own OS  -> VM\nSeveral small stateless services    -> containers\nMany containers across hosts       -> orchestrator", explanation: "The workload's isolation, portability, and operations needs should determine the tool." },
      takeaways: ["VMs virtualize hardware; containers isolate processes and package dependencies.", "Containers share a kernel, so host and image patching remain important.", "Kubernetes adds orchestration capabilities and operational complexity."],
    },
    "cloud-network-storage": {
      objectives: ["Explain virtual networks, DNS, and load balancers.", "Choose object, block, or file storage for a workload."],
      sections: [
        { heading: "Connecting cloud components", body: "A virtual network defines address space and routes. DNS maps names to destinations. A load balancer distributes requests across healthy targets. Network boundaries and firewall rules should expose only the traffic required by each service." },
        { heading: "Storage by access pattern", body: "Object storage suits durable files and backups accessed by key. Block storage behaves like a disk attached to a machine. File storage exposes shared directories. A content delivery network (CDN) caches suitable content closer to readers." },
      ],
      example: { language: "Web application", code: "Browser -> DNS -> load balancer\n                     -> app instances -> managed database\nUploaded images -> object storage -> CDN", explanation: "Each service has a clear role. The database should not be reachable directly from public clients." },
      takeaways: ["DNS resolves names; a load balancer directs traffic to service targets.", "Choose object, block, or file storage by access pattern.", "Private networking and narrow ingress reduce unnecessary exposure."],
    },
    "cloud-providers": {
      objectives: ["Recognize the shared concepts across major providers.", "Compare providers using workload requirements and total cost."],
      sections: [
        { heading: "Common building blocks", body: "AWS, Microsoft Azure, and Google Cloud all offer compute, virtual networking, identity, managed databases, object storage, monitoring, and serverless products. Product names differ, but the underlying architectural decisions are often similar." },
        { heading: "Compare the whole environment", body: "Evaluate regional availability, existing team skills, compliance needs, service limits, support, data transfer charges, and exit options. A single service's advertised price does not show the full cost of data movement and operations." },
      ],
      example: { language: "Provider-neutral map", code: "Compute        -> VM or managed container\nObject storage -> bucket / blob store\nIdentity       -> roles and policy bindings\nObservability  -> logs, metrics, traces", explanation: "Start with capabilities and requirements, then map to the selected provider's service catalog." },
      takeaways: ["Providers share architectural categories but differ in implementation.", "Service naming alone is not a useful comparison method.", "Consider portability, staff experience, regional needs, and full lifecycle cost."],
    },
    "cloud-security": {
      objectives: ["Apply the shared-responsibility model.", "Use least privilege, encryption, and safe credential handling."],
      sections: [
        { heading: "Security is shared", body: "The provider secures its facilities and managed infrastructure; the customer remains responsible for appropriate identities, data access, application code, and configuration. The exact boundary changes by service model, so verify it for each service." },
        { heading: "Reduce credential and access risk", body: "Grant each role only the actions and resources it needs. Prefer short-lived workload identity over long-lived keys. Protect data in transit with TLS and at rest with suitable encryption. Store secrets in a secret manager, keep them out of source control and logs, and rotate exposed credentials." },
      ],
      example: { language: "Access policy", code: "Web app role:\n  read: course-assets bucket\n  write: no access\n  database: connect through private network", explanation: "Separating read-only asset access from database permissions limits the impact of an application compromise." },
      takeaways: ["Cloud adoption does not transfer all security responsibilities to the provider.", "Use least privilege and separate human and workload identities.", "Never place credentials in code, public build output, or logs."],
    },
    "cloud-serverless": {
      objectives: ["Describe functions as a service and event-driven execution.", "Assess serverless latency, limits, and cost trade-offs."],
      sections: [
        { heading: "Run code in response to events", body: "Function as a Service (FaaS) runs small units of code when an event arrives, such as an HTTP request, file upload, or queue message. The provider manages much of the runtime capacity and scales instances with demand." },
        { heading: "Know the boundaries", body: "Serverless can reduce idle capacity management, but functions have runtime limits, cold-start behavior, provider-specific integrations, and distributed debugging concerns. Long-running or continuously busy workloads may suit another compute model better." },
      ],
      example: { language: "Event flow", code: "Upload event -> validate metadata function\n              -> queue thumbnail job\nQueue event  -> resize function -> object store", explanation: "Decoupling work through a queue absorbs bursts and lets each stage scale independently." },
      takeaways: ["Serverless means the provider manages servers, not that servers do not exist.", "Events and queues help separate independent processing stages.", "Check execution limits, latency, observability, and provider coupling."],
    },
    "cloud-reliability": {
      objectives: ["Distinguish vertical and horizontal scaling.", "Explain elasticity, availability, and fault tolerance."],
      sections: [
        { heading: "Scale for demand", body: "Vertical scaling adds resources to one instance. Horizontal scaling adds instances and generally requires the application to distribute work safely. Elasticity adjusts capacity as demand changes; autoscaling uses observed metrics and defined bounds." },
        { heading: "Design for failure", body: "Availability measures whether a service is usable over time. Fault tolerance keeps essential behavior operating despite component failure. Redundant instances, health checks, backups, queues, and tested recovery plans help, but a single shared dependency can still become a failure point." },
      ],
      example: { language: "Capacity policy", code: "min instances: 2\nscale out: CPU > 70% for 5 minutes\nscale in: CPU < 30% for 15 minutes\nmax instances: 8", explanation: "Bounds help control cost. Thresholds should be measured against actual traffic and service objectives." },
      takeaways: ["Horizontal scaling requires an application that can share or distribute work.", "Autoscaling must include limits and monitoring to control cost.", "Backups and recovery procedures should be tested, not merely configured."],
    },
    "cloud-deployment": {
      objectives: ["Map a frontend and backend to suitable hosting services.", "Plan secrets, monitoring, and cost controls before release."],
      sections: [
        { heading: "Plan the deployment path", body: "A static frontend can be served by a hosting platform or object store with a CDN. An API can run on managed application hosting or containers. A managed database reduces operational work but still needs private access, backups, retention, and migration planning." },
        { heading: "Configuration and operations", body: "Keep environment-specific settings outside the source tree. Put production secrets in the platform's protected secret store, not frontend variables that are bundled into public JavaScript. Monitor errors, latency, availability, and spend; define alerts and a rollback path." },
      ],
      example: { language: "EduMentor deployment map", code: "Vite frontend -> static hosting\nSpring Boot API -> managed application service\nPostgreSQL -> managed database\nHealth + error metrics -> monitoring", explanation: "This is an architecture sketch only. Actual service addresses and credentials belong in the deployment environment, never in the client bundle." },
      takeaways: ["Keep public frontend configuration separate from server-side secrets.", "Use managed databases with private access and tested backups.", "Monitor reliability and cost from the first deployment."],
    },
  },
};

export const CLOUD_QUIZZES = [
  {
    id: "cloud-computing-fundamentals", title: "Cloud Computing Fundamentals", subject: "Cloud Computing", difficulty: "Beginner",
    questions: [
      { q: "Which characteristic lets a team provision cloud resources without waiting for a provider operator?", options: ["On-demand self-service", "Fixed hardware allocation", "Manual capacity planning", "Single-tenant billing"], answer: 0, explanation: "On-demand self-service allows consumers to provision capabilities when needed through a console or API." },
      { q: "What is elasticity in cloud computing?", options: ["Encrypting all network traffic", "Adjusting resources to match changing demand", "Moving all data to one region", "Replacing backups with replication"], answer: 1, explanation: "Elasticity adds or releases capacity as workload demand changes." },
      { q: "Which is a common cloud benefit compared with buying servers up front?", options: ["No need to monitor usage", "Capacity can be provisioned more quickly", "Applications never fail", "All workloads become cheaper"], answer: 1, explanation: "Cloud resources can often be provisioned faster than procuring physical hardware, though they still require cost and reliability management." },
      { q: "Which is a realistic limitation of relying on cloud services?", options: ["They cannot store files", "They require network access and introduce provider dependency", "They cannot scale", "They never support encryption"], answer: 1, explanation: "Cloud workloads depend on network connectivity and provider services, creating availability and portability considerations." },
      { q: "A team pays for virtual machines by the hour. Which idea is most directly illustrated?", options: ["Measured service", "Air-gapped deployment", "Manual provisioning", "Static addressing"], answer: 0, explanation: "Measured service tracks usage so resources can be billed according to consumption." },
      { q: "What is a cloud region generally?", options: ["A geographical area containing provider data-center locations", "A single customer account", "A type of encryption key", "A billing alert"], answer: 0, explanation: "A region is a geographic provider area that may contain multiple isolated availability zones." },
      { q: "Why might an organization retain a traditional on-premises system?", options: ["Cloud systems cannot use databases", "A workload has locality, hardware, or predictable-cost constraints", "On-premises systems need no maintenance", "It guarantees zero downtime"], answer: 1, explanation: "Specific regulatory, locality, specialized hardware, or stable workload requirements can make on-premises operation appropriate." },
      { q: "Which practice helps prevent an unexpected cloud bill?", options: ["Disable monitoring", "Set budgets and review usage metrics", "Provision maximum capacity permanently", "Share administrator credentials"], answer: 1, explanation: "Budgets, alerts, and usage reviews can reveal cost growth before it becomes a surprise." },
      { q: "What does scalability describe?", options: ["The ability to handle increased workload by adding capacity", "The ability to avoid all backups", "A method of encrypting a disk", "A billing currency"], answer: 0, explanation: "Scalability is the ability to accommodate workload growth by adjusting capacity or design." },
      { q: "Which statement best describes cloud computing?", options: ["A delivery model for on-demand network access to configurable computing resources", "A specific programming language", "A guarantee that software is free", "A synonym for public Wi-Fi"], answer: 0, explanation: "Cloud computing delivers configurable computing capabilities over a network with on-demand provisioning and measured use." },
    ],
  },
  {
    id: "cloud-architecture-security", title: "Cloud Architecture and Security", subject: "Cloud Computing", difficulty: "Intermediate",
    questions: [
      { q: "What does least privilege require?", options: ["Give every user administrator access", "Grant only the access needed for a role", "Disable identity policies", "Use one shared account"], answer: 1, explanation: "Least privilege limits permissions to the resources and actions needed for a task." },
      { q: "Where should a production API key be stored?", options: ["In a public frontend variable", "In a protected server-side secret store", "In a source comment", "In a screenshot"], answer: 1, explanation: "A protected server-side secret store limits exposure; frontend build variables are public to users." },
      { q: "Which component typically distributes requests across healthy application instances?", options: ["Load balancer", "Object bucket", "Hypervisor", "DNS TXT record"], answer: 0, explanation: "A load balancer routes traffic among targets and can stop sending requests to unhealthy instances." },
      { q: "Which design best reduces public exposure of a database?", options: ["Expose its port to all addresses", "Place it on a private network and allow only required app connections", "Put credentials in browser code", "Disable authentication"], answer: 1, explanation: "Private network placement and narrow access rules reduce the database's attack surface." },
      { q: "In the shared-responsibility model, what remains a customer responsibility?", options: ["Provider data-center physical security", "Appropriate identities and data access configuration", "Manufacturing provider servers", "Maintaining provider power grids"], answer: 1, explanation: "Customers remain responsible for their identities, data, application, and service configuration, with exact boundaries varying by service." },
      { q: "What is a benefit of short-lived workload credentials?", options: ["They eliminate all authorization checks", "They reduce the exposure window of a leaked credential", "They never need identity policies", "They work only offline"], answer: 1, explanation: "Short-lived credentials expire, limiting how long a leaked token can be used." },
      { q: "What should a health check report for an application service?", options: ["A decorative animation state", "A genuine readiness or health result", "The administrator password", "Every student's record"], answer: 1, explanation: "Health checks should reflect real service conditions and avoid exposing sensitive information." },
      { q: "Which practice protects data in transit between a browser and an API?", options: ["TLS", "A public bucket", "A wider firewall rule", "A local storage key"], answer: 0, explanation: "TLS encrypts and authenticates network connections when configured with valid certificates." },
      { q: "Why use separate identities for a human operator and an application workload?", options: ["To make access harder to audit", "To scope permissions and credential lifecycles independently", "To share one password safely", "To avoid logging"], answer: 1, explanation: "Separate identities allow distinct permissions, audit trails, and credential lifetimes." },
      { q: "What is a useful defense against accidental destructive deployment changes?", options: ["No review or rollback process", "Least-privilege deployment roles and reviewed change plans", "One shared root key", "Disabling audit logs"], answer: 1, explanation: "Scoped deployment roles, reviewed plans, and audit trails limit unintended impact." },
    ],
  },
  {
    id: "database-management-systems", title: "Database Management Systems", subject: "Databases", difficulty: "Beginner",
    questions: [
      { q: "What is a primary key used for?", options: ["Uniquely identifying a row", "Encrypting a database file", "Sorting every query automatically", "Replacing all indexes"], answer: 0, explanation: "A primary key identifies each row uniquely and cannot be null." },
      { q: "What does a foreign key represent?", options: ["A relationship referencing a key in another or the same table", "A copy of a table stored abroad", "A password field", "A query cache"], answer: 0, explanation: "A foreign key enforces a relationship between rows and helps preserve referential integrity." },
      { q: "Which property ensures a transaction is all-or-nothing?", options: ["Atomicity", "Availability", "Indexing", "Sharding"], answer: 0, explanation: "Atomicity means all operations in a transaction complete, or none are committed." },
      { q: "Why add an index to a frequently searched column?", options: ["To speed some lookups at storage and write cost", "To guarantee every query is free", "To replace validation", "To encrypt the column"], answer: 0, explanation: "Indexes can improve lookup performance but consume storage and add write/update work." },
      { q: "Which SQL statement retrieves rows?", options: ["SELECT", "INSERT", "DROP", "GRANT"], answer: 0, explanation: "SELECT queries data from one or more tables." },
      { q: "What does normalization primarily help reduce?", options: ["Data duplication and update anomalies", "Database backups", "Access control", "Transaction logs"], answer: 0, explanation: "Normalization organizes related facts to reduce unnecessary duplication and inconsistent updates." },
      { q: "Which constraint prevents duplicate values in a column?", options: ["UNIQUE", "DEFAULT", "CHECK", "VIEW"], answer: 0, explanation: "A UNIQUE constraint requires values in its constrained column or column set to be unique." },
      { q: "What is a database transaction?", options: ["A logical unit of work that can be committed or rolled back", "A database username", "A stored image format", "A network route"], answer: 0, explanation: "Transactions group operations into a unit with defined commit and rollback behavior." },
      { q: "Why are parameterized queries important?", options: ["They separate data from SQL syntax and help prevent injection", "They automatically encrypt every backup", "They create indexes", "They remove the need for permissions"], answer: 0, explanation: "Binding values as parameters helps prevent user input from being interpreted as SQL code." },
      { q: "What is a database backup for?", options: ["Restoring data after loss or corruption", "Improving every query's speed", "Avoiding database monitoring", "Replacing access policies"], answer: 0, explanation: "Backups provide recovery points, and should be tested through restore exercises." },
    ],
  },
  {
    id: "operating-systems", title: "Operating Systems", subject: "Operating Systems", difficulty: "Beginner",
    questions: [
      { q: "What is the operating system kernel responsible for?", options: ["Managing core resources such as processes and memory", "Writing application requirements", "Serving as a web browser", "Replacing the CPU"], answer: 0, explanation: "The kernel manages essential hardware resources and provides core services to processes." },
      { q: "What is a process?", options: ["A program in execution with allocated state and resources", "A file compression format", "A physical disk partition", "A network protocol"], answer: 0, explanation: "A process is a running program with its own execution state and resource context." },
      { q: "What does virtual memory provide?", options: ["An abstraction of memory that maps process addresses to physical storage", "Unlimited physical RAM", "A second CPU", "A backup network"], answer: 0, explanation: "Virtual memory gives processes an address-space abstraction backed by physical memory and, when needed, secondary storage." },
      { q: "Which scheduling strategy gives each runnable process a time slice in turn?", options: ["Round robin", "Depth-first search", "First-fit disk allocation", "Token passing"], answer: 0, explanation: "Round-robin scheduling cycles through runnable processes, assigning each a time quantum." },
      { q: "What is a system call?", options: ["A controlled request from a program to an operating-system service", "A phone notification", "A database join", "A compiler warning"], answer: 0, explanation: "System calls are the interface through which user programs request privileged kernel services." },
      { q: "What is a deadlock?", options: ["Processes waiting indefinitely for resources held by one another", "A scheduled reboot", "A fast cache lookup", "A file permission"], answer: 0, explanation: "Deadlock can occur when processes hold resources while waiting for resources held by others." },
      { q: "Which component manages files and directories?", options: ["File system", "Scheduler", "ALU", "Load balancer"], answer: 0, explanation: "The file system organizes persistent data into files and directories and defines access operations." },
      { q: "What is the main role of a device driver?", options: ["Provide an operating-system interface to a hardware device", "Encrypt every user file", "Compile all application code", "Assign domain names"], answer: 0, explanation: "Drivers translate operating-system requests into device-specific operations." },
      { q: "What is a context switch?", options: ["Saving one process state and restoring another for execution", "Changing a source-code variable", "Moving a database to cloud storage", "Restarting a router"], answer: 0, explanation: "The operating system saves the current execution context and restores another so the CPU can switch tasks." },
      { q: "Why does an OS enforce user and process permissions?", options: ["To isolate resources and restrict unauthorized access", "To eliminate all software bugs", "To increase monitor brightness", "To bypass authentication"], answer: 0, explanation: "Permissions help isolate users and processes and control access to system resources." },
    ],
  },
  {
    id: "computer-networks", title: "Computer Networks", subject: "Networks", difficulty: "Beginner",
    questions: [
      { q: "Which protocol commonly maps domain names to IP addresses?", options: ["DNS", "FTP", "SSH", "NTP"], answer: 0, explanation: "DNS resolves names such as a host name into resource records including IP addresses." },
      { q: "What does TCP provide that UDP does not guarantee by itself?", options: ["Reliable ordered byte delivery", "Lower latency in every situation", "Encryption", "Domain name resolution"], answer: 0, explanation: "TCP provides a reliable ordered stream; UDP sends datagrams without those delivery guarantees." },
      { q: "What is an IP address used for?", options: ["Identifying a network interface for packet routing", "Encrypting a web page", "Storing a password", "Compressing a file"], answer: 0, explanation: "IP addresses identify network interfaces so packets can be routed between networks." },
      { q: "Which device forwards packets between IP networks?", options: ["Router", "Keyboard", "Repeater-only hub", "Printer driver"], answer: 0, explanation: "Routers use network-layer information and routing tables to forward packets between networks." },
      { q: "What does HTTPS add to HTTP when correctly configured?", options: ["TLS protection for the connection", "Guaranteed application correctness", "Automatic backups", "A private IP address"], answer: 0, explanation: "HTTPS uses TLS to protect the connection and authenticate the server when certificates are valid." },
      { q: "What is a subnet mask used to determine?", options: ["Which address bits identify the network portion", "A user's password length", "The encryption algorithm", "A router's screen size"], answer: 0, explanation: "A subnet mask or prefix length separates network and host portions of an IP address." },
      { q: "What does a firewall rule control?", options: ["Which network traffic is allowed or denied", "The order of database rows", "The file's compression ratio", "CPU instruction timing"], answer: 0, explanation: "Firewall rules filter traffic according to attributes such as direction, addresses, ports, and protocol." },
      { q: "What is latency?", options: ["The time taken for data to travel or a request to receive a response", "Total disk size", "The number of DNS records", "A type of encryption key"], answer: 0, explanation: "Latency measures delay, often expressed as round-trip time for network requests." },
      { q: "Why might a CDN be used for static content?", options: ["To cache content closer to users and reduce delivery latency", "To replace identity management", "To run a relational database query", "To prevent all denial-of-service attacks"], answer: 0, explanation: "A CDN distributes or caches content at edge locations closer to clients." },
      { q: "Which statement about a private IP address is accurate?", options: ["It is used within private network ranges and is not directly globally routed", "It is always secret from administrators", "It is an encryption key", "It guarantees a secure application"], answer: 0, explanation: "Private IP ranges are intended for internal networks and are not directly routed across the public internet." },
    ],
  },
  {
    id: "docker-containerization", title: "Docker and Containerization", subject: "Containers", difficulty: "Beginner to intermediate",
    questions: [
      { q: "What is a container image?", options: ["A packaged filesystem and metadata used to create containers", "A running network packet", "A cloud billing account", "A virtual-machine hypervisor"], answer: 0, explanation: "An image is an immutable template containing application files, dependencies, and configuration metadata." },
      { q: "What is a container?", options: ["An isolated running instance created from an image", "A programming language", "A DNS record", "A database index"], answer: 0, explanation: "A container is a running process environment created from an image with isolation and resource controls." },
      { q: "What does a Dockerfile describe?", options: ["Steps and metadata for building an image", "A live firewall session", "A database backup", "A user profile"], answer: 0, explanation: "A Dockerfile contains build instructions that produce a container image." },
      { q: "Why use a small base image where practical?", options: ["It can reduce download size and the number of included components", "It guarantees the app has no vulnerabilities", "It removes the need to patch", "It makes containers run without a kernel"], answer: 0, explanation: "Smaller images can reduce transfer time and attack surface, but still require scanning and updates." },
      { q: "Where should production secrets be supplied to a container?", options: ["Through protected runtime secret configuration", "In a committed Dockerfile ENV instruction", "Inside a public image label", "In a source-code comment"], answer: 0, explanation: "Protected runtime secret mechanisms keep credentials out of source control and image layers." },
      { q: "What does a published container port do?", options: ["Maps a host port to a container port", "Encrypts container memory", "Builds a new image", "Creates a database schema"], answer: 0, explanation: "Port publishing makes a container port reachable through a host port, subject to host and network firewall rules." },
      { q: "What is a volume commonly used for?", options: ["Persisting or sharing data outside a container's writable layer", "Replacing a container image", "Scheduling CPU time", "Resolving DNS names"], answer: 0, explanation: "Volumes provide storage that can outlive a container or be shared between containers." },
      { q: "What is a key difference between containers and typical virtual machines?", options: ["Containers share the host kernel; VMs run guest operating systems", "Containers always have stronger isolation", "VMs cannot run applications", "Containers require no CPU"], answer: 0, explanation: "Containers isolate processes while sharing the host kernel; VMs virtualize hardware and run a guest OS." },
      { q: "What is Docker Compose useful for?", options: ["Defining and running a multi-container application locally", "Replacing application tests", "Creating TLS certificates automatically in production", "Managing browser storage"], answer: 0, explanation: "Compose describes services, networks, and volumes for a multi-container application environment." },
      { q: "Why should containers run as a non-root user when feasible?", options: ["To reduce privileges if the process is compromised", "To guarantee zero downtime", "To avoid image updates", "To bypass network filtering"], answer: 0, explanation: "A non-root process has fewer privileges, which can limit the impact of a compromise." },
    ],
  },
];
