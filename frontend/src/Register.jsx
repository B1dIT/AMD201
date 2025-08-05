import React, { useState } from "react";
import { register, login } from "./api";

export default function Register({ switchToLogin, onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setSuccess("");
        try {
            await register(username, password);
            setSuccess("Registered Successfully.");
            const loginData = await login(username, password);
            onLogin(loginData.token, username);
            setUsername("");
            setPassword("");
        } catch (e) {
            setErr(e.message || "Register failed!");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <h2>Register</h2>
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
            <button style={styles.button} type="submit">Register</button>
            <div style={{ marginTop: 10 }}>
                <span>Have Account Already ?</span>
                <button type="button" onClick={switchToLogin} style={styles.linkButton}>Login</button>
            </div>
            {err && <div style={{ color: "red" }}>{err}</div>}
            {success && <div style={{ color: "green" }}>{success}</div>}
        </form>
    );
}

const styles = {
    form: { maxWidth: 350, margin: "60px auto", padding: 20, border: "1px solid #eee", borderRadius: 8, background: "#fff" },
    input: { width: "100%", margin: "8px 0", padding: 8 },
    button: { width: "100%", padding: 10 },
    linkButton: { color: "#007bff", background: "none", border: "none", cursor: "pointer", padding: 0 }
};
