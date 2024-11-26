import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import "bootstrap/dist/css/bootstrap.min.css"
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Config } from "./config/Config" 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <GoogleOAuthProvider clientId={Config.GOOGLE_WEB_CLIENT_ID}>

    
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>  
            <App /> 
        </AuthProvider>
      </BrowserRouter>
    
    </React.StrictMode>

  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
