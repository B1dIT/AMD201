export const API_BASE = "http://localhost:8000";

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
}

export async function register(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch { }
        throw new Error(data.message || "Register failed");
    }
    return res.json();
}

export async function shortenUrl(longUrl, token) {
    const res = await fetch(`${API_BASE}/api/shorten`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ originalurl: longUrl })
    });
    if (!res.ok) throw new Error("Shorten failed");
    return res.json();
}

export async function generateQr(shortCode, url, token) {
    const res = await fetch(`${API_BASE}/api/qr/generate-qr`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
            shortCode: shortCode || "temp",
            url: url || "https://example.com"
        })
    });
    if (!res.ok) {
        console.warn(`QR not created: ${res.status}`);
        return;
    }

    try {
        return await res.json();
    } catch (e) {
        console.log("QR generated (no JSON response)");
        return;
    }
}

export async function updateUrl(shortCode, data, token) {
    const res = await fetch(`${API_BASE}/api/url/update/${shortCode}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Update failed");
    return res.json();
}

export async function deleteUrl(shortCode, token) {
    const res = await fetch(`${API_BASE}/api/url/delete/${shortCode}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
}