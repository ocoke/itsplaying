<template>
  
    <main>

      <div v-if="data.item" class="mp-now">
        <!-- <div class="user-text pb-12 pl-6" v-if="user">
          <p>{{ user }} is playing:</p>
        </div> -->
        <div class="cover w-full sm:w-1/2">
         
          <img
            :src="data.item.images[0].url"
            alt="album cover"
            ref="img"
            crossorigin="anonymous"
            width="480"
            height="480"
          />
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
            src="https://itsplaying.vercel.app/blank.jpg"
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
  
  const apiUrl = 'https://curly-space-tribble-5577wg9j4r7f7wrj-8000.app.github.dev' + '/api/get?id=' + urlParams.get('id')
  
  const data = ref({})
  
  // when page loads, fetch data
  data.value = await fetch(apiUrl, {
    method: 'GET',
  })
    .then((response) => response.text())
    .then((text) => (text ? JSON.parse(text).data : {}))
  
  console.log(data.value)
  
  document.title = (data.value.item ? data.value.item.name + ' by ' + data.value.item.artists[0] : 'Not playing') + ' | itsplaying'
  
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
    // change page icon
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = img.value.src
  
    // change text color and page background color
  
    img.value.addEventListener('load', function () {
      const color = colorThief.getColor(img.value)
      console.log(color)
      document.body.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      trackTitle.value.style.color = trackArtists.value.style.color = copyright.value.style.color = pickTextColor(
        color,
        '#FFFFFF',
        '#000000'
      )
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
  
    document.title = (data.value.item ? data.value.item.name + ' by ' + data.value.item.artists[0].name : 'Not playing') + ' | itsplaying'
  }, 5000)
  </script>
  
