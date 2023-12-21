const getCurrentPlaying = async (access_token: string) => {
  const nowPlayingUri: string =
    "https://api.spotify.com/v1/me/player/currently-playing";
  const dataRespString = await fetch(nowPlayingUri, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + access_token,
    },
  }).then((res) => res.text());
  if (dataRespString === "" || !dataRespString) {
    return {
        code: 204,
        data: null
    }
  }
  const dataResp = JSON.parse(dataRespString);
  if (dataResp.error) {
    return {
        code: 400,
        data: dataResp.error,
    }
  }
  const data = {
    is_playing: dataResp.is_playing,
    item: {
      name: dataResp.item.name,
      artists: dataResp.item.artists.map((artist: { name: string }) =>
        artist.name
      ),
      album: dataResp.item.album.name,
      images: dataResp.item.album.images,
      duration_ms: dataResp.item.duration_ms,
      progress_ms: dataResp.progress_ms,
      uri: dataResp.item.uri,
      popularity: dataResp.item.popularity,
    },
  };
  return {
    code: 200,
    data,
  }
};
export default getCurrentPlaying;
