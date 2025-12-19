import { createSlice } from '@reduxjs/toolkit'

// Load initial state from localStorage if available
const loadInitialState = () => {
  // Always start with disconnected state to prevent auto-connection
  return {
    isConnected: false,
    connectionTime: 0,
    currentIP: 'Loading...',
    currentLocation: { name: 'Loading...', city: 'Loading...' },
    timerInterval: null
  };
};

const initialState = loadInitialState();

export const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('connectionState', JSON.stringify({
          isConnected: state.isConnected,
          connectionTime: state.connectionTime,
          currentIP: state.currentIP,
          currentLocation: state.currentLocation
        }));
      } catch (error) {
        console.error('Error saving connection state to localStorage:', error);
      }
    },
    setConnectionTime: (state, action) => {
      state.connectionTime = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('connectionState', JSON.stringify({
          isConnected: state.isConnected,
          connectionTime: state.connectionTime,
          currentIP: state.currentIP,
          currentLocation: state.currentLocation
        }));
      } catch (error) {
        console.error('Error saving connection state to localStorage:', error);
      }
    },
    setCurrentIP: (state, action) => {
      state.currentIP = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('connectionState', JSON.stringify({
          isConnected: state.isConnected,
          connectionTime: state.connectionTime,
          currentIP: state.currentIP,
          currentLocation: state.currentLocation
        }));
      } catch (error) {
        console.error('Error saving connection state to localStorage:', error);
      }
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('connectionState', JSON.stringify({
          isConnected: state.isConnected,
          connectionTime: state.connectionTime,
          currentIP: state.currentIP,
          currentLocation: state.currentLocation
        }));
      } catch (error) {
        console.error('Error saving connection state to localStorage:', error);
      }
    },
    setTimerInterval: (state, action) => {
      state.timerInterval = action.payload;
    },
    resetConnection: (state) => {
      state.isConnected = false;
      state.connectionTime = 0;
      state.timerInterval = null;
      // Clear from localStorage
      try {
        localStorage.removeItem('connectionState');
      } catch (error) {
        console.error('Error clearing connection state from localStorage:', error);
      }
    }
  }
})

export const { 
  setConnected, 
  setConnectionTime, 
  setCurrentIP, 
  setCurrentLocation, 
  setTimerInterval,
  resetConnection 
} = connectionSlice.actions

export const selectConnection = (state) => state.connection
export const selectIsConnected = (state) => state.connection.isConnected
export const selectConnectionTime = (state) => state.connection.connectionTime
export const selectCurrentIP = (state) => state.connection.currentIP
export const selectCurrentLocation = (state) => state.connection.currentLocation
export const selectTimerInterval = (state) => state.connection.timerInterval

export default connectionSlice.reducer 