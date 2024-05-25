import React, { useState } from 'react'
import './css/LoginSignup.css'
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { PuffLoader } from 'react-spinners';
import { ForgotPassword } from './Resetpasword';
import axios from 'axios';
const LoginSignup = () => {
  
    const [state, setState] = useState('Login');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const MIN_PASSWORD_LENGTH = 8;


  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    navigate("/resetpassword");
  }

    const handlePasswordChange = (e) => {
      const value = e.target.value.trim();
      setPassword(value);
      setPasswordError(
        value.length >= MIN_PASSWORD_LENGTH
          ? ""
          : `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
      );
    };

    const handleEmailChange = (e) => {
      const value = e.target.value;
      setEmail(value);
      setEmailError(validateEmail(value) ? "" : "Invalid email format");
    };

    
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value.trim();
    setConfirmPassword(value);
    setConfirmPasswordError(value === password ? '' : 'Passwords do not match');
  };
  
  const createUserInMongoAndStripe = async (firebaseUser) => {
    try {
      const response = await axios.post('http://localhost:5050/api/users', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
      });
      console.log('User created in MongoDB and Stripe:', response.data);
    } catch (error) {
      console.error('Error creating user in MongoDB and Stripe:', error);
    }
  };
  const handleLogin = async () => {
    if (!validateEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage('Please enter a valid email and ensure the password is at least 8 characters long');
      return;
    }
  
    try {
      setLoading(true); 
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log('User logged in');
      alert('You have successfully logged in');
      setUser(user);
      navigate('/');
      setEmail('');
      setPassword('');
      
      await setDoc(doc(db, 'users', user.uid), { userId: user.uid });
     
    } catch (error) {
      console.log('Login error:', error.message);
      setErrorMessage('Login failed: invalid credentials');
    } finally {
      setLoading(false); 
    }
  };

    const handleSignUp = async () => {
      if (!validateEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
        setErrorMessage('Please enter a valid email and ensure the password is at least 8 characters long');
        return;
      }
    
      try {
        setLoading(true); 
        await createUserWithEmailAndPassword(auth, email, password);
        const user = auth.currentUser;
        console.log('User signed up');
      
        await setDoc(doc(db, 'users', user.uid), { userId: user.uid });
       await createUserInMongoAndStripe(user);
       console.log('User created in MongoDB and Stripe', user);
       
       setUser(user);
       alert('You have successfully signed up');
       setState('Login');
       setEmail('');
       setPassword('');
       setConfirmPassword('');

      } catch (error) {
        console.log('Sign up error:', error.message);
        setErrorMessage('Sign up failed: ' + error.message);
      } finally {
        setLoading(false); 
      }
    };

  return (
    <div className='loginsignup' >
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          <form action="">
            {state === 'Sign Up' ? <input type="text" placeholder='Your Name' /> : <></>}
            <input type="email" placeholder='Email Address' value={email} onChange={handleEmailChange} />
            <div className="password-field">
              <input
                type= 'password'
                placeholder='Password'
                value={password}
                onChange={handlePasswordChange}
              />
             
            </div>
            {state === 'Sign Up' && (
              <div className="password-field">
                <input
                  type='password'
                  placeholder='Confirm Password'
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                />
                
              </div>
            )}
            {errorMessage && <p className="error-message" style={{ color: 'red' }}>{errorMessage}</p>}
            {emailError && <p className="error-message">{emailError}</p>}
            {passwordError && <p className="error-message">{passwordError}</p>}
            {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
          </form>
        </div>
        <button onClick={state === 'Login' ? handleLogin : handleSignUp} disabled={loading}>
          {loading ? <PuffLoader color="#EBF0EF" /> : state === 'Login' ? 'Login' : 'Sign Up'}
        </button>
        {state === 'Login' && (
          <div className="loginsignup-forgot">
            <p>Forgot your password?</p>
          </div>
        )}
        {state === 'Sign Up' ? (
          <p className="loginsignup-login">
            Already have an account ?<span onClick={() => setState('Login')}> Login</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Create an account <span onClick={() => setState('Sign Up')}>Click here</span>
          </p>
        )}
        <div className="loginsignup-agree">
          <input type="checkbox" name='agree' id='agree' />
          <p>By continuing I agree to the terms of use and privacy policy</p>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup