import React, { useState, useEffect, useRef } from "react";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";
import "../styles/Chatbot.css";

const API_URL = import.meta.env.VITE_VRI_URL;

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Load previous chat history when opened
  useEffect(() => {
    if (!isOpen) return;

    const loadMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessages([
            { sender: "bot", text: "Hi! I'm BounceCure Bot 🤖. How can I help you?" }
          ]);
          return;
        }

        const res = await fetch(`${API_URL}/api/chat/my-messages`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success) {
          const formatted = data.messages.map(m => ({
            sender: m.sender === "USER" ? "user" : "bot",
            text: m.text,
            time: m.createdAt
          }));

          if (formatted.length === 0) {
            setMessages([
              { sender: "bot", text: "Hi! I'm BounceCure Bot 🤖. How can I help you?" }
            ]);
          } else {
            setMessages(formatted);
          }
          
          setLastMessageCount(formatted.length);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    loadMessages();
    // Reset unread count when chat is opened
    setUnreadCount(0);
  }, [isOpen]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      // Show login message in chat instead of alert
      setMessages(prev => [...prev, 
        { sender: "user", text: input, time: new Date() },
        { sender: "bot", text: "⚠️ Please login to use chat. You need to be logged in to send messages.", time: new Date() }
      ]);
      setInput("");
      return;
    }

    const userMsg = { sender: "user", text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg.text })
      });

      const data = await res.json();

      if (data.success && data.botMessage) {
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: data.botMessage.text, time: new Date() }
        ]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong. Try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // Fetch messages periodically to detect new messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/chat/my-messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        const formatted = data.messages.map(m => ({
          sender: m.sender === "USER" ? "user" : "bot",
          text: m.text,
          time: m.createdAt
        }));

        // Check if there are new messages from admin/bot
        if (!isOpen && formatted.length > lastMessageCount) {
          const newMessages = formatted.slice(lastMessageCount);
          const newAdminBotMessages = newMessages.filter(m => m.sender === "bot");
          
          if (newAdminBotMessages.length > 0) {
            setUnreadCount(prev => prev + newAdminBotMessages.length);
          }
        }

        setMessages(formatted.length === 0 ? [
          { sender: "bot", text: "Hi! I'm BounceCure Bot 🤖. How can I help you?" }
        ] : formatted);
        
        setLastMessageCount(formatted.length);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  // Poll for new messages
  useEffect(() => {
    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // every 3 seconds

    return () => clearInterval(interval);
  }, [lastMessageCount, isOpen]);

  return (
    <>
      {/* Floating Button with Badge */}
      <div 
        className={`chat-float-button ${unreadCount > 0 ? 'has-unread' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <HiChatBubbleLeftRight />
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window animate-slide-in">
          <div className="chat-header">
            BounceCure Live Chat
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.sender}`}>
                <div className="icon">
                  {msg.sender === "bot" ? <FaRobot /> : <FaUser />}
                </div>
                <div className={`message-bubble ${msg.sender}`}>
                  <div>{msg.text}</div>
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>
                    {msg.time ? new Date(msg.time).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })
                    : ""}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row bot">
                <div className="icon"><FaRobot /></div>
                <div className="message-bubble bot typing">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              style={{ color: "#000" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* Unread Badge */
        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: linear-gradient(135deg, #44ff44, #06bd25);
          color: white;
          border-radius: 50%;
          min-width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          padding: 0 6px;
          box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
          animation: badge-pop 0.3s ease-out;
          border: 2px solid white;
        }

        @keyframes badge-pop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Pulsing animation for button with unread messages */
        .chat-float-button.has-unread {
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(185, 145, 16, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        /* Add a rotating border effect */
        .chat-float-button.has-unread::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(45deg, #b98c10, #966805, #b98c10);
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-border 3s linear infinite;
        }

        @keyframes rotate-border {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Enhanced float button hover */
        .chat-float-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #b97e10, #966f05);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(185, 112, 16, 0.4);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .chat-float-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(185, 160, 16, 0.6);
        }

        .chat-float-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
};

export default ChatBot;