import { useState } from "react";

const API_URL = "https://delivery-saas-production-caba.up.railway.app";

export default function App() {
  const [logado, setLogado] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // ================= LOGIN =================
  async function fazerLogin() {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro no login");

      setEmpresa(data.usuario);
      setLogado(true);
      localStorage.setItem("empresa_logada", JSON.stringify(data.usuario));

    } catch (error) {
      alert(error.message);
    }
  }

  // ================= LOGOUT =================
  function sair() {
    localStorage.removeItem("empresa_logada");
    setLogado(false);
    setEmpresa(null);
  }

  // ================= TELA LOGIN =================
  if (!logado) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5"
      }}>
        <div style={{
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          width: 300,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}>
          <h2>Painel da Loja</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />

          <button
            onClick={fazerLogin}
            style={{
              width: "100%",
              padding: 10,
              background: "#ff6b00",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ================= TELA LOGADA =================
  return (
    <div style={{ padding: 20 }}>
      <h1>Painel</h1>

      <p><strong>Empresa:</strong> {empresa?.nome || "Sem nome"}</p>
      <p><strong>Email:</strong> {empresa?.email}</p>

      <button onClick={sair}>
        Sair
      </button>
    </div>
  );
}