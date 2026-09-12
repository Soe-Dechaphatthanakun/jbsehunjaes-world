import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

    const BOT_TOKEN = "8962875521:AAHhx5Bo6Fa73QgEiYWWZYzKmoGWkHbe2K4"; // ⚠️ သင့် Bot Token ကို ဤနေရာတွင် ထည့်ပါ
    const ADMIN_GROUP_ID = "-1003824552410"; // ⚠️ Report ပို့ရန် သင့် Admin Group ID (ဥပမာ -100123...)

    // 🌟 BOT DM (Start Command) ဖြင့် ဝင်လာသော User များအား Protect Content ဖြင့် ဗီဒီယိုပို့ပေးခြင်း
    if (body.message && body.message.chat && body.message.chat.type === 'private' && body.message.text && body.message.text.startsWith('/start ')) {
       const payload = body.message.text.split(' ')[1];
       if (payload) {
          try {
             // Decode payload (Username ကို ပြန်ဖြည်ခြင်း)
             let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
             while (b64.length % 4) b64 += '=';
             const decodedStr = atob(b64);
             
             // Payload ဖြည်ပြီးနောက် Username ကို အတိအကျရမည်
             const [username, showId, epIndexStr] = decodedStr.split(':::');
             const epIndex = parseInt(epIndexStr, 10);

             // ⚠️ ပြင်ဆင်ချက် (၁): စနစ်သစ်ဖြစ်သော 'Users' Collection တွင် Username ဖြင့် တိုက်ရိုက် သွားရှာမည်
             const userSnap = await getDoc(doc(db, "Users", username));
             
             if (userSnap.exists()) {
                 const user = userSnap.data();

                 // User အမှန်တကယ် ဝယ်ယူထားကြောင်း အတည်ပြုခြင်း
                 if (user.unlockedEpisodes && user.unlockedEpisodes.includes(`${showId}_${epIndex}`)) {
                     
                     const showsSnap = await getDoc(doc(db, "SiteData", "shows"));
                     const shows = showsSnap.exists() ? showsSnap.data().data : [];
                     const show = shows.find((s: any) => s.id === showId);

                     if (show && show.episodes && show.episodes[epIndex] && show.episodes[epIndex].links && show.episodes[epIndex].links.length > 0) {
                         const tgUrl = show.episodes[epIndex].links[0].url; // Admin ၏ Master Channel မှ Link
                         let fromChatId = '';
                         let messageId = '';

                         if (tgUrl.includes('/c/')) {
                             const parts = tgUrl.split('/c/')[1].split('/');
                             fromChatId = '-100' + parts[0];
                             messageId = parts[1];
                         } else {
                             const parts = tgUrl.replace('https://t.me/', '').split('/');
                             fromChatId = '@' + parts[0];
                             messageId = parts[1];
                         }

                         // Telegram သို့ လုံခြုံရေးအပြည့်ဖြင့် (Protect Content) ပို့ဆောင်ခြင်း
                         const copyRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                                 chat_id: body.message.chat.id,
                                 from_chat_id: fromChatId,
                                 message_id: messageId,
                                 protect_content: true // ဖုန်းထဲ Save / Forward / Screen Record လုံးဝ မရအောင် ပိတ်သည့် စနစ်
                             })
                         });

                         const copyData = await copyRes.json();
                         if (copyData.ok) {
                             // Admin Group သို့ အောင်မြင်ကြောင်း Report ပို့ခြင်း
                             await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                 method: 'POST', headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ chat_id: ADMIN_GROUP_ID, text: `✅ Delivered: [${username}] ထံသို့ [${show.title_mm || show.title_en} - ${show.episodes[epIndex].epLabel}] အား အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ။ (Protected)` })
                             });
                         } else {
                             await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                 method: 'POST', headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ chat_id: body.message.chat.id, text: "Admin ဖက်မှ လမ်းကြောင်း ချိတ်ဆက်မှု မှားယွင်းနေပါသည်။" })
                             });
                         }
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
          } catch (e) {
             console.error("DM Error", e);
          }
       }
       return NextResponse.json({ success: true });
    }

    // 🌟 CHANNEL AUTO-LINK POST 🌟
    const post = body.channel_post || body.edited_channel_post || body.message || body.edited_message;
    if (!post) return NextResponse.json({ success: true, msg: 'Not a valid post' });

    const content = post.text || post.caption || '';
    const match = content.match(/#([a-zA-Z0-9_-]+)-ep(\d+)/i);
    if (!match) return NextResponse.json({ success: true, msg: 'No auto-link tag found' });

    const movieId = match[1];
    const epNumber = parseInt(match[2], 10);

    // Telegram Public Link တည်ဆောက်ခြင်း
    let tgLink = '';
    if (post.chat.username) {
      tgLink = `https://t.me/${post.chat.username}/${post.message_id}`;
    } else {
      const chatIdStr = String(post.chat.id).replace('-100', '');
      tgLink = `https://t.me/c/${chatIdStr}/${post.message_id}`;
    }

    // Firebase Database ထဲသို့ Link အလိုအလျောက် သွားထည့်ခြင်း
    const showsRef = doc(db, "SiteData", "shows");
    const showsSnap = await getDoc(showsRef);
    
    if (showsSnap.exists() && showsSnap.data().data) {
      let shows = showsSnap.data().data;
      let isUpdated = false;

      shows = shows.map((show: any) => {
        if (show.id.toLowerCase() === movieId.toLowerCase()) {
          if (show.episodes && show.episodes[epNumber - 1]) {
            const ep = show.episodes[epNumber - 1];
            if (!ep.links) ep.links = [];
            
            const alreadyExists = ep.links.some((l: any) => l.url === tgLink);
            if (!alreadyExists) {
              ep.links.push({ platform: 'Telegram', url: tgLink });
              isUpdated = true;
            }
          }
        }
        return show;
      });

      // ပြင်ဆင်ပြီးသား Data ကို Database ထဲ Save ခြင်း (နှင့် အပေါ်ဆုံးသို့ ရွှေ့ခြင်း)
      if (isUpdated) {
        const updatedShowIndex = shows.findIndex((s: any) => s.id.toLowerCase() === movieId.toLowerCase());
        if (updatedShowIndex !== -1) {
          const updatedShow = shows.splice(updatedShowIndex, 1)[0];
          shows.unshift(updatedShow); // ဇာတ်ကားကို အပေါ်ဆုံးသို့ ပို့လိုက်ပါပြီ
        }
        await setDoc(showsRef, { data: shows });

        // ⚠️ ပြင်ဆင်ချက် (၂) : User အားလုံးဆီ အပိုင်းသစ် Noti ပို့ပြီး Database ထဲ သိမ်းသည့်စနစ်ကို အပြီးတိုင် ဖယ်ရှားလိုက်ပါပြီ။ (Write Limit မကုန်စေရန်) 
        console.log(`Auto-linked ${movieId} Episode ${epNumber} and moved to top`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}