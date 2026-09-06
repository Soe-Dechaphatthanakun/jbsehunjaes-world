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

    // 🌟 ပြင်ဆင်ချက် (၁) - Channel သာမက Group/Private Chat က Edit လုပ်တာတွေကိုပါ ဖမ်းနိုင်ရန် 🌟
    const post = body.channel_post || body.edited_channel_post || body.message || body.edited_message;
    
    if (!post) return NextResponse.json({ success: true, msg: 'Not a valid post' });

    // စာသား သို့မဟုတ် ပုံ/ဗီဒီယိုရဲ့ Caption ကို ယူခြင်း
    const content = post.text || post.caption || '';
    
    // 🌟 ပြင်ဆင်ချက် (၂) - vid- သာမက cw-1 ကဲ့သို့သော ID များနှင့် အကြီး/အသေး မှားရိုက်မိတာတွေကိုပါ အကုန်လက်ခံရန် (/i ကိုသုံးထားသည်) 🌟
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
        // 🌟 ပြင်ဆင်ချက် (၃) - Telegram မှာ အကြီး/အသေး မှားရိုက်မိခဲ့ရင်တောင် အလုပ်လုပ်အောင် toLowerCase() ဖြင့် စစ်ဆေးခြင်း 🌟
        if (show.id.toLowerCase() === movieId.toLowerCase()) {
          if (show.episodes && show.episodes[epNumber - 1]) {
            const ep = show.episodes[epNumber - 1];
            if (!ep.links) ep.links = [];
            
            // Link ထပ်နေတာမျိုး မဖြစ်အောင် စစ်ဆေးခြင်း
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
        let updatedTitle = "";
        let exactLabel = ""; // 🌟 Admin ပေးခဲ့သော နာမည်အမှန်ကို ဖမ်းယူမည့် နေရာ
        
        const updatedShowIndex = shows.findIndex((s: any) => s.id.toLowerCase() === movieId.toLowerCase());
        if (updatedShowIndex !== -1) {
          updatedTitle = shows[updatedShowIndex].title_mm || shows[updatedShowIndex].title_en || 'ဇာတ်ကား';
          const updatedShow = shows.splice(updatedShowIndex, 1)[0];
          
          // 🌟 Array ရဲ့ Index ဟာ 0 ကနေစတဲ့အတွက် epNumber - 1 နေရာကနေ "EP 6 (Part-1)" စသည့် နာမည်အမှန်ကို လှမ်းယူပါမည် (Memory ပေါ်ကနေပဲ ယူတာဖြစ်လို့ Read Cost လုံးဝ မတက်ပါ)
          exactLabel = updatedShow.episodes[epNumber - 1]?.epLabel || `အပိုင်း ${epNumber}`;
          
          shows.unshift(updatedShow); // ဇာတ်ကားကို အပေါ်ဆုံးသို့ ပို့လိုက်ပါပြီ
        }
        await setDoc(showsRef, { data: shows });

        // 🌟 Noti စာသား တည်ဆောက်ခြင်း 
        let displayEp = exactLabel;
        if (/ep/i.test(exactLabel)) {
            // 'EP' ကို 'အပိုင်း' ဖြင့် အစားထိုးမည်။ အနောက်က ' 6 (Part-1)' သည် မပျက်ဘဲ အတိုင်းဆက်ကျန်နေမည်
            displayEp = exactLabel.replace(/ep/i, 'အပိုင်း');
        } else if (exactLabel.toLowerCase().includes('tailer') || exactLabel.toLowerCase().includes('trailer')) {
            displayEp = 'Trailer';
        }

        let notiMsg = `"${updatedTitle}" ဇာတ်လမ်းရဲ့ ${displayEp} အား တင်ပေးလိုက်ပါပြီ။`;
        if (displayEp === 'Trailer') {
            notiMsg = `***** ဒီကားရဲ့ Trailer ကိုတင်ပေးထားပါတယ်။`;
        }

        // --- NEW: SEND NOTIFICATION TO ALL USERS FOR EPISODE UPDATE ---
        const notiRef = doc(db, "SiteData", "notifications");
        const notiSnap = await getDoc(notiRef);
        if (notiSnap.exists()) {
           const notis = notiSnap.data().data || [];
           const newNoti = {
             id: Date.now().toString()+'_noti',
             targetUser: 'all',
             message: notiMsg, // 🌟 တွက်ချက်ထားသော စာသားကို ဤနေရာတွင် ထည့်လိုက်ပါပြီ
             date: new Date().toISOString(),
             isRead: false,
             actionType: 'ep_update'
           };
           await setDoc(notiRef, { data: [newNoti, ...notis] });
        }

        console.log(`Auto-linked ${movieId} Episode ${epNumber} and moved to top`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}