// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MessageBubble from '../components/chat/MessageBubble';
import ChatArea from '../components/ChatArea';
import * as ChatContext from '../contexts/ChatContext';
import * as AuthContext from '../contexts/AuthContext';
import * as SocketContext from '../contexts/SocketContext';

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="icon-message-circle" />,
  Pin: () => <div data-testid="icon-pin" />,
  X: () => <div data-testid="icon-x" />,
  Check: () => <div data-testid="icon-check" />,
  CheckCheck: () => <div data-testid="icon-check-check" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Download: () => <div data-testid="icon-download" />,
  Mic: () => <div data-testid="icon-mic" />,
  Reply: () => <div data-testid="icon-reply" />,
}));

// Mock child components
vi.mock('../components/chat/MessageInput', () => ({
  default: ({ onSend }: any) => (
    <div data-testid="message-input">
      <button onClick={() => onSend('test reply', 'text')}>Send Reply</button>
    </div>
  )
}));
vi.mock('../components/chat/TypingIndicator', () => ({
  default: () => <div data-testid="typing-indicator">Typing...</div>
}));
vi.mock('../components/chat/ChatHeader', () => ({
  default: () => <div data-testid="chat-header">Header</div>
}));
vi.mock('../components/chat/InfoPanel', () => ({
  default: () => <div data-testid="info-panel">Info Panel</div>
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('MessageBubble', () => {
  afterEach(() => {
    cleanup();
  });
  const mockMessage = {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Alice',
    content: 'Hello World',
    createdAt: new Date().toISOString(),
    messageType: 'text',
    status: 'sent' as const,
  };

  it('renders a text message correctly', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isMe={true}
        showName={false}
        compact={false}
      />
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders sender name when showName is true', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isMe={false}
        showName={true}
        compact={false}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders a replied message preview', () => {
    const repliedMessage = {
      senderName: 'Bob',
      content: 'How are you?'
    };
    render(
      <MessageBubble
        message={mockMessage}
        isMe={true}
        showName={false}
        compact={false}
        repliedMessage={repliedMessage}
      />
    );
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('shows hover actions on mouse enter', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isMe={true}
        showName={false}
        compact={false}
      />
    );
    
    // Find the message container (has class group)
    const container = screen.getByText('Hello World').closest('.group')!;
    fireEvent.mouseEnter(container);
    
    // Reply button should appear
    expect(screen.getByTitle('Reply')).toBeInTheDocument();
  });
});

describe('ChatArea', () => {
  const mockSendMessage = vi.fn();
  const mockSocketEmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'me' }
    } as any);

    vi.spyOn(SocketContext, 'useSocket').mockReturnValue({
      socket: { emit: mockSocketEmit }
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "Select a chat" when no active conversation', () => {
    vi.spyOn(ChatContext, 'useChat').mockReturnValue({
      activeConversation: null,
      messages: [],
      typingUsers: new Map(),
      sendMessage: mockSendMessage
    } as any);

    render(<ChatArea />);
    expect(screen.getByText('Select a chat')).toBeInTheDocument();
  });

  it('renders messages and groups them by date', () => {
    const now = new Date();
    const mockMessages = [
      {
        id: '1',
        senderId: 'them',
        senderName: 'Alice',
        content: 'Hi there',
        createdAt: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
        messageType: 'text'
      },
      {
        id: '2',
        senderId: 'me',
        senderName: 'Me',
        content: 'Hello!',
        createdAt: now.toISOString(), // Today
        messageType: 'text'
      }
    ];

    vi.spyOn(ChatContext, 'useChat').mockReturnValue({
      activeConversation: { id: 'conv-1', type: 'individual' },
      messages: mockMessages,
      typingUsers: new Map(),
      sendMessage: mockSendMessage
    } as any);

    render(<ChatArea />);
    
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('displays typing indicator when someone is typing', () => {
    const typingUsers = new Map();
    typingUsers.set('them', 'conv-1');

    vi.spyOn(ChatContext, 'useChat').mockReturnValue({
      activeConversation: { id: 'conv-1', type: 'individual' },
      messages: [],
      typingUsers,
      sendMessage: mockSendMessage
    } as any);

    render(<ChatArea />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('shows pinned message banner', () => {
    const mockMessages = [
      {
        id: '1',
        senderId: 'them',
        senderName: 'Alice',
        content: 'Important info',
        createdAt: new Date().toISOString(),
        messageType: 'text',
        isPinned: true
      }
    ];

    vi.spyOn(ChatContext, 'useChat').mockReturnValue({
      activeConversation: { id: 'conv-1', type: 'individual' },
      messages: mockMessages,
      typingUsers: new Map(),
      sendMessage: mockSendMessage
    } as any);

    render(<ChatArea />);
    expect(screen.getByText('Pinned Message')).toBeInTheDocument();
    expect(screen.getAllByText('Important info').length).toBe(2);
  });

  it('handles replying to a message', () => {
    const mockMessages = [
      {
        id: '1',
        senderId: 'them',
        senderName: 'Alice',
        content: 'Question?',
        createdAt: new Date().toISOString(),
        messageType: 'text'
      }
    ];

    vi.spyOn(ChatContext, 'useChat').mockReturnValue({
      activeConversation: { id: 'conv-1', type: 'individual' },
      messages: mockMessages,
      typingUsers: new Map(),
      sendMessage: mockSendMessage
    } as any);

    render(<ChatArea />);
    
    // Simulate hover and click reply on MessageBubble
    const container = screen.getByText('Question?').closest('.group')!;
    fireEvent.mouseEnter(container);
    
    const replyBtn = screen.getByTitle('Reply');
    fireEvent.click(replyBtn);

    // Reply banner should appear
    expect(screen.getByText('Replying to Alice')).toBeInTheDocument();

    // Sending should clear it and call sendMessage with replyToId
    const sendBtn = screen.getByText('Send Reply');
    fireEvent.click(sendBtn);

    expect(mockSendMessage).toHaveBeenCalledWith('test reply', 'text', '1');
    expect(screen.queryByText('Replying to Alice')).not.toBeInTheDocument();
  });
});
