import generateRandomString from "./randomString.ts";
import getCurrentPlaying from "./getCurrentPlaying.ts";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.188.0/http/file_server.ts";
// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
// import webstackScreenshot from "npm:webstack-screenshot"
const reponseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, Accept",
};

export default async function handler(
  req: Request,
): Response | Promise<Response> {
  const clientId: string = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret: string = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const redirect_uri: string = Deno.env.get("ITSPLAYING_SERVER") +
    "/api/callback";

  const url: object = new URL(req.url);
  const path: string = url.pathname;

  if (path.startsWith("/api/auth")) {
    const state: string = generateRandomString(16);
    const scope: string = "user-read-currently-playing";
    let authUri: string = "https://accounts.spotify.com/authorize";
    authUri += "?response_type=code";
    authUri += "&client_id=" + encodeURIComponent(clientId);
    authUri += "&scope=" + encodeURIComponent(scope);
    authUri += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    authUri += "&state=" + encodeURIComponent(state);

    return new Response(
      JSON.stringify({
        code: 200,
        data: authUri,
      }),
      {
        headers: reponseHeaders,
      },
    );
  }

  if (path.startsWith("/api/callback")) {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error) {
      return new Response(
        JSON.stringify({
          code: 400,
          data: error,
        }),
        {
          headers: reponseHeaders,
        },
      );
    }
    // send token reqeust
    let tokenUri: string = "https://accounts.spotify.com/api/token";
    tokenUri += "?grant_type=authorization_code";
    tokenUri += "&code=" + encodeURIComponent(code);
    tokenUri += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    const reqHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
    };
    const tokenResp = await fetch(tokenUri, {
      method: "POST",
      headers: reqHeaders,
    }).then((res) => res.json());

    // fetch user data
    const userUri: string = "https://api.spotify.com/v1/me";

    const userResp = await fetch(userUri, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + tokenResp.access_token,
      },
    }).then((res) => res.json());

    const kv = await Deno.openKv();

    const datas = {
      id: userResp.id,
      access_token: tokenResp.access_token,
      refresh_token: tokenResp.refresh_token,
      expires_at: new Date().getTime() + tokenResp.expires_in * 1000,
    };

    if (!userResp.id) {
      return new Response(
        JSON.stringify({
          code: 400,
          data: "An error occurred while fetching user data",
        }),
        {
          headers: reponseHeaders,
        },
      );
    }

    const result = await kv.set(["user", userResp.id], datas);

    return new Response("", {
      status: 307,
      headers: {
        Location:
          (Deno.env.get("ITSPLAYING_FRONTEND") ||
            "https://itsplaying.deno.dev") +
          "/share?id=" +
          userResp.id,
      },
    });
  }

  if (path.startsWith("/api/get.png")) {
    const id = url.searchParams.get("id")
    const webstackScreenshotAPI = Deno.env.get("WEBSTACK_SCREENSHOT_API") ||
      "https://webstack-screenshot.vercel.app";
    const kv = await Deno.openKv();
    const user = await kv.get(["user", id]);
    if (!user.value) {
      return new Response(
        JSON.stringify({
          code: 404,
          data: "Not Found",
        }),
        {
          headers: reponseHeaders,
        },
      );
    } else {
      let access_token = user.value.access_token;
      let expires_at = user.value.expires_at;
      let refresh_token = user.value.refresh_token;
      // console.log(access_token, expires_at, refresh_token)
      if (!access_token || !expires_at || !refresh_token) {
        return new Response(
          JSON.stringify({
            code: 404,
            data: "Not Found",
          }),
          {
            headers: reponseHeaders,
          },
        );
      }

      if (new Date().getTime() > expires_at) {
        // expired, refresh token
        // console.log('expired')
        let tokenUri: string = "https://accounts.spotify.com/api/token";
        tokenUri += "?grant_type=refresh_token";
        tokenUri += "&refresh_token=" + encodeURIComponent(refresh_token);
        const refreshTokenResp = await fetch(tokenUri, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
          },
        })
          .then((res) => res.json())
          .catch((err) => {
            return new Response(
              JSON.stringify({
                code: 400,
                data: err,
              }),
              {
                headers: reponseHeaders,
              },
            );
          });

        if (refreshTokenResp.error) {
          return new Response(
            JSON.stringify({
              code: 400,
              data: refreshTokenResp.error,
            }),
            {
              headers: reponseHeaders,
            },
          );
        }
        access_token = refreshTokenResp.access_token;
        expires_at = new Date().getTime() + refreshTokenResp.expires_in * 1000;
        refresh_token = refreshTokenResp.refresh_token;
        // write in new token
        const datas = {
          id: user.value.id,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: expires_at,
        };

        const result = await kv.set(["user", user.value.id], datas);
      }

      const currentPlaying = await getCurrentPlaying(access_token);
      const name = currentPlaying.data.item.name;
      const artists = currentPlaying.data.item.artists.join(",");
      const album = currentPlaying.data.item.images[1].url;
      let rqUrl = webstackScreenshotAPI + "/";
      rqUrl += "?url=" +
        encodeURIComponent(
          Deno.env.get("ITSPLAYING_FRONTEND") || "https://itsplaying.deno.dev" +
              "/card?name=" + encodeURIComponent(name) +
              "&artists=" + encodeURIComponent(artists) +
              "&album=" + encodeURIComponent(album),
        );

      return new Response(rqUrl);
    }
  }

  if (path.startsWith("/api/get.json")) {
    const id = url.searchParams.get("id");
    const kv = await Deno.openKv();
    const user = await kv.get(["user", id]);
    if (!user.value) {
      return new Response(
        JSON.stringify({
          code: 404,
          data: "Not Found",
        }),
        {
          headers: reponseHeaders,
        },
      );
    } else {
      let access_token = user.value.access_token;
      let expires_at = user.value.expires_at;
      let refresh_token = user.value.refresh_token;
      // console.log(access_token, expires_at, refresh_token)
      if (!access_token || !expires_at || !refresh_token) {
        return new Response(
          JSON.stringify({
            code: 404,
            data: "Not Found",
          }),
          {
            headers: reponseHeaders,
          },
        );
      }

      if (new Date().getTime() > expires_at) {
        // expired, refresh token
        // console.log('expired')
        let tokenUri: string = "https://accounts.spotify.com/api/token";
        tokenUri += "?grant_type=refresh_token";
        tokenUri += "&refresh_token=" + encodeURIComponent(refresh_token);
        const refreshTokenResp = await fetch(tokenUri, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
          },
        })
          .then((res) => res.json())
          .catch((err) => {
            return new Response(
              JSON.stringify({
                code: 400,
                data: err,
              }),
              {
                headers: reponseHeaders,
              },
            );
          });

        if (refreshTokenResp.error) {
          return new Response(
            JSON.stringify({
              code: 400,
              data: refreshTokenResp.error,
            }),
            {
              headers: reponseHeaders,
            },
          );
        }
        access_token = refreshTokenResp.access_token;
        expires_at = new Date().getTime() + refreshTokenResp.expires_in * 1000;
        refresh_token = refreshTokenResp.refresh_token;
        // write in new token
        const datas = {
          id: user.value.id,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: expires_at,
        };

        const result = await kv.set(["user", user.value.id], datas);
      }

      // fetch now playing data

      return new Response(
        JSON.stringify(await getCurrentPlaying(access_token)),
        {
          headers: reponseHeaders,
        },
      );
    }
  }
  // return await fetch((Deno.env.get('ITSPLAYING_FRONTEND') || 'https://itsplaying.vercel.app') + path)

  // for vite output, serve from dist
  if (
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".map") ||
    path.endsWith(".ico")
  ) {
    return serveDir(req, {
      fsRoot: "./dist",
    });
  } else {
    return serveFile(req, "./dist/index.html");
  }
}
