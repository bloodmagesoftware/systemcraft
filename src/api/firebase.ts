import { getApp, getApps, initializeApp } from "firebase/app";
import {
	getAuth,
	GithubAuthProvider,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	type User,
} from "firebase/auth";
import { useEffect, useState } from "preact/hooks";

declare global {
	interface Window {
		__firebaseApp?: ReturnType<typeof initializeApp>;
		__authStore?: {
			user: User | null;
			loading: boolean;
			listeners: Set<() => void>;
			setState: (u: User | null, loading?: boolean) => void;
			subscribe: (cb: () => void) => () => void;
			getSnapshot: () => { user: User | null; loading: boolean };
		};
	}
}

const firebaseConfig = {
	apiKey: "AIzaSyA2CBLmf3Zu1rs8l-YGwD7t2bKN90rjY0w",
	authDomain: "systemcraft-bms.firebaseapp.com",
	projectId: "systemcraft-bms",
	storageBucket: "systemcraft-bms.firebasestorage.app",
	messagingSenderId: "495109471277",
	appId: "1:495109471277:web:7077f028455dc97e114ca4",
};

// Robust singleton across multiple island bundles
const app =
	(typeof window !== "undefined" && window.__firebaseApp) ||
	(getApps().length ? getApp() : initializeApp(firebaseConfig));

if (typeof window !== "undefined") {
	window.__firebaseApp = app;
}

export const auth = getAuth(app);

// Providers (popup)
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Minimal global auth store for cross-island sharing
function ensureAuthStore() {
	if (typeof window === "undefined") return;

	if (!window.__authStore) {
		const store = {
			user: null as User | null,
			loading: true,
			listeners: new Set<() => void>(),
			setState(u: User | null, loading = false) {
				store.user = u;
				store.loading = loading;
				store.listeners.forEach((l) => l());
			},
			subscribe(cb: () => void) {
				store.listeners.add(cb);
				return () => store.listeners.delete(cb);
			},
			getSnapshot() {
				return { user: store.user, loading: store.loading };
			},
		};

		window.__authStore = store;

		// Attach a single listener that updates the global store
		onAuthStateChanged(auth, (u) => {
			store.setState(u, false);
		});
	}
}

ensureAuthStore();

// Public helpers
export function signInWithGoogle() {
	return signInWithPopup(auth, googleProvider);
}

export function signInWithGithub() {
	return signInWithPopup(auth, githubProvider);
}

export function signOutUser() {
	return signOut(auth);
}

// Accessors for the hook
export function getAuthState() {
	if (typeof window === "undefined" || !window.__authStore) {
		return { user: null as User | null, loading: true };
	}
	return window.__authStore.getSnapshot();
}

export function subscribeAuth(cb: () => void) {
	if (typeof window === "undefined") return () => {};
	ensureAuthStore();
	return window.__authStore!.subscribe(cb);
}

export function useAuth() {
	const [state, setState] = useState(getAuthState());

	useEffect(() => {
		return subscribeAuth(() => setState(getAuthState()));
	}, []);

	return {
		...state,
		isLoggedIn: !!state.user,
	};
}
