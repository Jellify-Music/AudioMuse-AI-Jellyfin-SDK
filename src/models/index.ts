/**
 * Request and response models for the AudioMuse AI Jellyfin plugin.
 *
 * The plugin proxies most routes straight through to the AudioMuse AI backend, so
 * these shapes mirror the backend's OpenAPI docstrings. Where the backend leaves a
 * shape undocumented, the model only declares the fields known to be present.
 */

/** A track as returned by most AudioMuse search and similarity endpoints. */
export interface AudioMuseTrack {
	/** The Jellyfin item id of the track. */
	item_id: string
	title: string
	/** The track artist. */
	author: string
	/** Album name, or `'unknown'` when missing. */
	album?: string
}

/** A track with a distance from the seed. Lower is more similar. */
export interface AudioMuseScoredTrack extends AudioMuseTrack {
	distance: number
}

/** Error payload returned by the AudioMuse AI backend. */
export interface AudioMuseErrorResponse {
	error?: string
	error_code?: string
	error_class?: string
	error_message?: string
	[key: string]: unknown
}

// Plugin

export interface PluginInfo {
	Version: string
	/** Entries in the form `'GET /AudioMuseAI/similar_tracks'`. */
	AvailableEndpoints: string[]
}

export interface TestConnectionResponse {
	success: boolean
	message: string
}

// Similarity

export interface SearchTracksParams {
	/** Partial or full track title. At least one of `title` or `artist` is required. */
	title?: string
	/** Partial or full artist name. At least one of `title` or `artist` is required. */
	artist?: string
}

export interface SimilarTracksParams {
	/** The Jellyfin item id of the seed track. Use this or `title` and `artist`. */
	item_id?: string
	title?: string
	artist?: string
	/**
	 * Number of similar tracks to return. Required because the plugin forwards a
	 * missing value as `0`, which the backend clamps to a single result.
	 */
	n: number
	/** Limit songs per artist. Omit to use the server default. */
	eliminate_duplicates?: boolean
}

export interface SimilarArtistsParams {
	/** The artist name. Use this or `artist_id`. */
	artist?: string
	/** The Jellyfin item id of the artist. */
	artist_id?: string
	/**
	 * Number of similar artists to return. Required because the plugin forwards a
	 * missing value as `0`.
	 */
	n: number
	/** HNSW search parameter. Higher is more accurate but slower. */
	ef_search?: number
	include_component_matches?: boolean
}

export interface SimilarArtist {
	artist: string
	artist_id: string | null
	divergence: number
	/** Only present when `include_component_matches` is set. */
	component_matches?: unknown[]
}

export interface MaxDistanceResponse {
	max_distance: number
	farthest_item_id: string | null
}

export interface FindPathParams {
	start_song_id: string
	end_song_id: string
	/** Maximum number of intermediate songs. Defaults to the server's configured length. */
	max_steps?: number
}

export interface PathTrack extends AudioMuseTrack {
	embedding_vector: number[]
	top_genre?: string
	/** Other analysis fields from the backend's score table. */
	[key: string]: unknown
}

export interface FindPathResponse {
	path: PathTrack[]
	total_distance: number
}

// Text and semantic search

export interface ClapSteeringTerm {
	/** A concept term returned by the backend's CLAP concepts endpoint. */
	term: string
	/** Snapped to the nearest published alpha step (currently 1, 2, 3, 5 or 10). */
	weight?: number
	direction?: 'more' | 'less'
}

export interface ClapSearchRequest {
	query: string
	limit?: number
	explain?: boolean
	steering?: ClapSteeringTerm[]
}

export interface ClapSearchResult extends AudioMuseTrack {
	similarity: number
}

export interface ClapSearchResponse {
	query: string
	count: number
	results: ClapSearchResult[]
	steering_explain?: unknown
}

export interface LyricsSearchRequest {
	query: string
	limit?: number
}

/** The backend does not document this row, so only the common track fields are declared. */
export type LyricsSearchResult = AudioMuseTrack & Record<string, unknown>

export interface LyricsSearchResponse {
	query: string
	count: number
	results: LyricsSearchResult[]
}

export interface SemGroveSearchRequest {
	/** The Jellyfin item id of the seed track. */
	item_id: string
	limit?: number
}

export interface SemGroveResult extends AudioMuseScoredTrack {
	top_genre?: string
	top_mood?: string
	/** Set on the seed track, which is included in the results. */
	is_seed?: boolean
}

export interface SemGroveSearchResponse {
	/** The plugin replaces the backend's `similarity` with `distance` (`1 - similarity`). */
	results: SemGroveResult[]
	count: number
}

export type HyperbolicMode = 'similar' | 'roots' | 'niche'

