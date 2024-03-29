import { Navbar } from "./components/navbar/Navbar";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginSignup from "./components/LoginSignup";
import Success from "./components/Success";
import Failed from "./components/Failed";
import { Adminupload } from './components/upload';
import {ForgotPassword} from './components/Resetpasword'
import { Dashboard } from "./components/Dashboard";
export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route  exact path= '/'element= {<Adminupload />}/>
          <Route  path= '/dashboard' element= {<Dashboard />}>
            <Route path=':userId' element={<Dashboard />}/>
          </Route>
          <Route path="/forgot-password" element={<ForgotPassword />}/>
          <Route path= '/login'element= {<LoginSignup/>}/>
          <Route path= '/success'element= {<Success/>}/>
          <Route path= '/failed'element= {<Failed/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}