import React, { useState, useEffect } from "react"
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom" 
import { startRegistration, platformAuthenticatorIsAvailable, browserSupportsWebAuthn} from '@simplewebauthn/browser';
 
 

export default function Signup() {
 
  const { signup, signupConfirm, signupComplete, getApplication} = useAuth()
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false) 
  const [confirm, setConfirm] = useState(false) 
  const [formData, setFormData] = useState({handle:"", displayName:""}) 
  const navigate = useNavigate() 

  useEffect(() => { 

    if (!browserSupportsWebAuthn()) { 
      setError( 'It seems this browser does not support Passkey Authentication.');
      return;
    }

    getApplication()
  }, []); 


  const cancelSignup = async () => {
    setError("")
    setConfirm(false)
  }
 
  const handleSubmit = async () => {
    setError("")
    if(confirm){
      getRegisterChallenge()
      return
    }

    let result = await signup(formData)
    if (result.error){
      setError(result.error.message)
    }
    else {
      setConfirm(true)
    }
  }



  const getRegisterChallenge = async() => {
    try {  

      let result = await signupConfirm(formData.handle, formData.code); 
      if (result.error) {
        setError(result.error.message)
        return
      }

      let attResp = await startRegistration(result);
      attResp.handle = formData.handle;
      

      let authn = await signupComplete(attResp);
      if (authn.error) {
        setError(authn.error.message)
      }
      else {
        setMessage("Authenticator registered!") 
        navigate("profile")
      } 

    } catch (error) {
      console.log("getRegisterChallenge error ", error);
      if (error.message) {
        setError(error.message)
      }

    }
    finally{
      setLoading(false)
    }
  }

  const onChangeForm = async (evt) => {
    setFormData({
      ...formData,
      [evt.target.name]: evt.target.value
    })
  }
 
 

  return (
    <>
      <Card className="text-center">
        <Card.Body>
          <h2 className="text-center mb-4 form-title">Sign Up</h2>
          {message && <Alert color="info">  {message} </Alert>} 
          {error && <Alert variant="danger">{error}</Alert>}

          <Form >

            <Form.Group id="name">
              <Form.Label className="gray-text">Display Name</Form.Label>
              <Form.Control type="text" value={formData.displayName} name="displayName" required className="small-text" onChange={onChangeForm}/>
            </Form.Group>

            <Form.Group id="email">
              <Form.Label className="gray-text">Email</Form.Label>
              <Form.Control type="text" value={formData.handle} name="handle" required className="small-text" onChange={onChangeForm}/>
            </Form.Group>
              
            {confirm &&  <Form.Group id="code">
              <Form.Label className="gray-text">Code</Form.Label>
              <Form.Control type="text" value={formData.code} name="code" required className="small-text" onChange={onChangeForm}/>
            </Form.Group>
            }
            {loading ? <Button variant="primary button-radius" disabled className="w-100 mt-3">
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    Loading...
                  </Button> :  
                  
              confirm ?  
                      <div> <Button disabled={loading} className="w-100 mt-3 button-radius" onClick={handleSubmit}>
                        Submit
                        </Button> 
                      
                        <Button disabled={loading} className="w-100 mt-3 button-radius" onClick={cancelSignup}>
                          Cancel
                        </Button> 

                      </div>
                    :
                    <Button disabled={loading} className="w-100 mt-3 button-radius" onClick={handleSubmit}>
                      Sign Up
                    </Button>
                    
            }
          </Form> 
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2"> 

        <h6 className="mt-20 gray-light"> ALREADY HAVE AN ACCOUNT? <Link to="/login" className="white-link">LOGIN</Link> </h6>
      </div>
    </>
  )
}
