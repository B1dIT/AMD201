import React, { useState, useEffect } from "react";
import { generateQr } from "./api";
import { API_BASE } from "./api";

export default function QrGenerator({ autoFillUrl }) {
    const [text, setText] = useState("");
    const [shortCode, setShortCode] = useState("");
    const [err, setErr] = useState("");
    const [qrGenerated, setQrGenerated] = useState(false); 

    useEffect(() => {
        if (autoFillUrl && !text) {
            setText(autoFillUrl);
        }
    }, [autoFillUrl, text]);

    const sanitizeShortCode = (code) => {
        return code.trim().replace(/[^a-zA-Z0-9\-_]/g, '-');
    };

    const handleGen = async () => {
        setErr("");
        let code = shortCode.trim();
        let url = text.trim();

        if (!code && !url) {
            setErr("Please provide a URL or short code");
            return;
        }

        if (!code) {
            code = btoa(url).substring(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        code = sanitizeShortCode(code);
        url = url || "https://example.com";

        try {
            await generateQr(code, url);
            setShortCode(code); 
            setQrGenerated(true); 
        } catch (e) {
            setErr(`QR failed: ${e.message}`);
        }
    };

    return (
        <div style={styles.box}>
            <h3>QR Creator</h3>

            <input
                style={styles.input}
                placeholder="URL"
                value={text}
                onChange={e => setText(e.target.value)}
            />

            <input
                style={styles.input}
                placeholder="Short code (abc123)"
                value={shortCode}
                onChange={e => setShortCode(e.target.value)}
            />

            <button style={styles.button} onClick={handleGen}>
                Create QR
            </button>

            {qrGenerated && (
                <div>
                    <img
                        alt="QR code"
                        src={`${API_BASE}/api/qr/${encodeURIComponent(shortCode || 'temp')}`}
                        style={{ marginTop: 12, width: 150, height: 150 }}
                        onError={() => setQrGenerated(false)} 
                    />
                </div>
            )}

            {err && <div style={{ color: "red" }}>{err}</div>}
        </div>
    );
}

const styles = {
    box: { margin: "24px auto", maxWidth: 400, padding: 18, border: "1px solid #eee", borderRadius: 8, background: "#fafbfc" },
    input: { width: "100%", margin: "8px 0", padding: 8 },
    button: { width: "100%", padding: 8 }
};