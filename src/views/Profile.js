import React, { useState, useEffect, useRef } from "react"
import { Form, Button, Card, Alert, ListGroup, Badge, Modal, Row, Col } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { startRegistration, startAuthentication} from '@simplewebauthn/browser';


export default function Profile() {

  const { getAppUser, updateProfile, updateUserName, logout, currentUser, application, verify, verifyComplete, addPasskey, addPasskeyComplete, updatePasskey, removePasskey } = useAuth()
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [modalState, setModalState] = useState({ editKey: false, deleteKey: false, verify: false })
  const navigate = useNavigate()
  const [profileData, setProfileData] = useState({})
  const [selectedKey, setSelectedKey] = useState()
  const [addingKey, setAddingKey] = useState(false)
  const [editingKey, setEditingKey] = useState(false)
  const [deletingKey, setDeletingKey] = useState(false)
  const [authenticators, setAuthenticators] = useState([])
  const [showUserNameScreen, setShowUserNameScreen] = useState(false)
  const renderRef = useRef(false)

  useEffect(() => {
    try {

      if (currentUser) {
        setProfileData(currentUser)
        if (application.userNamesEnabled && (!currentUser.userName || currentUser.userName === '')) setShowUserNameScreen(true)
        setAuthenticators(currentUser.authenticators)
      } 
    
    } catch (error) {
      navigate("/login")
    }
  }, [application.userNamesEnabled, currentUser, navigate]);

  useEffect(() => {

    async function fetchUser() {
      let user = await getAppUser();
      if (!user || !user.appUserId) navigate("/login")
    }

    if (renderRef.current === false) {

      const catche = localStorage.getItem("appuser");
      let loggedInUser = JSON.parse(catche);
      if (!loggedInUser || !loggedInUser.appUserId) navigate("/login")

      fetchUser()

      return () => {
        renderRef.current = true

      }
    }

  }, [getAppUser, navigate]);


  const handleLogout = async () => {
    logout()
    navigate("/login")
  }

  const handleSubmit = async (key) => {
    let result = {}
    
    if (key === 'userName') result = await updateUserName(profileData.userName)
    else result = await updateProfile(profileData)
    
    if (!result || result.error) {
      let message = result ? result.error.message : "Invalid Request";
      showMessage("error", message)
    }

    if (key === 'userName' && !result.error) {
      setShowUserNameScreen(false)
    }

  } 

  const handleUpdatePasskey = async () => { 
    setEditingKey(true)
    toggleModal("verify");

  }

  const handleVerify = async () => {
    try {
        
    
      toggleModal("verify");

      let result = await verify(currentUser.handle);
      if (result.error){
        showMessage("error", result.error.message)
        return;
      } 

      let asseResp = await startAuthentication({optionsJSON:result}); 
      asseResp.handle = currentUser.handle;
      let authn = await verifyComplete(asseResp);

      if (authn.error) {
        showMessage("error", authn.error.message)
        return
      }

      console.log("global user ", global.appKeyUser);


      if (addingKey){
        let result = await addPasskey();
        if (result.error){
          showMessage("error", result.error.message)
          return;
        }

        let attResp = await startRegistration({ optionsJSON : result}); 
        attResp.handle = currentUser.handle;

        console.log("attResp ", attResp);

        let user = await addPasskeyComplete(attResp);
        if (user.error){
          showMessage("error", user.error.message)
          return;
        }

        setAuthenticators(user.authenticators)
     
      }
      else if (editingKey){

        console.log('selectedKey = ', selectedKey)

        let user = await updatePasskey( selectedKey.id, selectedKey.name);
        if (user.error){
          showMessage("error", user.error.message)
          return;
        }
        setAuthenticators(user.authenticators)

      }
      else if (deletingKey){
        let user = await removePasskey(selectedKey.id);
        if (user.error){
          showMessage("error", user.error.message)
          return;
        }

        setAuthenticators(user.authenticators)
      
      }

      setSelectedKey()
      showMessage("success", "Success")
        
    } catch (error) {
      if(error.message.indexOf("https://www.w3.org/TR/webauthn-2") > 0) showMessage("error","The operation either timed out or was not allowed.")
      else showMessage("error", error.message)
    }
    

  }




  const handleCancelUpdatePasskey = async () => { 
    setSelectedKey() 
  }


  const onChangeValue = async (evt) => {

    setProfileData({
      ...profileData,
      [evt.target.name]: evt.target.value
    })

  }


  const onChangeKeyValue = async (evt) => {

    setSelectedKey({
      ...selectedKey,
      [evt.target.name]: evt.target.value
    })

  }


  const handleAddPasskey = async () => {
    setSelectedKey()
    toggleModal("verify");

    setAddingKey(true);
    setEditingKey(false);
    setDeletingKey(false);
   
  }

  const editPasskey = async (key) => {
    setSelectedKey(key)

    setEditingKey(true)
    setAddingKey(false)
    setDeletingKey(false)
  }


  const deletePasskey = async (key) => {
    setDeletingKey(true)
    setAddingKey(false)
    setEditingKey(false)

    setSelectedKey(key) 
    toggleModal("verify")
  }



  const toggleModal = (type, close) => {
    setModalState({ ...modalState, [type]: !modalState[type] })
  }

  const showMessage = (type, text) => {
    if (type === "error"){
      setError(text);
      setSuccessMessage()
    } 
    else{
      setSuccessMessage(text)
      setError();
    } 
  }

  return (
    <>
      <Card className="text-center">
        <Card.Body>

          <div className="w-100 text-center mt-2 mb-4">
            <h6 className="mt-20 gray-light">Success! You’ve Logged into the AppKey Demo. Congratulations on using your passkey—how simple was that? No passwords, no MFA, no cheat sheets—just effortless, secure login. Sign up for AppKey today to bring this seamless passwordless authentication to your mobile or web app!</h6>
          </div>

          {currentUser && <h2 className="text-center mb-4 form-title">Welcome {currentUser.firstName} {currentUser.lastName}</h2>}

          {profileData && profileData.loginProvider === "handle" && application.userNamesEnabled && <h5 className="text-center mb-4 form-title">Username: {profileData.userName}</h5>}

          {
          error ? <Alert variant="danger">{error}</Alert>
          :
          successMessage && <Alert variant="success">{successMessage}</Alert>
          }
          

          <Form>
            <Form.Group as={Row} className="mb-3" id="firstName">
              <Form.Label column sm={3} className="gray-text">First Name</Form.Label>
              <Col sm={9}>
                <Form.Control type="text" value={profileData.firstName} name="firstName" required className="small-text" onChange={onChangeValue} />
              </Col>
            </Form.Group>

             <Form.Group as={Row} className="mb-3" id="lastName">
              <Form.Label column sm={3} className="gray-text">Last Name</Form.Label>
              <Col sm={9}>
                <Form.Control type="text" value={profileData.lastName} name="lastName" required className="small-text" onChange={onChangeValue} />
              </Col>
            </Form.Group>

            {showUserNameScreen && profileData.loginProvider === 'handle' ?
              <div>

                <Form.Group as={Row}  className="mb-3" id="userName">
                  <Form.Label column sm={3} className="gray-text">User Name</Form.Label>

                  <Col sm={9}>
                    <Form.Control type="text" value={profileData.userName} name="userName" required className="small-text" autocorrect="off" autocapitalize="none" onChange={onChangeValue} />
                  </Col>
                </Form.Group>

                <Button className="w-100 mt-3 button-radius" onClick={() => handleSubmit('userName')}>
                  Update
                </Button>

              </div>
              :

              <Button className="w-100 mt-3 button-radius" onClick={() => handleSubmit('name')}>
                Update
              </Button>

            }

            {profileData.loginProvider === 'handle' && authenticators.length > 0 &&
              <div>
                <div className="w-100 mt-4 mb-4">
                  <h6 className="mt-20 gray-light">Manage Passkeys:</h6>
                </div>
                {authenticators.map(function (key, index) {
                  return (
                    <ListGroup>

                      <ListGroup.Item    >

                        {selectedKey && selectedKey.id === key.id && editingKey?
                          <Form>
                            <Form.Group as={Row} controlId="keyName">
                              <Form.Label column sm={3} >Enter Key Name </Form.Label>
                              <Col sm={9}>
                                <Form.Control type="text" placeholder="Enter Key Name" name="name" value={selectedKey.name} onChange={onChangeKeyValue}/>
                              </Col>
                            </Form.Group>
                          </Form>
                          :

                          <Form>
                            <Row>
                              <Col xs={7}>
                                <span className="mr-3">{key.name}</span>
                              </Col>

                              <Col>
                                <Badge bg="primary" pill onClick={() => editPasskey(key)} style={{ cursor: 'pointer' }}>
                                  <i class="bi bi-pencil-square"></i>
                                </Badge>
                              </Col>

                              {authenticators.length > 1 &&
                                <Col>
                                  <Badge bg="danger" pill onClick={() => deletePasskey(key)} style={{ cursor: 'pointer' }}>
                                    <i class="bi bi-trash3"></i>
                                  </Badge>
                                </Col>
                              }

                            </Row>
                          </Form>



                        }


                      </ListGroup.Item>
                    </ListGroup>
                  )
                })

                }

                {selectedKey && selectedKey.id?
                  <div>
                    <Button variant="success" className="w-100 mt-3 button-radius" onClick={() => handleUpdatePasskey()}>
                      Update Passkey
                    </Button>

                    <Button variant="secondary" className="w-100 mt-3 button-radius" onClick={() => handleCancelUpdatePasskey()}>
                      Cancel
                    </Button>
                  </div>
                  :
                  <Button className="w-100 mt-3 button-radius" onClick={() => handleAddPasskey()}>
                    Add Passkey
                  </Button>
                }
              </div>


            }


            <div className="w-100 mt-5">
              <h6 className="mt-20 gray-light">Logout:</h6>
            </div>

            <Button variant="danger" className="w-100  button-radius" onClick={handleLogout}>
              Log Out
            </Button>

          </Form>
        </Card.Body>
      </Card>

      <Modal show={modalState.verify} onHide={() => toggleModal("verify")}>
        <Modal.Header closeButton>
          <Modal.Title>Verify Passkey</Modal.Title>
        </Modal.Header>
        {selectedKey ?  <Modal.Body>Please verify your account before manage this passkey '{selectedKey.name}'.</Modal.Body> :  <Modal.Body>Please verify your account before adding new passkey.</Modal.Body>}
       
        <Modal.Footer>
          <Button variant="secondary" onClick={() => toggleModal("verify")}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleVerify()}>
            Verify
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  )
}
