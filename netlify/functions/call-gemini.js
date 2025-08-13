// This file acts as a secure proxy to the Google Gemini API.
// It uses the API key from a secure environment variable on the server,
// never exposing it to the client-side browser.

exports.handler = async function(event) {
    // Get the secret API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if the API key is available. If not, return an error.
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key is not configured on the server." })
        };
    }

    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        // The 'event.body' contains the payload sent from our front-end app.js
        const requestBody = JSON.parse(event.body);

        // Make the actual request to the Google API
        const response = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody) // Forward the payload
        });
        
        const data = await response.json();

        // If Google's API returns an error, forward it to the client
        if (!response.ok) {
            console.error("Google API Error:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || "An error occurred with the Google API."})
            };
        }

        // Send the successful response from Google back to our front-end
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Serverless function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
