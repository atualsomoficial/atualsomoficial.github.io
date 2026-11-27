require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  "https://atualsom.github.io",
  "https://atualsomoficial.github.io",
  process.env.SITE_ORIGIN
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origem não autorizada pelo CORS."));
  },
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
  { name: "Caixa K-AUDIO TPS-15A 300W", category: "Sistemas de som", description: "Caixa ativa profissional de 300W RMS para igrejas, eventos e apresentações.", price: { cash: "R$ 2.438,00 à vista", boleto: "R$ 2.869,00 no boleto", card: "12x de R$ 239,08 no cartão" } }
];

const categories = [...new Set(products.map((p) => p.category))];


/*
 * Motor de linguagem da Jenny.
 * Configure no Render:
 * AI_API_URL = endpoint OpenAI-compatible completo, terminando em /chat/completions
 * AI_API_KEY = chave privada do provedor
 * AI_MODEL = identificador do modelo
 */
const AI_API_URL = process.env.AI_API_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "";

function buildJennySystemPrompt() {
  const catalog = products.map((p) => {
    let item = p.name + " | categoria: " + p.category + " | " + p.description;
    if (p.price) item += " | preços cadastrados: " + p.price.cash + "; " + p.price.boleto + "; " + p.price.card;
    return item;
  }).join("\\n");

  return [
    "Você é Jenny, assistente virtual da Atual Som, uma loja brasileira de instrumentos musicais e equipamentos profissionais de áudio.",
    "Converse em português brasileiro, com naturalidade, simpatia, clareza e respostas objetivas. Use 💙 ocasionalmente, sem exagerar.",
    "Você é uma IA conversacional: entenda a intenção e o contexto, não dependa de palavras exatas. Frases diferentes com o mesmo significado devem receber o mesmo tipo de ajuda.",
    "Responda também a perguntas gerais, cumprimentos, dúvidas, explicações e conversas naturais. Não force todo assunto para uma venda. Se a pergunta for sobre a loja, conecte a resposta ao atendimento da Atual Som.",
    "Mantenha o contexto das mensagens anteriores. Interprete respostas curtas como 'sim', 'não', 'esse', 'a média' e '50 pessoas' em relação à pergunta imediatamente anterior. Não reinicie a conversa sem motivo.",
    "Sobre a Atual Som, use apenas os dados fornecidos neste prompt. Nunca invente preço, estoque, endereço, horário, frete, garantia, prazo, formas de pagamento ou características específicas não cadastradas.",
    "Se não souber um dado comercial, diga com transparência e ofereça atendimento humano pelo WhatsApp https://wa.me/559984646848 ou Instagram https://www.instagram.com/atualsom/.",
    "Ajude a entender necessidades com perguntas curtas e relevantes, uma por vez. Não faça interrogatórios nem repita perguntas já respondidas.",
    "Ao orientar montagem de sistemas de som, primeiro entenda aplicação, ambiente, público e equipamentos existentes. Não feche dimensionamento técnico sem dados suficientes.",
    "Não diga que consultou estoque, catálogo em tempo real ou sistemas externos. Não afirme que concluiu pedidos ou reservas.",
    "Informações oficiais disponíveis:",
    "Categorias: " + categories.join(", "),
    "Catálogo cadastrado (itens de referência, não representam necessariamente estoque disponível):",
    catalog,
    "WhatsApp: (99) 8464-6848 — https://wa.me/559984646848",
    "Instagram: @atualsom — https://www.instagram.com/atualsom/"
  ].join("\\n\\n");
}

async function answerWithAI(message, history = []) {
  if (!AI_API_URL || !AI_API_KEY || !AI_MODEL) return null;

  const messages = [
    { role: "system", content: buildJennySystemPrompt() },
    ...history
      .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) })),
    { role: "user", content: message.slice(0, 2000) }
  ];

  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + AI_API_KEY
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.65,
      max_tokens: 550
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Falha no provedor de IA:", response.status, detail.slice(0, 500));
    throw new Error("O motor de linguagem não respondeu corretamente.");
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("O provedor retornou uma resposta vazia.");
  }
  return reply.trim().slice(0, 5000);
}

