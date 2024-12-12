import React, {useState, useEffect, useRef } from "react"
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"  
import {platformAuthenticatorIsAvailable, startAuthentication, startRegistration, browserSupportsWebAuthn} from '@simplewebauthn/browser';
import { v4 as uuid } from 'uuid'
import {jwtDecode} from "jwt-decode";
 
import { Config } from "../config/Config";


export default function Login() {
 
  const { validateInput, login, loginComplete, loginAnonymous, loginAnonymousComplete, signupComplete, application, getApplication, socialSignup, socialLogin} = useAuth()
  const [error, setError] = useState("") 
  const [loading, setLoading] = useState(false)  

  const navigate = useNavigate() 
  const [handle, setHandle] = useState("") 
  const initialized = useRef(false)
  const appleLoginSuccess = useRef(false)
  const userData = useRef({})
  const [appData, setAppData] = useState({}) 
 

  useEffect(() => {

    const appleIDSignInOnFailure = (event) => {
      console.log("AppleIDSignInOnFailure.....", event.detail); 
      setError(`Failed to log in: ${event.detail.error}`); 
    }

    const appleIDSignInOnSuccess = (event) => { 
      // Listen for authorization success.
      // Handle successful response.
      console.log("appleIDSignInOnSuccess ... "); 
        
      // this event run twice for some reason. need only run once
      if (appleLoginSuccess.current) return;
      appleLoginSuccess.current = true;

      console.log("appleIDSignInOnSuccess .event.detail.authorization.. ", event.detail.authorization); 
      console.log("appleIDSignInOnSuccess .event.detail.user.. ", event.detail.user); 

      if (event.detail.authorization){ 
       
        let id_token = event.detail.authorization.id_token;

        let user = event.detail.user;

        if (user) {
          userData.current = {
            'token': id_token,
            'email': user.email,
            'firstName': user.name.firstName,
            'lastName': user.name.lastName,
          } 
          
        }
        else {

          userData.current = {
            'token': id_token, 
          }

          
        }

        

        submitSocialLogin(id_token, "apple");
      } 
      else setError("Failed to log in");  
    }


    /* global google */
    if (appData.googleLoginEnabled && window.google) {
      google.accounts.id.initialize({
        client_id: Config.GOOGLE_CLIENT_ID,
        callback: handleGoogle,
      });

      google.accounts.id.renderButton(document.getElementById("googleDiv"), {
        type: "standard",
        theme: "filled_blue",
        size: "large", 
        width:"200",
        text: "Sign in with Google",
        shape: "pill",
      });

      // google.accounts.id.prompt()
    }

    if (appData.appleLoginEnabled &&  window.AppleID) {
      window.AppleID.auth.init({
        clientId : Config.APPLE_BUNDLE_ID,
        scope : 'email name',
        redirectURI : Config.APPLE_REDIRECT_URI,
        state : 'SignInUserAuthenticationRequest',
        usePopup : true
      });

      
      document.addEventListener('AppleIDSignInOnSuccess', appleIDSignInOnSuccess)
      
      document.addEventListener('AppleIDSignInOnFailure', appleIDSignInOnFailure)

      
    } 

    return () => {
      document.removeEventListener('AppleIDSignInOnFailure', appleIDSignInOnFailure);
      document.removeEventListener('AppleIDSignInOnSuccess', appleIDSignInOnSuccess);
    };

  // eslint-disable-next-line 
  },[appData])



  useEffect(() => {


    if (!browserSupportsWebAuthn()) { 
      setError( 'It seems this browser does not support Passkey Authentication.');
      return;
    }  


    async function fetchApp() {
      let app = await getApplication()
      if (app) setAppData(app)
    }
   

    if (!initialized.current) { 

      initialized.current = true
      fetchApp() 
    }

     
    
  }, [getApplication]);
 

  async function submitSocialLogin(token, provider){
    try { 
      setError("")
      setLoading(true)
      const res = await socialLogin(token, provider);
      if(res.error){
        console.log("submitSocialLogin error " , res.error)
        if (res.error.code === 603) {

          if (provider === 'apple' && !userData.current.firstName){
            setError(`Whoop! Invalid Sign up. Please remove AppDemo in 'Sign with Apple' from your icloud setting and try again.`)
            return; 
          }
          console.log("submitSocialLogin userData " , userData.current)

          const result = await  socialSignup(token, userData.current.email, provider)
          if(result.error){
            if (result.error.message) setError(`Whoop! ${result.error.message}`)
            else setError(`Whoop! ${result.error}`)
          }
          else {
            navigate("/profile")
          } 

        }
        else if (res.error.message) setError(`Whoop! ${res.error.message}`)
        else setError(`Whoop! ${res.error}`)
        
      }
      else {
        
        navigate("/profile")
      } 
    } catch (error) {
      setError("Failed to log in")
    }
    finally{
      setLoading(false)
    }
  }
 

  const handleAnonymousLogin = async () => {
    if (!await platformAuthenticatorIsAvailable()) {
      setError("Your device doesn't have Passkey Authenticator. Please use any security key device to register.") 
      return;
    }

    let anonHandle = `ANON_${uuid()}`
    let result = await loginAnonymous(anonHandle)

    if(result.error){
      setError(result.error.message)
      return
    }

    console.log("handleAnonymousLogin result ", result);

    let attResp = await startRegistration({ optionsJSON:result });
    attResp.handle = anonHandle;
      

    let authn = await loginAnonymousComplete(attResp);
    if (authn.error) {
      setError(authn.error.message)
    }
    else { 
      navigate("/profile")
    } 

  }
 
  const handleSubmit = async () => {

    if (!await platformAuthenticatorIsAvailable()) {
      setError("Your device doesn't have Passkey Authenticator. Please use any security key device to register.") 
      return;
    }
    if(!validateInput(handle)){
      setError("Please enter a valid user handle")
      return;
    }

    let result = await login(handle);
    if (result.error){
      setError(result.error.message)
    }
    else if(result.requireAddPasskey){
      let attResp =  await startRegistration({ optionsJSON:result });
      attResp.handle = handle;
      

      let authn = await signupComplete(attResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else { 
        navigate("/profile")
      } 
    }
    else if (result.challenge){
      let asseResp = await startAuthentication({optionsJSON:result});
      asseResp.handle = handle; 

      let authn = await loginComplete(asseResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else {  
        navigate("/profile")
      }
    }
    else {
      setError("Invalid Data")
    }

  }

  const onChangeHandle = async (evt) => {
    setHandle(evt.target.value)
   
  }
 


  async function handleGoogle (response){
    console.log("handleGoogle response ", response); 
    let decoded = await jwtDecode(response.credential );

    console.log("handleGoogle decoded ", decoded); 
    userData.current = {
      'token': response.credential,
      'email': decoded.email,
      'firstName': decoded.given_name,
      'lastName': decoded.family_name
    }

 
    if (response.credential) submitSocialLogin(response.credential, 'google'); 
    else setError("Failed to log in")
  };

 

 
  return (
    <>
    
    
      <Card className="text-center">
        <Card.Body>
          <h2 className="text-center mb-4 form-title">Log In</h2>
           
          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group id="email">
              <Form.Label className="gray-text">Email</Form.Label>
              <Form.Control type="text" value={handle} name="handle" required className="small-text" onChange={onChangeHandle}/>
            </Form.Group>

            <div className="w-100 text-center">

            {loading ? <Button variant="primary button-radius" disabled className="w-100 mt-3">
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                        Loading...
                      </Button> 
                      : 

                      <Button  className="w-50 mt-3 button-radius" onClick={handleSubmit}>
                        Log In
                      </Button>
            }

              
            </div>
            
            <div className="w-100 text-center">
            {application.anonymousLoginEnabled &&  <Button  className="w-50 mt-3 button-radius" onClick={handleAnonymousLogin}> Log Anonymous</Button>}

            { ( application.appleLoginEnabled || application.googleLoginEnabled) && <h4 className="text-center mb-4 form-title mt-4"> Or Start With</h4> }
           
           
            { application.googleLoginEnabled && application.googleClientId && 
               <div className="row mb-3">
                <div className="col"></div> 
                <div className="col">
                  <div id="googleDiv" ></div>
                </div>
                <div className="col"></div>
              </div>
             }


            { application.appleLoginEnabled && application.appleBundleId &&
             <div className="row">
                 
                  <div className="col"></div>
                  <div className="col">
                  <div id="appleid-signin"
                      data-mode="center-align"
                      data-type="sign-in"
                      data-color="white"
                      data-border="true"
                      data-border-radius="50"
                      data-width="200"
                      data-height="40" 
                      className="social-button"></div>
                  </div>
                  <div className="col"></div>
                
                
              </div>
            }
          </div>
          </Form> 
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2"> 

        <h6 className="mt-20 gray-light"> DON'T HAVE AN ACCOUNT? <Link to="/signup" className="white-link">SIGN UP</Link> </h6>
      </div>

    
    </>
  )
}
