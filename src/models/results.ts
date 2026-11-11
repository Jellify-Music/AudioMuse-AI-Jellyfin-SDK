import type { AudioMuseApi } from '../audiomuse-api.js'
import type { AudioMuseScoredTrack, AudioMuseTrack } from './common.js'
import type { SimilarArtistsParams } from './requests.js'

/** An artist returned by {@link AudioMuseApi.getSimilarArtists}. */
export interface SimilarArtist {
	/** The artist name. */
	artist: string
	/** The Jellyfin item id of the artist, or `null` when it is not known. */
	artist_id: string | null
	/** How different the artist is from the seed. Lower is more similar. */
	divergence: number
	/** Explains the match. Only present when {@link SimilarArtistsParams.include_component_matches} is set. */
	component_matches?: unknown[]
}

/** A step of the path returned by {@link AudioMuseApi.findPath}. */
export interface PathTrack extends AudioMuseTrack {
	/** The track's audio embedding. */
	embedding_vector: number[]
	/** The track's most likely genre. */
	top_genre?: string
	/** Other analysis fields from the backend's score table. */
	[key: string]: unknown
}

/** A track returned by {@link AudioMuseApi.clapSearch}. */
export interface ClapSearchResult extends AudioMuseTrack {
	/** How well the track's audio matches the query. Higher is a better match. */
	similarity: number
}

/**
 * A track returned by {@link AudioMuseApi.lyricsSearch}.
 *
 * The backend does not document this row, so only the common track fields are declared.
 */
export type LyricsSearchResult = AudioMuseTrack & Record<string, unknown>

/** A track returned by {@link AudioMuseApi.semGroveSearch}. */
export interface SemGroveResult extends AudioMuseScoredTrack {
	/** The track's most likely genre. */
	top_genre?: string
	/** The track's most likely mood. */
	top_mood?: string
	/** `true` on the seed track, which is included in the results. */
	is_seed?: boolean
}

/** A track returned by {@link AudioMuseApi.hyperbolicSimilar}. */
export interface HyperbolicResult extends AudioMuseScoredTrack {
	/** The raw Poincaré distance from the seed. The plugin rescales `distance` to `d / (1 + d)`. */
	hyperbolic_distance: number
	/** The track's distance from the center of the Poincaré ball, from 0 up to 1. */
	hyperbolic_radius?: number
	/** The track's most likely genre. */
	top_genre?: string
}

/** A track returned by {@link AudioMuseApi.alchemy}. */
export interface AlchemyResult extends AudioMuseTrack {
	/** Distance from the blend's centroid. Lower is closer. */
	distance?: number | null
	/** The track's position in the backend's 2D map projection. */
	embedding_2d?: number[] | null
	/** Other analysis fields from the backend's score table. */
	[key: string]: unknown
}

/**
 * A track returned by {@link AudioMuseApi.generateSonicFingerprint}.
 *
 * The backend does not document this row, so only the common track fields are declared.
 */
export type SonicFingerprintResult = AudioMuseTrack & Record<string, unknown>
