import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { channel_id } = await request.json();

    if (!channel_id) {
      return NextResponse.json({ success: false, error: 'Channel ID missing' }, { status: 400 });
    }

    // သင့်ရဲ့ Telegram Bot Token ကို အောက်ပါစာကြောင်းတွင် အစားထိုးထည့်ပါ
    // ဥပမာ - const BOT_TOKEN = "123456789:ABCDefghIJKlmnOPQRstUVwxyz";
    const BOT_TOKEN = "8962875521:AAHhx5Bo6Fa73QgEiYWWZYzKmoGWkHbe2K4"; 

    // Telegram API ကို လှမ်းခေါ်ခြင်း (member_limit=1 ပါဝင်သည်)
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`;
    const tgResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel_id,
        member_limit: 1 // ဤနေရာတွင် ၁ ယောက်သာ ဝင်ခွင့်ကို သတ်မှတ်ထားသည်
      })
    });

    const tgData = await tgResponse.json();

    if (tgData.ok && tgData.result) {
      return NextResponse.json({ success: true, link: tgData.result.invite_link });
    } else {
      console.error("Telegram API Error:", tgData);
      return NextResponse.json({ success: false, error: 'Failed to generate link' }, { status: 400 });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}