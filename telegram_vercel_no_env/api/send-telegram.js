// Vercel Serverless Function: /api/send-telegram
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const { name, contact, task, website } = body;

    // Honeypot: silently accept bot submissions without forwarding them.
    if (typeof website === "string" && website.trim()) {
      return res.status(200).json({ success: true });
    }

    const isText = (value, max) =>
      typeof value === "string" && value.trim().length > 0 && value.length <= max;

    if (!isText(name, 100) || !isText(contact, 200) || !isText(task, 3000)) {
      return res.status(400).json({
        success: false,
        error: "Проверьте заполнение формы"
      });
    }

    // Вставьте НОВЫЙ токен от @BotFather между кавычками ниже.
    // Токен хранится только в серверной функции, не в index.html.
    const token = "9161119287:AAH_v1b6Kd0dr_LcAEyBCADSgXtPxSugmAo";
    const chatId = "7196676689";

    // Plain text: user-provided text cannot break Telegram Markdown formatting.
    const text = [
      "🔔 НОВАЯ ЗАЯВКА С САЙТА",
      "",
      `👤 Имя: ${name.trim()}`,
      `📬 Контакт: ${contact.trim()}`,
      `📝 Задача: ${task.trim()}`
    ].join("\n");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API error:", telegramResult.error_code || "unknown");
      return res.status(502).json({
        success: false,
        error: "Telegram временно не принял заявку"
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("send-telegram error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Внутренняя ошибка сервера"
    });
  }
};
