import type { Api } from '@jellyfin/sdk'
import { BaseAPI } from '@jellyfin/sdk/lib/generated-client/base.js'
import type { AxiosPromise, Method, RawAxiosRequestConfig } from 'axios'
import { AUDIOMUSE_BASE_PATH } from './constants.js'
import type {
	AlchemyRequest,
	AlchemyResult,
	CancelAllTasksResponse,
	CancelTaskResponse,
	ChatPlaylistRequest,
	ChatPlaylistResponse,
	ClapSearchRequest,
	ClapSearchResponse,
	CreateChatPlaylistRequest,
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
 * same way the generated `@jellyfin/sdk` clients do.
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

	/** Gets the plugin version and the routes it exposes. */
	getInfo(options?: RawAxiosRequestConfig) {
		return this.request<PluginInfo>('GET', 'info', {}, options)
	}

	/** Resolves when the plugin can reach the AudioMuse AI backend. */
	getHealth(options?: RawAxiosRequestConfig) {
		return this.request<void>('GET', 'health', {}, options)
	}

	/** Checks whether the plugin can reach an AudioMuse AI backend at `backendUrl`. */
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

	/** Searches analyzed tracks by title and/or artist. */
	searchTracks(params: SearchTracksParams, options?: RawAxiosRequestConfig) {
		return this.request<AudioMuseTrack[]>('GET', 'search_tracks', { params }, options)
	}

	/** Gets tracks that sound like the seed track. */
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

	/** Gets artists similar to the given artist. */
	getSimilarArtists(params: SimilarArtistsParams, options?: RawAxiosRequestConfig) {
		return this.request<SimilarArtist[]>('GET', 'similar_artists', { params }, options)
	}

	/** Gets the largest distance from a track to any other track in the index. */
	getMaxDistance(itemId: string, options?: RawAxiosRequestConfig) {
		return this.request<MaxDistanceResponse>(
			'GET',
			'max_distance',
			{ params: { item_id: itemId } },
			options,
		)
	}

	/** Builds a smooth sequence of tracks between two songs. */
	findPath(params: FindPathParams, options?: RawAxiosRequestConfig) {
		return this.request<FindPathResponse>('GET', 'find_path', { params }, options)
	}

	// Text and semantic search

	/** Finds tracks whose audio matches a free-text description. */
	clapSearch(body: ClapSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<ClapSearchResponse>('POST', 'clap/search', { data: body }, options)
	}

	/** Finds tracks whose lyrics match a free-text query. */
	lyricsSearch(body: LyricsSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<LyricsSearchResponse>(
			'POST',
			'lyrics/search/text',
			{ data: body },
			options,
		)
	}

	/** Finds tracks similar to a seed using the merged lyrics and audio index. */
	semGroveSearch(body: SemGroveSearchRequest, options?: RawAxiosRequestConfig) {
		return this.request<SemGroveSearchResponse>(
			'POST',
			'sem_grove/search',
			{ data: body },
			options,
		)
	}

	/** Ranks tracks by hyperbolic distance from a seed. */
	hyperbolicSimilar(body: HyperbolicSimilarRequest, options?: RawAxiosRequestConfig) {
		return this.request<HyperbolicSimilarResponse>(
			'POST',
			'hyperbolic/similar',
			{ data: body },
			options,
		)
	}

	/** Blends songs and artists into a centroid and returns the nearest tracks. */
	alchemy(body: AlchemyRequest, options?: RawAxiosRequestConfig) {
		return this.request<AlchemyResult[]>('POST', 'alchemy', { data: body }, options)
	}

	// Playlists

	/** Gets the playlists generated by the last clustering run. */
	getPlaylists(options?: RawAxiosRequestConfig) {
		return this.request<PlaylistsResponse>('GET', 'playlists', {}, options)
	}

	/** Creates a Jellyfin playlist from track ids. */
	createPlaylist(body: CreatePlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<CreatePlaylistResponse>(
			'POST',
			'create_playlist',
			{ data: body },
			options,
		)
	}

	/** Asks the configured AI provider to build a playlist from a prompt. */
	chatPlaylist(body: ChatPlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<ChatPlaylistResponse>('POST', 'chat/playlist', { data: body }, options)
	}

	/** Saves the result of {@link chatPlaylist} as a Jellyfin playlist. */
	createChatPlaylist(body: CreateChatPlaylistRequest, options?: RawAxiosRequestConfig) {
		return this.request<{ message: string }>(
			'POST',
			'chat/create_playlist',
			{ data: body },
			options,
		)
	}

	/** Recommends tracks based on a user's listening history. */
	generateSonicFingerprint(params: SonicFingerprintParams, options?: RawAxiosRequestConfig) {
		return this.request<SonicFingerprintResult[]>(
			'GET',
			'sonic_fingerprint/generate',
			{ params },
			options,
		)
	}

	// Tasks

	/** Starts analyzing recently added albums. */
	startAnalysis(body: StartAnalysisRequest = {}, options?: RawAxiosRequestConfig) {
		return this.request<TaskEnqueuedResponse>('POST', 'analysis', { data: body }, options)
	}

	/** Starts clustering the library into playlists. */
	startClustering(body: StartClusteringRequest = {}, options?: RawAxiosRequestConfig) {
		return this.request<TaskEnqueuedResponse>('POST', 'clustering', { data: body }, options)
	}

	getTaskStatus(taskId: string, options?: RawAxiosRequestConfig) {
		return this.request<TaskStatus>('GET', `status/${encodeURIComponent(taskId)}`, {}, options)
	}

	cancelTask(taskId: string, options?: RawAxiosRequestConfig) {
		return this.request<CancelTaskResponse>(
			'POST',
			`cancel/${encodeURIComponent(taskId)}`,
			{},
			options,
		)
	}

	/** Cancels every active task whose type starts with the prefix, e.g. `main_analysis`. */
	cancelAllTasks(taskTypePrefix: string, options?: RawAxiosRequestConfig) {
		return this.request<CancelAllTasksResponse>(
			'POST',
			`cancel_all/${encodeURIComponent(taskTypePrefix)}`,
			{},
			options,
		)
	}

	/** Gets the most recent top-level task. */
	getLastTask(options?: RawAxiosRequestConfig) {
		return this.request<LastTask>('GET', 'last_task', {}, options)
	}

	/** Gets the running top-level task, or an empty object when none is running. */
	getActiveTask(options?: RawAxiosRequestConfig) {
		return this.request<Partial<TaskStatus>>('GET', 'active_tasks', {}, options)
	}
}

/**
 * Creates an {@link AudioMuseApi} that shares the given {@link Api}'s server and credentials.
 *
 * @param api The Jellyfin SDK {@link Api} instance.
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
