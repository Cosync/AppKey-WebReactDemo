 
import './App.css'; 
import { Routes, Route } from "react-router-dom"  
import Login from './views/Login';
import logo from './assets/site_logo_h.svg' ;
import cosynclogo from './assets/cosync_bricks.svg' ;
import Signup from './views/Signup';
import { useAuth } from "./contexts/AuthContext"
import { Modal, Spinner, Row, Col } from "react-bootstrap"
import Profile from './views/Profile';

const reload = () => window.location.reload();

function App() {

  const { loading } = useAuth()


  return (
    <div className="App mt-3">

      <Row >
        <Col > </Col>
        <Col xs={12} md={10} lg={6}>
            <Row>
              <Col style={{disply:'flex', textAlign:'left'}}> <a href='https://cosync.io' target='_blank' rel="noreferrer"> <img src={cosynclogo} alt="Cosync Logo" width={100}/> </a> </Col>
              <Col style={{disply:'flex', textAlign:'right'}}> <a href='https://appkey.info' target='_blank' rel="noreferrer">  <img src={logo} alt="AppKey Logo" width={100}/> </a> </Col> 
            </Row>
            
            <Routes>
                <Route path="/apple-app-site-association" onEnter={reload} />
                <Route path="/login" element={<Login/>} />  
                <Route path="/signup" element={<Signup/>} />  
                <Route path="/profile" element={<Profile/>} />  
                <Route path="*" element={<Login/>} /> 
            </Routes>
          
          </Col>
        <Col> </Col>
      </Row>

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
