import type { AudioMuseApi } from '../audiomuse-api.js'
import type {
	AlchemyItemType,
	AlchemyOperation,
	ChatAiProvider,
	ClapSteeringDirection,
	HyperbolicMode,
} from './common.js'

// Similarity

/** Query for {@link AudioMuseApi.searchTracks}. At least one of `title` or `artist` is required. */
export interface SearchTracksParams {
	/** Part or all of the track title. */
	title?: string
	/** Part or all of the artist name. */
	artist?: string
}

/**
 * Query for {@link AudioMuseApi.getSimilarTracks}. Identify the seed track with either
 * `item_id`, or `title` and `artist` together.
 */
export interface SimilarTracksParams {
	/** The Jellyfin item id of the seed track. */
	item_id?: string
	/** The seed track's title. Must be used with `artist`. */
	title?: string
	/** The seed track's artist. Must be used with `title`. */
	artist?: string
	/**
	 * Number of similar tracks to return. Required because the plugin forwards a
	 * missing value as `0`, which the backend clamps to a single result.
	 */
	n: number
	/**
	 * When `true`, limits the number of tracks per artist in the results. When `false`,
	 * there is no limit. Omit to use the server default.
	 */
	eliminate_duplicates?: boolean
}

/**
 * Query for {@link AudioMuseApi.getSimilarArtists}. Identify the seed artist with either
 * `artist` or `artist_id`.
 */
export interface SimilarArtistsParams {
	/** The artist name. */
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
	/**
	 * Includes {@link SimilarArtist.component_matches}, which explain the match.
	 *
	 * @defaultValue `false`
	 */
	include_component_matches?: boolean
}

/** Query for {@link AudioMuseApi.findPath}. */
export interface FindPathParams {
	/** The Jellyfin item id of the first track. */
	start_song_id: string
	/** The Jellyfin item id of the last track. Must differ from `start_song_id`. */
	end_song_id: string
	/** Maximum number of intermediate tracks. Defaults to the server's configured path length. */
	max_steps?: number
}

// Text and semantic search

/** Steers a {@link ClapSearchRequest} toward or away from a sound concept. */
export interface ClapSteeringTerm {
	/**
	 * A concept term such as `piano`. Only terms published by the backend's CLAP concepts
	 * endpoint are accepted.
	 */
	term: string
	/**
	 * Strength of the steering. Any number is accepted and snapped to the nearest
	 * published step (currently 1, 2, 3, 5 or 10). Higher steps sharpen the query, while
	 * too high a weight lets the concept overrule the words.
	 *
	 * @defaultValue `3`
	 */
	weight?: number
	/** @defaultValue {@link ClapSteeringDirection.More} */
	direction?: ClapSteeringDirection
}

/** Body for {@link AudioMuseApi.clapSearch}. */
export interface ClapSearchRequest {
	/** A free-text description of the sound, for example `'upbeat summer songs'`. */
	query: string
	/**
	 * Number of tracks to return. Not capped.
	 *
	 * @defaultValue `50`
	 */
	limit?: number
	/**
	 * When `true` and `steering` is set, the response includes
	 * {@link ClapSearchResponse.steering_explain}.
	 *
	 * @defaultValue `false`
	 */
	explain?: boolean
	/** Up to 10 concepts to steer the search with. Omit for a plain search. */
	steering?: ClapSteeringTerm[]
}

/** Body for {@link AudioMuseApi.lyricsSearch}. */
export interface LyricsSearchRequest {
	/** A free-text description of the lyrics, for example `'songs about heartbreak in the rain'`. */
	query: string
	/**
	 * Number of tracks to return. Not capped.
	 *
	 * @defaultValue `50`
	 */
	limit?: number
}

/** Body for {@link AudioMuseApi.semGroveSearch}. */
export interface SemGroveSearchRequest {
	/**
	 * The Jellyfin item id of the seed track. It needs both lyrics and audio analysis to be
	 * in the SemGrove index.
	 */
	item_id: string
	/**
	 * Number of tracks to return. Not capped.
	 *
	 * @defaultValue `50`
	 */
	limit?: number
}

