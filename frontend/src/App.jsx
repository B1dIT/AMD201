import React, { useState } from "react";
import AuthPage from "./AuthPage";
import UrlShortener from "./UrlShortener";
import QrGenerator from "./QRGenerator";
import MyUrls from "./MyUrls";
import "./index.css";

export default function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [showAuth, setShowAuth] = useState(false);
    const [generatedShortUrl, setGeneratedShortUrl] = useState("");
    const [copySuccess, setCopySuccess] = useState(false);

    const handleLogin = (tk, user) => {
        setToken(tk);
        setUsername(user);
        localStorage.setItem("token", tk);
        localStorage.setItem("username", user);
        setShowAuth(false);
    };

    const handleLogout = () => {
        setToken("");
        setUsername("");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
    };

    const handleCopy = () => {
        if (generatedShortUrl) {
            navigator.clipboard.writeText(generatedShortUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1500);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="container">
                <div className="header">
                    <span className="header-title">Microservice Demo</span>

                    {token ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ color: "white", fontWeight: 500 }}>Hi, {username}</span>
                            <button className="header-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <button className="header-btn" onClick={() => setShowAuth(true)}>Login / Register</button>
                    )}
                </div>

                {showAuth && (
                    <div className="card" style={{ position: "relative", zIndex: 2 }}>
                        <AuthPage onLogin={handleLogin} />
                        <button
                            className="close-button"
                            onClick={() => setShowAuth(false)}
                        >
                            Close
                        </button>
                    </div>
                )}

                <div className="card">
                    <div className="section-title">URL Shortener</div>
                    <UrlShortener token={token} onShortUrlGenerated={setGeneratedShortUrl} />

                    {generatedShortUrl && (
                        <div className="short-url-box">
                            <span>
                                Shortened URL:&nbsp;
                                <a href={generatedShortUrl} target="_blank" rel="noopener noreferrer">
                                    {generatedShortUrl}
                                </a>
                            </span>
                            <button onClick={handleCopy}>Copy</button>
                            {copySuccess && (
                                <span className="copy-success">Copied!</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="section-title">QR Creator</div>
                    <QrGenerator token={token} autoFillUrl={generatedShortUrl} />
                </div>

                <div className="card">
                    <div className="section-title">My Saved URLs</div>
                    <div className="table-container">
                        <MyUrls token={token} />
                    </div>
                </div>
            </div>
        </div>
    );
}
