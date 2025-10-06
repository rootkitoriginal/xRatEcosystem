import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	login as authLogin,
	logout as authLogout,
	refreshSession as authRefreshSession,
	register as authRegister,
	validateToken as authValidateToken,
	isUsingMockAuth,
} from '../services/authService';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'xrat.auth.token';
const AUTH_REFRESH_TOKEN_KEY = 'xrat.auth.refreshToken';
const AUTH_USER_KEY = 'xrat.auth.user';

const hasWindow = typeof window !== 'undefined';
let storageAvailable = false;

if (hasWindow) {
	try {
		const testKey = '__xrat_auth_test__';
		window.localStorage.setItem(testKey, '1');
		window.localStorage.removeItem(testKey);
		storageAvailable = true;
	} catch (error) {
		console.warn('[AuthProvider] Local storage is not available', error);
		storageAvailable = false;
	}
}

const storage = {
	get: (key) => {
		if (!storageAvailable) {
			return null;
		}
		return window.localStorage.getItem(key);
	},
	set: (key, value) => {
		if (!storageAvailable) {
			return;
		}
		window.localStorage.setItem(key, value);
	},
	remove: (key) => {
		if (!storageAvailable) {
			return;
		}
		window.localStorage.removeItem(key);
	},
};

const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [refreshToken, setRefreshToken] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const usingMockAuth = useMemo(() => isUsingMockAuth(), []);

	const persistSession = useCallback((session = {}) => {
		if (hasOwn(session, 'token')) {
			const value = session.token;
			if (value) {
				setToken(value);
				storage.set(AUTH_TOKEN_KEY, value);
			} else {
				setToken(null);
				storage.remove(AUTH_TOKEN_KEY);
			}
		}

		if (hasOwn(session, 'refreshToken')) {
			const value = session.refreshToken;
			if (value) {
				setRefreshToken(value);
				storage.set(AUTH_REFRESH_TOKEN_KEY, value);
			} else {
				setRefreshToken(null);
				storage.remove(AUTH_REFRESH_TOKEN_KEY);
			}
		}

		if (hasOwn(session, 'user')) {
			const value = session.user;
			if (value) {
				setUser(value);
				storage.set(AUTH_USER_KEY, JSON.stringify(value));
			} else {
				setUser(null);
				storage.remove(AUTH_USER_KEY);
			}
		}
	}, []);

	const clearSession = useCallback(() => {
		persistSession({ token: null, refreshToken: null, user: null });
	}, [persistSession]);

	useEffect(() => {
		let active = true;

		const bootstrapSession = async () => {
			try {
				const storedToken = storage.get(AUTH_TOKEN_KEY);
				const storedRefreshToken = storage.get(AUTH_REFRESH_TOKEN_KEY);
				const storedUserRaw = storage.get(AUTH_USER_KEY);

				if (storedToken) {
					setToken(storedToken);
				}

				if (storedRefreshToken) {
					setRefreshToken(storedRefreshToken);
				}

				if (storedUserRaw) {
					try {
						const parsedUser = JSON.parse(storedUserRaw);
						setUser(parsedUser);
					} catch (parseError) {
						console.warn('[AuthProvider] Failed to parse stored user', parseError);
						storage.remove(AUTH_USER_KEY);
					}
				}

				if (storedToken) {
								try {
									const validatedUser = await authValidateToken(storedToken);
									if (!active) return;

									if (validatedUser) {
										persistSession({ user: validatedUser });
										return;
									}
								} catch (validationError) {
									console.warn('[AuthProvider] Token validation failed', validationError);
						if (storedRefreshToken) {
							try {
								const refreshed = await authRefreshSession(storedRefreshToken);
								if (!active) return;

								if (refreshed?.token) {
									persistSession({
										token: refreshed.token,
										refreshToken: refreshed.refreshToken ?? storedRefreshToken,
									});

									const refreshedUser = await authValidateToken(refreshed.token);
									if (!active) return;

									if (refreshedUser) {
										persistSession({ user: refreshedUser });
										return;
									}
								}
							} catch (refreshError) {
								console.warn('[AuthProvider] Failed to refresh token', refreshError);
							}
						}

						clearSession();
					}
				} else {
					clearSession();
				}
			} catch (bootstrapError) {
				console.warn('[AuthProvider] Failed to restore session', bootstrapError);
				clearSession();
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		bootstrapSession();

		return () => {
			active = false;
		};
	}, [clearSession, persistSession]);

	const login = useCallback(
		async (email, password) => {
			setLoading(true);
			setError(null);

			try {
				const result = await authLogin(email, password);
				persistSession({
					token: result?.token ?? null,
					refreshToken: result?.refreshToken ?? null,
					user: result?.user ?? null,
				});

				return result;
			} catch (loginError) {
				clearSession();
				const message = loginError instanceof Error ? loginError.message : 'Login failed';
				setError(message);
				throw loginError instanceof Error ? loginError : new Error(message);
			} finally {
				setLoading(false);
			}
		},
		[clearSession, persistSession]
	);

	const register = useCallback(
		async (userData) => {
			setLoading(true);
			setError(null);

			try {
				const result = await authRegister(userData);
				persistSession({
					token: result?.token ?? null,
					refreshToken: result?.refreshToken ?? null,
					user: result?.user ?? null,
				});

				return result;
			} catch (registerError) {
				clearSession();
				const message = registerError instanceof Error ? registerError.message : 'Registration failed';
				setError(message);
				throw registerError instanceof Error ? registerError : new Error(message);
			} finally {
				setLoading(false);
			}
		},
		[clearSession, persistSession]
	);

	const logout = useCallback(async () => {
		try {
			await authLogout(token);
		} catch (logoutError) {
			console.warn('[AuthProvider] Logout failed', logoutError);
		} finally {
			clearSession();
		}
	}, [clearSession, token]);

	const refreshAccessToken = useCallback(async () => {
		if (!refreshToken) {
			return null;
		}

		try {
			const refreshed = await authRefreshSession(refreshToken);

			if (refreshed?.token) {
				persistSession({
					token: refreshed.token,
					refreshToken: refreshed.refreshToken ?? refreshToken,
				});
				return refreshed.token;
			}
		} catch (refreshError) {
			console.warn('[AuthProvider] Unable to refresh access token', refreshError);
			clearSession();
		}

		return null;
	}, [clearSession, persistSession, refreshToken]);

	const updateUser = useCallback((updates) => {
		setUser((current) => {
			const next = { ...(current ?? {}), ...(updates ?? {}) };
			storage.set(AUTH_USER_KEY, JSON.stringify(next));
			return next;
		});
	}, []);

	const clearError = useCallback(() => setError(null), []);

	const contextValue = useMemo(
		() => ({
			user,
			token,
			refreshToken,
			isAuthenticated: Boolean(token),
			loading,
			error,
			login,
			register,
			logout,
			refreshAccessToken,
			updateUser,
			clearError,
			setError,
			usingMockAuth,
		}),
		[
			user,
			token,
			refreshToken,
			loading,
			error,
			login,
			register,
			logout,
			refreshAccessToken,
			updateUser,
			clearError,
			usingMockAuth,
		]
	);

		return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
	}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
	}

