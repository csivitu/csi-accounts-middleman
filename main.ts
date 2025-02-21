import axios, {AxiosError} from 'axios';
require('dotenv').config()

/** 
 * writing up a function that takes input from the client
 * params:
 * code_challenge (pcke challange pair's challenge string),
 * client_id, (public client identifier)
 * scope type:Array (can be CREATE, READ, UPDATE, DELETE)
 **/  
type handleFlowInputFromClientParams={
    code_challenge:string,
    client_id:string,
    scope:string[],
    referer:string //url of the client that called it 
}
const processInputOutput = async () => {
    //take the url params from the string
    const url = new URL(window.location.href);
    const code_challenge : string | null = url.searchParams.get('code_challenge');
    const client_id : string | null = url.searchParams.get('client_id');
    const scope : string[] = url.searchParams.getAll('scope');
    const referer : string | null = url.searchParams.get('origin');

    if(!code_challenge || !client_id || !scope || !referer) return;
    const responseUrl : string =process.env.AUTH_SERVICE || '';

    type handleFlowInputFromClientBody= Omit<handleFlowInputFromClientParams,"referer">;

    const body : handleFlowInputFromClientBody = {
        code_challenge,
        client_id,
        scope
    };
    try{
        const response=await axios.post(responseUrl,body);
        //response must contain authoriazation_code inside body param called authoriazation_code
        if(response.data.authoriazation_code){
            // the param url must be the url of the website that opened this page
            window.opener?.postMessage({ "authoriazation_code" : response.data.authoriazation_code }, referer);
        }
        else{
            throw new Error("Invalid response type from service");
        }
        console.log(`Success, Response: ${response}`);
        return;
    }catch(e:any){
        if(e instanceof AxiosError) {
            console.error("Axios based error occured.");
            return;
        }
        else {
            console.error(`Error: ${e}`)
        }
    }

}

