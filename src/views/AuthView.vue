<template>
  <main class="auth-center-btngroup">
    <div v-if="authError" class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        An error occurred while signing in with Spotify. (<span class="font-mono">`{{ error }}`</span>)
    </div>
    <div v-if="!isCallback">
      <button
        type="button"
        @click="signinSpotify"
        class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
      >
        Sign in with Spotify
      </button>
    </div>

    
    <div v-else></div>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
// can replace with your own client id
const clientId = 'ec175b1073e64c099e8e0156532c7cb6'
const redirectUri = 'https://curly-space-tribble-5577wg9j4r7f7wrj-5173.app.github.dev/auth'

const scope = 'user-read-currently-playing user-read-playback-state'
const authUrl = new URL('https://accounts.spotify.com/authorize')

let authError = ref(false)
const getToken = async (code) => {
  // stored in the previous step
  let codeVerifier = localStorage.getItem('code_verifier')

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  }

  const url = new URL('https://accounts.spotify.com/api/token')
  const body = await fetch(url, payload)
  const response = await body.json()
  if (response && response.error) {
    authError.value = true
    error.value = response.error
  }
  if (response && response.access_token) {
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    localStorage.setItem('expires_at', new Date().getTime() + response.expires_in * 1000)

    // redirect to home page
    router.push('/')
  } else {
    authError.value = true
  }

  
}

const urlParams = new URLSearchParams(window.location.search)
let code = urlParams.get('code')
let error = ref(urlParams.get('error'))
let isCallback = false
if (code) {
  isCallback = true
  getToken(code)
}
if (error.value) {
  authError.value = true
}

const signinSpotify = async () => {
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const values = crypto.getRandomValues(new Uint8Array(length))
    return values.reduce((acc, x) => acc + possible[x % possible.length], '')
  }

  const codeVerifier = generateRandomString(64)

  const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }

  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed)



  
  // generated in the previous step
  window.localStorage.setItem('code_verifier', codeVerifier)

  const params = {
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri
  }

  authUrl.search = new URLSearchParams(params).toString()
  window.location.href = authUrl.toString()
}
</script>
