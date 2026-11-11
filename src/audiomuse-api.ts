import type { Api } from '@jellyfin/sdk'
import { BaseAPI } from '@jellyfin/sdk/lib/generated-client/base.js'
import type { AxiosPromise, Method, RawAxiosRequestConfig } from 'axios'
import { AUDIOMUSE_BASE_PATH, type AUDIOMUSE_PLUGIN_NAME } from './constants.js'
import type {
	AlchemyRequest,
	AlchemyResponse,
	CancelAllTasksResponse,
	CancelTaskResponse,
	ChatPlaylistRequest,
	ChatPlaylistResponse,
	ClapSearchRequest,
	ClapSearchResponse,
	CreateChatPlaylistRequest,
	CreateChatPlaylistResponse,
	CreatePlaylistRequest,
	CreatePlaylistResponse,
	FindPathParams,
	FindPathResponse,
	HyperbolicSimilarRequest,
	HyperbolicSimilarResponse,
	LastTask,
	LyricsSearchRequest,
	LyricsSearchResponse,
	MaxDistanceResponse,
	PlaylistsResponse,
	PluginInfo,
	SearchTracksParams,
	SemGroveSearchRequest,
	SemGroveSearchResponse,
	SimilarArtist,
	SimilarArtistsParams,
	SimilarTracksParams,
	SonicFingerprintParams,
	SonicFingerprintResult,
	StartAnalysisRequest,
	StartClusteringRequest,
	AudioMuseErrorResponse,
	AudioMuseScoredTrack,
	AudioMuseTrack,
	TaskEnqueuedResponse,
	TaskStatus,
	TestConnectionResponse,
} from './models/index.js'

/**
 * Client for the routes the AudioMuse AI Jellyfin plugin adds under `/AudioMuseAI`.
 *
 * Shares the {@link Api} instance's base path, auth headers and axios instance, the
 * same way the generated `@jellyfin/sdk` clients do. Create one with
 * {@link getAudioMuseApi}.
 *
 * Every method resolves to an `AxiosResponse` and rejects with an `AxiosError` on a
 * non-2xx status. For errors from the AudioMuse AI backend, the error's `response.data`
 * is an {@link AudioMuseErrorResponse}.
 *
 * @example
 * ```ts
 * const audioMuse = getAudioMuseApi(api)
 * const { data: tracks } = await audioMuse.getSimilarTracks({ item_id: trackId, n: 25 })
 * ```
 */
export class AudioMuseApi extends BaseAPI {
	private request<T>(
		method: Method,
		path: string,
		{ params, data }: { params?: object; data?: unknown },
		options: RawAxiosRequestConfig = {},
	): AxiosPromise<T> {
		const baseOptions = this.configuration?.baseOptions ?? {}

		return this.axios.request<T>({
			...baseOptions,
			...options,
			method,
			url: `${this.basePath}/${AUDIOMUSE_BASE_PATH}/${path}`,
			params: params && withoutUndefined(params),
			data,
			headers: { ...baseOptions.headers, ...options.headers },
		})
	}

	// Plugin

	/**
	 * Gets the plugin version and the routes it exposes. Answered by the plugin itself,
	 * so it works even when the backend is down.
	 *
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The plugin info.
	 */
	getInfo(options?: RawAxiosRequestConfig) {
		return this.request<PluginInfo>('GET', 'info', {}, options)
	}

	/**
	 * Checks whether the plugin can reach its configured AudioMuse AI backend.
	 *
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns An empty response when the backend is healthy.
	 * @throws `AxiosError` with the backend's status code when it is not healthy.
	 */
	getHealth(options?: RawAxiosRequestConfig) {
		return this.request<void>('GET', 'health', {}, options)
	}

	/**
	 * Checks whether the plugin can reach an AudioMuse AI backend at a URL, using the
	 * plugin's configured API token. Useful for validating a URL before saving it in the
	 * plugin settings.
	 *
	 * @param backendUrl The base URL of the backend, for example `'http://audiomuse:8000'`.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns Whether the connection worked, with a message.
	 * @throws `AxiosError` when the connection fails. The error's `response.data` is still
	 * a {@link TestConnectionResponse} with the reason.
	 */
	testConnection(backendUrl: string, options?: RawAxiosRequestConfig) {
		return this.request<TestConnectionResponse>(
			'POST',
			'test_connection',
			// The plugin binds the body as a JSON string, not an object.
			{ data: JSON.stringify(backendUrl) },
			mergeHeaders(options, { 'Content-Type': 'application/json' }),
		)
	}

