import { CLOUD_COURSE_DETAILS, CLOUD_COURSE_LESSONS } from "./cloudLearning.js";
import { EXPANDED_COURSE_DETAILS, EXPANDED_COURSE_LESSONS } from "./expandedCatalog.js";

export const COURSE_DETAILS = {
  ...EXPANDED_COURSE_DETAILS,
  ...CLOUD_COURSE_DETAILS,
  "data-structures": {
    overview: "Choose a structure by the operations your program performs most often. This course builds intuition for the core linear and hierarchical structures used in everyday software.",
    outcomes: ["Compare access, insertion, and search costs", "Trace common operations by hand", "Choose a structure that fits a problem"],
  },
  "java-programming": {
    overview: "Build a foundation in Java by moving from its type system to object-oriented design and the standard collection interfaces.",
    outcomes: ["Read and write basic Java programs", "Model behavior with classes and interfaces", "Use generic collections safely"],
  },
  "machine-learning": {
    overview: "Follow a practical machine-learning workflow, from defining a prediction target to checking whether a model generalizes beyond its training data.",
    outcomes: ["Frame a prediction task and select features", "Explain regression and classification", "Evaluate models with held-out data"],
  },
  "cyber-security": {
    overview: "Learn foundational security concepts for protecting information, applications, and networked services. Examples focus on defensive design and safe handling.",
    outcomes: ["Apply confidentiality, integrity, and availability", "Distinguish cryptographic primitives", "Recognize common application and network risks"],
  },
};

