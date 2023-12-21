import generateRandomString from './randomString.ts';
import { serveDir, serveFile } from "https://deno.land/std@0.188.0/http/file_server.ts";
const reponseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept',
}

export default async function handler(req: Request): Response | Promise<Response> {
    const clientId: string = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret: string = Deno.env.get('SPOTIFY_CLIENT_SECRET')
    const redirect_uri: string = Deno.env.get('ITSPLAYING_SERVER') + '/api/callback'

    const url: object = new URL(req.url)
    const path: string = url.pathname

    if (path.startsWith('/api/auth')) {
        const state: string = generateRandomString(16)
        const scope: string = 'user-read-currently-playing'
        let authUri: string = 'https://accounts.spotify.com/authorize'
        authUri += '?response_type=code'
        authUri += '&client_id=' + encodeURIComponent(clientId)
        authUri += '&scope=' + encodeURIComponent(scope)
        authUri += '&redirect_uri=' + encodeURIComponent(redirect_uri)
        authUri += '&state=' + encodeURIComponent(state)

        return new Response(JSON.stringify({
            code: 200,
            data: authUri
        }), {
            headers: reponseHeaders
        })
    }

    if (path.startsWith('/api/callback')) {
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')
        if (error) {
            return new Response(JSON.stringify({
                code: 400,
                data: error
            }), {
                headers: reponseHeaders
            })
        }
        // send token reqeust
        let tokenUri: string = 'https://accounts.spotify.com/api/token'
        tokenUri += '?grant_type=authorization_code'
        tokenUri += '&code=' + encodeURIComponent(code)
        tokenUri += '&redirect_uri=' + encodeURIComponent(redirect_uri)
        const reqHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        }
        const tokenResp = await fetch(tokenUri, {
            method: 'POST',
            headers: reqHeaders
        }).then(res => res.json())

        // fetch user data
        const userUri: string = 'https://api.spotify.com/v1/me'

        const userResp = await fetch(userUri, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + tokenResp.access_token
            }
        }).then(res => res.json())

        const kv = await Deno.openKv()

        const datas = {
            id: userResp.id,
            access_token: tokenResp.access_token,
            refresh_token: tokenResp.refresh_token,
            expires_at: new Date().getTime() + tokenResp.expires_in * 1000,
        }

        if (!userResp.id) {
            return new Response(JSON.stringify({
                code: 400,
                data: 'An error occurred while fetching user data'
            }), {
                headers: reponseHeaders
            })
        }

        const result = await kv.set(['user', userResp.id], datas)


        


        return new Response(
            "", {
            status: 307,
            headers: {
                Location: (Deno.env.get('ITSPLAYING_FRONTEND') || 'https://itsplaying.vercel.app') + '/share?id=' + userResp.id
            }
        })

    }


    if (path.startsWith('/api/get')) {
        const id = url.searchParams.get('id')
        const kv = await Deno.openKv()
        const user = await kv.get(['user', id])
        if (!user.value) {
            return new Response(JSON.stringify({
                code: 404,
                data: 'Not Found'
            }), {
                headers: reponseHeaders
            })
        } else {
            let access_token = user.value.access_token
            let expires_at = user.value.expires_at
            let refresh_token = user.value.refresh_token
            // console.log(access_token, expires_at, refresh_token)
            if (!access_token || !expires_at || !refresh_token) {
                return new Response(JSON.stringify({
                    code: 404,
                    data: 'Not Found'
                }), {
                    headers: reponseHeaders
                })
            }

            if (new Date().getTime() > expires_at) {

                // expired, refresh token
                // console.log('expired')
                let tokenUri: string = 'https://accounts.spotify.com/api/token'
                tokenUri += '?grant_type=refresh_token'
                tokenUri += '&refresh_token=' + encodeURIComponent(refresh_token)
                const refreshTokenResp = await fetch(tokenUri, {
                    method: 'POST',
                    headers: {
                        Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret)
                    },
                }).then(res => res.json()).catch(err => {
                    return new Response(JSON.stringify({
                        code: 400,
                        data: err
                    }), {
                        headers: reponseHeaders
                    })
                })

                if (refreshTokenResp.error) {
                    return new Response(JSON.stringify({
                        code: 400,
                        data: refreshTokenResp.error
                    }), {
                        headers: reponseHeaders
                    })
                }
                access_token = refreshTokenResp.access_token
                expires_at = new Date().getTime() + refreshTokenResp.expires_in
                refresh_token = refreshTokenResp.refresh_token
                // write in new token
                const datas = {
                    id: user.value.id,
                    access_token: access_token,
                    refresh_token: refresh_token,
                    expires_at: expires_at,
                }
        
                const result = await kv.set(['user', user.value.id], datas)
            }

            // fetch now playing data
            const nowPlayingUri: string = 'https://api.spotify.com/v1/me/player/currently-playing'
            const dataResp = await fetch(nowPlayingUri, {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            }).then(res => res.json())
            if (dataResp.error) {
                return new Response(JSON.stringify({
                    code: 400,
                    data: dataResp.error
                }), {
                    headers: reponseHeaders
                })
            }
            const data = {
                is_playing: dataResp.is_playing,
                item: {
                    name: dataResp.item.name,
                    artists: dataResp.item.artists.map((artist: { name: string }) => artist.name),
                    album: dataResp.item.album.name,
                    images: dataResp.item.album.images,
                    duration_ms: dataResp.item.duration_ms,
                    progress_ms: dataResp.progress_ms,
                    uri: dataResp.item.uri,
                    popularity: dataResp.item.popularity,
                },
            }
            return new Response(JSON.stringify({
                code: 200,
                data: data
            }), {
                headers: reponseHeaders
            })
        }
    }
    // return await fetch((Deno.env.get('ITSPLAYING_FRONTEND') || 'https://itsplaying.vercel.app') + path)


    // for vite output, serve from dist
    if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.map') || path.endsWith('.ico')) {
        return serveDir(req, {
            fsRoot: "./dist",
        });
    } else {
        return serveFile(req, "./dist/index.html");
    }
}