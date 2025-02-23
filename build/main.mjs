const axiosInstance = window.axios;
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    
  };
export const processInputOutput = async () => {
    let code_challenge;
    let client_id;
    let scope = [];
    let referer;
    try {
        // Extract URL parameters
        const url = new URL(window.location.href);
        code_challenge = url.searchParams.get('code_challenge');
        client_id = url.searchParams.get('client_id');
        scope = url.searchParams.getAll('scope');
        referer = url.searchParams.get('origin');
        // Validate required parameters
        
        if (!code_challenge || !client_id || !scope.length || !referer) {
            console.log(url);
            console.log("Full URL:", window.location.href);
            console.log("Extracted Parameters:");
            console.log("code_challenge:", code_challenge);
            console.log("client_id:", client_id);
            console.log("scope:", scope);
            console.log("referer:", referer);
            console.error("Missing required parameters in the URL.");
            return;
        }
        console.log("success");
    }
    catch (error) {
        console.error("Error while parsing URL parameters:", error);
        return;
    }
    referer = decodeURIComponent(referer);
    // Reading AUTH_SERVICE from the global window object
    let responseUrl;
    try {
        responseUrl = window.AUTH_SERVICE || '';
        if (!responseUrl) {
            throw new Error("AUTH_SERVICE URL is missing.");
        }
        console.log("retrieved auth service url");
    }
    catch (error) {
        console.error("Error while retrieving AUTH_SERVICE URL:", error);
        return;
    }
    const body = { code_challenge, client_id, scope };
    try {
        // Send the request to the backend
        const response1 = await axios.post("http://localhost:3000", body, {
            headers: {
                "Content-Type": "application/json"
            },
            withCredentials: false  // disabled for now  
        });
        console.log("🔄 Fetching auth code...");
        const response = await axiosInstance.get("http://localhost:3000/auth");
        const authCode = response.data.auth_code; 
        if (response.data && response.data.auth_code) {
            try {
                
                window.opener?.postMessage({ "authorization_code": response.data.authCode }, referer);
            }
            catch (error) {
                console.error("Error while posting message to the opener:", error);
            }
        }
        else {
            throw new Error("Invalid response type from service: missing 'authCode'.");
        }
        console.log("Success! Response:", response.data);
    }
    catch (error) {
        if (axiosInstance.isAxiosError(error)) { 
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
