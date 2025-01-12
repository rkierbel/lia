import fetch from 'node-fetch';

const baseURL = 'http://localhost:3000/api/conversation';

async function startConversation() {
    try {
        const response = await fetch(`${baseURL}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        console.log('Conversation Started:', data);
        return data.conversationId; // Save the conversationId for further communication
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

async function sendMessage(conversationId: string, message: string) {
    try {
        const response = await fetch(`${baseURL}/${conversationId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        const data = await response.json();
        console.log('Message Response:', data);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Example execution
(async () => {
    const conversationId = await startConversation();
    if (conversationId) {
        await sendMessage(conversationId, 'What are my rights as a tenant?');
    }
})();