export const COURSE_LESSONS = {
  ...EXPANDED_COURSE_LESSONS,
  ...CLOUD_COURSE_LESSONS,
  "data-structures": {
    arrays: {
      sections: [
        { heading: "A contiguous sequence", body: "An array stores elements in indexed order. Because each element has a predictable position, reading or replacing an item by index is constant time, O(1). Searching an unsorted array still requires checking elements one by one, so it is O(n)." },
        { heading: "Strings and traversal", body: "A string is a sequence of characters. A single left-to-right pass can count, compare, or transform values in O(n) time. For repeated concatenation, use a mutable builder so each append does not copy the whole string." },
      ],
      example: { language: "Java", code: "int[] scores = {82, 91, 76};\nint total = 0;\nfor (int score : scores) {\n    total += score;\n}\ndouble average = (double) total / scores.length;", explanation: "The loop visits each score once. Its runtime grows linearly with the number of elements." },
      takeaways: ["Index access is O(1); a full scan is O(n).", "A traversal should do only the work required for each element.", "Use a StringBuilder for many Java string appends."],
    },
    lists: {
      sections: [
        { heading: "Nodes connected by references", body: "A linked list is a chain of nodes. Each node stores a value and a reference to the next node; a doubly linked node also points to the previous node. Lists do not require one contiguous memory block." },
        { heading: "Trade-offs", body: "Finding the item at position k requires walking from an end, O(n). If you already have the node, inserting or removing beside it is O(1). An array or dynamic array is usually better for frequent indexed reads and cache-friendly iteration." },
      ],
      example: { language: "Java", code: "class Node {\n    int value;\n    Node next;\n\n    Node(int value, Node next) {\n        this.value = value;\n        this.next = next;\n    }\n}\n\nNode head = new Node(10, new Node(20, null));", explanation: "Each node owns the link to the next node. The head reference is the entry point to the list." },
      takeaways: ["List traversal is sequential, not indexed.", "Insertion is cheap only when the insertion position is already known.", "Choose arrays when predictable indexing matters more than local insertion."],
    },
    "stacks-queues": {
      sections: [
        { heading: "Two ordering rules", body: "A stack is last in, first out (LIFO): the newest item is removed first. A queue is first in, first out (FIFO): the oldest item is removed first. Both are abstract data types defined by their operations, not by one required implementation." },
        { heading: "Where they appear", body: "Stacks model nested function calls, undo histories, and depth-first search. Queues model task scheduling, print jobs, and breadth-first search. A deque supports efficient insertion and removal at both ends." },
      ],
      example: { language: "Java", code: "Deque<String> undo = new ArrayDeque<>();\nundo.push(" + '"draft"' + ");\nundo.push(" + '"edited"' + ");\nString lastState = undo.pop(); // " + '"edited"', explanation: "The stack returns the latest pushed state first. ArrayDeque supports these end operations efficiently." },
      takeaways: ["Stack: push/pop at one end, LIFO.", "Queue: add at the back and remove at the front, FIFO.", "A deque can implement either pattern."],
    },
    trees: {
      sections: [
        { heading: "Hierarchical data", body: "A tree is a connected hierarchy of nodes with no cycles. In a binary search tree, values smaller than a node go left and larger values go right. Search is O(h), where h is the tree height; a balanced tree has height about log₂(n), while a skewed tree can reach n." },
        { heading: "Traversal order", body: "Preorder visits node, left, right; inorder visits left, node, right; postorder visits left, right, node. Inorder traversal of a binary search tree visits keys in sorted order." },
      ],
      example: { language: "Pseudocode", code: "inorder(node):\n    if node is null: return\n    inorder(node.left)\n    visit(node.value)\n    inorder(node.right)", explanation: "The recursive calls visit the left subtree before the node, then the right subtree. Each node is visited once: O(n)." },
      takeaways: ["Tree operations often depend on height, not just node count.", "Balanced trees keep height logarithmic.", "Inorder traversal of a BST yields sorted values."],
    },
  },
  "java-programming": {
    syntax: {
      sections: [
        { heading: "Types make values explicit", body: "Java variables have declared types. Primitive types such as int and boolean hold simple values; reference types such as String refer to objects. The compiler checks assignments and method calls before the program runs." },
        { heading: "Control flow", body: "Use conditionals to choose a path and loops to repeat work. A for-each loop is convenient when you need each collection element, while an indexed loop is useful when the position matters." },
      ],
      example: { language: "Java", code: "int[] temperatures = {18, 21, 19};\nint warmDays = 0;\nfor (int temperature : temperatures) {\n    if (temperature >= 20) {\n        warmDays++;\n    }\n}", explanation: "The array has a fixed element type. The loop tests each value and increments the count only when the condition is true." },
      takeaways: ["Choose a type that describes the value being stored.", "Use braces to make control-flow boundaries clear.", "Prefer for-each when you do not need an index."],
    },
    classes: {
      sections: [
        { heading: "Objects combine state and behavior", body: "A class defines fields and methods; an object is an instance created from that definition. A constructor establishes the object’s initial valid state. Keep fields private and expose operations that preserve the class’s rules." },
        { heading: "Encapsulation", body: "Encapsulation prevents callers from changing internal details arbitrarily. A method such as deposit can validate an amount before updating a balance, keeping the object consistent." },
      ],
      example: { language: "Java", code: "class Counter {\n    private int value;\n\n    void increment() { value++; }\n    int current() { return value; }\n}\n\nCounter counter = new Counter();\ncounter.increment();", explanation: "Callers use the public behavior without directly changing the private field." },
      takeaways: ["A class is a definition; an object is an instance.", "Use constructors to establish valid initial state.", "Encapsulate fields and expose meaningful operations."],
    },
    inheritance: {
      sections: [
        { heading: "Share contracts with interfaces", body: "An interface specifies methods a type promises to provide. Code can depend on the interface rather than one implementation, which makes alternate implementations easier to substitute and test." },
        { heading: "Use inheritance deliberately", body: "A subclass inherits and specializes a parent class. Use this for a true “is-a” relationship with substitutable behavior. Prefer composition when one object simply uses another; it avoids deep, fragile inheritance trees." },
      ],
      example: { language: "Java", code: "interface Notifier {\n    void send(String message);\n}\n\nclass ConsoleNotifier implements Notifier {\n    public void send(String message) {\n        System.out.println(message);\n    }\n}", explanation: "Any class implementing Notifier can be passed to code that only needs the send contract." },
      takeaways: ["Interfaces define capabilities and contracts.", "Inheritance should preserve substitutability.", "Composition is often simpler for combining behavior."],
    },
    collections: {
      sections: [
        { heading: "Program to collection interfaces", body: "List preserves order and allows duplicates; Set represents unique elements; Map associates keys with values. Select an implementation based on access patterns—for example, ArrayList for indexed reads and HashMap for average constant-time key lookup." },
        { heading: "Generics preserve type safety", body: "Generics describe the element type at compile time. A List<String> prevents adding an integer and removes the need for unsafe casts when reading values." },
      ],
      example: { language: "Java", code: "List<String> names = new ArrayList<>();\nnames.add(" + '"Ada"' + ");\nnames.add(" + '"Lin"' + ");\n\nfor (String name : names) {\n    System.out.println(name);\n}", explanation: "The List interface lets the variable use list operations while ArrayList provides the implementation. The generic type keeps elements as strings." },
      takeaways: ["Choose List, Set, or Map based on the relationship you need.", "Generics catch many type errors at compile time.", "Use interfaces in variable types to reduce implementation coupling."],
    },
  },
  "machine-learning": {
    workflow: {
      sections: [
        { heading: "Define the prediction task", body: "Specify what one example represents, which information is available at prediction time, and what the target should be. Establish a simple baseline before choosing a complex model; a model is useful only if it improves a meaningful measure." },
        { heading: "Separate data roles", body: "Training data fits model parameters. Validation data helps compare choices. A final test set estimates performance after decisions are complete. Keep related records together when splitting, and never let target information leak into features." },
      ],
      example: { language: "Workflow", code: "1. Define target and success metric\n2. Split records into train / validation / test\n3. Fit preprocessing on training data\n4. Train a baseline model\n5. Compare on validation data\n6. Evaluate once on the held-out test set", explanation: "The separation protects the final estimate from choices made while tuning the model." },
      takeaways: ["Start with a precise target and a baseline.", "Fit preprocessing only on training data.", "Reserve test data for a final, unbiased check."],
    },
    regression: {
      sections: [
        { heading: "Predicting a numeric value", body: "Regression estimates a continuous target such as duration or temperature. Linear regression models a weighted sum of features. Training chooses weights that reduce a loss, commonly mean squared error (MSE), on the training examples." },
        { heading: "Interpret assumptions", body: "A linear model assumes its chosen features combine linearly with the target. Outliers can strongly affect squared error. Inspect residuals—the differences between observed and predicted values—to spot systematic patterns the model misses." },
      ],
      example: { language: "Model", code: "predicted_minutes = intercept\nfor feature, weight in zip(features, weights):\n    predicted_minutes += feature * weight\n\nerror = actual_minutes - predicted_minutes", explanation: "Each feature contributes a weighted amount. The residual records how far this prediction is from the observed target." },
      takeaways: ["Regression predicts numeric targets.", "MSE penalizes larger errors more strongly.", "Residual patterns can reveal a poor model fit."],
    },
    classification: {
      sections: [
        { heading: "Predicting a category", body: "Classification assigns an input to a class, such as spam or not spam. A model may produce a score or probability; a decision threshold converts it into a label. Changing the threshold changes the balance between false positives and false negatives." },
        { heading: "Read precision and recall", body: "Precision asks: among predicted positives, how many were correct? Recall asks: among actual positives, how many did the model find? High-stakes screening may prioritize recall, while costly false alarms may call for higher precision." },
      ],
      example: { language: "Metrics", code: "precision = true_positive / (true_positive + false_positive)\nrecall = true_positive / (true_positive + false_negative)", explanation: "Both metrics focus on the positive class, but their denominators answer different questions." },
      takeaways: ["Classification predicts discrete labels.", "The threshold affects the confusion matrix.", "Choose precision or recall emphasis from the task’s costs."],
    },
    validation: {
      sections: [
        { heading: "Generalization is the goal", body: "A model overfits when it learns training-specific noise and performs worse on new examples. Compare training and validation performance: a large gap is a warning that the model may be too complex or the data split may be flawed." },
        { heading: "Control complexity", body: "Regularization discourages overly large parameters, while simpler feature sets and more representative data can also help. Cross-validation repeats train/validation splits to estimate variability when the dataset is limited." },
      ],
      example: { language: "Diagnostic", code: "if train_score is high and validation_score is low:\n    investigate_overfitting()\n    try_regularization()\n    review_data_split()", explanation: "A performance gap suggests the model has not learned a pattern that transfers to unseen data." },
      takeaways: ["Evaluate on data not used to fit the model.", "A training/validation gap is a useful overfitting signal.", "Regularization trades some fit for simpler behavior."],
    },
  },
  "cyber-security": {
    "security-basics": {
      sections: [
        { heading: "The CIA triad", body: "Confidentiality limits information to authorized readers. Integrity protects it from unauthorized alteration. Availability keeps systems and data usable when needed. A security control can strengthen one goal while creating trade-offs for another." },
        { heading: "Threat modeling", body: "Identify valuable assets, likely threats, exposed entry points, and the impact of failure. Apply least privilege: each user or service receives only the access needed for its task. Layer controls so one failure does not expose everything." },
      ],
      example: { language: "Review", code: "Asset: student records\nThreat: unauthorized account access\nControl: least-privilege authorization\nDetection: audit access events\nRecovery: tested backups", explanation: "A short threat model connects an asset to prevention, detection, and recovery controls." },
      takeaways: ["Security balances confidentiality, integrity, and availability.", "Least privilege limits the impact of a compromised account.", "Plan detection and recovery as well as prevention."],
    },
    cryptography: {
      sections: [
        { heading: "Different primitives solve different problems", body: "Encryption is reversible with the appropriate key and protects confidentiality. A cryptographic hash is designed to be one-way and helps detect changes. A digital signature uses a private key to authenticate a message and lets others verify it with the corresponding public key." },
        { heading: "Protect keys and passwords", body: "Do not invent cryptographic algorithms. Use maintained libraries and authenticated encryption modes. Passwords should be stored as salted, deliberately slow password hashes, not plaintext or reversible encryption." },
      ],
      example: { language: "Concept", code: "plaintext --encrypt(public or shared key)--> ciphertext\nmessage --hash--> fixed-length digest\nmessage --sign(private key)--> signature", explanation: "Encryption, hashing, and signing produce different guarantees; one cannot simply replace another." },
      takeaways: ["Encryption is reversible; hashing is not.", "Signatures support authenticity and integrity verification.", "Use vetted libraries and protect secret keys."],
    },
    "web-security": {
      sections: [
        { heading: "Treat input as data", body: "Injection occurs when untrusted input is interpreted as part of a command or query. Use parameterized database queries, context-aware output encoding, and allowlist validation. Validation helps enforce business rules but does not replace safe query construction." },
        { heading: "Enforce access on the server", body: "A hidden button is not authorization. Check every requested resource against the authenticated user’s permissions on the server. Add CSRF protections where browser cookies authenticate state-changing requests, and avoid exposing sensitive details in error responses." },
      ],
      example: { language: "SQL", code: "// Safe: value is bound as data\nPreparedStatement stmt = connection.prepareStatement(\n    " + '"SELECT * FROM courses WHERE id = ?"' + ");\nstmt.setLong(1, courseId);", explanation: "A parameterized query keeps the supplied ID separate from SQL syntax." },
      takeaways: ["Use parameterized queries instead of string concatenation.", "Authorize every resource request on the server.", "Encode output for the context where it is rendered."],
    },
    "network-security": {
      sections: [
        { heading: "Layer network boundaries", body: "A firewall or security group should expose only the ports required by a service. Keep databases and internal caches on private networks. Network segmentation reduces which systems an attacker can reach after one service is compromised." },
        { heading: "Protect data in transit", body: "TLS authenticates the server and encrypts traffic between endpoints. Keep certificates valid, use supported protocol configurations, and verify certificates rather than disabling checks. Monitoring and patching help detect and close exposed service risks." },
      ],
      example: { language: "Exposure review", code: "Public: HTTPS reverse proxy :443\nPrivate network: application service\nPrivate network: database and cache\nAdmin access: restricted identity + audited path", explanation: "Only the public entry point needs Internet exposure; internal services communicate over restricted network paths." },
      takeaways: ["Expose only the network entry points users need.", "Keep databases and caches private.", "Use TLS with certificate verification for data in transit."],
    },
  },
};
