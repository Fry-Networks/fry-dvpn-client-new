import { useEffect, useState } from 'react';
import globalTimer from '../utils/globalTimer';

export const useConnectionTimer = (isConnected) => {
  const [localTime, setLocalTime] = useState(0);

  useEffect(() => {
    console.log('Timer hook: isConnected =', isConnected);

    if (isConnected) {
      // Start global timer
      globalTimer.start();
      
      // Subscribe to timer updates
      const unsubscribe = globalTimer.subscribe((elapsedTime) => {
        setLocalTime(elapsedTime);
      });

      return unsubscribe;
    } else {
      // Stop and reset global timer
      globalTimer.reset();
      setLocalTime(0);
    }
  }, [isConnected]);

  return localTime;
}; 