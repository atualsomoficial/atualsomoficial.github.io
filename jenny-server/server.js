require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin =
  process.env.SITE_ORIGIN || "https://atualsomoficial.github.io";

app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Jenny - Atual Som",
    message: "Servidor online."
  });
});

app.post("/api/chat", (req, res) => {
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim()
    : "";

  if (!message) {
    return res.status(400).json({
      error: "Envie uma mensagem para a Jenny."
    });
  }

  // A conexão com um modelo de IA será adicionada aqui
  // quando definirmos um provedor cujos termos permitam este uso.
  return res.status(501).json({
    reply: "Estou sendo preparada para conversar melhor! Por enquanto, posso ajudar com as informações disponíveis no site da Atual Som."
  });
});

app.use((err, _req, res, _next) => {
  console.error("Erro no servidor:", err.message);
  res.status(500).json({ error: "Ocorreu um erro no servidor." });
});

app.listen(PORT, () => {
  console.log(`Jenny server ouvindo na porta ${PORT}`);
});