/** Body for {@link AudioMuseApi.hyperbolicSimilar}. */
export interface HyperbolicSimilarRequest {
	/** The Jellyfin item id of the seed track. */
	item_id: string
	/** @defaultValue {@link HyperbolicMode.Similar} */
	mode?: HyperbolicMode
	/**
	 * Number of tracks to return. Not capped.
	 *
	 * @defaultValue `50`
	 */
	limit?: number
	/**
	 * Only used by the `roots` and `niche` modes. The fraction, from 0 to 0.99, of the
	 * seed's remaining radial range that candidates must clear. Higher values search
	 * further inward or outward. Defaults to the server's configured spread.
	 */
	radial_spread?: number
}

/** One ingredient of an {@link AlchemyRequest}. */
export interface AlchemyItem {
	/** The id of the item. What it refers to depends on `type`. */
	id: string
	/** Whether to blend toward or away from this item. */
	op: AlchemyOperation
	/** @defaultValue {@link AlchemyItemType.Song} */
	type?: AlchemyItemType
}

/** Body for {@link AudioMuseApi.alchemy}. */
export interface AlchemyRequest {
	/** The items to blend. At least one `ADD` item is required. */
	items: AlchemyItem[]
	/** Number of tracks to return. Defaults to the server's configured count. */
	n?: number
	/**
	 * Softmax temperature for sampling the results. `0` returns the nearest tracks in
	 * order, and higher values add variety. Defaults to the server's configured temperature.
	 */
	temperature?: number
	/** Overrides how far results must be from each `SUBTRACT` item. */
	subtract_distance?: number
}

// Playlists

/** Body for {@link AudioMuseApi.createPlaylist}. */
export interface CreatePlaylistRequest {
	/** The name of the new playlist. */
	playlist_name: string
	/** The Jellyfin item ids of the tracks to add, in order. */
	track_ids: string[]
}

// Instant playlists (chat)

/**
 * Body for {@link AudioMuseApi.chatPlaylist}. Every AI setting is optional and falls back
 * to the server's configuration.
 */
export interface ChatPlaylistRequest {
	/**
	 * The natural-language request, for example `'Songs for a rainy afternoon'`. Requests
	 * longer than the server's limit (2000 characters by default) are rejected.
	 */
	userInput: string
	/** The AI provider to use. */
	ai_provider?: ChatAiProvider
	/** The model name to use with the provider, for example `'gemini-2.5-pro'`. */
	ai_model?: string
	/** A custom Ollama server URL. Only used with {@link ChatAiProvider.Ollama}. */
	ollama_server_url?: string
	/** A custom OpenAI-compatible server URL. Only used with {@link ChatAiProvider.OpenAi}. */
	openai_server_url?: string
	/** The OpenAI-compatible API key. Required with {@link ChatAiProvider.OpenAi}. */
	openai_api_key?: string
	/** A custom Gemini API key. */
	gemini_api_key?: string
	/** A custom Mistral API key. */
	mistral_api_key?: string
	/** Number of tracks the playlist should aim for. Defaults to the server's configured count. */
	n?: number
}

/** Body for {@link AudioMuseApi.createChatPlaylist}. */
export interface CreateChatPlaylistRequest {
	/** The name of the new playlist. */
	playlist_name: string
	/** The Jellyfin item ids of the tracks to add, in order. */
	item_ids: string[]
}

// Sonic fingerprint

/** Query for {@link AudioMuseApi.generateSonicFingerprint}. */
export interface SonicFingerprintParams {
	/** The Jellyfin user name or user id whose listening history to use. */
	jellyfin_user_identifier: string
	/** A Jellyfin access token for that user. */
	jellyfin_token: string
	/** Number of tracks to return. Defaults to the server's configured count. */
	n?: number
}
