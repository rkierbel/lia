Lia stands for Legal Inquiry Assistant.

Lia can answer legal questions in three languages: English, French and Dutch.
Lia always provides references to the legal sources used to formulate her answer.
Lia's answer is formulated in a way that is understandable by anyone, with or without legal knowledge.

Lia has a fixed knowledge base of a limited corpus of legal documents (to date January 14th, 2025: Brussels Housing Code).

Lia is built on LangGraph.js and its workflow can be summarized as such:

I. New conversation:
1. Start -> PointOfContact node generates welcome message in 3 languages
3. FeedbackNode throws interrupt(), graph stops & waits for a question
4. Server returns welcome message to client

II. User sends question:
1. Server invokes graph with a Command({resume: question}) 
2. Graph resumes at FeedbackNode after interrupt, goes to validationNode
3. ValidationNode calls
    - question validity tool (is about an area of law known by the agent)
    - question language inference tool
    - legal source inference tool
4. Question invalid ? throws interrupt() and waits for new question
5. Question is valid ?
   - goes to the LegalClassifier (reformulate the question into a clear point of law and extracts keywords to represent the legal notion(s) over which the user seeks clarification)
   - goes to the LegalResearcher (query embedding & matching legal sources retrieval),
   - goes to the LegalCommunicator who provides a comprehensive answer based on the augmented point of law, then to the PointOfContact who communicates the answer & prompts for a new question
   
III. Answer and wait for new question:
1. PointOfContact calls answerAndWaitForNewQuestion
2. Response with legal conclusion transmitted by the LegalCommunicator is generated
3. interrupt() throws, graph stops, waits for new question or END
4. Server returns answer to client
5. Process repeats
