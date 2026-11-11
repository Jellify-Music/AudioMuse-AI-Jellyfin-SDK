/**
 * Request and response models for the AudioMuse AI Jellyfin plugin.
 *
 * The plugin proxies most routes straight through to the AudioMuse AI backend, so
 * these shapes mirror the backend's OpenAPI docstrings. Where the backend leaves a
 * shape undocumented, the model only declares the fields known to be present.
 */

export * from './common.js'
export type * from './requests.js'
export type * from './results.js'
export type * from './responses.js'
export type * from './tasks.js'
