
 
 
import React, { useContext, useState, useEffect } from "react"
import { Config } from "../config/Config" 
 

const AuthContext = React.createContext()
 
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {

  
  const [loading, setLoading] = useState(false) 
  const [application, setApp] = useState({})
  const [requestSuccess, setLoadingSuccessData] = useState() 
  const [requestError, setRequestError] = useState()
  const [currentUser, setCurrentUser] = useState() 
   
  var loggedInUser
 

  useEffect(() => {
    const loggedInUser = localStorage.getItem("appuser");
    setLoadingSuccessData()
    if (loggedInUser) {
      try {
        const foundUser = JSON.parse(loggedInUser); 
        setCurrentUser(foundUser)
 
      } catch (error) {
        
      }
     
    }

    console.log("AuthContext loggedInUser ", loggedInUser)
    
  }, [])

  async function apiRequest(method, path, data, showLoading = true, file){ 

      const userCache = localStorage.getItem("appuser"); 
    
      if (userCache) {
        loggedInUser = JSON.parse(userCache); 
      }  

      setRequestError(null)
      if(showLoading) setLoading(true) 

      try {
          let requestOptions = {
              method: method || 'POST',
              headers: { } 
          };

          if (loggedInUser !== undefined) requestOptions.headers["access-token"] = loggedInUser["access-token"] 
          else requestOptions.headers["app-token"] = Config.APP_TOKEN

          if (method !== "GET" && method !== "DELETE"){
              requestOptions.body = JSON.stringify(data)
          }
          

          if (file) {
            const formData = new FormData();  
            formData.append('file', file); 
            requestOptions.body = formData
          }
          else {
            requestOptions.headers['Content-Type'] = 'application/json'     
          }

          let endpoint = `${Config.REST_API}/api/${path}`

          console.log("apiRequest endpoint ", endpoint)

          const response = await fetch(endpoint, requestOptions); 
          let result = await response.json();

          console.log("apiRequest result ", result)
          
          if (response.status !== 200){
              setRequestError(result);
              if(result.code === 405) logout()
              console.log("apiRequest setRequestError ", result)
              return {error:result}
          } 
          else{
              return result;
          } 


      } catch (error) {
           console.log("apiRequest error ", error)
          setRequestError(error)
          return {error:error}
      }
      finally{
          setLoading(false)
      }
  }
 
  async function getApplication() {
    let app =  await apiRequest("GET", "appuser/app", null, false)   
    if(!app.error) setApp(app)
  }

  async function signup(data) {

    return await apiRequest("POST", "appuser/signup", data, true)   

  }



  async function signupConfirm(handle, code) { 
    return await apiRequest("POST", "appuser/signupConfirm", { handle: handle,  code:code }, false)  
  }



  async function signupComplete(authData) {
    try { 

      let response = await apiRequest("POST", "appuser/signupComplete", authData, false)

      if (!response.error){
        setCurrentUser(response)
        localStorage.setItem('appuser', JSON.stringify(response));
      } 

     
      
      return response;

    } catch (error) {
      return  {error:error}
    }
  }
 

  async function login(handle, clear = true) {
    try {

      if(clear) localStorage.clear(); 

      return await apiRequest("POST", "appuser/login", { handle: handle }, false)

       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  async function loginComplete(assert) {
    try {

      let response = await apiRequest("POST", "appuser/loginComplete", assert, false)

      if (!response.error) {
 
        localStorage.setItem('appuser', JSON.stringify(response));
        setCurrentUser(response) 
      } 

      return response;

    } catch (error) {
      console.error(error)
      return {error:error}
    }
  }


 

  async function updateProfile(displayName){
    let response = await apiRequest("POST", "appuser/updateProfile", {displayName:displayName}, false)
    if (!response.error){ 
      updateUserCache('displayName', displayName) 
    } 

    return response;
  }

  function updateUserCache(key, value) {

    const loggedInUser = localStorage.getItem("appuser");
    if (loggedInUser) {
      try {

        let foundUser = JSON.parse(loggedInUser); 
        if (key === 'replace') foundUser = value
        else foundUser[key] = value

        console.log("updateUserCache data ", foundUser)


        localStorage.setItem('appuser', JSON.stringify(foundUser));   

        if(key !== 'replace') {
          setCurrentUser({
            ...currentUser,
            [key]:value 
          })
        }
        else setCurrentUser(foundUser)

      } catch (error) {
        console.error("cannot get user catche..error ", error)
      } 
    }
    else {
      console.error("cannot get user catche...")
    }
  }
 

  function logout() { 
    setCurrentUser(); 
    localStorage.clear();
    return true;
  }
  

  const verify = async () => {
    return await apiRequest("POST", `appuser/verify`, {}, true)  
      
  }

  const verifyComplete = async (data) => {
    return await apiRequest("POST", `appuser/verifyComplete`, data, true)   
  }

  

  const value = {
    application,
    currentUser, 
    requestSuccess,
    requestError,
    loading,
    getApplication,
    verify,
    verifyComplete,
    setLoadingSuccessData,
    setRequestError,
    login,  
    loginComplete,
    signup,
    signupConfirm,
    signupComplete,
    logout, 
    updateProfile,
   
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
