 
import './App.css'; 
import { Routes, Route } from "react-router-dom"  
import Login from './views/Login';
import logo from './assets/site_logo_h.svg' ;
import Signup from './views/Signup';
import { useAuth } from "./contexts/AuthContext"
import { Modal, Spinner } from "react-bootstrap"
import Profile from './views/Profile';

const reload = () => window.location.reload();
function App() {

  const { loading } = useAuth()


  return (
    <div className="App">

      <div className="row">
        <div className="col-3"> </div>
        <div className="col-6">
          
            <img src={logo} alt="AppKey Logo" width={170}/> 
 
            
            <Routes>
                <Route path="/apple-app-site-association" onEnter={reload} />
                <Route path="/login" element={<Login/>} />  
                <Route path="/signup" element={<Signup/>} />  
                <Route path="/profile" element={<Profile/>} />  
                <Route path="*" element={<Login/>} /> 
            </Routes>
          
        </div>
        <div className="col-3"> </div>
      </div>

      <Modal show={loading} size='sm'>
        <Modal.Header >
          <Modal.Title>Loading...</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className='center'>
            <Spinner as="span" animation="border" size="md" role="status" aria-hidden="true"/>
          </div> 

        </Modal.Body>
         
      </Modal>


    </div>
  );
}

export default App;
