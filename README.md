# HL7 Parser Migration

## How to run the project and tests

### TypeScript:
1. Download the project and unzip the files
2. Open the a terminal and cd to the root of the unzipped project, `Hl7TestApp-RyanGabrin`
3. Run `cd HL7TestApp-TypeScript`
4. Run `npm install`
5. Run `npx ts-node Program.ts ..\TestData\`
    - The console should log each test data entry and output the parsed ObjectRecord.
6. To run the tests, run `npx jest`
    - The console should display the results of the jest test suite, which includes 18 tests
    - to view the code coverage, use `npx jest --coverage`

## Your stack choice and a one-paragraph rationale
- I chose to write this class using Node.js/TypeScript. Outside of having a greater familiarity with the language, I chose this due to what I believe are its advantages in rapid prototyping and broad library availability. While TypeScript is a typed language, it does provide more generic structures like "any" and "object" that, while quickly putting together an MVP, can speed up the time to achieve functional success. Additionally, npm provides users with a wide spread of libraries, allowing me the opportunity to investigate even simpler methods of accomplishing the tasks of the LegacyHl7Parser. Finally, Node.js is lightweight and easily deployed, and when attempting to break out a legacy monolith into smaller maintainable components, this seemed to be the most reasonable route. While throughput is a mild concern when compared to C#, horizontal scaling is always an option to address this if necessary.

## Any trade-offs or known limitations
- As I call out a number of times in this project, the main limitations of TypeScript/Node.js vs .NET 8 are its lack of multi-threading capabilities and its less standard development environment by comparison.
- The multi-threading tradeoff means that, for larger requests and workflows, there may potentially be a performance bottleneck in a Node.js application that forces higher operating costs with more server instances needed to keep up.
- As for the less standard development environment, the libraries and packages made available in Node through npm are generally open-source and have unstable timelines on maintenance and upkeep. This means using Node increases risk of more frequent package management and hands-on configuration work in comparison to .NET, which has centralized package management through Microsoft.

## What you would do differently with more time
- With more time, I would focus on expanding the infrastructure around the service, determining a deployment pipeline, expanding the test suite, and implementing more verbose and accessible logging for failures.
- Given this is a Node application, we could deploy it on an express server quite smoothly; an alternate route would be Dockerization, which would be more robust in that it locks down the runtime environment.
- For the test suite, I'd want to establish a reusable structure that could be shared across services that we split out; right now this is 100% geared toward the Hl7TestApp, and as such is very brittle itself.
- Finally, when failures occur in the app they are handled gracefully but are locally reported in the console. Logs should be stored in a centrally accessible location (I am most familiar with the ELK Stack) through which they can be easily viewed.

## Noteworthy findings during development
- The provided LegacyHl7Parser has a defect in its retrieval of the OrderedDateTime when compared to the 'happy path' data provided. The OrderedDateTime is retrieved from the 6th index of the OBR fields, however in the data provided, that value is in the 7th index. For feature parity with the existing code I did not fix this indexing in my TypeScript implementation of LegacyHl7Parser, but would in a production scenario if this is the expected formatting. I do have a test input (TestData-HappyPath(Fixed)) that amends the data input to demonstrate a proper output. The solution to this in my implementation would simply be changing the index location in the Hl7Schema.
- A null 'rawMessage' test case was added to my test suite, but fails to run as the LegacyHl7Parser logic only expects a non-null string to be input, and as such was commented out for the time being. Again, this is not something I fixed in the parser code to maintain parity with the existing feature, but is something that would be raised and likely addressed before moving the new service forward.
- In place of the 'rawMessage' edge case above, I implemented a test for an input file containing multiple HL7 messages. While the requested test cases accounted for malformed data, they did not cover an excess amount of data and as such our program had no clarity around how it would behave in this scenario. Through this test I confirmed that the process would iterate through all messages but ultimately send an OrderRecord only for the final message in the list, providing potential justification for the creation of safeguards against this behavior. This was my chosen edge case as it was fully detached from the 4 originally requested cases and checked the logic of the code across larger amounts of data rather than a single message ingestion.
