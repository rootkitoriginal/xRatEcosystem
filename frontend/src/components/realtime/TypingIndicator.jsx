import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
import './TypingIndicator.css';

const TypingIndicator = ({ room }) => {
  const { on } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const handleTypingStart = (data) => {
      if (data.room === room && !typingUsers.includes(data.userName)) {
        setTypingUsers((prev) => [...prev, data.userName]);
      }
    };

    const handleTypingStop = (data) => {
      if (data.room === room) {
        setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
      }
    };

    const unsubscribe1 = on('typing:start', handleTypingStart);
    const unsubscribe2 = on('typing:stop', handleTypingStop);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, room, typingUsers]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    } else {
      return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-text">{getTypingText()}</div>
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