	// Similarity

	/**
	 * Searches analyzed tracks by title, artist or both. Meant for autocomplete, so it
	 * returns a short page of matches.
	 *
	 * @param params The search terms. At least one of `title` or `artist` is required.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The matching tracks.
	 */
	searchTracks(params: SearchTracksParams, options?: RawAxiosRequestConfig) {
		return this.request<AudioMuseTrack[]>('GET', 'search_tracks', { params }, options)
	}

	/**
	 * Gets tracks that sound like a seed track.
	 *
	 * @param params The seed track and how many results to return.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The similar tracks, most similar first.
	 * @throws `AxiosError` with status 400 when the seed is missing, or 404 when it is not
	 * in the index.
	 *
	 * @example
	 * ```ts
	 * const { data } = await audioMuse.getSimilarTracks({
	 * 	item_id: trackId,
	 * 	n: 25,
	 * 	eliminate_duplicates: true,
	 * })
	 * ```
	 */
	getSimilarTracks(
		{ eliminate_duplicates, ...params }: SimilarTracksParams,
		options?: RawAxiosRequestConfig,
	) {
		return this.request<AudioMuseScoredTrack[]>(
			'GET',
			'similar_tracks',
			{ params: { ...params, eliminate_duplicates: eliminate_duplicates?.toString() } },
			options,
		)
	}

	/**
	 * Gets artists similar to a seed artist.
	 *
	 * @param params The seed artist and how many results to return.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The similar artists, most similar first.
	 * @throws `AxiosError` with status 404 when the artist is not found, or 503 when the
	 * backend's artist index is not ready.
	 */
	getSimilarArtists(params: SimilarArtistsParams, options?: RawAxiosRequestConfig) {
		return this.request<SimilarArtist[]>('GET', 'similar_artists', { params }, options)
	}

	/**
	 * Gets the largest distance from a track to any other track in the index. Useful for
	 * turning a {@link AudioMuseScoredTrack.distance} into a relative score.
	 *
	 * @param itemId The Jellyfin item id of the track.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The largest distance and the farthest track.
	 * @throws `AxiosError` with status 404 when the track is not in the index.
	 */
	getMaxDistance(itemId: string, options?: RawAxiosRequestConfig) {
		return this.request<MaxDistanceResponse>(
			'GET',
			'max_distance',
			{ params: { item_id: itemId } },
			options,
		)
	}

	/**
	 * Builds a smooth sequence of tracks from one song to another.
	 *
	 * @param params The start and end tracks.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The path, including the start and end tracks.
	 * @throws `AxiosError` with status 400 when the start and end are the same, or 404 when
	 * no path is found within `max_steps`.
	 */
	findPath(params: FindPathParams, options?: RawAxiosRequestConfig) {
		return this.request<FindPathResponse>('GET', 'find_path', { params }, options)
	}

	// Text and semantic search

	/**
	 * Finds tracks whose audio matches a free-text description, using CLAP embeddings.
	 *
	 * @param body The query and search options.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The matching tracks, best match first.
	 * @throws `AxiosError` with status 400 when CLAP is disabled or the query is missing,
	 * or 503 when the CLAP index is not loaded yet.
	 *
	 * @example
	 * ```ts
	 * const { data } = await audioMuse.clapSearch({
	 * 	query: 'upbeat summer songs',
	 * 	limit: 50,
	 * 	steering: [{ term: 'piano', direction: ClapSteeringDirection.Less }],
	 * })
	 * ```
	 */
	clapSearch(body: ClapSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<ClapSearchResponse>('POST', 'clap/search', { data: body }, options)
	}

