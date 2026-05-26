// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthPage from '../pages/AuthPage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders login form by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Welcome back! Sign in to continue.')).toBeDefined();
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeDefined();
    expect(screen.queryByPlaceholderText('John Doe')).toBeNull(); // Full Name should not be visible
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeDefined();
  });

  it('toggles to register form', () => {
    render(<AuthPage />);
    
    // Click "Sign up" toggle
    const signUpToggle = screen.getByRole('button', { name: 'Sign up' });
    fireEvent.click(signUpToggle);

    expect(screen.getByText('Create your account to get started.')).toBeDefined();
    expect(screen.getByPlaceholderText('John Doe')).toBeDefined(); // Full Name should be visible
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeDefined();
  });

  it('shows error if fields are empty on login submit', async () => {
    render(<AuthPage />);
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    
    // Submit without filling anything
    fireEvent.click(submitBtn);
    expect(screen.getByText('Email is required')).toBeDefined();
    expect(mockLogin).not.toHaveBeenCalled();

    // Fill email but no password
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    fireEvent.click(submitBtn);
    expect(screen.getByText('Password is required')).toBeDefined();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows error if password is too short', async () => {
    render(<AuthPage />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 characters'), '1234567');
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows error if full name is missing on register', async () => {
    render(<AuthPage />);
    // Toggle to register
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 characters'), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Full Name is required')).toBeDefined();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls login on successful submit and navigates', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<AuthPage />);

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 characters'), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('calls register on successful submit and navigates', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    render(<AuthPage />);

    // Toggle to register
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'John Smith');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 characters'), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@test.com', 'password123', 'John Smith');
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('displays error from auth context on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<AuthPage />);

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 8 characters'), 'wrongpass');
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
