"use client";

import { useAuth } from "@/provider/authProvider";
import { WSURL } from "@/utils/constants";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useRef, useState } from "react";

const MachantConversationLayerByGabriel = () => {
  const { user } = useAuth(); // Assuming this returns user with public_fingerprint, private_fingerprint, email, username
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (user && user.public_fingerprint && user.private_fingerprint) {
      connectWebSocket(user);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  const connectWebSocket = (userData) => {
    if (ws) {
      ws.close();
    }

    const wsUrl = `${WSURL}/ws/merchant/${userData.public_fingerprint}?private_fingerprint=${userData.private_fingerprint}`;
    const websocket = new WebSocket(wsUrl);

    // Add custom header for private fingerprint
    websocket.addEventListener('open', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
      
      switch (data.type) {
        case 'conversations_list':
          setConversations(data.data || []);
          break;
          
        case 'conversation_messages':
          setMessages(data.data.map(msg => ({
            id: msg.id,
            message: msg.message,
            senderEmail: msg.sender_email,
            isMe: msg.sender_email === userData.email,
            timestamp: msg.created_at
          })));
          break;
          
        case 'new_message':
          // Add new message to current conversation if it's selected
          if (selectedConversation && data.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, {
              id: Date.now(),
              message: data.message,
              senderEmail: data.sender_email,
              isMe: data.sender_email === userData.email,
              timestamp: new Date().toISOString()
            }]);
          }
          
          // Update conversations list
          setConversations(prev => prev.map(conv => 
            conv.id === data.conversation_id 
              ? { 
                  ...conv, 
                  last_message: data.message, 
                  last_message_time: new Date().toISOString(),
                  user_name: data.user_name,
                  user_email: data.user_email
                }
              : conv
          ));
          break;
          
        case 'message_sent':
          // Message confirmation - already added optimistically
          break;
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (userData) {
          connectWebSocket(userData);
        }
      }, 3000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(websocket);
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'get_messages',
        conversation_id: conversation.id
      }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim() || !selectedConversation || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Optimistically add message to UI
    const newMessage = {
      id: Date.now(),
      message: currentMessage.trim(),
      senderEmail: user.email,
      isMe: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);

    ws.send(JSON.stringify({
      type: 'send_message',
      conversation_id: selectedConversation.id,
      message: currentMessage.trim()
    }));

    setCurrentMessage('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Icon icon="eos-icons:loading" className="animate-spin text-4xl" />
      </div>
    );
  }
  
  return (
    <div className='chat-wrapper'>
      <div className='chat-sidebar card'>
        {/* Current User Profile */}
        <div className='chat-sidebar-single active top-profile'>
          <div className='img'>
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.username?.charAt(0).toUpperCase() || 'M'}
            </div>
          </div>
          <div className='info'>
            <h6 className='text-md mb-0'>{user.username}</h6>
            <p className='mb-0'>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className='action'>
            <div className='btn-group'>
              <button
                type='button'
                className='text-secondary-light text-xl'
                data-bs-toggle='dropdown'
                data-bs-display='static'
                aria-expanded='false'
              >
                <Icon icon='bi:three-dots' />
              </button>
              <ul className='dropdown-menu dropdown-menu-lg-end border'>
                <li>
                  <button className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'>
                    <Icon icon='fluent:person-32-regular' />
                    Profile
                  </button>
                </li>
                <li>
                  <button className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'>
                    <Icon icon='carbon:settings' />
                    Settings
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='chat-search'>
          <span className='icon'>
            <Icon icon='iconoir:search' />
          </span>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search conversations...'
            autoComplete='off'
          />
        </div>

        {/* Conversations List */}
        <div className='chat-all-list'>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-sidebar-single cursor-pointer ${
                  selectedConversation?.id === conv.id ? 'active' : ''
                }`}
                onClick={() => handleConversationSelect(conv)}
              >
                <div className='img'>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {conv.user_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className='info flex-1'>
                  <h6 className='text-sm mb-1'>{conv.user_name || 'Anonymous'}</h6>
                  <p className='mb-0 text-xs text-gray-600 truncate'>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
                <div className='action text-end'>
                  <p className='mb-0 text-neutral-400 text-xs lh-1'>
                    {formatLastMessageTime(conv.last_message_time)}
                  </p>
                  <div className="flex items-center justify-center mt-1">
                    <span className="text-xs text-gray-500">
                      {conv.message_count || 0} msgs
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Icon icon="material-symbols:chat-outline" className="text-4xl mb-2 block mx-auto" />
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              <br />
              {!searchQuery && 'Customers will appear here when they message you'}
            </div>
          )}
        </div>
      </div>

      <div className='chat-main card'>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className='chat-sidebar-single active'>
              <div className='img'>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedConversation.user_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className='info'>
                <h6 className='text-md mb-0'>{selectedConversation.user_name || 'Anonymous'}</h6>
                <p className='mb-0 text-sm text-gray-600'>{selectedConversation.user_email}</p>
              </div>
              <div className='action d-inline-flex align-items-center gap-3'>
                <button type='button' className='text-xl text-primary-light'>
                  <Icon icon='mi:call' />
                </button>
                <button type='button' className='text-xl text-primary-light'>
                  <Icon icon='fluent:video-32-regular' />
                </button>
                <div className='btn-group'>
                  <button
                    type='button'
                    className='text-primary-light text-xl'
                    data-bs-toggle='dropdown'
                    data-bs-display='static'
                    aria-expanded='false'
                  >
                    <Icon icon='tabler:dots-vertical' />
                  </button>
                  <ul className='dropdown-menu dropdown-menu-lg-end border'>
                    <li>
                      <button className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'>
                        <Icon icon='mdi:clear-circle-outline' />
                        Clear Chat
                      </button>
                    </li>
                    <li>
                      <button className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'>
                        <Icon icon='ic:baseline-block' />
                        Block User
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className='chat-message-list'>
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`chat-single-message ${msg.isMe ? 'right' : 'left'}`}
                  >
                    {!msg.isMe && (
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {selectedConversation.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className='chat-message-content'>
                      <p className='mb-2'>{msg.message}</p>
                      <p className='chat-time mb-0'>
                        <span>{formatTime(msg.timestamp)}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Icon icon="material-symbols:chat-bubble-outline" className="text-6xl mb-4" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className='chat-message-box' onSubmit={handleSendMessage}>
              <input
                type='text'
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={isConnected ? 'Write message...' : 'Connecting...'}
                disabled={!isConnected}
              />
              <div className='chat-message-box-action'>
                <button type='button' className='text-xl' disabled={!isConnected}>
                  <Icon icon='ph:link' />
                </button>
                <button type='button' className='text-xl' disabled={!isConnected}>
                  <Icon icon='solar:gallery-linear' />
                </button>
                <button
                  type='submit'
                  disabled={!isConnected || !currentMessage.trim()}
                  className='btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1 disabled:opacity-50'
                >
                  Send
                  <Icon icon='f7:paperplane' />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon icon="material-symbols:forum-outline" className="text-8xl mb-4" />
              <h3 className="text-xl mb-2">Welcome to Merchant Chat</h3>
              <p>Select a conversation to start chatting with customers</p>
              {!isConnected && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <Icon icon="material-symbols:wifi-off" className="text-yellow-600 text-2xl mb-2" />
                  <p className="text-yellow-700 text-sm">Reconnecting to chat server...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachantConversationLayerByGabriel;