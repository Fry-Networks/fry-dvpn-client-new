import { createSlice } from '@reduxjs/toolkit'

const getInitialDarkMode = () => {
  const stored = localStorage.getItem('darkMode')
  if (stored === null) {
    // First time user - default to light theme
    return false
  }
  // Parse the stored value properly
  return stored === 'true'
}

const initialState = {
  darkMode: getInitialDarkMode()
}

export const darkModeSlice = createSlice({
  name: 'darkMode',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', state.darkMode.toString())
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      localStorage.setItem('darkMode', state.darkMode.toString())
    }
  }
})

export const { toggleDarkMode, setDarkMode } = darkModeSlice.actions

export const selectDarkMode = (state) => state.darkMode.darkMode

export default darkModeSlice.reducer
