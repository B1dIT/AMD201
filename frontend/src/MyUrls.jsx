import React, { useState, useEffect } from "react";
import { shortenUrl, updateUrl, deleteUrl } from "./api";

export default function MyUrls({ token }) {
    const [urls, setUrls] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({ customName: "", description: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;
        fetchUrls();
    }, [token]);

    const fetchUrls = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8000/api/url/my-urls", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch URLs");
            const data = await res.json();
            setUrls(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Cannot load your URLs. Please login again.");
            setUrls([]);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (url) => {
        setEditing(url.shortCode);
        setEditForm({
            customName: url.customName || "",
            description: url.description || ""
        });
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditForm({ customName: "", description: "" });
    };

    const saveEdit = async (shortCode) => {
        try {
            const res = await fetch(`http://localhost:8000/api/url/update/${shortCode}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    originalUrl: urls.find(u => u.shortCode === shortCode)?.originalUrl,
                    customName: editForm.customName,
                    description: editForm.description
                })
            });

            if (!res.ok) throw new Error("Update failed");

            setUrls(urls.map(u =>
                u.shortCode === shortCode
                    ? { ...u, customName: editForm.customName, description: editForm.description }
                    : u
            ));
            setEditing(null);
        } catch (err) {
            setError("Update failed: " + err.message);
        }
    };

    const handleDelete = async (shortCode) => {
        if (!window.confirm("Are you sure you want to delete this URL?")) return;

        try {
            const res = await fetch(`http://localhost:8000/api/url/delete/${shortCode}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Delete failed");

            setUrls(urls.filter(u => u.shortCode !== shortCode));
        } catch (err) {
            setError("Delete failed: " + err.message);
        }
    };

    if (!token) return null;

    return (
        <div style={{ margin: "24px 0", padding: "16px", border: "1px solid #ddd", borderRadius: 8, background: "#f9f9f9" }}>
            <h3>My Saved URLs</h3>

            {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}
            {loading && <p>Loading your URLs...</p>}

            {urls.length === 0 ? (
                <p>You haven't saved any URLs yet.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#eee" }}>
                            <th style={styles.th}>Short Code</th>
                            <th style={styles.th}>Original URL</th>
                            <th style={styles.th}>Custom Name</th>
                            <th style={styles.th}>Description</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {urls.map((url) => (
                            <tr key={url.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <a href={`http://localhost:8000/${url.shortCode}`} target="_blank" rel="noopener noreferrer">
                                        {url.shortCode}
                                    </a>
                                </td>
                                <td style={styles.td}>
                                    <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                                        {url.originalUrl.length > 30 ? url.originalUrl.slice(0, 30) + "..." : url.originalUrl}
                                    </a>
                                </td>
                                <td style={styles.td}>
                                    {editing === url.shortCode ? (
                                        <input
                                            value={editForm.customName}
                                            onChange={e => setEditForm({ ...editForm, customName: e.target.value })}
                                            style={{ width: "100%", padding: "4px" }}
                                        />
                                    ) : (
                                        url.customName || "-"
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editing === url.shortCode ? (
                                        <input
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            style={{ width: "100%", padding: "4px" }}
                                        />
                                    ) : (
                                        url.description || "-"
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {editing === url.shortCode ? (
                                        <>
                                            <button onClick={() => saveEdit(url.shortCode)} style={{ ...styles.button, marginRight: 4 }}>Save</button>
                                            <button onClick={cancelEdit} style={{ ...styles.button, backgroundColor: "#6c757d" }}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(url)} style={styles.button}>Edit</button>
                                            <button onClick={() => handleDelete(url.shortCode)} style={{ ...styles.button, backgroundColor: "#dc3545", marginLeft: 4 }}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const styles = {
    th: { padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" },
    td: { padding: "10px", borderBottom: "1px solid #eee" },
    tr: { transition: "background 0.2s" },
    button: {
        padding: "6px 10px",
        border: "none",
        borderRadius: "4px",
        color: "white",
        cursor: "pointer",
        fontSize: "14px"
    }
};