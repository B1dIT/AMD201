import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "./index.css"

export default function AuthPage({ onLogin }) {
    const [showRegister, setShowRegister] = useState(false);

    return (
        <div className="auth-page">
            <div className="auth-card">
                {showRegister
                    ? <Register switchToLogin={() => setShowRegister(false)} onLogin={onLogin} />
                    : <Login onLogin={onLogin} switchToRegister={() => setShowRegister(true)} />}
            </div>
        </div>
    );
}

