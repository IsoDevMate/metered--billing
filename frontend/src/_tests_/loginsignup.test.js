
import { describe, expect, test, vi } from 'vitest'
import { render,screen } from  "@testing-library/react"
import { useAuth } from '../components/context/context';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
const mockAuth = {
    currentUser: {
      uid: '12323232',
    },
  };

  vi.mock('../firebase', () => ({
    auth: mockAuth,
    db: {
      collection: vi.fn(),
      addDoc: vi.fn(),
    },
  }));

const mockSetUser = vi.fn();
vi.mock('../components/context/context', () => ({
  useAuth: () => ({
    setUser: mockSetUser,
  }),
}));

const mockAxiosPost = vi.fn();
vi.mock('axios', () => ({
  post: mockAxiosPost,
}));

vi.mock('firebase/firestore', () => ({
  setDoc: vi.fn(),
  doc: vi.fn()
}));

const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
}));

import LoginSignup from '../components/loginsignup';
import { auth, db, collection, addDoc, app } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { PuffLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


describe('Login successfully component', () => {
    test('return the user object',()=>{
        
    })
})