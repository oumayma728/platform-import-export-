import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, WS_BASE } from './api.js';

export default function MessagingView({ token, user, salons, initialConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [ws, setWs] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!initialConversationId || conversations.length === 0) {
      return;
    }
    const match = conversations.find((conv) => conv.id === initialConversationId);
    if (match) {
      setActiveConv(match);
    }
  }, [initialConversationId, conversations]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      connectWebSocket(activeConv.id);
    }
    return () => {
      if (ws) ws.close();
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWebSocket = (convId) => {
    if (ws) ws.close();
    const newWs = new WebSocket(`${WS_BASE}/conversations/ws/${convId}?token=${token}`);

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'error') {
        setError(data.message);
      } else if (data.type === 'message') {
        setMessages((prev) => [...prev, data]);
      }
    };

    newWs.onclose = () => console.log('WS closed');
    setWs(newWs);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ content: inputText }));
      setInputText('');
    } else {
      try {
        const res = await fetch(`${API_BASE}/conversations/${activeConv.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: inputText }),
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages((prev) => [...prev, newMsg]);
          setInputText('');
        } else {
          const err = await res.json();
          setError(err.detail.message || err.detail);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setError(null);
  };

  return (
    <div className="messaging-container">
      <div className="conversations-list">
        <h3>Conversations</h3>
        {conversations.length === 0 && <p>Aucune conversation.</p>}
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            to={`/conversations/${conv.id}`}
            className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
            onClick={() => selectConversation(conv)}
          >
            <strong>Stand: {conv.stand_id.substring(0, 8)}...</strong>
            <p>Statut: {conv.status}</p>
          </Link>
        ))}
      </div>

      <div className="chat-area">
        {activeConv ? (
          <>
            <div className="chat-header">
              <h3>Discussion {activeConv.id.substring(0, 8)}</h3>
              {error && <div className="error-banner">{error}</div>}
            </div>
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                  <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrivez un message..."
                disabled={!!error}
              />
              <button type="submit" disabled={!inputText.trim() || !!error}>Envoyer</button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
}
