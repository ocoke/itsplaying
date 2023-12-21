<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'

const router = useRouter()
// can replace with your own client id
const clientId = 'ec175b1073e64c099e8e0156532c7cb6'

const getRefreshToken = async () => {
  // refresh token that has been previously stored
  const refreshToken = localStorage.getItem('refresh_token');
  const url = "https://accounts.spotify.com/api/token";

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId
    }),
  }
  const body = await fetch(url, payload);
  const response = await body.json();

  if (response && response.error) {
    // handle error
    router.push('/auth?error=refresh_token')
    return false
  } else {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
  }
}


if (!localStorage.getItem("access_token") && !localStorage.getItem("refresh_token") && !localStorage.getItem("code_verifier") && !localStorage.getItem("server_manage_id") && location.pathname != "/card" && location.pathname != "/auth") {
  router.push('/auth')
} else {
  const expiresAt = localStorage.getItem("expires_at");
  if (new Date().getTime() > Number(expiresAt) && location.pathname != "/card") {
    getRefreshToken()
  }
}
</script>

<template>
  <Suspense><RouterView /></Suspense>
</template>