function normalize(value) {
  return String(value || "").toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(q, patterns) {
  return patterns.some((pattern) => pattern.test(q));
}

function humanContact(reason) {
  return "Para " + reason + ", a equipe da Atual Som precisa confirmar a informação. Você pode chamar pelo Instagram: https://www.instagram.com/atualsom/. Se preferir, diga qual produto procura e eu tento ajudar com as informações cadastradas.";
}

function answer(raw, history = []) {
  const q = normalize(raw);
  const previous = Array.isArray(history) ? history.slice(-8) : [];
  const lastUser = [...previous].reverse().find((m) => m && (m.role === "user") && typeof m.content === "string");
  const lastAssistant = [...previous].reverse().find((m) => m && (m.role === "assistant") && typeof m.content === "string");
  const context = normalize(previous.map((m) => m?.content || "").join(" "));
  const lastAssistantText = normalize(lastAssistant?.content || "");
  const shortReply = /^(sim|s|isso|exato|claro|pode|pode ser|nao|não|n|talvez|esse|essa|qual deles|me explica|como assim)$/.test(q);

  // Continuidade: interpreta respostas curtas usando o assunto imediatamente anterior.
  // Resposta sobre porte e público após a Jenny perguntar sobre a igreja.
  if (/igreja|culto|templo|louvor/.test(lastAssistantText) && /\b(media|medio|grande|pequena|pequeno)\b/.test(q) && /\d+\s*pessoas?/.test(q)) {
    const publico = q.match(/\d+\s*pessoas?/);
    return "Entendi! Uma igreja de porte " + (q.includes("media") || q.includes("medio") ? "médio" : q.includes("pequena") || q.includes("pequeno") ? "pequeno" : "grande") + ", com cerca de " + (publico ? publico[0] : "50 pessoas") + ". 💙 O espaço é fechado ou aberto? E vocês usam banda com instrumentos ou principalmente voz?";
  }
  if (shortReply && lastAssistantText) {
    if (/igreja|culto|templo|louvor/.test(lastAssistantText)) {
      if (/^(sim|s|isso|exato|claro|pode|pode ser)$/.test(q)) return "Ótimo! Para eu continuar a orientação, me diga aproximadamente quantas pessoas frequentam a igreja e se o ambiente é pequeno, médio ou grande.";
      if (/^(nao|não|n)$/.test(q)) return "Sem problema. Você quer pensar em outra solução para a igreja ou prefere me contar o que precisa sonorizar?";
    }
    if (/estudio|gravar|gravacao|podcast/.test(lastAssistantText)) {
      if (/^(sim|s|isso|exato|claro|pode|pode ser)$/.test(q)) return "Perfeito. Você pretende gravar voz, instrumentos ou os dois? Assim consigo orientar melhor sobre microfone, interface e monitoração.";
      if (/^(nao|não|n)$/.test(q)) return "Tudo bem. O que você pretende fazer no lugar da gravação: sonorização ao vivo, ensaio ou outra aplicação?";
    }
    if (/microfone/.test(lastAssistantText)) return "Certo! Só para eu não indicar algo errado: você precisa de microfone com fio, sem fio ou para gravação?";
    if (/mesa de som|mixer/.test(lastAssistantText)) return "Entendi. A mesa será usada em igreja, evento ou estúdio? E quantos microfones ou instrumentos pretende conectar?";
    if (/caixa de som|subwoofer|sistema de som/.test(lastAssistantText)) return "Vamos por partes: o sistema será usado em ambiente fechado ou aberto? Se puder, diga também o tamanho aproximado do espaço.";
    if (/teclado|piano digital/.test(lastAssistantText)) return "Certo! Você procura um teclado para estudar, tocar na igreja ou fazer apresentações?";
    if (/violao|guitarra|contrabaixo/.test(lastAssistantText)) return "Legal! Você está procurando para começar a estudar ou já toca e quer escolher um instrumento para apresentações?";
  }
  if (/^(e voce|e vc|e tu|e ai|e voce como esta|e vc como ta)$/.test(q)) return "Estou por aqui e pronta para ajudar! 💙 Mas quero saber de você também: está procurando alguma coisa para a loja ou só quer conversar um pouco?";
  if (/^(jenny|ei jenny|voce ai|esta ai)$/.test(q)) return "Estou aqui! 😊 Pode continuar de onde paramos. Sobre o que você quer conversar?";
  if (shortReply && !context) return "Claro! 😊 Me dá só mais um pouquinho de contexto: sobre o que você está falando?";
  if (/^(entendi|certo|ok|ta bom|beleza|show)$/.test(q)) return "Combinado! Quer que eu aprofunde esse assunto ou prefere perguntar outra coisa?";
  if (/^(nao sei|não sei|ainda nao sei|ainda não sei)$/.test(q)) return "Tudo bem, podemos descobrir juntos. Me conta primeiro o que você está tentando resolver, sem precisar saber o nome do equipamento.";
  if (!q) return "Pode me contar o que você está procurando? Posso ajudar com instrumentos, equipamentos de áudio, categorias e informações do catálogo.";

  // Cumprimentos e conversa natural
  if (/\b(tudo bem|como vai|tudo certo)\b/.test(q)) return "Estou bem, obrigada por perguntar! 💙 E você, como está?";
  if (/^(oi|ola|opa|e ai|eae|bom dia|boa tarde|boa noite)$/.test(q)) return "Oi! 💙 Que bom falar com você. Como posso ajudar hoje?";
  if (has(q, [/\b(obrigad[oa]|valeu|agradeco|agradecida)\b/])) {
    return "Por nada! 💙 Se surgir outra dúvida sobre equipamentos ou instrumentos, pode falar comigo.";
  }
  if (has(q, [/\b(tchau|ate mais|ate logo|falou|vou nessa)\b/])) {
    return "Até mais! Obrigada por conhecer a Atual Som. Quando precisar de equipamentos ou instrumentos, estarei por aqui. 💙";
  }
  if (has(q, [/\b(quem e voce|seu nome|como voce chama|voce e um robo|e uma ia)\b/])) {
    return "Sou a Jenny, assistente virtual da Atual Som. Fui preparada para ajudar a encontrar produtos, explicar categorias e orientar sua escolha. Quando uma informação não está cadastrada, encaminho você à equipe para evitar passar algo errado.";
  }
  if (has(q, [/\b(o que voce faz|como pode me ajudar|pode ajudar)\b/])) {
    return "Posso ajudar você a encontrar instrumentos e equipamentos de áudio, conhecer as categorias do catálogo, entender para que serve cada tipo de equipamento e localizar o canal de atendimento da loja. O que você precisa?";
  }

  // Loja e catálogo
  if (has(q, [/\b(categorias|catalogo|catalogo completo|quais produtos|o que voces vendem|o que tem na loja|trabalham com|trabalha com)\b/])) {
    return "A Atual Som trabalha com estas categorias:\n• " + categories.join("\n• ") + "\n\nQual categoria você quer explorar?";
  }
  if (has(q, [/\b(endereco|onde fica|localizacao|loja fisica|como chegar)\b/])) {
    return humanContact("confirmar o endereço e o horário de atendimento");
  }
  if (has(q, [/\b(horario|abre|fecha|funcionamento|aberto hoje)\b/])) {
    return humanContact("confirmar o horário de funcionamento");
  }
  if (has(q, [/\b(instagram|rede social|perfil|pagina)\b/])) {
    return "Você encontra a Atual Som no Instagram: https://www.instagram.com/atualsom/. Por lá também pode falar com a equipe.";
  }
  if (has(q, [/\b(whatsapp|zap|telefone|numero|contato|atendente|vendedor|pessoa|humano|equipe)\b/])) {
    return humanContact("falar com um atendente e receber os contatos atualizados");
  }

  // Pagamento, entrega e políticas: nunca inventar condições
  if (has(q, [/\b(frete|entrega|envio|transportadora|prazo de entrega|chega quando)\b/])) {
    return humanContact("calcular o frete e confirmar o prazo de entrega para sua região");
  }
  if (has(q, [/\b(estoque|disponivel|tem em estoque|pronta entrega|a pronta entrega)\b/])) {
    return humanContact("confirmar o estoque atualizado");
  }
  if (has(q, [/\b(parcelamento|parcelar|vezes|cartao|credito|debito|boleto|pix|pagamento|formas de pagamento)\b/])) {
    return "As condições podem variar conforme o produto. A única condição detalhada cadastrada aqui é a da caixa K-AUDIO TPS-15A: R$ 2.438,00 à vista, R$ 2.869,00 no boleto ou 12x de R$ 239,08 no cartão. Para outros itens, preciso que a equipe confirme as opções.";
  }
  if (has(q, [/\b(troca|devolucao|garantia|defeito|assistencia|conserto|manutencao)\b/])) {
    return humanContact("consultar a política de garantia, troca ou assistência");
  }
  if (has(q, [/\b(desconto|promocao|promocoes|oferta|mais barato|negociar)\b/])) {
    return humanContact("verificar promoções e condições especiais disponíveis");
  }

  // Intenção: montar, instalar ou planejar um sistema de som.
  // Diferentes formulações da mesma necessidade seguem o mesmo atendimento.
  const soundSystemIntent = has(q, [
    /\\b(montar|montagem|construir|construcao|instalar|instalacao|projetar|planejar|criar|fazer|desenvolver|preciso de|quero|estou procurando)\\b.*\\b(som|sonorizacao|sistema de audio|sistema de som|equipamento de audio|equipamentos de audio|audio)\\b/,
    /\\b(som|sonorizacao|sistema de audio|sistema de som)\\b.*\\b(igreja|culto|evento|auditorio|comercio|casa|ambiente)\\b/,
    /\\b(quero um som|preciso de um som|preciso sonorizar|fazer a sonorizacao|montar o audio)\\b/
  ]);
  if (soundSystemIntent) {
    if (/\\b(igreja|culto|templo|louvor|ministerio)\\b/.test(q)) {
      return "Claro! 💙 Vamos planejar a sonorização da igreja. Para começar, quantas pessoas o espaço costuma receber? Se souber, diga também se o ambiente é pequeno, médio ou grande.";
    }
    if (/\\b(evento|festa|show|palestra|auditorio|ar livre|area aberta)\\b/.test(q)) {
      return "Vamos pensar em um sistema adequado para esse evento! 💙 Qual é o público estimado e o local será aberto ou fechado?";
    }
    if (/\\b(estudio|gravacao|podcast|home studio)\\b/.test(q)) {
      return "Perfeito! 💙 Para montar esse sistema, você pretende captar voz, instrumentos ou os dois?";
    }
    return "Claro! 💙 Posso ajudar a planejar o sistema de som. Onde você pretende usar: igreja, eventos, comércio ou em casa?";
  }

  // Perguntas frequentes de atendimento e orientação básica
  if (has(q, [/\b(como comprar|quero comprar|fazer pedido|fechar pedido|realizar compra|encomendar)\b/])) {
    return "É simples! 💙 Você pode escolher o produto no catálogo e falar com a equipe da Atual Som para confirmar disponibilidade, valor e concluir a compra pelo WhatsApp: https://wa.me/559984646848. Se quiser, me diga qual produto procura e eu ajudo a localizar.";
  }
  if (has(q, [/\b(voces vendem|vcs vendem|tem instrumento|instrumentos musicais|instrumentos)\b/])) {
    return "Sim! A Atual Som trabalha com instrumentos e equipamentos de áudio. No catálogo temos categorias como cordas, teclas, sopro, percussão, microfones, mesas e sistemas de som. Qual instrumento ou equipamento você procura?";
  }
  if (has(q, [/\b(aceita pix|paga no pix|pagamento no pix|pix)\b/])) {
    return "Não tenho a confirmação das formas de pagamento de todos os produtos. Para confirmar se há Pix e as condições atuais, fale com a equipe pelo WhatsApp: https://wa.me/559984646848.";
  }
  if (has(q, [/\b(fazem entrega|entrega para|entregam|envia para|mandam para|entrega em)\b/])) {
    return humanContact("confirmar se há entrega para sua cidade e calcular o frete");
  }
  if (has(q, [/\b(qual a melhor caixa|melhor caixa de som|caixa de som boa|qual caixa comprar|indica uma caixa)\b/])) {
    return "A melhor caixa depende do uso e do ambiente. Para indicar sem exagerar ou faltar potência, preciso saber: será para voz e música, igreja, evento ou uso doméstico? O espaço é fechado ou aberto?";
  }
  if (has(q, [/\b(o que e rms|o que significa rms|potencia rms|watts rms|rms)\b/])) {
    return "RMS é uma referência de potência contínua que ajuda a comparar a capacidade de trabalho de um equipamento de áudio. Não escolha uma caixa apenas pelo número de watts: sensibilidade, qualidade, cobertura e tamanho do ambiente também fazem diferença.";
  }
  if (has(q, [/\b(o que e uma mesa de som|para que serve mesa de som|mesa de som serve para que)\b/])) {
    return "A mesa de som reúne e controla o áudio de microfones, instrumentos e outras fontes. Nela você ajusta volumes, equalização e, conforme o modelo, efeitos e saídas diferentes. A quantidade de canais deve acompanhar tudo o que será conectado.";
  }
  if (has(q, [/\b(o que e caixa ativa|caixa ativa significa|caixa amplificada)\b/])) {
    return "Uma caixa ativa, também chamada de amplificada, já possui amplificador interno. Em geral, basta enviar o sinal de áudio e fornecer energia elétrica, respeitando as conexões e orientações do fabricante.";
  }
  if (has(q, [/\b(o que e caixa passiva|caixa passiva significa)\b/])) {
    return "Uma caixa passiva não possui amplificador interno: ela precisa ser ligada a um amplificador compatível. É importante conferir impedância e potência para combinar os equipamentos corretamente.";
  }
  if (has(q, [/\b(qual diferenca entre caixa ativa e passiva|diferenca caixa ativa passiva|ativa ou passiva)\b/])) {
    return "A caixa ativa já tem amplificador integrado; a passiva precisa de um amplificador externo. A ativa costuma simplificar a montagem. A passiva pode fazer sentido em sistemas com amplificação centralizada. A escolha depende do projeto e dos equipamentos que você já possui.";
  }
  if (has(q, [/\b(o que e subwoofer|para que serve subwoofer|subwoofer serve para que)\b/])) {
    return "O subwoofer reproduz principalmente as frequências graves e complementa as caixas principais. Ele não substitui as caixas de voz: precisa ser combinado com o restante do sistema e ajustado ao ambiente.";
  }
  if (has(q, [/\b(qual microfone comprar|melhor microfone|indica um microfone|microfone para voz)\b/])) {
    return "Para voz ao vivo, microfones dinâmicos são muito usados pela praticidade e resistência. Para gravação, um condensador pode ser interessante, dependendo do ambiente. Você vai usar em palco, igreja, reuniões ou estúdio? Prefere com fio ou sem fio?";
  }
  if (has(q, [/\b(qual a diferenca entre digital e analogica|mesa digital ou analogica|mesa analogica ou digital)\b/])) {
    return "Mesas analógicas costumam ter controles diretos e operação simples. Mesas digitais reúnem recursos como processamento, cenas e roteamento avançado, variando conforme o modelo. A melhor escolha depende da quantidade de canais, recursos necessários e familiaridade de quem vai operar.";
  }
  if (has(q, [/\b(o que preciso para montar um som|montar um sistema de som|equipamentos para montar um som|como montar um som)\b/])) {
    return "Um sistema básico pode envolver fonte de áudio, mesa ou controlador quando necessário, caixas compatíveis, microfones e cabos. A lista muda conforme o uso. É para igreja, evento, comércio, estúdio ou casa?";
  }
  if (has(q, [/\b(qual a melhor marca|melhor marca de caixa|melhor marca de mesa|marca mais confiavel)\b/])) {
    return "Não existe uma única melhor marca para todos os casos. É importante comparar modelo, potência real, cobertura, entradas, garantia, assistência e orçamento. Se me disser o tipo de equipamento e o uso, ajudo a definir o que avaliar.";
  }
  if (has(q, [/\b(voces fazem projeto|faz projeto de som|projeto de sonorizacao|orcamento de som|montar projeto)\b/])) {
    return "Podemos iniciar uma orientação de sonorização. Para isso, precisamos entender o ambiente, as medidas, o público e o tipo de uso. Você pode acessar a área Projects no site ou falar com a equipe pelo WhatsApp: https://wa.me/559984646848.";
  }
  // Orientação por necessidade
  if (has(q, [/\b(quero|preciso|montar|comprar|fazer)\b.*\b(som|sonorizacao|sistema de som)\b/, /^som$/, /^quero um som$/])) {
    return "Claro! 💙 Vamos encontrar um sistema de som adequado. Você precisa dele para igreja, eventos, comércio ou uso em casa?";
  }
  if (has(q, [/\b(igreja|culto|templo|ministerio|louvor|banda da igreja|som para igreja)\b/])) {
    return "Para sonorizar uma igreja, normalmente vale avaliar caixas de som, mesa de som, microfones e cabos. A escolha depende do tamanho do ambiente, quantidade de pessoas, instrumentos e se o som será usado também para transmissão. É para quantas pessoas, aproximadamente?";
  }
  if (has(q, [/\b(evento|festa|show|palestra|auditorio|area aberta|ar livre)\b/])) {
    return "Para um evento, os pontos principais são o tamanho do espaço, público estimado, uso em ambiente aberto ou fechado e quantidade de microfones/instrumentos. Você pretende sonorizar um espaço de quantas pessoas?";
  }
  if (has(q, [/\b(estudio|gravar|gravacao|podcast|home studio)\b/])) {
    return "Para gravação, podemos começar identificando o que você quer captar: voz, instrumentos ou podcast. Em geral, entram na lista microfone, interface de áudio, fones e, dependendo do projeto, monitores. O que você pretende gravar?";
  }
  if (has(q, [/\b(igreja pequena|som pequeno|ambiente pequeno)\b/])) {
    return "Em um ambiente pequeno, é importante evitar comprar potência sem necessidade. Precisamos considerar o tamanho do local, quantidade de pessoas e se haverá música ao vivo. Como é o espaço?";
  }
  if (has(q, [/\b(iniciante|comecar|comecando|primeiro instrumento|aprender musica|estudar)\b/])) {
    return "Que legal começar na música! 💙 A melhor escolha depende do seu gosto, objetivo e orçamento. Você tem vontade de aprender violão, guitarra, teclado, bateria ou outro instrumento?";
  }
  if (has(q, [/\b(qual comprar|qual voce recomenda|me recomenda|melhor equipamento|preciso de ajuda para escolher)\b/])) {
    return "Claro! Para indicar algo que realmente faça sentido, me diga três coisas: qual será o uso, onde você vai utilizar e qual faixa de investimento pretende considerar.";
  }

  // Dúvidas sobre tipos de equipamentos
  if (has(q, [/\b(mesa de som|mixer|mixagem|canais de audio)\b/])) {
    return "A mesa de som recebe e controla sinais de microfones e instrumentos, permitindo ajustar volumes e equalização antes de enviar o áudio às caixas. Mesas digitais oferecem recursos de processamento e memórias; analógicas costumam ter operação mais direta. Você precisa de uma mesa para igreja, evento ou estúdio?";
  }
  if (has(q, [/\b(microfone|microfones|sem fio|wireless|lapela)\b/])) {
    return "Existem microfones com fio, sem fio, dinâmicos e condensadores. A escolha depende da aplicação: voz ao vivo, instrumentos, gravação ou apresentação. Você vai usar o microfone em palco, igreja, reunião ou estúdio?";
  }
  if (has(q, [/\b(caixa de som|alto falante|som amplificado|caixa ativa|caixa passiva)\b/])) {
    return "Caixas ativas possuem amplificação integrada; caixas passivas precisam de amplificador externo. Para escolher, precisamos considerar tamanho do ambiente, público e finalidade. Você pretende usar em igreja, evento ou ambiente doméstico?";
  }
  if (has(q, [/\b(subwoofer|grave|graves)\b/])) {
    return "O subwoofer é uma caixa dedicada às frequências graves. Ele complementa as caixas principais, especialmente em música ao vivo e eventos. O resultado depende do conjunto e do espaço. Você quer reforçar o grave de qual sistema?";
  }
  if (has(q, [/\b(interface de audio|placa de audio|gravar no computador)\b/])) {
    return "A interface de áudio conecta microfones e instrumentos ao computador, convertendo o sinal para gravação e reprodução. Para indicar uma, preciso saber quantas entradas você precisa e o que pretende gravar.";
  }
  if (has(q, [/\b(cabo|cabos|conector|plug|adaptador|pedestal|suporte)\b/])) {
    return "Cabos, conectores, pedestais e suportes precisam ser escolhidos de acordo com o equipamento e o tipo de conexão. Se você me disser o modelo do aparelho ou mandar o nome da conexão, posso orientar melhor.";
  }
  if (has(q, [/\b(teclado|piano digital|teclas)\b/])) {
    return "Teclados podem variar bastante em timbres, teclas, acompanhamento e recursos. Piano digital costuma priorizar a experiência de piano; teclados arranjadores oferecem mais sons e acompanhamentos. Você procura para estudar, tocar na igreja ou apresentações?";
  }
  if (has(q, [/\b(violao|guitarra|contrabaixo|baixo eletrico|cordas)\b/])) {
    return "Na categoria de cordas você pode explorar violões, guitarras e contrabaixos. A escolha depende do estilo musical, conforto, sonoridade e experiência de quem vai tocar. Qual instrumento você está procurando?";
  }
  if (has(q, [/\b(bateria|cajon|percussao|prato|baqueta)\b/])) {
    return "A categoria de percussão atende desde estudos e apresentações acústicas até bandas e palco. Você procura uma bateria completa, cajón ou algum acessório?";
  }
  if (has(q, [/\b(saxofone|trompete|sopro|flauta|clarinete)\b/])) {
    return "Temos a categoria de instrumentos de sopro no catálogo. Para encontrar a opção certa, me diga qual instrumento você procura e se é para estudo ou apresentação.";
  }

  // Busca de produto no catálogo
  const matches = products.filter((p) => {
    const terms = normalize(p.name + " " + p.category + " " + p.description).split(" ");
    return terms.some((word) => word.length > 3 && q.includes(word));
  });

  if (matches.length) {
    const selected = matches.slice(0, 5);
    const details = selected.map((p) => {
      let line = "• " + p.name + " — " + p.category + ". " + p.description;
      if (p.price) line += " Preço cadastrado: " + p.price.cash + "; " + p.price.boleto + "; " + p.price.card + ".";
      return line;
    }).join("\n");
    return "Encontrei estas opções no catálogo:\n" + details + "\n\nQuer saber mais sobre algum desses itens? Para confirmar estoque e condições atualizadas, consulte a equipe.";
  }

  // Preço sem produto específico
  if (has(q, [/\b(preco|valor|quanto custa|custa|orcamento)\b/])) {
    return "Qual produto você gostaria de consultar? Tenho uma condição de preço cadastrada para a caixa K-AUDIO TPS-15A 300W. Para os demais itens, a equipe precisa confirmar o valor atualizado.";
  }

  // Resposta honesta para perguntas fora da base
  return "Ainda não tenho essa informação cadastrada e prefiro não inventar uma resposta. Posso ajudar com o catálogo, instrumentos, mesas, microfones, caixas de som, equipamentos para igrejas, eventos e gravação. Se sua dúvida for específica, descreva um pouco mais ou fale com a equipe: https://www.instagram.com/atualsom/.";
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Jenny - Atual Som",
    engine: AI_API_URL && AI_API_KEY && AI_MODEL ? "language-model" : "rules-fallback",
    aiConfigured: Boolean(AI_API_URL && AI_API_KEY && AI_MODEL),
    message: "Servidor online."
  });
});

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const history = Array.isArray(req.body?.history) ? req.body.history
    .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .slice(-10) : [];
  if (!message) {
    return res.status(400).json({ error: "Envie uma mensagem para a Jenny." });
  }

  try {
    const aiReply = await answerWithAI(message, history);
    if (aiReply) return res.json({ reply: aiReply, engine: "language-model" });

    // Mantém o atendimento antigo apenas enquanto as credenciais do motor de IA não forem configuradas.
    return res.json({ reply: answer(message, history), engine: "rules-fallback" });
  } catch (error) {
    console.error("Erro no atendimento da Jenny:", error.message);
    return res.status(503).json({
      error: "Estou com uma instabilidade momentânea no atendimento inteligente. Tente novamente em instantes ou fale com nossa equipe: https://wa.me/559984646848."
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Erro no servidor:", err.message);
  res.status(500).json({ error: "Ocorreu um erro no servidor." });
});

app.listen(PORT, () => {
  console.log("Jenny server ouvindo na porta " + PORT);
});
