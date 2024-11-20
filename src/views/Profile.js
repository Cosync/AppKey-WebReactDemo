import React, { useState, useEffect } from "react"
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"  
 
 

export default function Profile() {
 
  const { updateProfile, logout, currentUser} = useAuth()
 
 
  const navigate = useNavigate() 

  const [displayName, setDisplayName] = useState("") 

  useEffect(() => {   
    try { 
      const catche = localStorage.getItem("appuser");
      let loggedInUser = JSON.parse(catche); 
      if (!loggedInUser || !loggedInUser.appUserId ) navigate("/login")
      else setDisplayName(loggedInUser.displayName)

    } catch (error) {
      navigate("/login")
    }
  }, []); 

  const handleLogout = async () => {
    logout()
    navigate("/login")
  }
 
  const handleSubmit = async () => { 
    updateProfile(displayName) 
  }

  const onChangeValue = async (evt) => {
    setDisplayName(evt.target.value)
  }
 
 

  return (
    <>
      <Card className="text-center">
        <Card.Body>
          {currentUser && <h2 className="text-center mb-4 form-title">Welcome {currentUser.displayName}</h2> }
         
       
          <Form>
            <Form.Group id="displayName">
              <Form.Label className="gray-text">Display Name</Form.Label>
              <Form.Control type="text" value={displayName}  required className="small-text" onChange={onChangeValue}/>
            </Form.Group>

            <Button className="w-100 mt-3 button-radius" onClick={handleSubmit}>
              Update
            </Button>

            <Button  className="w-100 mt-3 button-radius" onClick={handleLogout}>
              Log Out
            </Button>

          </Form> 
        </Card.Body>
      </Card>
      
    </>
  )
}
