export function localAiUrl(path: '/api/reading' | '/api/explain') {
    return import.meta.env.DEV ? path : `http://127.0.0.1:8000${path}`;
}
