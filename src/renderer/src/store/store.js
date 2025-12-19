import { configureStore } from '@reduxjs/toolkit'
import accountReducer from './accountSlice'
import darkModeReducer from './darkModeSlice'
import connectionReducer from './connectionSlice'

export const store = configureStore({
  reducer: {
    darkMode: darkModeReducer,
    account: accountReducer,
    connection: connectionReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
