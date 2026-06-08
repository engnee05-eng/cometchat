import { useEffect, useMemo, useState } from 'react'
import {
  CometChatUIKit,
  UIKitSettingsBuilder,
} from '@cometchat/chat-uikit-react'
import { CometChatContext } from './cometchatContext.js'

const TEST_USERS = ['cometchat-uid-1', 'cometchat-uid-2']

let initInFlight = null
let loginInFlight = null

function getInitialUid() {
  const params = new URLSearchParams(window.location.search)
  const uid = params.get('uid')
  return TEST_USERS.includes(uid) ? uid : TEST_USERS[0]
}

function getConfig() {
  return {
    appId: import.meta.env.VITE_COMETCHAT_APP_ID,
    region: import.meta.env.VITE_COMETCHAT_REGION,
    authKey: import.meta.env.VITE_COMETCHAT_AUTH_KEY,
  }
}

function hasMissingConfig(config) {
  return (
    !config.appId ||
    !config.region ||
    !config.authKey ||
    config.appId.includes('your_') ||
    config.authKey.includes('your_')
  )
}

async function ensureInitialized(config) {
  if (CometChatUIKit.isInitialized?.()) {
    return
  }

  if (!initInFlight) {
    const settings = new UIKitSettingsBuilder()
      .setAppId(config.appId)
      .setRegion(config.region)
      .setAuthKey(config.authKey)
      .subscribePresenceForAllUsers()
      .build()

    initInFlight = CometChatUIKit.init(settings)
  }

  await initInFlight
}

async function ensureLoggedIn(uid) {
  const existing = await CometChatUIKit.getLoggedinUser()

  if (existing?.getUid?.() === uid) {
    return existing
  }

  if (existing) {
    await CometChatUIKit.logout()
  }

  if (loginInFlight) {
    await loginInFlight
    const afterWait = await CometChatUIKit.getLoggedinUser()
    if (afterWait?.getUid?.() === uid) {
      return afterWait
    }
  }

  loginInFlight = CometChatUIKit.login(uid)

  try {
    return await loginInFlight
  } finally {
    loginInFlight = null
  }
}

export function CometChatProvider({ children }) {
  const [uid, setUid] = useState(getInitialUid)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const config = useMemo(() => getConfig(), [])
  const peerUid = uid === TEST_USERS[0] ? TEST_USERS[1] : TEST_USERS[0]

  useEffect(() => {
    let cancelled = false

    async function start() {
      setError('')

      if (hasMissingConfig(config)) {
        setStatus('missing-config')
        return
      }

      setStatus('loading')

      try {
        await ensureInitialized(config)
        await ensureLoggedIn(uid)

        if (!cancelled) {
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || String(err))
          setStatus('error')
        }
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [config, uid])

  function switchUser(nextUid) {
    const url = new URL(window.location.href)
    url.searchParams.set('uid', nextUid)
    window.history.replaceState({}, '', url)
    setUid(nextUid)
  }

  const value = {
    uid,
    peerUid,
    users: TEST_USERS,
    status,
    error,
    switchUser,
  }

  return (
    <CometChatContext.Provider value={value}>
      {children}
    </CometChatContext.Provider>
  )
}
