import type { AudioMuseApi } from '../audiomuse-api.js'

/**
 * A track as returned by most AudioMuse search and similarity endpoints.
 *
 * Ids are always the Jellyfin item ids. The backend translates its internal ids before
 * responding.
 */
export interface AudioMuseTrack {
	/** The Jellyfin item id of the track. */
	item_id: string
	/** The track title. */
	title: string
	/** The track artist. The backend calls this `author`, not `artist`. */
	author: string
	/** The album name, or `'unknown'` when the backend has none. */
	album?: string
}

/** A track with its distance from the seed track. */
export interface AudioMuseScoredTrack extends AudioMuseTrack {
	/**
	 * Distance from the seed track. Lower is more similar. The scale depends on the
	 * endpoint and the backend's index settings.
	 */
	distance: number
}

/**
 * How {@link AudioMuseApi.hyperbolicSimilar} picks tracks around the seed in the Poincaré
 * ball, where generic tracks sit near the center and more specific ones near the edge.
 */
export const HyperbolicMode = {
	/** The nearest tracks in any direction. */
	Similar: 'similar',
	/** Tracks closer to the center than the seed: broader, more foundational songs. */
	Roots: 'roots',
	/** Tracks closer to the edge than the seed: more specific, niche songs. */
	Niche: 'niche',
} as const
export type HyperbolicMode = (typeof HyperbolicMode)[keyof typeof HyperbolicMode]

/** Whether an {@link AlchemyItem} pulls the blend toward it or pushes it away. */
export const AlchemyOperation = {
	/** Pull the centroid toward this item. At least one `ADD` item is required. */
	Add: 'ADD',
	/** Push the results away from this item. */
	Subtract: 'SUBTRACT',
} as const
export type AlchemyOperation = (typeof AlchemyOperation)[keyof typeof AlchemyOperation]

/** What the `id` of an {@link AlchemyItem} refers to. */
export const AlchemyItemType = {
	/** A Jellyfin track item id. */
	Song: 'song',
	/** A Jellyfin artist item id or an artist name. */
	Artist: 'artist',
	/** A saved alchemy anchor id. */
	Anchor: 'anchor',
	/** A mood label such as `happy` or `relaxed`. */
	Mood: 'mood',
	/** A playlist id. */
	Playlist: 'playlist',
} as const
export type AlchemyItemType = (typeof AlchemyItemType)[keyof typeof AlchemyItemType]

/** The AI providers instant playlists ({@link AudioMuseApi.chatPlaylist}) can use. */
export const ChatAiProvider = {
	Ollama: 'OLLAMA',
	/** OpenAI or any OpenAI-compatible API such as OpenRouter. */
	OpenAi: 'OPENAI',
	Gemini: 'GEMINI',
	Mistral: 'MISTRAL',
	/** No AI. */
	None: 'NONE',
} as const
export type ChatAiProvider = (typeof ChatAiProvider)[keyof typeof ChatAiProvider]

/** Whether a {@link ClapSteeringTerm} steers the search toward or away from its concept. */
export const ClapSteeringDirection = {
	More: 'more',
	Less: 'less',
} as const
export type ClapSteeringDirection =
	(typeof ClapSteeringDirection)[keyof typeof ClapSteeringDirection]

/** The clustering algorithm for {@link AudioMuseApi.startClustering}. */
export const ClusteringMethod = {
	KMeans: 'kmeans',
	Dbscan: 'dbscan',
	/** Gaussian mixture model. */
	Gmm: 'gmm',
	Spectral: 'spectral',
} as const
export type ClusteringMethod = (typeof ClusteringMethod)[keyof typeof ClusteringMethod]

/** The AI providers clustering can use to name playlists. Unlike chat, OpenAI is not supported. */
export const ClusteringAiProvider = {
	Ollama: 'OLLAMA',
	Gemini: 'GEMINI',
	Mistral: 'MISTRAL',
	/** Name playlists without AI. */
	None: 'NONE',
} as const
export type ClusteringAiProvider = (typeof ClusteringAiProvider)[keyof typeof ClusteringAiProvider]
