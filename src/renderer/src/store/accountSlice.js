import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  walletAddress: '',
  balance: '0',
  seedPhrase: '',
  currentPlan: null,
  planExpiryDate: null
}

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccount: (state, action) => {
      state.walletAddress = action.payload.walletAddress
      state.balance = action.payload.balance.toString()
      state.seedPhrase = action.payload.seedPhrase
      state.currentPlan = action.payload.currentPlan || null
      state.planExpiryDate = action.payload.planExpiryDate || null
    },
    updatePlan: (state, action) => {
      console.log('🔄 updatePlan reducer called with:', action.payload);
      state.currentPlan = action.payload.currentPlan;
      state.planExpiryDate = action.payload.planExpiryDate;
      console.log('✅ Redux state updated - currentPlan:', state.currentPlan, 'planExpiryDate:', state.planExpiryDate);
    },
    updateBalance: (state, action) => {
      state.balance = action.payload.balance.toString()
    }
  }
})

// Action to set account details
export const { setAccount, updatePlan, updateBalance } = accountSlice.actions

// Selector to get account details
export const getAccount = (state) => {
  const account = state.account
  return {
    ...account,
    balance: account.balance || '0'
  }
}

// Reducer export
export default accountSlice.reducer
