import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  // .pages.dev လင့်ခ်ဖြင့် ဝင်လာပါက စစ်ဆေးမည်
  if (hostname === 'jbsehunjaes-world.pages.dev') {
    const url = request.nextUrl.clone();
    
    // ⚠️ ဤနေရာတွင် သင့်၏ .com Domain အတိအကျကို ပြင်ထည့်နိုင်ပါသည်
    url.hostname = 'jbsehunjae.com'; 
    url.port = ''; 
    
    // .com လင့်ခ်သို့ အလိုအလျောက် ပြောင်းလဲပို့ဆောင်ပေးမည်
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// API များ၊ ပုံများနှင့် System ဖိုင်များကို Redirect မလုပ်မိစေရန် ဖယ်ထုတ်ထားခြင်း
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};