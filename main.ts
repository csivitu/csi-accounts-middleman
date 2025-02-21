import axios, { AxiosError } from 'axios';
require('dotenv').config();

/** 
 * Function to process input from the client.
 * @params:
 * - code_challenge: (PKCE challenge pair's challenge string)
 * - client_id: (Public client identifier)
 * - scope: (Array: can be CREATE, READ, UPDATE, DELETE)
 * - referer: (URL of the client that called it)
 **/  
type handleFlowInputFromClientParams = {
    code_challenge: string;
    client_id: string;
    scope: string[];
    referer: string; // URL of the client that called it 
};

export const processInputOutput = async () => {
    let code_challenge: string | null;
    let client_id: string | null;
    let scope: string[] = [];
    let referer: string | null;

    try {
        // Extract URL parameters
        const url = new URL(window.location.href);
        code_challenge = url.searchParams.get('code_challenge');
        client_id = url.searchParams.get('client_id');
        scope = url.searchParams.getAll('scope');
        referer = url.searchParams.get('origin');

        // Validate required parameters
        if (!code_challenge || !client_id || !scope.length || !referer) {
            console.error("Missing required parameters in the URL.");
            return;
        }
    } catch (error) {
        console.error("Error while parsing URL parameters:", error);
        return;
    }
    referer = decodeURIComponent(referer);

    // Reading AUTH_SERVICE from the global window object
    let responseUrl: string;
    try {
        responseUrl = (window as any).AUTH_SERVICE || '';
        if (!responseUrl) {
            throw new Error("AUTH_SERVICE URL is missing.");
        }
    } catch (error) {
        console.error("Error while retrieving AUTH_SERVICE URL:", error);
        return;
    }

    type handleFlowInputFromClientBody = Omit<handleFlowInputFromClientParams, "referer">;
    const body: handleFlowInputFromClientBody = { code_challenge, client_id, scope };

    try {
        // Send the request to the backend
        const response = await axios.post(responseUrl, body);

        if (response.data && response.data.authorization_code) {
            try {
                // Send message to the opener window
                window.opener?.postMessage({ "authorization_code": response.data.authorization_code }, referer);
            } catch (error) {
                console.error("Error while posting message to the opener:", error);
            }
        } else {
            throw new Error("Invalid response type from service: missing 'authorization_code'.");
        }

        console.log("Success! Response:", response.data);
    } catch (error: any) {
        if (error instanceof AxiosError) {
            console.error("Axios error occurred:", error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
        } else {
            console.error("Unexpected error occurred:", error);
        }
    }
};