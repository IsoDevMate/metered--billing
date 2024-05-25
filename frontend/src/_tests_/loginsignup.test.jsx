import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from '@testing-library/user-event';
//import { UserEvent } from '@testing-library/user-event';
import { beforeEach } from 'node:test';
import LoginSignup from '../components/LoginSignup'
import { useAuth } from '../components/context/context'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { act } from 'react-dom/test-utils';

/*
vi.mock('browser', () => ({
  ...window,
  alert: vi.fn(),
}));
*/

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../components/context/context', () => ({
  useAuth: vi.fn(() => ({ setUser: vi.fn() })),
}))


vi.mock('axios')
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {},
  },
  db: {
    collection: vi.fn(),
    addDoc: vi.fn(),
  },
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  setDoc: vi.fn(),
  doc: vi.fn(),
}))

describe('LoginSignup tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders login form', () => {
    render(<LoginSignup />)
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })


  test('switches to sign up form', async () => {
    render(<LoginSignup />);
    await act(async () => {
      await userEvent.click(screen.getByText('Click here'));
    });
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });



test('logs in successfully', async () => {
  const setUser = vi.fn();
  const navigateMock = vi.fn();

  vi.mocked(useAuth).mockReturnValue({ setUser });
  vi.mocked(useNavigate).mockReturnValue(navigateMock);
  vi.mocked(signInWithEmailAndPassword).mockResolvedValue();
  vi.mocked(setDoc).mockResolvedValue();

  render(<LoginSignup />);

  await act(async () => {
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
  });

  await waitFor(() => {
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: expect.any(String) }));
    expect(setUser).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});

test('signs up successfully', async () => {
  const setUser = vi.fn();
  const navigateMock = vi.fn();

  vi.mocked(useAuth).mockReturnValue({ setUser });
  vi.mocked(useNavigate).mockReturnValue(navigateMock);
  vi.mocked(createUserWithEmailAndPassword).mockResolvedValue();
  vi.mocked(setDoc).mockResolvedValue();
  vi.mocked(axios.post).mockResolvedValue({ data: {} });

  render(<LoginSignup />);

  await act(async () => {
    await userEvent.click(screen.getByText('Click here'));
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
  });

  await waitFor(() => {
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: expect.any(String) }));
    expect(axios.post).toHaveBeenCalledWith('http://localhost:5050/users', expect.objectContaining({
      email: 'test@example.com',
      firebaseUid: expect.any(String),
    }));
    expect(setUser).toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
})