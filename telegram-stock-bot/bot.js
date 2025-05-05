const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

let produitId = 68425;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Bienvenue ! Tape /stock pour voir la disponibilité. /id <num> pour changer de produit.");
});

bot.onText(/\/id (\d+)/, (msg, match) => {
  produitId = parseInt(match[1]);
  bot.sendMessage(msg.chat.id, `🔄 Produit changé : ${produitId}`);
});

bot.onText(/\/stock/, async (msg) => {
  const chatId = msg.chat.id;
  const data = await checkStock(produitId);

  if (data.length === 0) {
    bot.sendMessage(chatId, "❌ Aucun stock disponible.");
  } else {
    const message = data.map(p => `✅ ${p.Nom} - ${p.Ville} (${p.Quantité} en stock)`).join("\n\n");
    bot.sendMessage(chatId, message);
  }
});

async function checkStock(id) {
  const res = await fetch("https://api.vigirupture.fr/api/1/vr/productdispo", {
    method: "POST",
    headers: {
      "Authorization": process.env.VIGI_TOKEN,
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: JSON.stringify({
      Lat: 48.98816,
      Lng: 2.3625728,
      Distance: 30,
      PR: [{ Id: id }]
    })
  });

  const json = await res.json();
  const results = json.result || [];
  return results
    .filter(p => p.Stock?.some(s => s.Id === id && s.Quantite > 0))
    .map(p => ({
      Nom: p.Nom_Pharmacie,
      Ville: p.Ville,
      Quantité: p.Stock[0].Quantite
    }));
}