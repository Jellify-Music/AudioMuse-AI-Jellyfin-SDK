# AudioMuse-AI-Jellyfin-SDK

Typed client for the [AudioMuse AI](https://github.com/NeptuneHub/AudioMuse-AI) endpoints exposed by its [Jellyfin plugin](https://github.com/NeptuneHub/audiomuse-ai-plugin), built on [`@jellyfin/sdk`](https://github.com/jellyfin/jellyfin-sdk-typescript).

It follows the same pattern as the SDK's own `getXxxApi()` helpers, so requests share your `Api` instance's server URL, credentials and axios instance.

## Install

```sh
bun add @jellify-music/audiomuse-ai-jellyfin-sdk
```

`@jellyfin/sdk` and `axios` are peer dependencies.

## Usage

```ts
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api'
import { AUDIOMUSE_PLUGIN_NAME, getAudioMuseApi } from '@jellify-music/audiomuse-ai-jellyfin-sdk'

// Check the plugin is installed first
const { data: plugins } = await getPluginApi(api).getPlugins()
const isAudioMuseInstalled = plugins.some((plugin) => plugin.Name === AUDIOMUSE_PLUGIN_NAME)

const audioMuse = getAudioMuseApi(api)

const { data: similar } = await audioMuse.getSimilarTracks({ item_id: trackId, n: 25 }, { signal })
const { data: results } = await audioMuse.clapSearch({ query: 'upbeat summer songs', limit: 50 })
```

Every method takes an optional axios request config as its last argument, for things like an `AbortSignal`.

## Endpoints

All routes live under `/AudioMuseAI` on the Jellyfin server.

| Method                     | Route                                |
| -------------------------- | ------------------------------------ |
| `getInfo`                  | `GET info`                           |
| `getHealth`                | `GET health`                         |
| `testConnection`           | `POST test_connection`               |
| `searchTracks`             | `GET search_tracks`                  |
| `getSimilarTracks`         | `GET similar_tracks`                 |
| `getSimilarArtists`        | `GET similar_artists`                |
| `getMaxDistance`           | `GET max_distance`                   |
| `findPath`                 | `GET find_path`                      |
| `clapSearch`               | `POST clap/search`                   |
| `lyricsSearch`             | `POST lyrics/search/text`            |
| `semGroveSearch`           | `POST sem_grove/search`              |
| `hyperbolicSimilar`        | `POST hyperbolic/similar`            |
| `alchemy`                  | `POST alchemy`                       |
| `getPlaylists`             | `GET playlists`                      |
| `createPlaylist`           | `POST create_playlist`               |
| `chatPlaylist`             | `POST chat/playlist`                 |
| `createChatPlaylist`       | `POST chat/create_playlist`          |
| `generateSonicFingerprint` | `GET sonic_fingerprint/generate`     |
| `startAnalysis`            | `POST analysis`                      |
| `startClustering`          | `POST clustering`                    |
| `getTaskStatus`            | `GET status/{task_id}`               |
| `cancelTask`               | `POST cancel/{task_id}`              |
| `cancelAllTasks`           | `POST cancel_all/{task_type_prefix}` |
| `getLastTask`              | `GET last_task`                      |
| `getActiveTask`            | `GET active_tasks`                   |

The plugin also replaces Jellyfin's `GET /Items/{itemId}/InstantMix` with a sonic-similarity mix. That route keeps Jellyfin's request and response shape, so call it with `getInstantMixApi(api).getInstantMixFromItem()` from `@jellyfin/sdk`.

## Notes

- Most routes pass requests straight through to the AudioMuse AI backend, so the response types come from the backend's OpenAPI docs. A few rows the backend leaves undocumented are typed loosely.
- `getSimilarTracks` and `getSimilarArtists` require `n`. The plugin forwards a missing `n` as `0`, which returns a single result.
- The plugin rewrites `semGroveSearch` and `hyperbolicSimilar` responses: `distance` is normalized to 0–1, and hyperbolic results keep the raw value in `hyperbolic_distance`.

## Development

```sh
bun install
bun test
bun run typecheck
bun run build
```

## License

[MIT](LICENSE)
