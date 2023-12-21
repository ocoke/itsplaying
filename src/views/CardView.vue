<template>
  
    <main>

      <div v-if="data && data.item" class="mp-now">
        <!-- <div class="user-text pb-12 pl-6" v-if="user">
          <p>{{ user }} is playing:</p>
        </div> -->
        <div class="cover w-full sm:w-1/2">
         
          <div class='img'>
            <img
            :src="data.item.images[0].url"
            alt="album cover"
            ref="img"
            crossorigin="anonymous"
            width="480"
            height="480"
            class=""
          />
  
          <div class="w-full bg-gray-300 mt-7 mb-1 rounded-full h-1" v-show="showProgress" ref="progressBar">
            <div class="bg-white h-1 rounded-full opacity-50" ref="progress" style="width: 0;"></div>
          </div></div>
        </div>
        <div class="meta w-full sm:w-1/2">
          <div style="width: 100%;">
            <div class="track-title" ref="trackTitle">{{ data.item.name }}</div>
            <div class="track-artists" ref="trackArtists">
              <span v-for="(i, index) in data.item.artists" v-bind:key="i"
                >{{ i }}<span v-if="index != data.item.artists.length - 1">,&nbsp;</span></span
              >
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mp-now">
        <div class="cover w-full sm:w-1/2">
          <img
            src="/blank.jpg"
            alt="album cover"
            ref="img"
            crossorigin="anonymous"
            width="480"
            height="480"
          />
        </div>
        <div class="meta w-full sm:w-1/2">
          <div class="track-title" ref="trackTitle">Not playing</div>
          <!-- <div class="track-artists" ref="trackArtists"><span v-for="(i, index) in data.item.artists" v-bind:key="i">{{ i.name }}<span v-if="index != data.item.artists.length - 1">,&nbsp;</span></span></div> -->
        </div>
      </div>
      
    </main>
    <div class="copyright">
      <p ref="copyright">Powered by <a href="https://github.com/ocoke/itsplaying">itsplaying</a></p>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import ColorThief from 'colorthief'
  
  const urlParams = new URLSearchParams(window.location.search)
  let user = urlParams.get('user')
  const showProgress = urlParams.get('progress') == 'true'
  const progressBar = ref()
  const progress = ref()
  
  const apiUrl =  '/api/get?id=' + urlParams.get('id')
  
  const data = ref({})
  
  // when page loads, fetch data
  data.value = await fetch(apiUrl, {
    method: 'GET',
  })
    .then((response) => response.text())
    .then((text) => (text ? JSON.parse(text).data : {}))
  
  console.log(data.value)

  setTimeout(() => {
    if (data.value.item) {
      const durationMs = data.value.item.duration_ms
      const progressMs = data.value.item.progress_ms

      const progressWidth = (progressMs / durationMs) * 100

      console.log(progress.value)
      if (progress.value) {
        progress.value.style.width = progressWidth + '%'
      }
    }
  }, 200)


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
  const copyright = ref()
  
  watch(img, () => {
  
    // change text color and page background color
  
    img.value.addEventListener('load', function () {
      const color = colorThief.getColor(img.value)
      console.log(color)
      document.body.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      if (progressBar.value) {
        progressBar.value.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      }
      trackTitle.value.style.color = trackArtists.value.style.color = copyright.value.style.color = pickTextColor(
        color,
        '#FFFFFF',
        '#000000'
      )
      
      if (progress.value) {
        progress.value.style.backgroundColor = trackTitle.value.style.color
      }
    })
    // }
  })

  
  // setInterval, fetch data every 10 seconds
  
  setInterval(async () => {

    data.value = await fetch(apiUrl, {
      method: 'GET',
    })
      .then((response) => response.text())
      .then((text) => (text ? JSON.parse(text).data : {}))
    
   if (data.value.item) {
    const durationMs = data.value.item.duration_ms
    const progressMs = data.value.item.progress_ms
    const progressWidth = (progressMs / durationMs) * 100
    if (progress.value) {
      progress.value.style.transition = 'all 4.5s'
      progress.value.style.width = progressWidth + '%'
    }
   }
  }, 5000)
  </script>
  
