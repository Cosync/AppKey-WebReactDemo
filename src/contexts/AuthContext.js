
 
 
import React, { useRef, useContext, useState, useEffect } from "react"
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
  const [signupToken, setSignupToken] = useState() 
  const renderRef = useRef(false)  

  useEffect(() => {

    if (renderRef.current === false){ 

      
      getApplication()

      const loggedInUser = localStorage.getItem("appuser");
      console.log("AuthContext loggedInUser ", loggedInUser)

      setLoadingSuccessData()

      if (loggedInUser) {

        try {
          const foundUser = JSON.parse(loggedInUser); 
          setCurrentUser(foundUser)

        } catch (error) {
          console.log("AppDetail render error. ", error)
        }
      
      }

      return () => {
          renderRef.current = true
          console.log("AuthContext render clean up. ")
      }
    } 
   
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function apiRequest(method, path, data, showLoading = true, file){ 

     
      try {

        const userCache = localStorage.getItem("appuser");  
        

        const loggedInUser = JSON.parse(userCache);  

      
        console.log('apiRequest loggedInUser ', loggedInUser)

        setRequestError(null)

        if(showLoading) setLoading(true)  

          let requestOptions = {
              method: method || 'POST',
              headers: { } 
          };

          if (loggedInUser && loggedInUser !== undefined) requestOptions.headers["access-token"] = loggedInUser["access-token"] 
          else if (signupToken && signupToken !== undefined) requestOptions.headers["signup-token"] = signupToken
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
    if(app && !app.error) setApp(app)
      
    return app;
  }



  const validateInput = (value, login = true) => {
    if (!value) return false;
    else if (value === "") return false;
    else if (login && application.userNamesEnabled) return true;
    else if(application.handleType === "phone") return validatePhone(value);
    else if(application.handleType === "email") return validateEmail(value);
    else return true;
}


const validateEmail = (email) => {
    return (email.indexOf("@") > 0 && email.indexOf(".") > 2 &&  email.indexOf(".") < email.length - 1)
}


const validatePhone = (phone) => {
    
    var regex  = /^\+[0-9\s]{8,16}$/;
    let val = phone.match(regex);
    return val;
}

  async function signup(data) {
    setSignupToken()
    return await apiRequest("POST", "appuser/signup", data, true)   

  }



  async function signupConfirm(attResp) { 
    let result =  await apiRequest("POST", "appuser/signupConfirm", attResp, true)  
    if(result['signup-token'] !== undefined) setSignupToken(result['signup-token'])
    return result
  }



  async function signupComplete(data) {
    try { 

      let response = await apiRequest("POST", "appuser/signupComplete", data, true)

      if (!response.error){
        setCurrentUser(response)
        localStorage.setItem('appuser', JSON.stringify(response));
        setSignupToken()
      }

      return response;

    } catch (error) {
      return  {error:error}
    }
  }
 

  async function socialLogin(token, provider) {
    try { 

      let response = await apiRequest("POST", "appuser/socialLogin", { token: token, provider:provider })
      if (!response.error) {
 
        localStorage.setItem('appuser', JSON.stringify(response));
        setCurrentUser(response) 
      } 

      return response;
       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }

  async function socialSignup(token, handle, provider) {
    try { 

      let response = await apiRequest("POST", "appuser/socialSignup", { token: token, handle:handle, provider:provider })
      if (!response.error) {
 
        localStorage.setItem('appuser', JSON.stringify(response));
        setCurrentUser(response) 
      } 

      return response;
       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  


  async function login(handle, clear = true) {
    try {

      if(clear) localStorage.clear(); 

      return await apiRequest("POST", "appuser/login", { handle: handle }, true)

       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  async function loginComplete(assert) {
    try {

      let response = await apiRequest("POST", "appuser/loginComplete", assert, true)

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



  async function loginAnonymous(handle, clear = true) {
    try {

      if(clear) localStorage.clear(); 

      return await apiRequest("POST", "appuser/loginAnonymous", { handle: handle }, true)

       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  async function loginAnonymousComplete(assert) {
    try {

      let response = await apiRequest("POST", "appuser/loginAnonymousComplete", assert, true)

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


 

  async function updateProfile(key, value){
    let response;
    if(key === 'userName') response = await apiRequest("POST", "appuser/setUserName", {'userName':value}, true)
    else response = await apiRequest("POST", "appuser/updateProfile", {'displayName':value}, true)
  
    if (!response.error){ 
      updateUserCache(key, value) 
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
    setSignupToken()
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
    validateInput,
    getApplication,
    verify,
    verifyComplete,
    setLoadingSuccessData,
    setRequestError,
    socialLogin,
    socialSignup,
    login,  
    loginComplete,
    signup,
    signupConfirm,
    signupComplete,
    logout, 
    updateProfile,
    loginAnonymous,
    loginAnonymousComplete,
    
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
