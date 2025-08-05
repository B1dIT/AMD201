import React, { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin, switchToRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        try {
            const data = await login(username, password);
            onLogin(data.token, username);
        } catch {
            setErr("Wrong username or password!");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <h2>Login</h2>
            <input
                style={styles.input}
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
            />
            <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button style={styles.button} type="submit">Login</button>
            <div style={{ marginTop: 10 }}>
                <span>Don't Have Account? </span>
                <button type="button" onClick={switchToRegister} style={styles.linkButton}>Register</button>
            </div>
            {err && <div style={{ color: "red" }}>{err}</div>}
        </form>
    );
}

const styles = {
    form: { maxWidth: 350, margin: "60px auto", padding: 20, border: "1px solid #eee", borderRadius: 8, background: "#fff" },
    input: { width: "100%", margin: "8px 0", padding: 8 },
    button: { width: "100%", padding: 10 },
    linkButton: { color: "#007bff", background: "none", border: "none", cursor: "pointer", padding: 0 }
};