export interface HyperbolicSimilarRequest {
	/** The Jellyfin item id of the seed track. */
	item_id: string
	mode?: HyperbolicMode
	limit?: number
	/** Only used by the `roots` and `niche` modes. Between 0 and 0.99. */
	radial_spread?: number
}

export interface HyperbolicResult extends AudioMuseScoredTrack {
	/** The raw Poincaré distance. The plugin rescales `distance` to `d / (1 + d)`. */
	hyperbolic_distance: number
	hyperbolic_radius?: number
	top_genre?: string
}

export interface HyperbolicSimilarResponse {
	results: HyperbolicResult[]
	count: number
	mode: HyperbolicMode
	seed_radius: number | null
	seed_item_id: string
	radial_spread: number
}

export type AlchemyOperation = 'ADD' | 'SUBTRACT'

export type AlchemyItemType = 'song' | 'artist' | 'anchor' | 'mood' | 'playlist'

export interface AlchemyItem {
	id: string
	op: AlchemyOperation
	type?: AlchemyItemType
}

/** The backend does not document this row, so only the common track fields are declared. */
export type AlchemyResult = AudioMuseTrack & Record<string, unknown>

export interface AlchemyRequest {
	/** At least one `ADD` item is required. */
	items: AlchemyItem[]
	n?: number
	temperature?: number
	subtract_distance?: number
}

// Playlists

export interface PlaylistsResponse {
	multi_server: boolean
	servers: {
		server_id: string | null
		server_name: string
		is_default: boolean
		/** Generated playlists keyed by playlist name. */
		playlists: Record<string, AudioMuseTrack[]>
	}[]
}

export interface CreatePlaylistRequest {
	playlist_name: string
	track_ids: string[]
}

export interface CreatePlaylistResponse {
	message: string
	playlist_id: string
	mapped: number
	skipped: number
}

// Instant playlists (chat)

export type ChatAiProvider = 'OLLAMA' | 'OPENAI' | 'GEMINI' | 'MISTRAL' | 'NONE'

export interface ChatPlaylistRequest {
	userInput: string
	ai_provider?: ChatAiProvider
	ai_model?: string
	ollama_server_url?: string
	openai_server_url?: string
	openai_api_key?: string
	gemini_api_key?: string
	mistral_api_key?: string
	n?: number
}

export interface ChatPlaylistResponse {
	response: {
		message: string
		original_request: string
		ai_provider_used: string
		ai_model_selected: string
		executed_query: string | null
		query_results: { item_id: string; title: string; artist: string }[] | null
	}
}

export interface CreateChatPlaylistRequest {
	playlist_name: string
	item_ids: string[]
}

// Sonic fingerprint

/** The backend does not document this row, so only the common track fields are declared. */
export type SonicFingerprintResult = AudioMuseTrack & Record<string, unknown>

export interface SonicFingerprintParams {
	/** The Jellyfin user name or user id. */
	jellyfin_user_identifier: string
	/** A Jellyfin access token for that user. */
	jellyfin_token: string
	n?: number
}

// Tasks

export interface TaskEnqueuedResponse {
	task_id: string
	task_type: string
	status?: string
}

export interface StartAnalysisRequest {
	num_recent_albums?: number
	top_n_moods?: number
}

/**
 * Clustering overrides. Every field is optional and falls back to the server's
 * configuration. See the AudioMuse AI backend docs for the full list.
 */
export interface StartClusteringRequest {
	top_n_clustering_playlist?: number
	clustering_method?: 'kmeans' | 'dbscan' | 'gmm' | 'spectral'
	num_clusters_min?: number
	num_clusters_max?: number
	clustering_runs?: number
	max_songs_per_cluster?: number
	top_n_moods?: number
	enable_clustering_embeddings?: boolean
	ai_model_provider?: 'OLLAMA' | 'GEMINI' | 'MISTRAL' | 'NONE'
	[key: string]: unknown
}

export interface TaskStatus {
	task_id: string
	/** For example `PENDING`, `STARTED`, `PROGRESS`, `SUCCESS`, `FAILURE` or `REVOKED`. */
	state: string
	status_message: string
	/** Percentage from 0 to 100. */
	progress: number
	running_time_seconds: number
	details: Record<string, unknown>
	task_type_from_db: string | null
}

export interface LastTask {
	task_id: string | null
	task_type: string | null
	status: string
	progress: number
	details: Record<string, unknown>
	running_time_seconds: number
}

export interface CancelTaskResponse {
	message: string
	task_id: string
	cancelled_jobs_count: number
}

export interface CancelAllTasksResponse {
	message: string
	cancelled_main_tasks: string[]
}
