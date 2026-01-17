import { authenticate, clearToken, getToken, setToken } from './authApi'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

test('token helpers manage storage', () => {
  expect(getToken()).toBeNull()
  setToken('abc')
  expect(getToken()).toBe('abc')
  clearToken()
  expect(getToken()).toBeNull()
})

test('authenticate stores token', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ token: 'jwt-token' }),
  }))

  const token = await authenticate('login', { email: 'a@b.com', password: 'pw' })
  expect(token).toBe('jwt-token')
  expect(getToken()).toBe('jwt-token')
})
