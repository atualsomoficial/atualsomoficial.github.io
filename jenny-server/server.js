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

const products = [
  { name: "Caixa de som profissional", category: "Sistemas de som", description: "Sonorização para eventos, igrejas e apresentações." },
  { name: "Subwoofer ativo", category: "Sistemas de som", description: "Reforço de graves para sistemas de PA." },
  { name: "Mesa de som digital", category: "Mesas de som", description: "Controle e mixagem para aplicações ao vivo." },
  { name: "Mesa de som analógica", category: "Mesas de som", description: "Mixagem prática para palco e instalação." },
  { name: "Microfone Kadosh K-382M sem fio duplo", category: "Microfones", description: "Sistema duplo UHF com dois microfones de mão e receptor." },
  { name: "Microfone condensador", category: "Microfones", description: "Captação para estúdio, voz e instrumentos." },
  { name: "Guitarra elétrica", category: "Cordas", description: "Instrumento versátil para palco e estúdio." },
  { name: "Violão acústico", category: "Cordas", description: "Sonoridade acústica para estudo e apresentações." },
  { name: "Contrabaixo elétrico", category: "Cordas", description: "Graves presentes para sua banda." },
  { name: "Teclado musical", category: "Teclas", description: "Timbres e recursos para músicos e igrejas." },
  { name: "Piano digital", category: "Teclas", description: "Experiência de piano para estudo e performance." },
  { name: "Saxofone", category: "Sopro", description: "Instrumento de sopro para diversos estilos musicais." },
  { name: "Trompete", category: "Sopro", description: "Brilho e presença para conjuntos e bandas." },
  { name: "Bateria acústica", category: "Percussão", description: "Kit para ensaios, palco e gravações." },
  { name: "Cajón", category: "Percussão", description: "Percussão compacta para apresentações acústicas." },
  { name: "Pedestal e cabos", category: "Acessórios", description: "Acessórios essenciais para sua estrutura de áudio." },
  { name: "Caixa K-AUDIO TPS-15A 300W", category: "Sistemas de som", description: "Caixa ativa profissional de 300W RMS para igrejas, eventos e apresentações. À vista: R$ 2.438,00; boleto: R$ 2.869,00; cartão: 12x de R$ 239,08." }
];

function normalize(value) {
  return value.toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function answer(raw) {
  const q = normalize(raw);
  const categories = [...new Set(products.map((p) => p.category))];

  if (/\b(oi|ola|bom dia|boa tarde|boa noite|tudo bem)\b/.test(q)) {
    return "Olá! Que bom falar com você! 💙 Sou a Jenny, assistente virtual da Atual Som. Você procura algum equipamento ou instrumento?";
  }

  if (/(categoria|vendem|produtos|catalogo|tem o que|trabalha com)/.test(q)) {
    return "Na Atual Som você encontra estas categorias:\n• " +
      categories.join("\n• ") +
      "\n\nQual delas você gostaria de conhecer?";
  }

  if (/(igreja|culto|templo|som para igreja)/.test(q)) {
    return "Para sonorização de igreja, podemos avaliar caixas de som, mesa de som, microfones e acessórios. O conjunto ideal depende do tamanho do ambiente e de como a equipe utiliza o som. Quantas pessoas costumam participar dos cultos?";
  }

  if (/(estudio|gravar|gravacao)/.test(q)) {
    return "Para começar um pequeno estúdio, vale considerar microfone, interface de áudio, fones e monitores. Você pretende gravar voz, instrumentos ou os dois?";
  }

  if (/(orcamento|preco|valor|custa|pagamento|boleto|cartao)/.test(q)) {
    return "Os preços de boa parte do catálogo são apenas ilustrativos. Uma condição cadastrada é a da caixa K-AUDIO TPS-15A: R$ 2.438,00 à vista, R$ 2.869,00 no boleto ou 12x de R$ 239,08 no cartão. Confirme sempre valores e disponibilidade com a equipe.";
  }

  if (/(entrega|frete|envio|prazo|estoque|disponivel)/.test(q)) {
    return "Não tenho acesso ao estoque ou ao cálculo de frete em tempo real. Para confirmar disponibilidade, entrega e prazo, fale com a equipe da Atual Som pelo Instagram: https://www.instagram.com/atualsom/.";
  }

  if (/(atendente|humano|vendedor|equipe|whatsapp|instagram|falar com)/.test(q)) {
    return "Claro! Você pode falar com a equipe da Atual Som pelo Instagram: https://www.instagram.com/atualsom/. Eles podem confirmar preços, estoque e condições de pagamento.";
  }

  const matches = products.filter((p) => {
    const haystack = normalize(p.name + " " + p.category + " " + p.description);
    return haystack.split(/\s+/).some((word) => word.length > 3 && q.includes(word));
  });

  if (matches.length) {
    return "Encontrei estas opções no catálogo:\n" +
      matches.slice(0, 6).map((p) => "• " + p.name + " — " + p.category).join("\n") +
      "\n\nQuer saber mais sobre algum desses produtos? Os preços e o estoque devem ser confirmados com a equipe.";
  }

  return "Ainda não encontrei uma resposta exata para essa pergunta. Posso ajudar com produtos, categorias, equipamentos para igrejas e orientações iniciais. Para atendimento, fale com a equipe em https://www.instagram.com/atualsom/.";
}

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

  return res.json({ reply: answer(message) });
});

app.use((err, _req, res, _next) => {
  console.error("Erro no servidor:", err.message);
  res.status(500).json({ error: "Ocorreu um erro no servidor." });
});

app.listen(PORT, () => {
  console.log(`Jenny server ouvindo na porta ${PORT}`);
});
