export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const message = req.body.message;
    if (!message || !message.chat || !message.text) {
      res.status(200).json({ ok: true });
      return;
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    let reply;
    if (text === '/start') {
      reply = `👋 Welcome to LitAgent!\n\nYour Telegram Chat ID is:\n\n\`${chatId}\`\n\nCopy this and paste it into LitAgent → Settings → Notifications to receive payment reminders and balance alerts here.`;
    } else {
      reply = `Your Chat ID is: \`${chatId}\`\n\nPaste this into LitAgent → Settings → Notifications.`;
    }

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Telegram webhook error:', e);
    res.status(200).json({ ok: true }); // always 200 so Telegram doesn't retry endlessly
  }
}