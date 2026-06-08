import { useEffect, useRef, useState } from 'react'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import {
  CometChatConversations,
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
} from '@cometchat/chat-uikit-react'
import { useCometChatSession } from '../providers/cometchatContext.js'

function MissingConfig() {
  return (
    <main className="shell">
      <section className="setup-panel" aria-labelledby="setup-title">
        <p className="eyebrow">CometChat setup</p>
        <h1 id="setup-title">Add your app credentials to start chatting.</h1>
        <p>
          Create or open a CometChat app, then fill in
          <code>.env</code> with <code>VITE_COMETCHAT_APP_ID</code>,
          <code>VITE_COMETCHAT_REGION</code>, and
          <code>VITE_COMETCHAT_AUTH_KEY</code>. Restart Vite after changing the
          file.
        </p>
      </section>
    </main>
  )
}

function LoadingState() {
  return (
    <main className="shell">
      <section className="setup-panel" aria-live="polite">
        <p className="eyebrow">CometChat setup</p>
        <h1>Connecting to CometChat...</h1>
      </section>
    </main>
  )
}

function ErrorState({ error }) {
  return (
    <main className="shell">
      <section className="setup-panel error" role="alert">
        <p className="eyebrow">CometChat error</p>
        <h1>Chat could not start.</h1>
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      </section>
    </main>
  )
}

export function ChatScreen() {
  const { uid, peerUid, users, status, error, switchUser } =
    useCometChatSession()
  const [activeConversation, setActiveConversation] = useState(null)
  const [directUser, setDirectUser] = useState(null)
  const composerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    if (status !== 'ready') {
      return undefined
    }

    CometChat.getUser(peerUid)
      .then((user) => {
        if (!cancelled) {
          setDirectUser(user)
          setActiveConversation(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDirectUser(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [peerUid, status])

  useEffect(() => {
    if (status === 'ready') {
      composerRef.current?.focus?.()
    }
  }, [status, activeConversation, directUser])

  if (status === 'missing-config') {
    return <MissingConfig />
  }

  if (status === 'error') {
    return <ErrorState error={error} />
  }

  if (status !== 'ready') {
    return <LoadingState />
  }

  const conversationWith = activeConversation?.getConversationWith?.()
  const conversationType = activeConversation?.getConversationType?.()
  const selectedUser =
    conversationType === 'user' ? conversationWith : directUser
  const selectedGroup = conversationType === 'group' ? conversationWith : null

  return (
    <main className="chat-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">CometChat React</p>
          <h1>Messages</h1>
        </div>
        <div className="session-tools" aria-label="Choose test user">
          {users.map((user) => (
            <button
              type="button"
              key={user}
              className={user === uid ? 'active' : ''}
              onClick={() => switchUser(user)}
            >
              {user.replace('cometchat-', '')}
            </button>
          ))}
        </div>
      </header>

      <section className="tester-note" aria-live="polite">
        Signed in as <strong>{uid}</strong>. For the two-window test, open an
        incognito window at <code>/?uid={peerUid}</code>.
      </section>

      <section className="messenger" aria-label="Messages">
        <aside className="conversation-list">
          <CometChatConversations
            activeConversation={activeConversation}
            onItemClick={setActiveConversation}
          />
        </aside>

        <section className="message-pane">
          {selectedUser || selectedGroup ? (
            <>
              <CometChatMessageHeader
                user={selectedUser || undefined}
                group={selectedGroup || undefined}
              />
              <div className="message-list">
                {selectedUser && (
                  <CometChatMessageList
                    user={selectedUser}
                    hideReplyInThreadOption
                  />
                )}
                {selectedGroup && (
                  <CometChatMessageList
                    group={selectedGroup}
                    hideReplyInThreadOption
                  />
                )}
              </div>
              <div id="message-composer" ref={composerRef} className="composer">
                {selectedUser && <CometChatMessageComposer user={selectedUser} />}
                {selectedGroup && (
                  <CometChatMessageComposer group={selectedGroup} />
                )}
              </div>
            </>
          ) : (
            <div className="empty-pane">
              <h2>Select a conversation</h2>
              <p>
                The app will default to a direct chat with
                <strong> {peerUid}</strong> once the test user is available.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
