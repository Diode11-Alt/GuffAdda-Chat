import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CallScreen from '../components/CallScreen';
import { io } from 'socket.io-client';
import '@testing-library/jest-dom';

// Mock Socket.io
jest.mock('socket.io-client', () => {
  const mSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    io: jest.fn(() => mSocket),
  };
});

// Mock MediaDevices
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [{ stop: jest.fn() }],
});
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true
});

// Mock RTCPeerConnection
const mockAddIceCandidate = jest.fn();
const mockAddTrack = jest.fn();
const mockCreateOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'fake-offer' });
const mockCreateAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'fake-answer' });
const mockSetLocalDescription = jest.fn().mockResolvedValue(undefined);
const mockSetRemoteDescription = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn();

class MockRTCPeerConnection {
  addIceCandidate = mockAddIceCandidate;
  addTrack = mockAddTrack;
  createOffer = mockCreateOffer;
  createAnswer = mockCreateAnswer;
  setLocalDescription = mockSetLocalDescription;
  setRemoteDescription = mockSetRemoteDescription;
  close = mockClose;
  remoteDescription = null;
  iceConnectionState = 'new';
  
  // Handlers
  onicecandidate = null;
  oniceconnectionstatechange = null;
  ontrack = null;
}

global.RTCPeerConnection = MockRTCPeerConnection as any;
global.RTCIceCandidate = jest.fn().mockImplementation((init) => init) as any;
global.RTCSessionDescription = jest.fn().mockImplementation((init) => init) as any;

describe('CallScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly without being in a call', () => {
    render(<CallScreen socketUrl="http://localhost:3000" userId="user1" />);
    expect(screen.getByText('Video Call')).toBeInTheDocument();
    expect(screen.getByText('Start Call')).toBeInTheDocument();
  });

  it('starts a call correctly', async () => {
    render(<CallScreen socketUrl="http://localhost:3000" userId="user1" />);
    
    const startButton = screen.getByText('Start Call');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
    });

    expect(mockCreateOffer).toHaveBeenCalled();
    expect(mockSetLocalDescription).toHaveBeenCalled();
    
    const ioMock = io as jest.Mock;
    const socketInstance = ioMock.mock.results[0].value;
    
    await waitFor(() => {
      expect(socketInstance.emit).toHaveBeenCalledWith('call-user', expect.objectContaining({
        target: 'some-target-id',
        offer: { type: 'offer', sdp: 'fake-offer' }
      }));
    });
    
    expect(screen.getByText('End Call')).toBeInTheDocument();
  });

  it('handles incoming call and accepting it', async () => {
    const ioMock = io as jest.Mock;
    
    render(<CallScreen socketUrl="http://localhost:3000" userId="user1" />);
    const socketInstance = ioMock.mock.results[0].value;
    
    // Simulate incoming call
    const incomingCallHandler = socketInstance.on.mock.calls.find((call: any) => call[0] === 'incoming-call')[1];
    
    await waitFor(() => {
      incomingCallHandler({ from: 'user2', offer: { type: 'offer', sdp: 'remote-offer' } });
    });
    
    expect(screen.getByText('Incoming call from user2')).toBeInTheDocument();
    
    // Accept call
    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
    
    expect(mockCreateAnswer).toHaveBeenCalled();
    expect(mockSetLocalDescription).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(socketInstance.emit).toHaveBeenCalledWith('accept-call', expect.objectContaining({
        target: 'user2',
        answer: { type: 'answer', sdp: 'fake-answer' }
      }));
    });
  });

  it('ends call correctly', async () => {
    render(<CallScreen socketUrl="http://localhost:3000" userId="user1" />);
    
    const startButton = screen.getByText('Start Call');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('End Call')).toBeInTheDocument();
    });
    
    const endButton = screen.getByText('End Call');
    fireEvent.click(endButton);
    
    expect(mockClose).toHaveBeenCalled();
    expect(screen.getByText('Start Call')).toBeInTheDocument();
  });
});
