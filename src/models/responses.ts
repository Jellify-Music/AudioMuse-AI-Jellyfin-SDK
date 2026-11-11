import type { AudioMuseApi } from '../audiomuse-api.js'
import type { AudioMuseTrack, HyperbolicMode } from './common.js'
import type { ClapSearchRequest } from './requests.js'
import type {
	AlchemyResult,
	ClapSearchResult,
	HyperbolicResult,
	LyricsSearchResult,
	PathTrack,
	SemGroveResult,
} from './results.js'

/**
 * Error body returned by the AudioMuse AI backend. Read it from the `response.data` of
 * the `AxiosError` a failed request throws.
 */
export interface AudioMuseErrorResponse {
	/** A human-readable error message. */
	error?: string
	/** A machine-readable error code. */
	error_code?: string
	/** The category of the error. */
	error_class?: string
	/** A more detailed error message. */
	error_message?: string
	[key: string]: unknown
}

// Plugin

/** Response from {@link AudioMuseApi.getInfo}. */
export interface PluginInfo {
	/** The installed plugin version, for example `'1.2.3.0'`. */
	Version: string
	/** Every route the plugin exposes, in the form `'GET /AudioMuseAI/similar_tracks'`. */
	AvailableEndpoints: string[]
}

/** Response from {@link AudioMuseApi.testConnection}. */
export interface TestConnectionResponse {
	/** Whether the backend answered. */
	success: boolean
	/** A human-readable result, including the failure reason. */
	message: string
}

// Similarity

/** Response from {@link AudioMuseApi.getMaxDistance}. */
export interface MaxDistanceResponse {
	/** The largest distance from the track to any other track in the index. */
	max_distance: number
	/** The Jellyfin item id of the farthest track. */
	farthest_item_id: string | null
}

/** Response from {@link AudioMuseApi.findPath}. */
export interface FindPathResponse {
	/** The tracks from start to end, including both. */
	path: PathTrack[]
	/** The sum of the distances between consecutive tracks. */
	total_distance: number
}

// Text and semantic search

/** Response from {@link AudioMuseApi.clapSearch}. */
export interface ClapSearchResponse {
	/** The query that was searched. */
	query: string
	/** The number of results. */
	count: number
	/** The matching tracks, best match first. */
	results: ClapSearchResult[]
	/**
	 * The query's strongest concepts and how each steering term changed it. Only present
	 * when {@link ClapSearchRequest.explain} and {@link ClapSearchRequest.steering} are set.
	 */
	steering_explain?: unknown
}

/** Response from {@link AudioMuseApi.lyricsSearch}. */
export interface LyricsSearchResponse {
	/** The query that was searched. */
	query: string
	/** The number of results. */
	count: number
	/** The matching tracks, best match first. */
	results: LyricsSearchResult[]
}

/** Response from {@link AudioMuseApi.semGroveSearch}. */
export interface SemGroveSearchResponse {
	/**
	 * The similar tracks, most similar first, including the seed. The plugin replaces the
	 * backend's `similarity` with `distance` (`1 - similarity`).
	 */
	results: SemGroveResult[]
	/** The number of results. */
	count: number
}

/** Response from {@link AudioMuseApi.hyperbolicSimilar}. */
export interface HyperbolicSimilarResponse {
	/** The matching tracks, nearest first. */
	results: HyperbolicResult[]
	/** The number of results. */
	count: number
	/** The mode that was used. */
	mode: HyperbolicMode
	/** The seed's distance from the center of the Poincaré ball, or `null` when unknown. */
	seed_radius: number | null
	/** The Jellyfin item id of the seed track. */
	seed_item_id: string
	/** The radial spread that was used. */
	radial_spread: number
}

/**
 * Response from {@link AudioMuseApi.alchemy}.
 *
 * Only the main fields are declared. The backend also returns projection and anchor data
 * used by its own UI.
 */
export interface AlchemyResponse {
	/** The blended tracks. */
	results: AlchemyResult[]
	/** Tracks that were near the blend but too close to a `SUBTRACT` item. */
	filtered_out: AlchemyResult[]
	/** The blend's `ADD` centroid in the backend's 2D map projection. */
	centroid_2d: number[] | null
	/** The full `ADD` centroid vector, or `null` when there is none. */
	add_centroid_vector: number[] | null
	/** The full `SUBTRACT` centroid vector, or `null` when there is none. */
	subtract_centroid_vector: number[] | null
	[key: string]: unknown
}

// Playlists

/** Response from {@link AudioMuseApi.getPlaylists}. */
export interface PlaylistsResponse {
	/** Whether the backend serves more than one media server. */
	multi_server: boolean
	/** The playlists of each media server, default server first. */
	servers: {
		/** The backend's id for the media server. May be `null`. */
		server_id: string | null
		/** The media server's display name. */
		server_name: string
		/** Whether this is the backend's default media server. */
		is_default: boolean
		/** Generated playlists keyed by playlist name. */
		playlists: Record<string, AudioMuseTrack[]>
	}[]
}

/** Response from {@link AudioMuseApi.createPlaylist}. */
export interface CreatePlaylistResponse {
	/** A human-readable result. */
	message: string
	/** The Jellyfin item id of the new playlist. */
	playlist_id: string
	/** The number of tracks added to the playlist. */
	mapped: number
	/** The number of tracks that could not be found on the server and were left out. */
	skipped: number
}

// Instant playlists (chat)

/** Response from {@link AudioMuseApi.chatPlaylist}. */
export interface ChatPlaylistResponse {
	response: {
		/** A log of the AI interaction and processing. */
		message: string
		/** The `userInput` from the request. */
		original_request: string
		/** The AI provider that was used. */
		ai_provider_used: string
		/** The AI model that was used. */
		ai_model_selected: string
		/** The last query the AI ran, or `null` when none ran. */
		executed_query: string | null
		/** The tracks for the playlist, or `null` when none were found. */
		query_results:
			| {
					/** The Jellyfin item id of the track. */
					item_id: string
					/** The track title. */
					title: string
					/** The track artist. */
					artist: string
			  }[]
			| null
	}
}

/** Response from {@link AudioMuseApi.createChatPlaylist}. */
export interface CreateChatPlaylistResponse {
	/** A human-readable result that includes the new playlist's id. */
	message: string
}
