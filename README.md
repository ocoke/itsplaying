# `itsplaying`

> 🎵 Get the current music that's playing and display it to other people.

## ✨ Features

- [x] Now Playing Screen, with cover, artist, name and a matching background color.
- [x] Public API, integrate with your app (GitHub README), show the music that you're playing to others.
- [ ] Other features? [New Issue](https://github.com/ocoke/itsplaying/issues/new).

## 🙌 Getting Started

### 🤔 Prepare

<!-- - A way to deploy `itsplaying` (serverless platforms are recommended). -->
- A Spotify account, either free or pro plan is okay.

### 🔗 Link

> [!TIP]
> As default, we provided a Spotify App to get your current playing status.

- Visit [`/auth`](https://itsplaying.deno.dev/auth), and click `Sign in with Spotify` to sign in.
- Then, sign in to your Spotify account and click `Agree` to grant `itsplaying` to visit your status.

![image](https://github.com/ocoke/itsplaying/assets/71591824/29278fb3-d0d5-4577-900b-dd7438b44465)

- The app will automatically redirect you back to the homepage, if an error occurs, please try again.
- Now, you can visit [`/now`](https://itsplaying.deno.dev/now) to get the current playing status.

### 😀 Share

- Visit [`/share`](https://itsplaying.deno.dev/share), type your server URL (you can keep default), and click `Share` to sign in.

![image](https://github.com/ocoke/itsplaying/assets/71591824/aa7fbe99-36ea-4b27-9d37-96b11a7373aa)

- After signing in, you can see the sharing URL.

#### 🗒️ JSON Format

```
https://[server]/api/get?id=[id]
https://itsplaying.deno.dev/api/get?id=31ldqmkw53rigxjzgmf5wht465u4
```

#### 🗒️ Sharing Page

```
https://[server]/card?id=[id]
https://itsplaying.deno.dev/card?id=31ldqmkw53rigxjzgmf5wht465u4
https://itsplaying.deno.dev/card?id=31ldqmkw53rigxjzgmf5wht465u4&progress=true
```

> With query `&progress=true` can enable playing progress.

#### 🗒️ GitHub README

Because of the dynamic background color, `itsplaying` is using screenshots to display in GitHub README.

We're still exploring other good ways to show the picture.

> I'm using a Web screenshot API ([/Lete114/WebStack-Screenshot](https://github.com/Lete114/WebStack-Screenshot)).

```markdown
[![An error occurred when fetching images. Refresh the page to try again, or click here to open the link. ](https://webstack-screenshot.vercel.app/?url=https%3A%2F%2Fitsplaying.deno.dev%2Fcard%3Fid%3D31ldqmkw53rigxjzgmf5wht465u4%26progress%3Dtrue&viewport=1200x600&timeout=0&cache=5)](https://itsplaying.deno.dev/card?id=31ldqmkw53rigxjzgmf5wht465u4&progress=true)
```



## 👨‍💻 Screenshots

![image](https://github.com/ocoke/itsplaying/assets/71591824/37a55ab7-c5aa-428d-9dad-7be6dd9032af)

![image](https://github.com/ocoke/itsplaying/assets/71591824/7e6bdb02-9554-46e6-bc96-ec79723326e0)

![image](https://github.com/ocoke/itsplaying/assets/71591824/15cd574f-2401-4dd6-bb24-433b5d6ff1a2)

![image](https://github.com/ocoke/itsplaying/assets/71591824/5558bed6-d21e-423e-a50b-b63ff20c383d)

![image](https://github.com/ocoke/itsplaying/assets/71591824/4ac55e15-b158-4fe2-b152-0fccc542444d)
