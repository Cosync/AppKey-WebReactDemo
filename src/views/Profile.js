import React, { useState, useEffect, useRef } from "react"
import { Form, Button, Card, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"  
 
 

export default function Profile() {
 
  const {getAppUser, updateProfile, logout, currentUser, application} = useAuth()
  const [error, setError] = useState("") 
 
  const navigate = useNavigate() 
  const [profileData, setProfileData] = useState({})  
  const [showUserNameScreen, setShowUserNameScreen] = useState(false) 
  const renderRef = useRef(false) 

  useEffect(() => {   
    try { 
     
      if (currentUser) { 
        setProfileData(currentUser)
        if(application.userNamesEnabled && (!currentUser.userName || currentUser.userName === '' )) setShowUserNameScreen(true)
      }  

    } catch (error) {
      navigate("/login")
    }
  }, [application.userNamesEnabled, currentUser, navigate]); 

  useEffect(() => {   

    async function fetchUser() {
      let user = await getAppUser(); 
      if (!user || !user.appUserId ) navigate("/login")
    }

    if (renderRef.current === false) { 

      const catche = localStorage.getItem("appuser");
      let loggedInUser = JSON.parse(catche); 
      if (!loggedInUser || !loggedInUser.appUserId ) navigate("/login")

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

          <div className="w-100 text-center mt-2 mb-4">  
              <h6 className="mt-20 gray-light">Success! You’ve Logged into the AppKey Demo. Congratulations on using your passkey—how simple was that? No passwords, no MFA, no cheat sheets—just effortless, secure login. Sign up for AppKey today to bring this seamless passwordless authentication to your mobile or web app!</h6>
          </div> 

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
                  <Form.Control type="text" value={profileData.userName} name="userName"  required className="small-text" autocorrect="off" autocapitalize="none" onChange={onChangeValue}/>
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
