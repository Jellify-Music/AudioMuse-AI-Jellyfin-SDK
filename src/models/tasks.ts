import type { AudioMuseApi } from '../audiomuse-api.js'
import type { ClusteringAiProvider, ClusteringMethod } from './common.js'

/**
 * Response from {@link AudioMuseApi.startAnalysis} and {@link AudioMuseApi.startClustering}.
 * Poll {@link AudioMuseApi.getTaskStatus} with `task_id` to follow the task.
 */
export interface TaskEnqueuedResponse {
	/** The id of the new task. */
	task_id: string
	/** The type of the task, for example `'main_analysis'` or `'main_clustering'`. */
	task_type: string
	/** The task's initial queue status, for example `'queued'`. Only returned for analysis. */
	status?: string
}

/**
 * Body for {@link AudioMuseApi.startAnalysis}. Every field falls back to the server's
 * configuration.
 */
export interface StartAnalysisRequest {
	/** Number of most recently added albums to analyze. */
	num_recent_albums?: number
	/** Number of top moods to keep for each track. */
	top_n_moods?: number
}

/**
 * Body for {@link AudioMuseApi.startClustering}. Every field is optional and falls back
 * to the server's configuration. See the AudioMuse AI backend docs for the full list.
 */
export interface StartClusteringRequest {
	/** Maximum number of playlists to create. */
	top_n_clustering_playlist?: number
	/** The clustering algorithm. */
	clustering_method?: ClusteringMethod
	/** Minimum number of clusters. Only used by `kmeans` and `gmm`. */
	num_clusters_min?: number
	/** Maximum number of clusters. Only used by `kmeans` and `gmm`. */
	num_clusters_max?: number
	/** Number of clustering runs to try. The best-scoring run is kept. */
	clustering_runs?: number
	/** Maximum number of tracks in each playlist. */
	max_songs_per_cluster?: number
	/** Number of top moods to use in each track's feature vector. */
	top_n_moods?: number
	/**
	 * Clusters on audio embeddings when `true`, or on mood scores when `false`.
	 *
	 * @defaultValue `true`
	 */
	enable_clustering_embeddings?: boolean
	/** The AI provider used to name the playlists. */
	ai_model_provider?: ClusteringAiProvider
	[key: string]: unknown
}

/** Response from {@link AudioMuseApi.getTaskStatus}. */
export interface TaskStatus {
	/** The id of the task. */
	task_id: string
	/**
	 * The task's state, for example `PENDING`, `STARTED`, `PROGRESS`, `SUCCESS`,
	 * `FAILURE` or `REVOKED`.
	 */
	state: string
	/** A human-readable status message. */
	status_message: string
	/** Progress percentage from 0 to 100. */
	progress: number
	/** How long the task has run, in seconds. Updates live while the task runs. */
	running_time_seconds: number
	/** Task details such as a `log` array. The shape depends on the task type and state. */
	details: Record<string, unknown>
	/**
	 * The task type as recorded by the backend, for example `'main_analysis'` or
	 * `'album_analysis'`.
	 */
	task_type_from_db: string | null
}

/**
 * Response from {@link AudioMuseApi.getLastTask}. When no task has ever run, `task_id`
 * and `task_type` are `null`.
 */
export interface LastTask {
	/** The id of the task. */
	task_id: string | null
	/** The type of the task, for example `'main_analysis'`. */
	task_type: string | null
	/** The task's state, for example `SUCCESS`. */
	status: string
	/** Progress percentage from 0 to 100. */
	progress: number
	/** Task details. Long logs are truncated to the last 10 entries. */
	details: Record<string, unknown>
	/** How long the task ran, in seconds. */
	running_time_seconds: number
}

/** Response from {@link AudioMuseApi.cancelTask}. */
export interface CancelTaskResponse {
	/** A human-readable result. */
	message: string
	/** The id of the cancelled task. */
	task_id: string
	/** The number of jobs cancelled, including the task's child tasks. */
	cancelled_jobs_count: number
}

/** Response from {@link AudioMuseApi.cancelAllTasks}. */
export interface CancelAllTasksResponse {
	/** A human-readable result. */
	message: string
	/** The ids of the cancelled top-level tasks. */
	cancelled_main_tasks: string[]
}
