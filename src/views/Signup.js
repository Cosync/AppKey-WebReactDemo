import React, { useState, useEffect, useRef } from "react"
import { Form, Button, Card, Alert, Spinner, Container, Row, Col } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom" 
import { startRegistration, browserSupportsWebAuthn} from '@simplewebauthn/browser';
 
 

export default function Signup() {
 
  const { validateInput, signup, signupConfirm, signupComplete, logout} = useAuth()
  const [error, setError] = useState()
  const [message, setMessage] = useState()
  const [loading, setLoading] = useState(false) 
  const [confirm, setConfirm] = useState(false) 
  const [formData, setFormData] = useState({handle:"", firstName:"", lastName:""}) 
  const navigate = useNavigate() 
  const renderRef = useRef(false) 

  useEffect(() => { 

    if (!browserSupportsWebAuthn()) { 
      setError( 'It seems this browser does not support Passkey Authentication.');
      return;
    }

    if (renderRef.current === false){
     
      logout()

      return () => {
        renderRef.current = true
        console.log("AuthContext render clean up. ")
      }
    }
  }, [logout]); 


  const cancelSignup = async () => {
    setError("")
    setConfirm()
  }
 
  const handleSubmit = async () => {
    setError("")

    if(!formData.firstName || !formData.lastName || !formData.handle){
      setError("Please enter all fields")
      return;
    }

    if(confirm){ 
      signupCompleteHandler()
      return
    }

    if(!validateInput(formData.handle, false)){
      setError("Please enter a valid handle")
      return;
    }

    let result = await signup(formData)
    if (result.error){
      setError(result.error.message)
    }
    else {

      let attResp = await startRegistration({ optionsJSON : result});
      attResp.handle = formData.handle;
      

      let authn = await signupConfirm(attResp);
      if (authn.error) {
        setError(authn.error.message)
        return
      }
      
      setMessage(authn.message)
      console.log("signupConfirm authn ", authn) 

      setConfirm(true)
      
    }
  }



  const signupCompleteHandler = async() => {
    try {  
      setError()
      setMessage()
      
      if(!formData.code || !formData.handle){
        setError("Please enter all fields")
        return;
      } 

      let confResult = await signupComplete(formData);
      if (confResult.error) {
        setError(confResult.error.message)
      }
      else {
        navigate("/profile")
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
     <Container>
      <Row>
        <Col></Col>
        <Col xs={12}> 
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-center mb-4 form-title">Sign Up</h2>

             
              <div className="w-100 text-center mt-2 mb-4">
                <h6 className="mt-20 gray-light"> Welcome to the AppKey demo! Sign up with your email to create your passkey and log in effortlessly. Discover how simple and secure passwordless login can be—no passwords, just your passkey.</h6>
              </div>

              {message && <Alert variant="info">  {message} </Alert>} 
              {error && <Alert variant="danger">{error}</Alert>}

              <Form >

                <Form.Group id="firstname">
                  <Form.Label className="gray-text">First Name</Form.Label>
                  <Form.Control type="text" value={formData.firstName} name="firstName" required className="small-text" onChange={onChangeForm}/>
                </Form.Group>

                 <Form.Group id="lastname">
                  <Form.Label className="gray-text">Last Name</Form.Label>
                  <Form.Control type="text" value={formData.firstName} name="lastName" required className="small-text" onChange={onChangeForm}/>
                </Form.Group>

                <Form.Group id="email">
                  <Form.Label className="gray-text">User Handle</Form.Label>
                  <Form.Control type="text" value={formData.handle} name="handle" required className="small-text" autocorrect="off" autocapitalize="none" onChange={onChangeForm}/>
                </Form.Group>
                  
                {confirm &&  <Form.Group id="code" >
                  
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

          </Col>
          <Col> </Col>
        </Row>
      </Container>
      <div className="w-100 text-center mt-2"> 

        <h6 className="mt-20 gray-light"> ALREADY HAVE AN ACCOUNT? <Link to="/" className="white-link">LOGIN</Link> </h6>
      </div>
    </>
  )
}
