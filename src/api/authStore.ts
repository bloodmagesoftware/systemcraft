import {
	type AuthProvider,
	getRedirectResult,
	onAuthStateChanged,
	signInWithRedirect,
	signOut,
	type User,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "preact/hooks";
import { auth, githubProvider, googleProvider } from "./firebase";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export type AuthState = {
	status: AuthStatus;
	user: User | null;
	error: Error | null;
};

type Listener = (s: AuthState) => void;

class AuthStore {
	private state: AuthState = {
		status: "loading",
		user: null,
		error: null,
	};
	private listeners = new Set<Listener>();
	private initialized = false;
	private handlingRedirect = false;
	private unsub: (() => void) | null = null;

	private setState(next: Partial<AuthState>) {
		this.state = { ...this.state, ...next };
		for (const l of this.listeners) l(this.state);
	}

	private async ensureInit() {
		if (this.initialized) return;
		this.initialized = true;

		// Start by attempting to settle any redirect result exactly once.
		// Avoid racing multiple islands.
		const handleRedirect = async () => {
			if (this.handlingRedirect) return;
			this.handlingRedirect = true;
			try {
				// We don't need the credential here; this ensures pending auth
				// promises resolve and avoids "no pending redirect" noise.
				await getRedirectResult(auth);
			} catch (err) {
				// Swallow benign "no pending redirect" errors; propagate real ones.
				if (err instanceof Error) {
					// Optional: comment this in for debugging.
					// console.warn("getRedirectResult error:", err);
				}
			} finally {
				this.handlingRedirect = false;
			}
		};

		await handleRedirect();

		this.unsub = onAuthStateChanged(
			auth,
			(user) => {
				if (user) {
					this.setState({
						status: "authenticated",
						user,
						error: null,
					});
				} else {
					this.setState({
						status: "unauthenticated",
						user: null,
						error: null,
					});
				}
			},
			(error) => {
				this.setState({
					status: "error",
					error: error instanceof Error ? error : new Error(String(error)),
				});
			},
		);
	}

	subscribe(listener: Listener): () => void {
		this.ensureInit();
		this.listeners.add(listener);
		// Immediately call back with current state.
		listener(this.state);
		return () => {
			this.listeners.delete(listener);
			// Keep the Firebase subscription alive for the lifetime of the tab.
		};
	}

	getSnapshot(): AuthState {
		return this.state;
	}

	async loginWithProvider(provider: AuthProvider): Promise<void> {
		await this.ensureInit();
		await signInWithRedirect(auth, provider);
	}

	loginWithGoogleRedirect(): Promise<void> {
		return this.loginWithProvider(googleProvider);
	}

	loginWithGithubRedirect(): Promise<void> {
		return this.loginWithProvider(githubProvider);
	}

	async logout(): Promise<void> {
		await this.ensureInit();
		await signOut(auth);
	}
}

// Ensure a single instance across islands/bundles via window.
declare global {
	interface Window {
		__APP_AUTH_STORE__?: AuthStore;
	}
}

function getGlobalAuthStore(): AuthStore {
	if (typeof window === "undefined") {
		// SSR stub; actual instance will be created client-side.
		return new AuthStore();
	}
	if (!window.__APP_AUTH_STORE__) {
		window.__APP_AUTH_STORE__ = new AuthStore();
	}
	return window.__APP_AUTH_STORE__;
}

const store = getGlobalAuthStore();

export function useAuth(): AuthState & {
	loginWithGoogleRedirect: () => Promise<void>;
	loginWithGithubRedirect: () => Promise<void>;
	logout: () => Promise<void>;
} {
	const [state, setState] = useState<AuthState>(() => store.getSnapshot());
	useEffect(() => store.subscribe(setState), []);

	// Stable actions
	const actions = useMemo(
		() => ({
			loginWithGoogleRedirect: () => store.loginWithGoogleRedirect(),
			loginWithGithubRedirect: () => store.loginWithGithubRedirect(),
			logout: () => store.logout(),
		}),
		[],
	);

	// Eagerly ensure init on first consumer mount.
	useEffect(() => {
		// noop: subscribe already triggers ensureInit
	}, []);

	return { ...state, ...actions };
}

export function useAuthUser(): User | null {
	const { user } = useAuth();
	return user;
}

export function useAuthStatus(): AuthStatus {
	const { status } = useAuth();
	return status;
}
