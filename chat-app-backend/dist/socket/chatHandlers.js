"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserOnline = exports.setupChatHandlers = void 0;
const message_service_1 = require("../services/message.service");
const conversation_service_1 = require("../services/conversation.service");
const user_service_1 = require("../services/user.service");
// Track online users: userId → Set<socketId>
const onlineUsers = new Map();
const setupChatHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // ── User comes online ──
        socket.on('user_connected', async (userId) => {
            if (!userId)
                return;
            socket.userId = userId;
            // Track this socket for the user
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);
            // Broadcast online status
            socket.broadcast.emit('user_online', { userId });
            console.log(`User ${userId} online (${onlineUsers.get(userId).size} sockets)`);
        });
        // ── Join a conversation room ──
        socket.on('join_chat', (data) => {
            if (data?.conversationId) {
                socket.join(data.conversationId);
                console.log(`Socket ${socket.id} joined room ${data.conversationId}`);
            }
        });
        // ── Leave a conversation room ──
        socket.on('leave_chat', (data) => {
            if (data?.conversationId) {
                socket.leave(data.conversationId);
            }
        });
        // ── Send a message (PERSISTED TO DB) ──
        socket.on('send_message', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.conversationId || !data.content)
                return;
            try {
                // 1. Persist to database
                const message = await message_service_1.MessageService.create({
                    conversationId: data.conversationId,
                    senderId: userId,
                    messageType: data.type || 'text',
                    content: data.content,
                    iv: data.iv,
                    replyToId: data.replyToId,
                });
                // 2. Update conversation's last_message pointer
                await conversation_service_1.ConversationService.updateLastMessage(data.conversationId, message.id);
                // 3. Increment unread count for other members
                await conversation_service_1.ConversationService.incrementUnread(data.conversationId, userId);
                // 4. Broadcast the full message to the room
                io.to(data.conversationId).emit('receive_message', {
                    id: message.id,
                    conversationId: data.conversationId,
                    senderId: userId,
                    senderName: message.sender?.display_name || 'Unknown',
                    senderAvatar: message.sender?.avatar_url || null,
                    messageType: message.message_type,
                    content: message.encrypted_payload,
                    replyToId: message.reply_to_id,
                    createdAt: message.created_at,
                });
            }
            catch (err) {
                console.error('Error persisting message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // ── Message delivered ──
        socket.on('message_delivered', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId)
                return;
            await message_service_1.MessageService.updateStatus(data.messageId, userId, 'delivered');
            io.to(data.conversationId).emit('message_status_update', {
                messageId: data.messageId,
                userId,
                status: 'delivered',
            });
        });
        // ── Message read ──
        socket.on('message_read', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.conversationId)
                return;
            // Reset unread count
            await conversation_service_1.ConversationService.markAsRead(data.conversationId, userId);
            if (data.messageId) {
                await message_service_1.MessageService.updateStatus(data.messageId, userId, 'read');
                io.to(data.conversationId).emit('message_status_update', {
                    messageId: data.messageId,
                    userId,
                    status: 'read',
                });
            }
        });
        // ── Typing indicators ──
        socket.on('typing_start', (data) => {
            const userId = socket.userId;
            if (!userId || !data.conversationId)
                return;
            socket.to(data.conversationId).emit('user_typing', {
                conversationId: data.conversationId,
                userId,
                isTyping: true,
            });
        });
        socket.on('typing_stop', (data) => {
            const userId = socket.userId;
            if (!userId || !data.conversationId)
                return;
            socket.to(data.conversationId).emit('user_typing', {
                conversationId: data.conversationId,
                userId,
                isTyping: false,
            });
        });
        // ── WebRTC Signaling ──
        socket.on('call_initiate', (data) => {
            const userId = socket.userId;
            socket.to(data.conversationId).emit('call_incoming', {
                conversationId: data.conversationId,
                callerId: userId,
                offer: data.offer,
                callType: data.callType,
            });
        });
        socket.on('call_accept', (data) => {
            socket.to(data.conversationId).emit('call_accepted', data);
        });
        socket.on('call_reject', (data) => {
            socket.to(data.conversationId).emit('call_rejected', data);
        });
        socket.on('call_end', (data) => {
            socket.to(data.conversationId).emit('call_ended', data);
        });
        socket.on('ice_candidate', (data) => {
            socket.to(data.conversationId).emit('ice_candidate', data);
        });
        // ── Message Reactions ──
        socket.on('add_reaction', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId || !data.reaction)
                return;
            await message_service_1.MessageService.addReaction(data.messageId, userId, data.reaction);
            io.to(data.conversationId).emit('message_reaction_add', {
                messageId: data.messageId,
                userId,
                reaction: data.reaction,
            });
        });
        socket.on('remove_reaction', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId || !data.reaction)
                return;
            await message_service_1.MessageService.removeReaction(data.messageId, userId, data.reaction);
            io.to(data.conversationId).emit('message_reaction_remove', {
                messageId: data.messageId,
                userId,
                reaction: data.reaction,
            });
        });
        // ── Edit/Delete/Pin Messages ──
        socket.on('edit_message', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId || !data.content)
                return;
            await message_service_1.MessageService.editMessage(data.messageId, userId, data.content);
            io.to(data.conversationId).emit('message_edited', {
                messageId: data.messageId,
                content: data.content,
            });
        });
        socket.on('delete_message', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId)
                return;
            await message_service_1.MessageService.deleteMessage(data.messageId, userId, data.forEveryone);
            io.to(data.conversationId).emit('message_deleted', {
                messageId: data.messageId,
                forEveryone: data.forEveryone,
            });
        });
        socket.on('pin_message', async (data) => {
            const userId = socket.userId;
            if (!userId || !data.messageId)
                return;
            await message_service_1.MessageService.setPinned(data.messageId, data.isPinned);
            io.to(data.conversationId).emit('message_pinned', {
                messageId: data.messageId,
                isPinned: data.isPinned,
            });
        });
        // ── Disconnect ──
        socket.on('disconnect', async () => {
            const userId = socket.userId;
            if (userId) {
                // Remove this socket from tracking
                const sockets = onlineUsers.get(userId);
                if (sockets) {
                    sockets.delete(socket.id);
                    // Only mark offline if no more sockets for this user
                    if (sockets.size === 0) {
                        onlineUsers.delete(userId);
                        await user_service_1.UserService.updateLastSeen(userId);
                        socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
                        console.log(`User ${userId} offline`);
                    }
                }
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
exports.setupChatHandlers = setupChatHandlers;
/**
 * Check if a user is currently online.
 */
const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};
exports.isUserOnline = isUserOnline;
