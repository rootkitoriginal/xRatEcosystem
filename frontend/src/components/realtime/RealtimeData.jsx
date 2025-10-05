import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketProvider';
import './RealtimeData.css';

const RealtimeData = ({ event, onUpdate, children }) => {
  const { on } = useWebSocket();
  const [data, setData] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  const handleDataUpdate = useCallback(
    (newData) => {
      setData(newData);
      setHasUpdate(true);

      // Flash animation
      setTimeout(() => setHasUpdate(false), 1000);

      if (onUpdate) {
        onUpdate(newData);
      }
    },
    [onUpdate]
  );

  useEffect(() => {
    const unsubscribe = on(event, handleDataUpdate);
    return unsubscribe;
  }, [on, event, handleDataUpdate]);

  return (
    <div className={`realtime-data ${hasUpdate ? 'updating' : ''}`}>
      {children({ data, hasUpdate })}
    </div>
  );
};

export default RealtimeData;
