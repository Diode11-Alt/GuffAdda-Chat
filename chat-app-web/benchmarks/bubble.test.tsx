import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import MessageBubble from '../src/components/chat/MessageBubble';
import FastBubble from '../src/components/experimental/FastBubble';

const mockMessage = {
  id: 'msg-1',
  senderId: 'user-1',
  senderName: 'Alice',
  content: 'Hello, this is a test message to benchmark the render performance of our components.',
  createdAt: new Date().toISOString(),
  messageType: 'text',
  status: 'read' as const,
  reactions: [
    { userId: 'user-2', reaction: '👍' },
    { userId: 'user-3', reaction: '❤️' }
  ],
  isEdited: false,
  isPinned: false,
};

const defaultProps = {
  message: mockMessage,
  isMe: true,
  showName: true,
  compact: false,
  onReaction: () => {},
  onReply: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onPin: () => {},
};

describe('Message Bubble Render Benchmarks', () => {
  bench('MessageBubble (Original)', () => {
    const { unmount } = render(<MessageBubble {...defaultProps} />);
    unmount(); // Clean up to prevent DOM bloat during iterations
  });

  bench('FastBubble (Optimized)', () => {
    const { unmount } = render(<FastBubble {...defaultProps} />);
    unmount();
  });
});
