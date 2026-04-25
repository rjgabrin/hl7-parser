# Migration Strategy

## 1. Key Risks
- Migrating from .NET to TypeScript presents four primary concerns:
  - **Performance:** .NET's multi-threading allows for greater throughput, while Node.js/Javascript execution is single-threaded. This may impact customer experience or require more server instances, increasing costs overall. This is an argument for .NET 8 if high performance is required.
  - **Typing:** C# is strongly typed, while TypeScript has added flexibility from its roots in JavaScript. Care must be taken to ensure safe typing in TypeScript to avoid input/output errors. The use of `any` or `object` types must be guarded against, as otherwise the typed advantage and security of TypeScript over JavaScript is nullified.
  - **Library Parity:** TypeScript libraries are mostly open-source and rarely match .NET libraries 1-to-1. As a result of this, new implementations may be needed to leverage alternative tools availble to a Node project. NPM offers a great many libraries, but they are externally maintained, which means they may be unreliable and cause complications in long-term package management.
  - **Deployment Pipeline** Discrepancies in the build and deployment tools used by .NET and Node raise concerns in this transition. .NET, as a Microsoft-managed framework, relies on Windows-based tooling to be built and hosted whereas Node is platform-agnostic, using tools like npm and yarn to handle build tasks and Docker or Azure for hosting. Additionally, Node services often require the use of a reverse proxy to be reached (e.g. nginx), which add an additional layer of complexity.

## 2. Phasing Proposal
1. **Architecture Planning**
    - Before starting the transition, the first step would be to design and rearchitect the service to meet new requirements. This new design would include a rework of the existing code paths to avoid porting brittle code to a new language without addressing more foundational issues in the logic. This step would also include an identification of core functionalities and definition of boundaries for independent services such that the monolith could be split multiple ways.
    - Throughout this process extensive documentation of the new architecture and its purposes (e.g., breaking out the monolith, modernizing the stack) would need to be generated. Any major architecture decisions would be noted for clarity and focus over the lifetime of the project.
2. **Indidivual Service Translation (HL7 Parser as Example)**
    - Begin transitioning the HL7 Parser to the new stack. This step would establish a project structure for the new independent service and classes as a foundation for future development. 
    - For the larger migration, use a progressive transition: the legacy app calls the new instance for individual workflows, relying more on the new app as it matures and phasing out the old redundant classes. Repeat for each class/workflow, ensuring user experience is not impacted. Eventually, all services are independent and a centralized user service coordinates them.
3. **Automated Testing Generation**
    - As new classes are developed, establish unit tests in real-time (in lock-step with Step 2 above). Use the legacy functionality as a baseline to generate test cases for new classes and workflows. When the legacy app begins calling the new app in lower environments, it will provide a secondary validation as a deviation from the old input/output structures will break the integration. Adequate testing minimizes risk of this and ensures input/output expectations are met.
    - Testing should also include performance testing to ensure the new implementation can handle the currently expected load. This step may require architecture updates if a greater throughput is needed and new components are added (like load balancers, additional server instances, etc).
4. **Simultaneous Rollout**
    - Run the new and old services in dev, QA, and testing environments simultaneously for a period to ensure stability. This allows safe transfer of reliance from old to new services.
5. **Batched Integration/Client Release**
    - Release the new service to small groups of clients at a time. Too many at once risks impacting many customers; too few risks long-term maintainence of both services. Set a start/end date, target number of customers per week/month, and a clear defect remediation plan. With both services running, a simple URL switch should be able to move clients to the new service and roll back if needed.
    - Ensure that customers are notified in advance of the switch so they can monitor and report issues quickly.

## 3. Runtime Rationale
- I chose TypeScript for its lightweight architecture and broad library availability, which enabled fast prototyping. The legacy .NET 4.8.1 code is brittle and unstable; this rewrite is an opportunity to improve, not just re-implement. Early on use of types 'any' and 'object' can help to keep development moving, and once functional parity is achieved with the legacy service, data objects can be hardened for type safety. NPM libraries provide us with new opportunities to streamline our workflows as well. With all of that in mind, .NET 8 remains a strong alternative for its multi-threading and scaling; while Node.js can scale horizontally, .NET offers both vertical and horizontal scaling with greater efficiency.
