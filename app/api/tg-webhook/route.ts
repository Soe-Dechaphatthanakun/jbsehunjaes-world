export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore/lite";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAPVvbhDa1xJ97b2N4Mm7it4yY1TRSKaDw", 
  authDomain: "jbsehunjaes-world.firebaseapp.com",
  projectId: "jbsehunjaes-world",
  storageBucket: "jbsehunjaes-world.firebasestorage.app",
  messagingSenderId: "605183918160",
  appId: "1:605183918160:web:a5a9e10af5a113fa32d155",
  measurementId: "G-YB2V92YDTS"
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const BOT_TOKEN = "8962875521:AAE3A3aEx652OFr0G97GWTAAImb19Eyb9-Y"; // ⚠️ အစ်ကို့ Bot Token အစစ်ပြန်ထည့်ပါ
    const ADMIN_GROUP_ID = "-1003824552410"; // ⚠️ အစ်ကို့ Admin Group ID အစစ်ပြန်ထည့်ပါ

    // 🌟 BOT DM (Start Command) ဖြင့် ဝင်လာသော User များအား Protect Content ဖြင့် ဗီဒီယိုပို့ပေးခြင်း
    if (body.message && body.message.chat && body.message.chat.type === 'private' && body.message.text) {
       const text = body.message.text;

       if (text === '/start') {
           await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
               method: 'POST', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ chat_id: body.message.chat.id, text: "🎬 ဇာတ်ကားကြည့်ရန်အတွက် Website ပေါ်ရှိ 'Get via Bot' သို့မဟုတ် 'ဝယ်ယူမည်' ခလုတ်ကို နှိပ်ပြီးမှသာ ဝင်ရောက်ပေးပါ။\n(ရိုးရိုး /start နှိပ်လျှင် ဇာတ်ကားပို့ပေးမည် မဟုတ်ပါ။)" })
           });
           return NextResponse.json({ success: true });
       }

       if (text.startsWith('/start ')) {
           const payload = text.split(' ')[1];
           if (payload) {
              try {
                 let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                 while (b64.length % 4) b64 += '=';
                 
                 let decodedStr = atob(b64);
                 
                 // 🌟 စာလုံးအပွားများကို မူလအတိုင်း ပြန်လည်ဖြည်ထုတ်ပေးခြင်း
                 try {
                     decodedStr = decodeURIComponent(escape(decodedStr));
                 } catch(err) {
                     // Error ဖြစ်လျှင် မူလစာသားအတိုင်း ထားမည်
                 }
                 
                 const [username, showId, epIndexStr] = decodedStr.split(':::');
                 const epIndex = parseInt(epIndexStr, 10);

                 const userSnap = await getDoc(doc(db, "Users", username));
                 
                 if (userSnap.exists()) {
                     const user = userSnap.data();

                     if (user.unlockedEpisodes && user.unlockedEpisodes.includes(`${showId}_${epIndex}`)) {
                         
                         const showSnap = await getDoc(doc(db, "Shows", showId));
                         const show = showSnap.exists() ? (showSnap.data() as any) : null;

                         if (show && show.episodes && show.episodes[epIndex] && show.episodes[epIndex].links && show.episodes[epIndex].links.length > 0) {
                             
                             const tgLinkObj = show.episodes[epIndex].links.find((l: any) => 
                                 (l.platform && l.platform.toLowerCase() === 'telegram') || 
                                 (l.url && l.url.includes('t.me'))
                             );
                             
                             if (!tgLinkObj || !tgLinkObj.url) {
                                 await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ chat_id: body.message.chat.id, text: "❌ ဤအပိုင်းအတွက် Telegram Link မရှိပါ။ Admin သို့ဆက်သွယ်ပါ။" })
                                 });
                                 return NextResponse.json({ success: true });
                             }

                             let tgUrl = tgLinkObj.url; 
                             if (!tgUrl.startsWith('http')) {
                                 tgUrl = 'https://' + tgUrl;
                             }

                             let fromChatId = '';
                             let messageId: number = 0;

                             try {
                                 const urlObj = new URL(tgUrl);
                                 const pathParts = urlObj.pathname.split('/').filter(Boolean);
                                 
                                 if (pathParts[0] === 'c') {
                                     fromChatId = '-100' + pathParts[1];
                                 } else {
                                     fromChatId = '@' + pathParts[0];
                                 }
                                 messageId = parseInt(pathParts[pathParts.length - 1], 10);
                                 if (isNaN(messageId)) throw new Error("Invalid Message ID");
                                 
                             } catch (err) {
                                 await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ chat_id: body.message.chat.id, text: `❌ လင့်ခ် ပုံစံမှားယွင်းနေပါသည်။\n(URL: ${tgUrl})` })
                                 });
                                 return NextResponse.json({ success: true });
                             }

                             const copyRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`, {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({
                                     chat_id: body.message.chat.id,
                                     from_chat_id: fromChatId,
                                     message_id: messageId,
                                     protect_content: true 
                                 })
                             });

                             const copyData = await copyRes.json();
                             if (copyData.ok) {
                                 await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ chat_id: ADMIN_GROUP_ID, text: `✅ Delivered: [${username}] ထံသို့ [${show.title_mm || show.title_en} - ${show.episodes[epIndex].epLabel}] အား အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ။ (Protected)` })
                                 });
                             } else {
                                 await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ chat_id: body.message.chat.id, text: `❌ ချန်နယ် ချိတ်ဆက်မှု မှားယွင်းနေပါသည်။ (Bot ကို Channel တွင် Admin ပေးထားခြင်း ရှိမရှိ စစ်ဆေးပါ)\nError: ${copyData.description}` })
                                 });
                             }
                         } else {
                             await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                 method: 'POST', headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ chat_id: body.message.chat.id, text: "❌ ဇာတ်ကားအချက်အလက် မပြည့်စုံပါ။ (Link မရှိပါ)" })
                             });
                         }
                     } else {
                         await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                             method: 'POST', headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ chat_id: body.message.chat.id, text: "❌ သင်သည် ဤအပိုင်းအား ဝယ်ယူထားခြင်း မရှိသေးပါ။" })
                         });
                     }
                 } else {
                     await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                         method: 'POST', headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ chat_id: body.message.chat.id, text: "❌ သင့်အကောင့်ကို ရှာမတွေ့ပါ။ Website တွင် Login အရင်ဝင်ပါ။" })
                     });
                 }
              } catch (e: any) {
                 await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ chat_id: body.message.chat.id, text: "❌ စနစ်ချို့ယွင်းမှုဖြစ်ပွားနေပါသည်။ (Decode Error)" })
                 });
              }
           }
           return NextResponse.json({ success: true });
       }
    }

    // 🌟 CHANNEL AUTO-LINK POST 🌟
    const post = body.channel_post || body.edited_channel_post || body.message || body.edited_message;
    if (!post) return NextResponse.json({ success: true, msg: 'Not a valid post' });

    const content = post.text || post.caption || '';
    const match = content.match(/#([a-zA-Z0-9_-]+)-ep(\d+)/i);
    if (!match) return NextResponse.json({ success: true, msg: 'No auto-link tag found' });

    const movieId = match[1];
    const epNumber = parseInt(match[2], 10);

    let tgLink = '';
    if (post.chat.username) {
      tgLink = `https://t.me/${post.chat.username}/${post.message_id}`;
    } else {
      const chatIdStr = String(post.chat.id).replace('-100', '');
      tgLink = `https://t.me/c/${chatIdStr}/${post.message_id}`;
    }

    const showRef = doc(db, "Shows", movieId);
    const showSnap = await getDoc(showRef);
    
    if (showSnap.exists()) {
      let show = showSnap.data() as any;

      if (show.episodes && show.episodes[epNumber - 1]) {
        const ep = show.episodes[epNumber - 1];
        if (!ep.links) ep.links = [];
        
        const alreadyExists = ep.links.some((l: any) => l.url === tgLink);
        if (!alreadyExists) {
          ep.links.push({ platform: 'Telegram', url: tgLink });
          show.updatedAt = new Date().toISOString();
          await setDoc(showRef, show);
          console.log(`Auto-linked ${movieId} Episode ${epNumber} successfully`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}