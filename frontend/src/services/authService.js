import { mockAuth } from './mockAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

const normalizeUser = (user) => {
	if (!user) {
		return null;
	}

	const id = user.id ?? user._id ?? user.userId ?? user.uuid ?? null;
	const name = user.name ?? user.username ?? '';
	const username = user.username ?? user.name ?? '';

	return {
		...user,
		id,
		name,
		username,
	};
};

const handleNetworkError = (error, fallbackMessage) => {
	if (error && error.name === 'TypeError' && error.message && error.message.includes('fetch')) {
		throw new Error('Unable to connect to server. Please check if the backend is running.');
	}

	if (error instanceof Error) {
		throw error;
	}

	throw new Error(fallbackMessage);
};

const parseResponse = async (response) => {
	let payload = null;

	try {
		payload = await response.json();
		} catch (error) {
			console.warn('[AuthService] Failed to parse JSON response', error);
			// If the body cannot be parsed we still want to surface a sensible error message
			throw new Error('Unexpected response from authentication service');
		}

	return payload;
};

const realAuthService = {
	login: async (email, password) => {
		try {
			const response = await fetch(`${API_URL}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			const payload = await parseResponse(response);

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Login failed');
			}

			return {
				token: payload.data?.accessToken,
				refreshToken: payload.data?.refreshToken,
				user: normalizeUser(payload.data?.user),
			};
		} catch (error) {
			handleNetworkError(error, 'Login failed');
		}
	},

	register: async ({ username, email, password }) => {
		try {
			const response = await fetch(`${API_URL}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, email, password }),
			});

			const payload = await parseResponse(response);

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Registration failed');
			}

			return {
				token: payload.data?.accessToken,
				refreshToken: payload.data?.refreshToken,
				user: normalizeUser(payload.data?.user),
			};
		} catch (error) {
			handleNetworkError(error, 'Registration failed');
		}
	},

	validateToken: async (token) => {
		if (!token) {
			return null;
		}

		try {
			const response = await fetch(`${API_URL}/api/auth/profile`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 401 || response.status === 403) {
				return null;
			}

			const payload = await parseResponse(response);

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Failed to validate session');
			}

			return normalizeUser(payload.data?.user);
		} catch (error) {
			handleNetworkError(error, 'Failed to validate session');
		}
	},

	refresh: async (refreshToken) => {
		if (!refreshToken) {
			return null;
		}

		try {
			const response = await fetch(`${API_URL}/api/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refreshToken }),
			});

			if (response.status === 401 || response.status === 403) {
				throw new Error('Refresh token expired. Please login again.');
			}

			const payload = await parseResponse(response);

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Failed to refresh session');
			}

			return {
				token: payload.data?.accessToken,
				refreshToken,
			};
		} catch (error) {
			handleNetworkError(error, 'Failed to refresh session');
		}
	},

	logout: async (token) => {
		if (!token) {
			return { success: true };
		}

		try {
			const response = await fetch(`${API_URL}/api/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 401 || response.status === 403) {
				return { success: true };
			}

			const payload = await parseResponse(response);

			if (!response.ok || !payload.success) {
				throw new Error(payload.message || 'Failed to logout');
			}

			return {
				success: true,
				message: payload.message,
			};
		} catch (error) {
			handleNetworkError(error, 'Failed to logout');
		}
	},
};

const createMockToken = (prefix = 'mock-jwt') => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

const mockAuthService = {
	login: async (email, password) => {
		const result = await mockAuth.login(email, password);

		return {
			token: result.token ?? createMockToken('mock-jwt'),
			refreshToken: result.refreshToken ?? createMockToken('mock-refresh'),
			user: normalizeUser(result.user),
		};
	},

	register: async (userData) => {
		const result = await mockAuth.register(userData);

		return {
			token: result.token ?? createMockToken('mock-jwt'),
			refreshToken: result.refreshToken ?? createMockToken('mock-refresh'),
			user: normalizeUser(result.user),
		};
	},

	validateToken: async (token) => {
		if (!token) {
			return null;
		}

		const user = await mockAuth.validateToken(token);
		return normalizeUser(user);
	},

	refresh: async (refreshToken) => ({
		token: createMockToken('mock-jwt'),
		refreshToken: refreshToken ?? createMockToken('mock-refresh'),
	}),

	logout: async () => mockAuth.logout(),
};

console.log(`🔐 Auth Service: Using ${USE_MOCK_AUTH ? 'MOCK' : 'REAL API'} mode`);

const activeService = USE_MOCK_AUTH ? mockAuthService : realAuthService;

export const authService = activeService;

export const login = (...args) => activeService.login(...args);
export const register = (...args) => activeService.register(...args);
export const logout = (...args) => activeService.logout(...args);
export const validateToken = (...args) => activeService.validateToken(...args);
export const refreshSession = (...args) => activeService.refresh(...args);
export const isUsingMockAuth = () => USE_MOCK_AUTH;

export const authConfig = {
	useMock: USE_MOCK_AUTH,
	apiUrl: API_URL,
};

