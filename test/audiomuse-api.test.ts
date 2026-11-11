import { describe, expect, it } from 'bun:test'
import { Jellyfin } from '@jellyfin/sdk'
import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getAudioMuseApi } from '../src/index.js'

const BASE_PATH = 'https://jellyfin.example.com'
const ACCESS_TOKEN = 'test-token'

/** Creates an AudioMuseApi whose axios instance records requests instead of sending them. */
function createTestApi(responseData: unknown = {}) {
	const requests: InternalAxiosRequestConfig[] = []
	const axiosInstance = axios.create({
		adapter: async (config) => {
			requests.push(config)
			return { data: responseData, status: 200, statusText: 'OK', headers: {}, config }
		},
	})

	const jellyfin = new Jellyfin({
		clientInfo: { name: 'Test', version: '1.0.0' },
		deviceInfo: { name: 'Test Device', id: 'test-device' },
	})
	const api = jellyfin.createApi(BASE_PATH, ACCESS_TOKEN, axiosInstance)

	return { audioMuseApi: getAudioMuseApi(api), requests }
}

describe('getAudioMuseApi', () => {
	it('sends requests to the plugin route on the Jellyfin server', async () => {
		const info = { Version: '1.0.0.0', AvailableEndpoints: ['GET /AudioMuseAI/health'] }
		const { audioMuseApi, requests } = createTestApi(info)

		const { data } = await audioMuseApi.getInfo()

		expect(data).toEqual(info)
		expect(requests[0]?.method).toBe('get')
		expect(requests[0]?.url).toBe(`${BASE_PATH}/AudioMuseAI/info`)
	})

	it('sends the Jellyfin authorization header', async () => {
		const { audioMuseApi, requests } = createTestApi()

		await audioMuseApi.getHealth()

		expect(requests[0]?.headers.Authorization).toContain(`Token="${ACCESS_TOKEN}"`)
	})

	it('keeps headers passed in options alongside the authorization header', async () => {
		const { audioMuseApi, requests } = createTestApi()

		await audioMuseApi.getHealth({ headers: { 'X-Test': 'yes' } })

		expect(requests[0]?.headers['X-Test']).toBe('yes')
		expect(requests[0]?.headers.Authorization).toContain(`Token="${ACCESS_TOKEN}"`)
	})

	it('drops undefined query params and stringifies booleans', async () => {
		const { audioMuseApi, requests } = createTestApi([])

		await audioMuseApi.getSimilarTracks({ item_id: 'abc', n: 10, eliminate_duplicates: false })

		expect(requests[0]?.params).toEqual({
			item_id: 'abc',
			n: 10,
			eliminate_duplicates: 'false',
		})
	})

	it('sends JSON bodies for POST routes', async () => {
		const { audioMuseApi, requests } = createTestApi()

		await audioMuseApi.createPlaylist({ playlist_name: 'Mix', track_ids: ['a', 'b'] })

		expect(requests[0]?.method).toBe('post')
		expect(requests[0]?.url).toBe(`${BASE_PATH}/AudioMuseAI/create_playlist`)
		expect(JSON.parse(requests[0]?.data)).toEqual({
			playlist_name: 'Mix',
			track_ids: ['a', 'b'],
		})
	})

	it('sends the backend URL as a JSON string when testing a connection', async () => {
		const { audioMuseApi, requests } = createTestApi()

		await audioMuseApi.testConnection('http://audiomuse:8000')

		expect(requests[0]?.data).toBe('"http://audiomuse:8000"')
		expect(requests[0]?.headers['Content-Type']).toBe('application/json')
	})

	it('encodes task ids in the path', async () => {
		const { audioMuseApi, requests } = createTestApi()

		await audioMuseApi.getTaskStatus('a/b')

		expect(requests[0]?.url).toBe(`${BASE_PATH}/AudioMuseAI/status/a%2Fb`)
	})

	it('forwards an abort signal', async () => {
		const { audioMuseApi, requests } = createTestApi()
		const controller = new AbortController()

		await audioMuseApi.getPlaylists({ signal: controller.signal })

		expect(requests[0]?.signal).toBe(controller.signal)
	})
})
