import React, { useState, useEffect } from "react"
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"  
import {platformAuthenticatorIsAvailable, startAuthentication, startRegistration, browserSupportsWebAuthn} from '@simplewebauthn/browser';
import { v4 as uuid } from 'uuid'

export default function Login() {
 
  const { login, loginComplete, loginAnonymous, loginAnonymousComplete, signupComplete, application} = useAuth()
  const [error, setError] = useState("") 
  const [loading, setLoading] = useState(false) 
  const navigate = useNavigate() 
  const [handle, setHandle] = useState("") 

  useEffect(() => { 
    if (!browserSupportsWebAuthn()) { 
      setError( 'It seems this browser does not support Passkey Authentication.');
      return;
    }  
  }, []); 

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
    let attResp = await startRegistration(result);
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

    let result = await login(handle);
    if (result.error){
      setError(result.error.message)
    }
    if(result.requireAddPasskey){
      let attResp = await startRegistration(result);
      attResp.handle = handle;
      

      let authn = await signupComplete(attResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else { 
        navigate("profile")
      } 
    }
    else {
      let asseResp = await startAuthentication(result);
      asseResp.handle = handle; 

      let authn = await loginComplete(asseResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else {  
        navigate("/profile")
      }
    }

  }

  const onChangeHandle = async (evt) => {
    setHandle(evt.target.value)
   
  }
 
 

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
              

            {loading ? <Button variant="primary button-radius" disabled className="w-100 mt-3">
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    Loading...
                  </Button> :  
                  <Button disabled={loading} className="w-100 mt-3 button-radius" onClick={handleSubmit}>
                    Log In
                  </Button>
            }

            {application.anonymousLoginEnabled &&  <Button disabled={loading} className="w-100 mt-3 button-radius" onClick={handleAnonymousLogin}>
                    Log Anonymous
                  </Button>
            }
          </Form> 
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2"> 

        <h6 className="mt-20 gray-light"> DON'T HAVE AN ACCOUNT? <Link to="/signup" className="white-link">SIGN UP</Link> </h6>
      </div>
    </>
  )
}
