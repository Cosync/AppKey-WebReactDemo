import React, {useState, useEffect } from "react"
import { Form, Button, Card, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"  
import {platformAuthenticatorIsAvailable, startAuthentication, startRegistration, browserSupportsWebAuthn} from '@simplewebauthn/browser';
import { v4 as uuid } from 'uuid'
import {jwtDecode} from "jwt-decode";
import { GoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';
import { Config } from "../config/Config";


export default function Login() {
 
  const { validateInput, login, loginComplete, loginAnonymous, loginAnonymousComplete, signupComplete, application, socialSignup, socialLogin} = useAuth()
  const [error, setError] = useState("") 
  const [googleUser, setGoogleUser] = useState() 
  const navigate = useNavigate() 
  const [handle, setHandle] = useState("") 
 

 

  useEffect(() => { 
    if (!browserSupportsWebAuthn()) { 
      setError( 'It seems this browser does not support Passkey Authentication.');
      return;
    }  

  }, [ ]); 



  useEffect( () => { 

    async function fetchData() { 

      console.log('fetchData googleUser ', googleUser)
      
      let result = await socialLogin(googleUser.credential, 'google') 
      console.log('socialLogin user ', result)
      if(result.error && result.error.code === 603){
        const decoded = jwtDecode(googleUser.credential); 
        console.log('googleUser decoded ', decoded)
  
        let signupResult = await socialSignup(googleUser.credential, decoded.email, 'google') 
        console.log('socialSignup signupResult ', signupResult)

        if (signupResult.error) {
          setError(signupResult.error.message)
        }
        else { 
          navigate("profile")
        } 
      }
      else { 
        navigate("profile")
      } 
    }


    if (googleUser && googleUser.credential) {  
      fetchData()
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser, navigate]); 


  const handleAnonymousLogin = async () => {
    if (!await platformAuthenticatorIsAvailable()) {
      setError("Your device doesn't have Passkey Authenticator. Please use any security key device to register.") 
      return;
    }

    let anonHandle = `ANON_${uuid()}`
    let optionsJSON = await loginAnonymous(anonHandle)

    if(optionsJSON.error){
      setError(optionsJSON.error.message)
      return
    }
    let attResp =  await startRegistration({ optionsJSON });
      attResp.handle = anonHandle;
      

      let authn = await loginAnonymousComplete(attResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else { 
        navigate("profile")
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
      let attResp = await startRegistration({ optionsJSON:result });
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
 

   /* "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM2MjgyNTg2MDExMTNlNjU3NmE0NTMzNzM2NWZlOGI4OTczZDE2NzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5MjUwNTA2NDIwMjAtZXJlczZoanY3YTQ1Nmg3ODFtbG9hamF2aG52OHFiNDAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5MjUwNTA2NDIwMjAtZXJlczZoanY3YTQ1Nmg3ODFtbG9hamF2aG52OHFiNDAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDk2NTA0NTQ0OTgwMDUwNzg5OTYiLCJoZCI6ImNvc3luYy5pbyIsImVtYWlsIjoidG9sYUBjb3N5bmMuaW8iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmJmIjoxNzMyNTIwMDM3LCJuYW1lIjoiVG9sYSBWb2V1bmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSzdwb1lJYU5kNGVjWERtZFcyNkJQVF9ibXB0cE5ZZWp5VTNzM3luMmdSSWJGOEpBPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlRvbGEiLCJmYW1pbHlfbmFtZSI6IlZvZXVuZyIsImlhdCI6MTczMjUyMDMzNywiZXhwIjoxNzMyNTIzOTM3LCJqdGkiOiIzYWFjMWQyZjJhNWMxMjdhMGUxMDZiYmUzZmRmYjQ3OTIzMDM0ZTIzIn0.rM6C6YGGQf4BPTZE8snvfa6XfKcstXmZwkj3iOFiAMU2XtzMBnsX4932uU4uAK9BLj83DBwQ39fr586pXZPy7FLTm7s9EpQAW5p0bs0i-kSusovBsCulIg6wyVlfDerPjDIbuv8OOEW_FgD31jIU1joi2Ojp_euuCTcPRJiL2uI-8isd6IeyPv3jVWX7A3HB1mNl3mz960fXwPZW8X_AlQyJ61PalnEi8LOQu8y2gGmadDYXEHUjCgbcpZtZoJyVZsQAH2hUF_CMOQFvEzmmPSatbIapevsxR2qZI9WZYPS103AwryxgOa2lEvl4LDN2j4tMTX4yjgIm7JSAh4a5Uw",
    "clientId": "925050642020-eres6hjv7a456h781mloajavhnv8qb40.apps.googleusercontent.com",
    "sel ect_by": "btn"
    */
  const responseMessage = (response) => {
    console.log('Google responseMessage  response', response); 

    setGoogleUser(response)
 
  };

  const errorMessage = (error) => {
      console.log('Google errorMessage error ', error);
  };


  const appleResponseMessage = (response) => {
    console.log('appleResponseMessage responseMessage  response', response); 

   
 
  };

  const appleErrorMessage = (error) => {
    console.log('appleErrorMessage responseMessage  error', error);  
 
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

              <Button  className="w-50 mt-3 button-radius" onClick={handleSubmit}>
                Log In
              </Button>
            </div>
            
            <div className="w-100 text-center">
            {application.anonymousLoginEnabled &&  <Button  className="w-50 mt-3 button-radius" onClick={handleAnonymousLogin}> Log Anonymous</Button>}

            { ( application.appleLoginEnabled || application.googleLoginEnabled) && <h4 className="text-center mb-4 form-title mt-4"> OR </h4> }
           
           
            { application.googleLoginEnabled && application.googleClientId && 
              <div className="w-100 text-center">
                 <div style={{position: "relative", display: "flex", alignItems: "center" , justifyContent: "center" }}>

                  <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
                </div> 
              </div> }


            { application.appleLoginEnabled && application.appleBundleId &&
              <div className="w-100 button-radius">
              <AppleSignin
                /** Auth options passed to AppleID.auth.init() */
                authOptions={{
                  /** Client ID - eg: 'com.example.com' */
                  clientId: 'io.appkey.appdemo',
                  /** Requested scopes, seperated by spaces - eg: 'email name' */
                  scope: 'email name',
                  /** Apple's redirectURI - must be one of the URIs you added to the serviceID - the undocumented trick in apple docs is that you should call auth from a page that is listed as a redirectURI, localhost fails */
                  redirectURI: Config.APPLE_REDIRECT_URL,
                  /** State string that is returned with the apple response */
                  state: 'state',
                  /** Nonce */
                  nonce: 'nonce',
                  /** Uses popup auth instead of redirection */
                  usePopup: true,
                }} // REQUIRED
                /** General props */
                uiType="dark"
                /** className */
                className="w-50 mt-3 button-radius"
                /** Removes default style tag */
                noDefaultStyle={false}
                /** Allows to change the button's children, eg: for changing the button text */
                buttonExtraChildren="Login with Apple"
                /** Extra controlling props */
                /** Called upon signin success in case authOptions.usePopup = true -- which means auth is handled client side */
                onSuccess={(response) => appleResponseMessage} // default = undefined
                /** Called upon signin error */
                onError={(error) => appleErrorMessage } // default = undefined
                /** Skips loading the apple script if true */
                skipScript={false} // default = undefined
                 
                  
              />

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
