"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from "@/provider/authProvider";
import { Icon } from "@iconify/react/dist/iconify.js";

const ChatMessageLayer = () => {
  const { user } = useAuth();
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [token, setToken] = useState(null);
  
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("Retrieved token from localStorage:", storedToken ? "Token exists" : "No token");
    setToken(storedToken);
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (user && token) {
      console.log("User and token available - fetching conversations:", { 
        userId: user.id, 
        userEmail: user.email,
        tokenExists: !!token 
      });
      fetchConversations();
    } else {
      console.log("Missing requirements:", { user: !!user, token: !!token });
    }
  }, [user, token]);

  const fetchConversations = async () => {
    if (!token) {
      console.log("No token available for fetchConversations");
      return;
    }

    try {
      console.log("Making request to fetch conversations with token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Fetch conversations response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch conversations error:", errorText);
        if (response.status === 401) {
          console.error("Authentication failed - token may be invalid");
          // Optionally redirect to login or refresh token
        }
        return;
      }

      const data = await response.json();
      console.log("Conversations data:", data);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // WebSocket connection management
  const connectWebSocket = useCallback((recipientId) => {
    if (!user || !recipientId || !token) {
      console.log("Missing requirements for WebSocket:", { 
        user: !!user, 
        recipientId, 
        token: !!token 
      });
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log("Connecting to WebSocket with:", { userId: user.id, recipientId });
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?userId=${user.id}&recipientId=${recipientId}&token=${encodeURIComponent(token)}`;
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
    };

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data.type);
      handleWebSocketMessage(data);
    };

    newWs.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = newWs;
    setWs(newWs);
  }, [user, token]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'history':
        setMessages(prev => [...prev, {
          id: data.id,
          message: data.data,
          isMe: data.isMe,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          timestamp: new Date(data.timestamp)
        }]);
        break;

      case 'chat':
        setMessages(prev => [...prev, {
          id: data.id,
          message: data.data,
          isMe: data.isMe,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          timestamp: new Date()
        }]);
        
        // Update conversations list with new message
        fetchConversations();
        break;

      case 'new_message_notification':
        // Handle notification when user is not in the chat
        if (selectedUser?.id !== data.fromUserId) {
          // Update conversation list to show unread count
          fetchConversations();
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(`New message from ${data.fromUsername}`, {
              body: data.message,
              icon: '/favicon.ico'
            });
          }
        }
        break;

      case 'user_online':
        setOnlineUsers(prev => new Set([...prev, data.userId]));
        break;

      case 'user_offline':
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        break;

      case 'info':
        console.log('WebSocket info:', data.info);
        break;

      default:
        console.log('Unknown message type:', data);
    }
  };

  // Handle user selection
  const handleUserSelect = (userData) => {
    console.log("User selected:", userData);
    setSelectedUser(userData);
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    
    // Connect to WebSocket for this user
    connectWebSocket(userData.id);
    
    // Mark messages as read
    if (userData.room_id) {
      markMessagesAsRead(userData.room_id);
    }
  };

  const markMessagesAsRead = async (roomId) => {
    if (!roomId || !token) {
      console.log("Cannot mark as read:", { roomId, token: !!token });
      return;
    }
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/mark-read/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Refresh conversations to update unread counts
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        if (!token) {
          console.log("No token available for search");
          setIsSearching(false);
          return;
        }

        try {
          console.log("Searching for users:", searchQuery);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/chat/search-users?q=${encodeURIComponent(searchQuery)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log("Search response:", response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Search error:", errorText);
            if (response.status === 401) {
              console.error("Search authentication failed");
            }
            setSearchResults([]);
            return;
          }

          const data = await response.json();
          console.log("Search results:", data);
          setSearchResults(data.users || []);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, token]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || !ws || !selectedUser) {
      console.log("Cannot send message:", { 
        message: !!currentMessage.trim(), 
        ws: !!ws, 
        selectedUser: !!selectedUser 
      });
      return;
    }

    console.log("Sending message:", currentMessage);
    ws.send(JSON.stringify({
      message: currentMessage.trim()
    }));

    setCurrentMessage('');
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return formatTime(date);
    return date.toLocaleDateString();
  };

  if (!user) {
    return <div className="chat-wrapper">Please log in to use chat.</div>;
  }

  if (!token) {
    return <div className="chat-wrapper">Loading authentication...</div>;
  }

  return (
    <div className='chat-wrapper'>
      <div className='chat-sidebar card'>
        {/* Current User Profile */}
        <div className='chat-sidebar-single active top-profile'>
          <div className='img'>
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className='info'>
            <h6 className='text-md mb-0'>{user.username}</h6>
            <p className='mb-0'>{isConnected ? 'Online' : 'Offline'}</p>
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
            placeholder='Search users...'
            autoComplete='off'
          />
        </div>

        {/* Search Results */}
        {(searchQuery.length >= 2 || isSearching) && (
          <div className="search-results">
            {isSearching ? (
              <div className="p-3 text-center">
                <Icon icon="eos-icons:loading" className="animate-spin" />
                <span className="ml-2">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results-list">
                <div className="px-3 py-2 text-xs text-gray-500 font-semibold">
                  SEARCH RESULTS
                </div>
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser.id}
                    className='chat-sidebar-single cursor-pointer hover:bg-gray-50'
                    onClick={() => handleUserSelect({
                      id: searchUser.id,
                      username: searchUser.username,
                      email: searchUser.email
                    })}
                  >
                    <div className='img'>
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {searchUser.username?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className='info flex-1'>
                      <h6 className='text-sm mb-1'>{searchUser.username}</h6>
                      <p className='mb-0 text-xs text-gray-500'>{searchUser.email}</p>
                    </div>
                    <div className='action text-end'>
                      <Icon icon="material-symbols:chat" className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                No users found
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        {!searchQuery && (
          <div className='chat-all-list'>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.room_id}
                  className={`chat-sidebar-single cursor-pointer ${
                    selectedUser?.id === conv.other_user_id ? 'active' : ''
                  }`}
                  onClick={() => handleUserSelect({
                    id: conv.other_user_id,
                    username: conv.other_username,
                    email: conv.other_email,
                    room_id: conv.room_id
                  })}
                >
                  <div className='img relative'>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {conv.other_username?.charAt(0).toUpperCase()}
                    </div>
                    {onlineUsers.has(conv.other_user_id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className='info flex-1'>
                    <h6 className='text-sm mb-1'>{conv.other_username}</h6>
                    <p className='mb-0 text-xs text-gray-600 truncate'>
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                  <div className='action text-end'>
                    <p className='mb-0 text-neutral-400 text-xs lh-1'>
                      {formatLastMessageTime(conv.last_message_time)}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className='w-5 h-5 text-xs rounded-full bg-red-500 text-white d-inline-flex align-items-center justify-content-center mt-1'>
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Icon icon="material-symbols:chat-outline" className="text-4xl mb-2 block mx-auto" />
                No conversations yet
                <br />
                Search for users to start chatting
              </div>
            )}
          </div>
        )}
      </div>

      <div className='chat-main card'>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className='chat-sidebar-single active'>
              <div className='img relative'>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
                {onlineUsers.has(selectedUser.id) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className='info'>
                <h6 className='text-md mb-0'>{selectedUser.username}</h6>
                <p className='mb-0'>
                  {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
                </p>
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
                        {msg.senderUsername?.charAt(0).toUpperCase()}
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
                placeholder='Write message...'
                disabled={!isConnected}
              />
              <div className='chat-message-box-action'>
                <button type='button' className='text-xl'>
                  <Icon icon='ph:link' />
                </button>
                <button type='button' className='text-xl'>
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
              <h3 className="text-xl mb-2">Welcome to Chat</h3>
              <p>Select a conversation or search for users to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageLayer;