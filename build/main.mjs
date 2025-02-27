const axiosInstance = window.axios;

export const processInputOutput = async () => {
    let code_challenge, client_id, scope, referer, username, email, password, isSignup;

    try {
        // ✅ Extract URL parameters
        const url = new URL(window.location.href);
        code_challenge = url.searchParams.get("code_challenge");
        client_id = url.searchParams.get("client_id");
        scope = url.searchParams.getAll("scope");
        referer = url.searchParams.get("origin");
        username = url.searchParams.get("username");
        email = url.searchParams.get("email");
        password = url.searchParams.get("password");
        isSignup = url.searchParams.get("isSignup") === "true"; // Convert to boolean

        if (!code_challenge || !client_id || !scope.length || !referer || !username || !email || !password) {
            console.error("❌ Missing required parameters in the URL.");
            return;
        }

        console.log("✅ Extracted Parameters Successfully");
    } catch (error) {
        console.error("❌ Error while parsing URL parameters:", error);
        return;
    }

    referer = decodeURIComponent(referer);

    // ✅ Ensure AUTH_SERVICE URL is present
    let responseUrl;
    try {
        responseUrl = window.AUTH_SERVICE || "http://localhost:3000";
        console.log("✅ Retrieved AUTH_SERVICE URL:", responseUrl);
    } catch (error) {
        console.error("❌ Error retrieving AUTH_SERVICE URL:", error);
        return;
    }

    // ✅ Construct request payload
    const body = { 
        name: username,  // Assuming 'username' is the user's full name
        username: String(username),
        email: String(email), 
        password: String(password), 
        roleID: "6fa459ea-ee8a-3ca4-894e-db77e160355e", // Replace with a valid UUID if needed
        code_challenge, 
        client_id, 
        scope 
    };

    try {
        // ✅ Send login/signup request to backend
        const authEndpoint = isSignup ? `${responseUrl}/auth/signup` : `${responseUrl}/auth/login`;
        console.log(`🔄 Sending request to: ${authEndpoint}`);
        console.log("📤 Request Payload:", JSON.stringify(body, null, 2));

        const response = await axiosInstance.post(authEndpoint, body, {
            headers: { "Content-Type": "application/json" },
            withCredentials: false, // Disabled for now  
        });

        console.log("🔄 Fetching authorization code...");

        // ✅ Extract authorization code from response
        const authCode = response.data.authorization_code;

        if (authCode) {
            // ✅ Store authorization code in localStorage or sessionStorage
            localStorage.setItem("authorization_code", authCode);
            console.log("✅ Stored authorization code:", authCode);

            // ✅ Send authorization code back to frontend
            try {
                console.log("✅ Posting authorization code to frontend:", authCode);
                window.opener?.postMessage({ authorization_code: authCode }, referer);
            } catch (error) {
                console.error("❌ Error posting message to opener:", error);
            }
        } else {
            throw new Error("Invalid response: missing 'authorization_code'.");
        }

        console.log("✅ Success! Response:", response.data);
        return authCode; // ✅ Return auth code if needed elsewhere

    } catch (error) {
        if (axiosInstance.isAxiosError(error)) {
            console.error("❌ Axios error:", error.message);
            if (error.response) {
                console.error("Response Data:", error.response.data);
                console.error("Response Status:", error.response.status);
            }
        } else {
            console.error("❌ Unexpected error occurred:", error);
        }
    }
};
