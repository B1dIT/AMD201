import React, { useState } from "react";
import { shortenUrl } from "./api";

export default function UrlShortener({ token, onShortUrlGenerated }) {
    const [longUrl, setLongUrl] = useState("");
    const [shortUrl, setShortUrl] = useState("");
    const [err, setErr] = useState("");
    console.log("onShortUrlGenerated:", onShortUrlGenerated);

    const handleShorten = async () => {
        setErr("");
        setShortUrl("");

        try {
            const data = await shortenUrl(longUrl, token);
            const url = data.shortUrl || data.ShortUrl || data.shorturl;

            if (url) {
                setShortUrl(url);
                onShortUrlGenerated?.(url);
            } else {
                setErr("Invalid response from server");
            }
        } catch (error) {
            setErr("Failed to shorten URL: " + error.message);
        }
    };

    return (
        <div style={styles.box}>
            <h3>URL Shortener</h3>
            <input
                style={styles.input}
                placeholder="Enter long URL"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
            />
            <button style={styles.button} onClick={handleShorten}>
                Shorten
            </button>

            {shortUrl && (
                <div style={styles.result}>
                    <strong>Shortened URL:</strong>
                    <br />
                    <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                    >
                        {shortUrl}
                    </a>
                    <br />
                    <button
                        onClick={() => navigator.clipboard.writeText(shortUrl)}
                        style={styles.copyButton}
                    >
                        Copy
                    </button>
                </div>
            )}

            {err && <div style={styles.error}>{err}</div>}
        </div>
    );
}

const styles = {
    box: {
        margin: "24px auto",
        maxWidth: 500,
        padding: 18,
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fff"
    },
    input: {
        width: "100%",
        margin: "8px 0",
        padding: "10px",
        fontSize: "16px",
        borderRadius: 4,
        border: "1px solid #ccc"
    },
    button: {
        width: "100%",
        padding: "10px",
        fontSize: "16px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer"
    },
    result: {
        marginTop: "16px",
        padding: "12px",
        background: "#f0f7ff",
        border: "1px solid #bee5eb",
        borderRadius: 6
    },
    link: {
        fontSize: "16px",
        color: "#007bff",
        wordBreak: "break-all"
    },
    copyButton: {
        marginTop: "8px",
        padding: "6px 12px",
        fontSize: "14px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer"
    },
    error: {
        marginTop: "12px",
        color: "red",
        fontSize: "14px"
    }
};