	/**
	 * Finds tracks whose lyrics match a free-text description.
	 *
	 * @param body The query and result limit.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The matching tracks, best match first.
	 * @throws `AxiosError` with status 400 when lyrics search is disabled or the query is
	 * missing, or 404 when nothing matches.
	 */
	lyricsSearch(body: LyricsSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<LyricsSearchResponse>(
			'POST',
			'lyrics/search/text',
			{ data: body },
			options,
		)
	}

	/**
	 * Finds tracks similar to a seed in both lyrics and sound, using the merged SemGrove
	 * index.
	 *
	 * @param body The seed track and result limit.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The similar tracks, most similar first, including the seed.
	 * @throws `AxiosError` with status 404 when the seed is not in the SemGrove index,
	 * which needs both lyrics and audio analysis.
	 */
	semGroveSearch(body: SemGroveSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<SemGroveSearchResponse>(
			'POST',
			'sem_grove/search',
			{ data: body },
			options,
		)
	}

	/**
	 * Ranks tracks by hyperbolic distance from a seed. Use the mode to look for broader
	 * or more niche tracks than the seed.
	 *
	 * @param body The seed track, mode and result limit.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The matching tracks, nearest first.
	 * @throws `AxiosError` with status 400 when the seed has no projection or the
	 * hyperbolic index is not built yet.
	 */
	hyperbolicSimilar(body: HyperbolicSimilarRequest, options?: RawAxiosRequestConfig) {
		return this.request<HyperbolicSimilarResponse>(
			'POST',
			'hyperbolic/similar',
			{ data: body },
			options,
		)
	}

	/**
	 * Blends songs, artists, moods and other items into a centroid and returns the
	 * tracks nearest to it, skipping tracks near any `SUBTRACT` items.
	 *
	 * @param body The items to blend and sampling options.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The blended tracks and the blend's centroid.
	 * @throws `AxiosError` with status 400 when there is no `ADD` item.
	 *
	 * @example
	 * ```ts
	 * const { data } = await audioMuse.alchemy({
	 * 	items: [
	 * 		{ id: trackId, op: AlchemyOperation.Add },
	 * 		{ id: 'sad', op: AlchemyOperation.Subtract, type: AlchemyItemType.Mood },
	 * 	],
	 * 	n: 50,
	 * })
	 * ```
	 */
	alchemy(body: AlchemyRequest, options?: RawAxiosRequestConfig) {
		return this.request<AlchemyResponse>('POST', 'alchemy', { data: body }, options)
	}

	// Playlists

	/**
	 * Gets the playlists generated by the last clustering run, grouped by media server.
	 *
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The generated playlists.
	 */
	getPlaylists(options?: RawAxiosRequestConfig) {
		return this.request<PlaylistsResponse>('GET', 'playlists', {}, options)
	}

	/**
	 * Creates a Jellyfin playlist from track ids.
	 *
	 * @param body The playlist name and tracks.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The new playlist's id and how many tracks were added.
	 */
	createPlaylist(body: CreatePlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<CreatePlaylistResponse>(
			'POST',
			'create_playlist',
			{ data: body },
			options,
		)
	}

	/**
	 * Asks an AI provider to build a playlist from a natural-language request. This only
	 * picks the tracks. Save them with {@link createChatPlaylist}.
	 *
	 * @param body The request and optional AI settings.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The picked tracks and a log of the AI's work.
	 * @throws `AxiosError` with status 400 when the request is missing or too long.
	 */
	chatPlaylist(body: ChatPlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<ChatPlaylistResponse>('POST', 'chat/playlist', { data: body }, options)
	}

	/**
	 * Saves tracks from {@link chatPlaylist} as a Jellyfin playlist.
	 *
	 * @param body The playlist name and tracks.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns A message with the new playlist's id.
	 */
	createChatPlaylist(body: CreateChatPlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<CreateChatPlaylistResponse>(
			'POST',
			'chat/create_playlist',
			{ data: body },
			options,
		)
	}

	/**
	 * Recommends tracks that match a user's listening history.
	 *
	 * @param params The Jellyfin user and how many tracks to return.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The recommended tracks.
	 * @throws `AxiosError` with status 400 when the user or token is missing.
	 */
	generateSonicFingerprint(params: SonicFingerprintParams, options?: RawAxiosRequestConfig) {
		return this.request<SonicFingerprintResult[]>(
			'GET',
			'sonic_fingerprint/generate',
			{ params },
			options,
		)
	}

