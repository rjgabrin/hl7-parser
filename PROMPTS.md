Format Example:
## Prompt {Number} - Title

**Asked:** 
**Got:** 
**Changed:** 
**Why:** 

-----------------------------------------------------------------------------------------------
## Prompt 1 — Selecting a tech stack for the application 

**Asked:** "I have a legacy back-end server application that needs to be updated to a modern tech stack. I'm able to update it to use .NET 8 with C#, or Node.js/Typescript. Provide me with a list of the top 5 Pros/Cons to using each."

**Got:** A bulleted list of itemized Pros/Cons for .NET 8 and Node.js, ending with a table displaying the two side-by-side

**Changed:** This was just an information prompt; no work was completed for me to update.

**Why:** Having used both C# and TypeScript, I understand the general benefits/drawbacks of each from my personal experience. However, from the perspective of a back-end service, I don't know what I don't know so this was my first pass at identifying if there may be a glaring issue with one over the other.

-----------------------------------------------------------------------------------------------
## Prompt 2 — Transferring Initial LegacyHl7Parser to TypeScript

**Asked:** "I have created a skeleton class named LegacyHl7Parser.ts. Using LegacyHl7Parser.cs as a guide, replicate its functionality in the existing classes of LegacyHl7Pasrser.ts. If specific packages are used in the C# file that do not exist in TypeScript, call them out. Do not attempt to insert what you believe is a suitable replacement or make any modifications to the code flow."

**Got:** A filled in LegacyHl7Parser class in TypeScript, generally mimicking the functionality of the C# implementation.

**Changed:** I moved the OrderRecord declaration to its own interface outside of this file, and I added helper functions to harden the HL7 ingestion and OrderRecord generation.

**Why:** Part of the problem with the legacy system, as outlined in the instructions file, is that it is brittle and hard to update when changes are needed. For this reason I am ensuring that I not only carry over the functionality but incrementally break it down into smaller independent classes/interfaces.

-----------------------------------------------------------------------------------------------
## Prompt 3 — Creating an entrypoint to run the actual HL7 Parser

**Asked:** "The HL7 Parser needs an entrypoint through which the application can be run. The inputs for this entrypoint should be files from another directory. Create me an entrypoint named Program.ts in the same directory that accepts the path to this test data input directory as a parameter."

**Got:** A skeleton Program.ts file that had a hardcoded path to a single TestData.hl7 file, read the contents from that file, invoked the LegacyHl7Parser Parse function, and wrote the record to the console.

**Changed:** I reworked the way the application ingested data, as a single hardcoded file path was not enough to suffice the requirements for a batch of hl7 files all at once. 

**Why:** With the original implementation the AI only set up the program to run from 1 hardcoded file, making it inflexible and insufficient for the project requirements.

-----------------------------------------------------------------------------------------------
## Prompt 4 — Integrating Jest for testing 

**Asked:** "Create a test file for the parser.ts class with tests for the following scenarios:
   - A well-formed ORM^O01 message (happy path)
   - A message with a missing or malformed `MSH-9` (message type) field
   - A message with no `OBR` segment
   - A `PID-3` field with and without the `^`-delimited subcomponent (e.g., `12345^MR^HospitalA` vs. `12345`). Use the jest library for testing, and use the test data in ./TestData/ as a guide for each of the inputs of these test cases."

**Got:** A new test file (LegacyHl7ParserTests.tests.ts) containing test cases for the 4 outlined scenarios in the prompt.

**Changed:** I had to update the expected output, as the AI model made incorrect assumptions about the code. There was an extra test case including 2 MSH-9 fields in a file which I did not call out in the prompt, but it attempted to write the test case for that anyway. 

**Why:** The AI model primarily struggled with malformed test data including multiple of the same field. In the actual flow, each field is processed whether one of that type has been seen or not, so the value(s) of the last one processed are what we display. The AI model assumed that the first instance of this field is where the process would stop, making its expected output incorrect.

-----------------------------------------------------------------------------------------------
## Prompt 5 — Expanding test cases from my initial data 

**Asked:** "I've added more test data to the TestData directory, namely the Empty and MultipleMessages data. Can you expand the LegacyHl7ParserTests file to include tests for these edge cases?"

**Got:** 2 new test cases added to the LegacyHl7ParserTests file to account for an empty message and multiple messages. 

**Changed:** I had to update the expected output for the multiple-messages test case. The application assumed that the first message would be the only one processed, however the flow steps through all sliced entries, meaning it will process every message and output the data of the last in the list rather than the first. I updated the expected output to reflect this.

**Why:** Again, the AI model did not account for the full functionality of the parse function, which splits up the input data and iterates through all lines/fields accordingly. At no point is there an early return or override stating that one and only one field will be parsed per run, but the AI seems to have assumed this was the case.

-----------------------------------------------------------------------------------------------

## Prompt 6 — Styling my README and MigrationStrategy files

**Asked:** "My README and MigrationStrategy files have finalized content, however the markdown styling needs work. Anything with a # next to it is intended as a title, anything with a number (i.e. 1.) and period next to it is intended to be part of a numbered list, and anything beneath that (i.e. 1a. ) is intended to be a sub-list beneath its parent bullet point."

**Got:** Cleaned up styling per the above guidelines for my README and MigrationStrategy documents.

**Changed:** Despite noting finalized content and only requesting formatting changes, Copilot still attempted to reword parts of my answers. Much of this needed to be rolled back.

**Why:** In its attempts to clean up the styling, the AI over-simplified some phrasing that I used and this ultimately changed the message entirely. For example, I said that types 'any' and 'object' must be guarded against and avoided entirely in TypeScript to protect from I/O type mismatches further down the pipeline; Copilot changed that to say 'any' and 'object' should be used 'sparingly' or 'as needed'. This change, though subtle, introduces a flexibility to production code that I was not advocating for and actually was explicitly against, making this cleanup necessary.

-----------------------------------------------------------------------------------------------

## Prompt 7 — Improving HL7 Message ingestion with a schema

**Asked:** "The current index-based parsing of the HL7 message in the 'parse' function is brittle. It is likely to break if different message types or versions are ingested that do not adhere to the current Hl7 v2 format. I want to establish a schema for the current HL7 v2 message where we centralize these index references. This will ensure any changes only need to be made in one location, and also allow us to expand to multiple schemas in the future should it be necessary, so that multiple message types may be ingested safely."

**Got:** A breakdown of how the HL7 Schema implementation would address the above concerns along with an example starter for the schema declaration.

**Changed:** The suggested schema used 'any' and 'object' types for many of the fields, which is not acceptable in my implementation as it completely does away with the strongly-typed protections of TypeScript over JavaScript. I expanded the schema to include more granular type interfaces that then constructed the Hl7Schema.

**Why:** Thinking long-term for the application, my original implementation of the Hl7 parser was formatted only for Hl7 v2 messages. These v2 messages are still updated and - simply by the existance of a v2 - I can expect an eventual v3, v4, and so on with unique structures. Through establishing a schema for this v2 structure, I am set up to generalize the parser logic to check multiple schemas as-needed, making the overall code flow more stable over time. When a new message format is released, I will have minimal edits to make to the actual code logic and will instead be expanding the existing or new schema(s), which helps to protect some against breaking old functionality.
