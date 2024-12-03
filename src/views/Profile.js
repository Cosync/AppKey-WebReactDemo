import React, { useState, useEffect } from "react"
import { Form, Button, Card, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"  
 
 

export default function Profile() {
 
  const {updateProfile, logout, currentUser, application} = useAuth()
  const [error, setError] = useState("") 
 
  const navigate = useNavigate() 
  const [profileData, setProfileData] = useState({})  
  const [showUserNameScreen, setShowUserNameScreen] = useState(false) 

  useEffect(() => {   
    try { 
      const catche = localStorage.getItem("appuser");
      let loggedInUser = JSON.parse(catche); 
      if (!loggedInUser || !loggedInUser.appUserId ) navigate("/login")
      else{
        setProfileData(loggedInUser)
        if(application.userNamesEnabled && (!loggedInUser.userName || loggedInUser.userName === '' )) setShowUserNameScreen(true)
      } 


    } catch (error) {
      navigate("/login")
    }
  }, [application.userNamesEnabled, currentUser, navigate]); 

   

  const handleLogout = async () => {
    logout()
    navigate("/login")
  }
 
  const handleSubmit = async (key) => { 

    let result = await updateProfile(key, profileData[key]) 
    if(!result || result.error){
      let message = result ? result.error.message : "Invalid Request";
      setError(message)
    }
    
    if(key === 'userName' && !result.error){
      setShowUserNameScreen(false)
    }

  }

  const onChangeValue = async (evt) => {

    setProfileData({
      ...profileData,
      [evt.target.name] : evt.target.value
    })
 
  }
 
 

  return (
    <>
      <Card className="text-center">
        <Card.Body>
          {currentUser && <h2 className="text-center mb-4 form-title">Welcome {currentUser.displayName}</h2> }

          {profileData && profileData.loginProvider === "handle"  && application.userNamesEnabled && <h5 className="text-center mb-4 form-title">Username: {profileData.userName}</h5> }

          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group id="displayName">
              <Form.Label className="gray-text">Display Name</Form.Label>
              <Form.Control type="text" value={profileData.displayName} name="displayName" required className="small-text" onChange={onChangeValue}/>
            </Form.Group>

            {showUserNameScreen && profileData.loginProvider === 'handle' ?
              <div> 
            
                <Form.Group id="userName">
                  <Form.Label className="gray-text">User Name</Form.Label>
                  <Form.Control type="text" value={profileData.userName} name="userName"  required className="small-text" onChange={onChangeValue}/>
                </Form.Group>

                <Button className="w-100 mt-3 button-radius" onClick={ () => handleSubmit('userName')}>
                  Update
                </Button>

              </div>
              :
            
              <Button className="w-100 mt-3 button-radius" onClick={ () => handleSubmit('displayName')}>
                Update
              </Button>

            }

           

            <Button  className="w-100 mt-3 button-radius" onClick={handleLogout}>
              Log Out
            </Button>

          </Form> 
        </Card.Body>
      </Card>
      
    </>
  )
}
