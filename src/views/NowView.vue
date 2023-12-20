<template>
  <main>
    <div v-if="data.item" class="mp-now">
      <div class="cover w-1/2">
        <img
          :src="data.item.album.images[0].url"
          alt="album cover"
          ref="img"
          crossorigin="anonymous"
          width="480"
          height="480"
        />
      </div>
      <div class="meta w-1/2">
        <div style="width: 100%;">
          <div class="track-title" ref="trackTitle">{{ data.item.name }}</div>
          <div class="track-artists" ref="trackArtists">
            <span v-for="(i, index) in data.item.artists" v-bind:key="i"
              >{{ i.name }}<span v-if="index != data.item.artists.length - 1">,&nbsp;</span></span
            >
          </div>
        </div>
      </div>
    </div>
    <div v-else class="mp-now">
      <div class="cover w-1/2">
        <img
          src="https://sdfsdf.dev/100x100.jpg,F3F4F6,transparent"
          alt="album cover"
          ref="img"
          crossorigin="anonymous"
          width="480"
          height="480"
        />
      </div>
      <div class="meta w-1/2">
        <div class="track-title" ref="trackTitle">Not playing</div>
        <!-- <div class="track-artists" ref="trackArtists"><span v-for="(i, index) in data.item.artists" v-bind:key="i">{{ i.name }}<span v-if="index != data.item.artists.length - 1">,&nbsp;</span></span></div> -->
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue'
import ColorThief from 'colorthief'
const apiUrl = 'https://api.spotify.com/v1/me/player/currently-playing'
const auths = 'Bearer ' + localStorage.getItem('access_token')

const data = ref({})

// when page loads, fetch data
data.value = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    Authorization: auths
  }
})
  .then((response) => response.text())
  .then((text) => (text ? JSON.parse(text) : {}))

console.log(data.value)

document.title = (data.value.item ? data.value.item.name + ' by ' + data.value.item.artists[0].name : 'Not playing') + ' | itsplaying'

const colorThief = new ColorThief()

const pickTextColor = (bgColor, lightColor, darkColor) => {
  // calculate luminance
  for (let i in bgColor) {
    bgColor[i] /= 255
    // if c <= 0.04045 then c = c/12.92 else c = ((c+0.055)/1.055) ^ 2.4
    if (bgColor[i] <= 0.04045) {
      bgColor[i] = bgColor[i] / 12.92
    } else {
      bgColor[i] = Math.pow((bgColor[i] + 0.055) / 1.055, 2.4)
    }
  }
  const L = 0.2126 * bgColor[0] + 0.7152 * bgColor[1] + 0.0722 * bgColor[2]
  if (L > 0.179) {
    return darkColor
  } else {
    return lightColor
  }
}

const img = ref()
const trackTitle = ref()
const trackArtists = ref()

watch(img, () => {
  // if (img.value.complete) {
  //     const color = colorThief.getColor(img.value)
  //     console.log(color)
  //     document.body.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  //     trackTitle.value.style.color = trackArtists.value.style.color = pickTextColor(color, '#FFFFFF', '#000000');
  // } else {
  img.value.addEventListener('load', function () {
    const color = colorThief.getColor(img.value)
    console.log(color)
    document.body.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    trackTitle.value.style.color = trackArtists.value.style.color = pickTextColor(
      color,
      '#FFFFFF',
      '#000000'
    )
  })
  // }
})
const clientId = 'ec175b1073e64c099e8e0156532c7cb6'
const getRefreshToken = async () => {
  // refresh token that has been previously stored
  const refreshToken = localStorage.getItem('refresh_token')
  const url = 'https://accounts.spotify.com/api/token'

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId
    })
  }
  const body = await fetch(url, payload)
  const response = await body.json()
  

  if (response && response.error) {
    // handle error
    router.push('/auth?error=refresh_token')
  }

  localStorage.setItem('access_token', response.accessToken)
  localStorage.setItem('refresh_token', response.refreshToken)
}

// setInterval, fetch data every 10 seconds

setInterval(async () => {
  const expiresAt = localStorage.getItem('expires_at')
  if (new Date().getTime() > Number(expiresAt)) {
    getRefreshToken()
  }

  data.value = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: auths
    }
  })
    .then((response) => response.text())
    .then((text) => (text ? JSON.parse(text) : {}))

  document.title = (data.value.item ? data.value.item.name + ' by ' + data.value.item.artists[0].name : 'Not playing') + ' | itsplaying'


  // img.value.addEventListener('load', function() {
  //     const color = colorThief.getColor(img.value)
  //     console.log(color)
  //     document.body.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  //     trackTitle.value.style.color = trackArtists.value.style.color = pickTextColor(color, '#FFFFFF', '#000000');
  // });
}, 8000)
</script>