	// Tasks

	/**
	 * Starts analyzing the most recently added albums in the background. Starting a new
	 * analysis archives earlier successful tasks.
	 *
	 * @param body Overrides for the server's analysis settings.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The new task. Follow it with {@link getTaskStatus}.
	 */
	startAnalysis(body: StartAnalysisRequest = {}, options?: RawAxiosRequestConfig) {
		return this.request<TaskEnqueuedResponse>('POST', 'analysis', { data: body }, options)
	}

	/**
	 * Starts clustering the library into playlists in the background. Get the playlists
	 * with {@link getPlaylists} once it finishes.
	 *
	 * @param body Overrides for the server's clustering settings.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The new task. Follow it with {@link getTaskStatus}.
	 * @throws `AxiosError` with status 409 when a clustering task is already running.
	 */
	startClustering(body: StartClusteringRequest = {}, options?: RawAxiosRequestConfig) {
		return this.request<TaskEnqueuedResponse>('POST', 'clustering', { data: body }, options)
	}

	/**
	 * Gets the status of a task.
	 *
	 * @param taskId The id of the task.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The task's state, progress and details.
	 * @throws `AxiosError` with status 404 when the task is not found.
	 */
	getTaskStatus(taskId: string, options?: RawAxiosRequestConfig) {
		return this.request<TaskStatus>('GET', `status/${encodeURIComponent(taskId)}`, {}, options)
	}

	/**
	 * Cancels a task and its child tasks.
	 *
	 * @param taskId The id of the task.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns How many jobs were cancelled.
	 * @throws `AxiosError` with status 400 when the task is no longer active, or 404 when
	 * it is not found.
	 */
	cancelTask(taskId: string, options?: RawAxiosRequestConfig) {
		return this.request<CancelTaskResponse>(
			'POST',
			`cancel/${encodeURIComponent(taskId)}`,
			{},
			options,
		)
	}

	/**
	 * Cancels every active top-level task of a type, and their child tasks.
	 *
	 * @param taskTypePrefix The task type, for example `'main_analysis'` or `'main_clustering'`.
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The ids of the cancelled tasks.
	 * @throws `AxiosError` with status 404 when no active task of that type exists.
	 */
	cancelAllTasks(taskTypePrefix: string, options?: RawAxiosRequestConfig) {
		return this.request<CancelAllTasksResponse>(
			'POST',
			`cancel_all/${encodeURIComponent(taskTypePrefix)}`,
			{},
			options,
		)
	}

	/**
	 * Gets the most recent top-level task, such as an analysis or clustering run.
	 *
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The task, with `null` ids when no task has ever run.
	 */
	getLastTask(options?: RawAxiosRequestConfig) {
		return this.request<LastTask>('GET', 'last_task', {}, options)
	}

	/**
	 * Gets the running top-level task, if any.
	 *
	 * @param options Axios request config, for things like an `AbortSignal`.
	 * @returns The running task, or an empty object when none is running.
	 */
	getActiveTask(options?: RawAxiosRequestConfig) {
		return this.request<Partial<TaskStatus>>('GET', 'active_tasks', {}, options)
	}
}

/**
 * Creates an {@link AudioMuseApi} that shares the given {@link Api}'s server and credentials.
 *
 * The plugin must be installed on the server. Check for it by looking for
 * {@link AUDIOMUSE_PLUGIN_NAME} in `getPluginApi(api).getPlugins()`.
 *
 * @param api The Jellyfin SDK {@link Api} instance.
 * @returns The AudioMuse AI client.
 *
 * @example
 * ```ts
 * const audioMuse = getAudioMuseApi(api)
 * ```
 */
export function getAudioMuseApi(api: Api) {
	return new AudioMuseApi(api.configuration, undefined, api.axiosInstance)
}

function withoutUndefined(params: object) {
	return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
}

function mergeHeaders(
	options: RawAxiosRequestConfig = {},
	headers: Record<string, string>,
): RawAxiosRequestConfig {
	return { ...options, headers: { ...headers, ...options.headers } }
}
