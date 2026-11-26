require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.SITE_ORIGIN || "https://atualsomoficial.github.io";

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
  { name: "Caixa K-AUDIO TPS-15A 300W", category: "Sistemas de som", description: "Caixa ativa profissional de 300W RMS para igrejas, eventos e apresentações.", price: { cash: "R$ 2.438,00 à vista", boleto: "R$ 2.869,00 no boleto", card: "12x de R$ 239,08 no cartão" } }
];

const categories = [...new Set(products.map((p) => p.category))];

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
  if (shortReply && context) {
    if (/igreja|culto|templo|louvor/.test(context)) {
      if (/^(sim|s|isso|exato|claro|pode|pode ser)$/.test(q)) return "Ótimo! Para eu continuar a orientação, me diga aproximadamente quantas pessoas frequentam a igreja e se o ambiente é pequeno, médio ou grande.";
      if (/^(nao|não|n)$/.test(q)) return "Sem problema. Você quer pensar em outra solução para a igreja ou prefere me contar o que precisa sonorizar?";
    }
    if (/estudio|gravar|gravacao|podcast/.test(context)) {
      if (/^(sim|s|isso|exato|claro|pode|pode ser)$/.test(q)) return "Perfeito. Você pretende gravar voz, instrumentos ou os dois? Assim consigo orientar melhor sobre microfone, interface e monitoração.";
      if (/^(nao|não|n)$/.test(q)) return "Tudo bem. O que você pretende fazer no lugar da gravação: sonorização ao vivo, ensaio ou outra aplicação?";
    }
    if (/microfone/.test(context)) return "Certo! Só para eu não indicar algo errado: você precisa de microfone com fio, sem fio ou para gravação?";
    if (/mesa de som|mixer/.test(context)) return "Entendi. A mesa será usada em igreja, evento ou estúdio? E quantos microfones ou instrumentos pretende conectar?";
    if (/caixa de som|subwoofer|sistema de som/.test(context)) return "Vamos por partes: o sistema será usado em ambiente fechado ou aberto? Se puder, diga também o tamanho aproximado do espaço.";
    if (/teclado|piano digital/.test(context)) return "Certo! Você procura um teclado para estudar, tocar na igreja ou fazer apresentações?";
    if (/violao|guitarra|contrabaixo/.test(context)) return "Legal! Você está procurando para começar a estudar ou já toca e quer escolher um instrumento para apresentações?";
  }
  if (/^(e voce|e vc|e tu|e ai|e voce como esta|e vc como ta)$/.test(q)) return "Estou por aqui e pronta para ajudar! 💙 Mas quero saber de você também: está procurando alguma coisa para a loja ou só quer conversar um pouco?";
  if (/^(jenny|ei jenny|voce ai|esta ai)$/.test(q)) return "Estou aqui! 😊 Pode continuar de onde paramos. Sobre o que você quer conversar?";
  if (shortReply && !context) return "Claro! 😊 Me dá só mais um pouquinho de contexto: sobre o que você está falando?";
  if (/^(entendi|certo|ok|ta bom|beleza|show)$/.test(q)) return "Combinado! Quer que eu aprofunde esse assunto ou prefere perguntar outra coisa?";
  if (/^(nao sei|não sei|ainda nao sei|ainda não sei)$/.test(q)) return "Tudo bem, podemos descobrir juntos. Me conta primeiro o que você está tentando resolver, sem precisar saber o nome do equipamento.";
  if (!q) return "Pode me contar o que você está procurando? Posso ajudar com instrumentos, equipamentos de áudio, categorias e informações do catálogo.";

  // Cumprimentos e conversa natural
  if (has(q, [/^(oi|ola|opa|e ai|eae|bom dia|boa tarde|boa noite)$/, /\b(tudo bem|como vai|tudo certo)\b/])) {
    return "Olá! 💙 Eu sou a Jenny, assistente virtual da Atual Som. Como posso ajudar hoje? Você procura um instrumento, equipamento de som ou algum acessório?";
  }
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

  // Orientação por necessidade
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
    message: "Servidor online."
  });
});

app.post("/api/chat", (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const history = Array.isArray(req.body?.history) ? req.body.history
    .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .slice(-12) : [];
  if (!message) {
    return res.status(400).json({ error: "Envie uma mensagem para a Jenny." });
  }
  return res.json({ reply: answer(message, history) });
});

app.use((err, _req, res, _next) => {
  console.error("Erro no servidor:", err.message);
  res.status(500).json({ error: "Ocorreu um erro no servidor." });
});

app.listen(PORT, () => {
  console.log("Jenny server ouvindo na porta " + PORT);
});
