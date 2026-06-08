import { createContext, useContext } from 'react'

export const CometChatContext = createContext(null)

export function useCometChatSession() {
  const context = useContext(CometChatContext)

  if (!context) {
    throw new Error('useCometChatSession must be used inside CometChatProvider')
  }

  return context
}
