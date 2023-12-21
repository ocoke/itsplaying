<template>
    <main class="auth-center-btngroup">
        <div class="max-w-lg text-left" v-if="id">
            <div class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
                <span class="font-medium">Signed in successfully!</span>
              </div>
            
                        
            <div class="block p-6 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 w-full">

                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">REST API</h5>
                <p class="font-normal text-gray-700 dark:text-gray-400">The server will automatically refresh your token. Use the following URL to access the data.</p>
                <blockquote class="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
                    <p class="font-mono select-all">{{currentUrl}}/api/get?id={{id}}</p>
                </blockquote>
            </div>
    
        </div>
        <div class="max-w-lg text-left" v-else>
            <div class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                Sharing your currently playing status needs a <span class="font-medium">itsplaying server</span>.
            </div>
            <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert" v-if="error">
                <span class="font-medium">Error: {{ error.message }}</span> 
                <details>
                    <pre v-if="error.details">{{ error.details }}</pre>
                </details>
            </div>
            <div class="mb-6 w-full">
                <label for="default-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white ml-1.5">Server URL</label>
                <input type="text" v-model="serverUrl" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            </div>
            <button type="button" class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 float-right" @click="share">Share</button>
        </div>
        <!-- <div class="fixed w-full h-full top-0 left-0" v-if="redirectUri">
            <iframe  :src="redirectUri" class="w-full h-full" onload="console.log(this.contentWindow.location)"></iframe>
        </div> -->
    </main>
  </template>

<script setup>
import { ref } from 'vue'
let currentUrl = localStorage.getItem('server_url') || location.origin
const error = ref(null)
const serverUrl = ref(currentUrl)
const redirectUri = ref(null)
const id = new URL(location.href).searchParams.get('id')
const share = async () => {
    serverUrl.value = new URL(serverUrl.value).origin
    localStorage.setItem('server_url', serverUrl.value)
    let resp = await fetch(serverUrl.value + '/api/auth', {
        method: 'GET',
    }).then(res => res.json()).catch(err => {
        error.value = {
            message: 'Failed to connect to server',
            details: err
        }
    })
    error.value = null
    location.href = resp.data
}
</script>