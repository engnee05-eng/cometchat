import './App.css'
import { ChatScreen } from './components/ChatScreen.jsx'
import { CometChatProvider } from './providers/CometChatProvider.jsx'

function App() {
  return (
    <CometChatProvider>
      <ChatScreen />
    </CometChatProvider>
  )
}

export default App
