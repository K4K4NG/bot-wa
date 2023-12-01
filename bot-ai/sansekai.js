const {
  BufferJSON,
  WA_DEFAULT_EPHEMERAL,
  generateWAMessageFromContent,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  getContentType
} = require("@adiwajshing/baileys");

const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");

module.exports = sansekai = async (client, m, chatUpdate, store) => {
  try {
    var body =
      m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype == "imageMessage"
        ? m.message.imageMessage.caption
        : m.mtype == "videoMessage"
        ? m.message.videoMessage.caption
        : m.mtype == "extendedTextMessage"
        ? m.message.extendedTextMessage.text
        : m.mtype == "buttonsResponseMessage"
        ? m.message.buttonsResponseMessage.selectedButtonId
        : m.mtype == "listResponseMessage"
        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
        : m.mtype == "templateButtonReplyMessage"
        ? m.message.templateButtonReplyMessage.selectedId
        : m.mtype === "messageContextInfo"
        ? m.message.buttonsResponseMessage?.selectedButtonId ||
          m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
          m.text
        : "";

    var budy = typeof m.text == "string" ? m.text : "";
    var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
    const isCmd2 = body.startsWith(prefix);
    const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const itsMe = m.sender == botNumber ? true : false;
    let text = (q = args.join(" "));
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

    const from = m.chat;
    const reply = m.reply;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => {}) : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";

    let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;

    if (isCmd2 && !m.isGroup) {
      console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
    } else if (isCmd2 && m.isGroup) {
      console.log(
        chalk.black(chalk.bgWhite("[ LOGS ]")),
        color(argsLog, "turquoise"),
        chalk.magenta("From"),
        chalk.green(pushname),
        chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`),
        chalk.blueBright("IN"),
        chalk.green(groupName)
      );
    }

    if (isCmd2) {
      switch (command) {
        case ".help":
        case ".menu":
        case ".start":
        case ".info":
          m.reply(`*Whatsapp Bot OpenAI*
            
*(ChatGPT)*
Cmd: ${prefix}ai 
Tanyakan apa saja kepada AI. 

*(DALL-E)*
Cmd: ${prefix}img
Membuat gambar dari teks

*(Source Code Bot)*
Cmd: ${prefix}sc
Menampilkan source code bot yang dipakai`);
          break;
        case ".ai":
        case ".openai":
        case ".chatgpt":
        case ".ask":
          try {
            if (setting.keyopenai === "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") return reply("Apikey belum diisi...");
            if (!text) return reply(`Chat dengan AI...\n\nContoh: ${prefix}${command} Apa itu resesi`);
            const configuration = new Configuration({
              apiKey: setting.keyopenai,
            });
            const openai = new OpenAIApi(configuration);
            const response = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: text }],
            });
            m.reply(`${response.data.choices[0].message.content}`);
          } catch (error) {
            console.logError(error);
            m.reply("Maaf, sepertinya ada yang error: " + error.message);
          }
          break;
        case ".img":
        case ".ai-img":
        case ".image":
        case ".images":
        case ".dall-e":
        case ".dalle":
          try {
            if (setting.keyopenai === "ISI_APIKEY_OPENAI_DISINI") return reply("Apikey belum diisi...");
            if (!text) return reply(`Membuat gambar dari AI...\n\nContoh: ${prefix}${command} Wooden house on snow mountain`);
            const configuration = new Configuration({
              apiKey: setting.keyopenai,
            });
            const openai = new OpenAIApi(configuration);
            const response = await openai.createImage({
              prompt: text,
              n: 1,
              size: "512x512",
            });
            client.sendImage(from, response.data.data[0].url, text, mek);
          } catch (error) {
            console.logError(error);
            m.reply("Maaf, sepertinya ada yang error: " + error.message);
          }
          break;
        case ".sc":
        case ".script":
        case ".scbot":
          m.reply("Bot ini menggunakan script dari https://github.com/Sansekai/Wa-OpenAI");
          break;
        case ".s":
        case ".stiker":
          try {
            if (!isMedia || !mek.message.imageMessage || !mek.message.imageMessage.url) {
              return reply("Kirim gambar yang ingin dijadikan stiker.");
            }

            const imageBuffer = await client.downloadMediaMessage(mek);
            const stickerBuffer = await createSticker(imageBuffer);
            client.sendImageAsSticker(from, stickerBuffer, {quoted: mek});
          } catch (error) {
            console.error(error);
            reply("Maaf, terjadi kesalahan saat membuat stiker.");
          }
          break;
        default:
          if (isCmd2 && budy.toLowerCase() != undefined) {
            if (m.chat.endsWith("broadcast")) return;
            if (m.isBaileys) return;
            if (!budy.toLowerCase()) return;
            if (argsLog || (isCmd2 && !m.isGroup)) {
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            } else if (argsLog || (isCmd2 && m.isGroup)) {
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            }
          }
      }
    }
  } catch (err) {
    m.reply(util.format(err));
  }
};

async function createSticker(imageBuffer) {
  const stickerData = await client.generateSticker(imageBuffer, 'author');
  const stickerBuffer = Buffer.from(stickerData, 'base64');
  return stickerBuffer;
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
