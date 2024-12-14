
 
 
import React, { useRef, useContext, useState, useEffect } from "react"
import { Config } from "../config/Config" 
import AppKeyWebAuthn from "appkey-webauthn"
 

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

  const appKeyAuth = new AppKeyWebAuthn({appToken: Config.APP_TOKEN, apiUrl:Config.REST_API}).getInstance();

  useEffect(() => {

    if (renderRef.current === false){  
      

      const loggedInUser = localStorage.getItem("appuser");
      console.log("AuthContext loggedInUser ", loggedInUser)

      setLoadingSuccessData()

      if (loggedInUser) {

        try {
          const foundUser = JSON.parse(loggedInUser); 
          setCurrentUser(foundUser)
          appKeyAuth.auth.user = foundUser;

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

  async function apiRequest(func, data, showLoading = true, file){ 

      try {

        const userCache = localStorage.getItem("appuser");  
        const loggedInUser = JSON.parse(userCache);

        console.log('apiRequest loggedInUser ', loggedInUser)

        setRequestError(null)

        if(showLoading) setLoading(true)  
        let result;

        console.log('apiRequest func ', func)
        console.log('apiRequest data ', data)
        
        switch (func) {
          case 'app':
            result = await appKeyAuth.app.getApplication()
            break;

          case 'signup':
            result = await appKeyAuth.auth.signup(data)
            break;
          case 'signupConfirm':
            result = await appKeyAuth.auth.signupConfirm(data) 
            break;
          case 'signupComplete':
            result = await appKeyAuth.auth.signupComplete(data)
            let user = appKeyAuth.auth.user;
            console.log('signupComplete user ', user)

            break;
          case 'login':
              result = await appKeyAuth.auth.login(data)
              break;
          case 'loginComplete':
              result = await appKeyAuth.auth.loginComplete(data)
              break;
          case 'socialLogin':
            result = await appKeyAuth.auth.socialLogin(data)
            break;
          case 'socialSignup':
            result = await appKeyAuth.auth.socialSignup(data)
            break;
          case 'loginAnonymous':
            result = await appKeyAuth.auth.loginAnonymous(data)
            break;
          case 'loginAnonymousComplete':
            result = await appKeyAuth.auth.loginAnonymousComplete(data)
            break;
          case 'userNameAvailable':
              result = await appKeyAuth.profile.userNameAvailable(data)
              break; 
          case 'setUserName':
            result = await appKeyAuth.profile.setUserName(data)
            break; 
          case 'updateProfile':
            result = await appKeyAuth.profile.updateProfile(data)
            break;
            
          case 'verify':
            result = await appKeyAuth.auth.verify(data)
            break;
          
          case 'verifyComplete':
            result = await appKeyAuth.auth.verifyComplete(data)
            break;
              

          default:
            break;
        } 

        console.log("apiRequest result ", result)
        
        if (result && result.code){
            setRequestError(result);
            if(result.code === 405) logout() 
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
    let app =  await apiRequest("app", null, false)   
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
    return await apiRequest("signup", data, true)   

  }



  async function signupConfirm(attResp) { 
    let result =  await apiRequest("signupConfirm", attResp, true)  
    if(result['signup-token'] !== undefined) setSignupToken(result['signup-token'])
    return result
  }



  async function signupComplete(data) {
    try { 
      data.signupToken = signupToken;
      let response = await apiRequest("signupComplete", data, true)

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

      let response = await apiRequest("socialLogin",  { token: token, provider:provider })
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

  async function socialSignup(token, handle, provider, displayName) {
    try { 

      let response = await apiRequest("socialSignup",  { token: token, handle:handle, provider:provider, displayName:displayName })
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

      return await apiRequest("login", { handle: handle }, true)

       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  async function loginComplete(assert) {
    try {

      let response = await apiRequest("loginComplete", assert, true)

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

      return await apiRequest("loginAnonymous", { handle: handle }, true)

       
    } catch (error) {
      console.log(error)
      return {error:error}
    }
  }


  async function loginAnonymousComplete(assert) {
    try {

      let response = await apiRequest("loginAnonymousComplete", assert, true)

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
    if(key === 'userName') response = await apiRequest("setUserName", {'userName':value}, true)
    else response = await apiRequest("updateProfile", {'displayName':value}, true)
  
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
    setSignupToken();
    localStorage.clear();

    appKeyAuth.auth.logout();

    return true;
  }
  

  const verify = async (handle) => {
    return await apiRequest("verify", {handle:handle}, true)  
      
  }

  const verifyComplete = async (data) => {
    return await apiRequest("verifyComplete", data, true)   
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
