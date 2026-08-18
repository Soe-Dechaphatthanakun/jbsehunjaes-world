'use client';

import React, { useState, useEffect, useRef } from 'react';
// Firebase Imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  Play, Lock, Unlock, Search, User, Coins, Sparkles, X, Plus, Edit, Trash2, 
  Globe, Menu, Home, HelpCircle, Gift, Info, Send, Phone,
  Users, Bell, LayoutDashboard, Upload, ShieldCheck, UserPlus, Calendar, ChevronRight,
  ChevronLeft, Copy, CheckCircle, Clock, XCircle, CreditCard, Settings, LogOut, Key, MessageCircle, MonitorPlay,
  Eye, EyeOff, Download, RefreshCw, Mail, AlertCircle, Link2, FileSpreadsheet, ListVideo, Filter
} from 'lucide-react';

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// INTERFACES & TYPES
// ------------------------------------------------------------------
interface EpLink { platform: string; url: string; }
interface EpisodeData { epLabel: string; links: EpLink[]; releaseDateRaw?: string; releaseDate: string; }
interface VideoCardData { id: string; title_en: string; title_mm: string; image: string; category: string; description: string; totalEpisodes: number; pointsPerEp: number; episodes: EpisodeData[]; vipTelegramLink?: string; }

// History tracking for usage and admin bonuses
interface UserHistoryLog { id: string; type: 'usage' | 'admin_bonus' | 'buy_vip'; title: string; amount: number; date: string; }

// User Data with createdAt, lastLoginAt, and pointHistory
interface UserData { username: string; email: string; password?: string; role: 'admin' | 'user'; points: number; vip: boolean; unlockedShows: string[]; createdAt?: string; lastLoginAt?: string; pointHistory?: UserHistoryLog[]; pointAdjustment?: number | string; }

interface PointRequest { id: string; username: string; idCode: string; provider: string; date: string; status: 'pending' | 'approved' | 'rejected'; amount?: number; requestedAmount?: number; remark?: string; }
interface ContentItem { id: string; title_en: string; body_en: string; title_mm: string; body_mm: string; }
interface PromoItem { id: string; title_en: string; body_en: string; title_mm: string; body_mm: string; image?: string; }
interface SocialLink { id: string; platform: string; url: string; logo?: string; }
interface SiteConfig { marqueeEn: string; marqueeMm: string; depositGuideEn: string; depositGuideMm: string; paymentWarningEn: string; paymentWarningMm: string; socialLinks: SocialLink[]; }
interface NotificationData { id: string; targetUser: string; message: string; detail?: string; date: string; isRead: boolean; actionType: 'point_request' | 'point_approve' | 'point_reject' | 'admin_edit' | 'new_user' | 'new_upload' | 'ep_update'; }
interface AdminLogData { id: string; adminName: string; targetUser: string; action: string; remark: string; date: string; }

// ------------------------------------------------------------------
// INITIAL CONSTANTS & DEFAULT DATA
// ------------------------------------------------------------------
const DEFAULT_CONFIG: SiteConfig = {
  marqueeEn: "We do not accept gambling advertisements.",
  marqueeMm: "လောင်းကစားနဲ့ပတ်သက်သော ကြော်ငြာများကိုထည့်သွင်းကြော်ငြာပေးမည်မဟုတ်ပါ",
  depositGuideEn: "Step 1: Scan the QR code.\nStep 2: Transfer the exact amount.\nStep 3: Enter your Transaction ID.",
  depositGuideMm: "ငွေသွင်းနည်း\n၁။ ပြသထားသော QR Code ကို Scan ဖတ်ပါ။\n၂။ မိမိဝယ်ယူလိုသော ပမာဏကို လွှဲပါ။\n၃။ ငွေလွှဲပြီးပါက လုပ်ငန်းစဉ်အမှတ် (Txn ID) ကို အောက်ပါအကွက်တွင် မှန်ကန်စွာ ထည့်သွင်းပါ။",
  paymentWarningEn: "Do not write anything in the transaction description/notes. Please transfer only between 1 AM - 6 AM and 12 PM - 9 PM.",
  paymentWarningMm: "ငွေလွှဲရာတွင် Description (မှတ်ချက်) နေရာ၌ ဘာမှမရေးပါနှင့်။ မနက် ၁ နာရီမှ ၆ နာရီအတွင်း၊ နေ့ခင်း ၁၂ နာရီမှ ည ၉ နာရီအတွင်းသာ သွင်းပေးပါ။",
  socialLinks: [
    { id: '1', platform: 'Facebook', url: '#', logo: '' },
    { id: '2', platform: 'Telegram', url: '#', logo: '' },
    { id: '3', platform: 'Viber', url: '#', logo: '' }
  ]
};

const INITIAL_PROVIDERS = {
  banks: [
    { id: 'aya-bank', name: 'AYA Bank', qrImage: 'https://via.placeholder.com/200?text=AYA+QR', color: 'bg-red-600', accountNo: '', logo: '' },
    { id: 'kbz-bank', name: 'KBZ Bank', qrImage: 'https://via.placeholder.com/200?text=KBZ+QR', color: 'bg-blue-600', accountNo: '', logo: '' }
  ],
  ewallets: [
    { id: 'aya-pay', name: 'AYA Pay', qrImage: 'https://via.placeholder.com/200?text=AYAPAY+QR', color: 'bg-red-500', accountNo: '', logo: '' },
    { id: 'kbz-pay', name: 'KBZ Pay', qrImage: 'https://via.placeholder.com/200?text=KBZPAY+QR', color: 'bg-blue-500', accountNo: '', logo: '' },
    { id: 'wave-pay', name: 'Wave Pay', qrImage: 'https://via.placeholder.com/200?text=WAVEPAY+QR', color: 'bg-yellow-400', accountNo: '', logo: '' }
  ]
};

const INITIAL_CATEGORIES = ['All']; 
const INITIAL_PLATFORMS = ['Facebook', 'Telegram', 'Viber', 'Drive', 'Other']; 

const INITIAL_SHOWS: VideoCardData[] = [
  {
    id: 'cw-1', title_en: 'Unlucky Bae', title_mm: 'ကံမကောင်းတဲ့ချစ်သူ',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=80',
    category: 'All', description: 'When two opposite college students end up as accidental roommates...',
    totalEpisodes: 2, pointsPerEp: 20, vipTelegramLink: 'https://t.me/sweetieworld_vip',
    episodes: [
      { epLabel: 'EP 1', links: [{platform: 'Telegram', url: 'https://t.me/example'}, {platform: 'Facebook', url: 'https://facebook.com'}], releaseDateRaw: '', releaseDate: '' },
      { epLabel: 'EP 2', links: [], releaseDateRaw: '2026-08-04T18:00', releaseDate: '4 Aug 2026 6:00 PM' }
    ]
  }
];

const INITIAL_USERS: UserData[] = [
  { username: 'admin', email: 'admin@gmail.com', password: '123', role: 'admin', points: 999999, vip: false, unlockedShows: [], createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(), pointHistory: [] },
  { username: 'testuser', email: 'user@gmail.com', password: '123', role: 'user', points: 200, vip: false, unlockedShows: [], createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(), pointHistory: [] }
];

const TRANSLATIONS = {
  en: {
    loginBtn: "LOGIN", signUpBtn: "REGISTER", adminPanel: "Admin Panel", logout: "Logout", pts: "PTS",
    latestReleases: "Latest Releases", collection: "Collection", episodes: "Episodes", searchPlaceholder: "Search drama, movie...",
    home: "Home", promotions: "Promotions", faq: "FAQ & Guide", email: "Email or Username", password: "Password", 
    forgotPwd: "Forgot password?", noAccount: "Don't have an account?", hasAccount: "Already have an account?", backTo: "Back to", 
    getpwd: "Get Password", buyPoints: "Buy Points", watchBtn: "Click to Watch", waitBtn: "Wait for Schedule",
    vipTitle: "VIP Member", vipDesc: "Join VIP to watch all episodes without waiting for the schedule.", joinVip: "Join VIP",
    vipUnlockedTitle: "VIP Unlocked", vipUnlockedDesc: "You have full VIP access to all episodes of this series.",
    vipNotRequired: "VIP Not Required", allEpsAvailable: "All episodes are available to watch.",
    unlockAll: "Unlock All Episodes", unlockDesc: "Points are required to unlock all episodes of this series.", required: "Required:",
    balance: "Your Balance:", unlockBtn: "Deduct Points & Unlock", adminSystem: "SUPPORT SYSTEM", adminRole: "Role: Admin",
    adminTabDashboard: "Dashboard", adminTabUsers: "User Dashboard", adminTabPoints: "Point Requests", adminTabHistory: "Transaction History",
    adminTabSettings: "System Settings", adminTabPromo: "Manage Promotions", adminTabFaq: "Manage FAQs", adminTabUpload: "Upload Movies / Series",
    adminTabLogs: "Action Logs",
    userMgmt: "User Management", searchUser: "Search Username or Email...", searchPoint: "Search Username or ID Code...",
    createUser: "Create User", pointReqs: "Point Requests", addCat: "Add Category",
    uploadVid: "Upload Movie / Series", genSlots: "Generate Slots", saveBtn: "Save Content", updateBtn: "Update Content",
    titleEnPlaceholder: "Title (English)", titleMmPlaceholder: "Title (Myanmar)", descPlaceholder: "Description / Body Content",
    imgPlaceholder: "Image URL", tgLinkPlaceholder: "VIP Telegram Link", qrLinkPlaceholder: "QR Image URL", totEps: "Total Episodes", newCatName: "New Category Name...",
    addBtn: "Add", approveBtn: "Approve", rejectBtn: "Reject", noReqs: "No pending requests.", cancelBtn: "Cancel", alertNotReleased: "Not released yet! Wait until",
    alertOrJoinVip: "Or join VIP.", msgExists: "This Username or Email already exists.", msgSuccess: "Registration successful.",
    msgLoginSucc: "Login successful.", msgWrong: "Invalid Username or Password.", msgPointSent: "Request submitted.",
    msgApproved: "Points added successfully.", msgContentAdded: "Content saved successfully.", msgUploaded: "Video saved successfully.",
    msgVipSuccess: "VIP unlocked successfully.", msgNotEnough: "Not enough points. Required: ", msgUserSaved: "Data saved successfully!",
    msgDeleted: "Item deleted.", msgCopied: "Copied to clipboard!", payMenuDeposit: "Deposit Points", payMenuHistory: "My History", paySelectMethod: "Select Payment Method",
    payBank: "Banks", payEwallet: "E-Wallets", payAccountNo: "Account Number", payTxnId: "Transaction ID", paySubmitBtn: "Submit", 
    payWarnTitle: "Important Notice", payWarnDesc: "Do not write anything in the transaction description/notes.",
    payWarnTime: "Please transfer only between 1:00 AM - 6:00 AM and 12:00 PM - 9:00 PM. Outside these hours, admin is offline and you will need to wait.",
    statusPending: "Pending", statusSuccess: "Success", statusRejected: "Rejected",
    changePwd: "Change Password", contactUs: "Contact Us", duplicateId: "This Transaction ID has already been used.", remarkLabel: "Reason: ",
    createUserTitle: "Create New User", editUserTitle: "Edit User Data Settings", pointsInput: "Points", role: "Role",
    confirmDelTitle: "Are you sure?", confirmDelDesc: "Do you want to delete this item? This action cannot be undone.",
    confirmRejectTitle: "Reject Request", rejectPlaceholder: "Reason for rejection...", 
    promptPwdTitle: "Change Password", promptPwdPlaceholder: "Enter new password...",
    oldPwd: "Old Password", newPwd: "New Password", confirmPwd: "Confirm Password", pwdMismatch: "Passwords do not match!", wrongOldPwd: "Old password is incorrect!",
    choosePlatform: "Choose Platform", watchOn: "Watch on",
    downloadQR: "Download QR Code",
    rememberMe: "Remember me for future logins",
    notifications: "Notifications", noNoti: "No notifications.", markAllRead: "Mark all as read", inbox: "Inbox / Messages"
  },
  mm: {
    loginBtn: "အကောင့်ဝင်ရန်", signUpBtn: "အကောင့်ဖွင့်ရန်", adminPanel: "Admin စာမျက်နှာ", logout: "အကောင့်မှထွက်ရန်", pts: "မှတ်",
    latestReleases: "နောက်ဆုံးတင်ထားသော ဇာတ်ကားများ", collection: "ဇာတ်ကားများ", episodes: "အပိုင်းများ", searchPlaceholder: "ဇာတ်ကားအမည် ရှာရန်...",
    home: "ပင်မစာမျက်နှာ", promotions: "ပရိုမိုးရှင်းများ", faq: "Point ဝယ်နည်း နှင့် အမေးအဖြေ", email: "အီးမေးလ် (သို့) Username", password: "စကားဝှက်", 
    forgotPwd: "စကားဝှက်မေ့နေပါသလား?", noAccount: "အကောင့်မရှိသေးဘူးလား?", hasAccount: "အကောင့်ရှိပြီးသားလား?", backTo: "နောက်သို့", 
    getpwd: "စကားဝှက်တောင်းမည်", buyPoints: "Point ဝယ်ယူရန်", watchBtn: "ဇာတ်ကားကြည့်ရန်နှိပ်ပါ", waitBtn: "အချိန်စောင့်ပါ",
    vipTitle: "VIP အဖွဲ့ဝင်", vipDesc: "Schedule မစောင့်ချင်ပါက VIP Member ဝင်ပြီး အပိုင်းအားလုံး ကြည့်ရှုနိုင်ပါသည်။", joinVip: "VIP ဝင်မည်",
    vipUnlockedTitle: "VIP ဝင်ပြီးပါပြီ", vipUnlockedDesc: "ဒီဇာတ်ကားအတွက် VIP အပြည့်အစုံ ဝင်ရောက်ထားပြီး ဖြစ်ပါသည်။",
    vipNotRequired: "VIP ဝင်ရန်မလိုအပ်ပါ", allEpsAvailable: "အပိုင်းအားလုံးကို အခမဲ့ကြည့်ရှုနိုင်ပြီဖြစ်ပါသည်။",
    unlockAll: "အပိုင်းအားလုံး ဖွင့်ရန်", unlockDesc: "ဒီဇာတ်ကားရဲ့ အပိုင်းအားလုံးကို VIP အနေနဲ့ကြည့်ရန် Points လိုအပ်ပါသည်။", required: "လိုအပ်သော Point:",
    balance: "သင့်လက်ကျန်:", unlockBtn: "Point ပေးချေ၍ VIP ဝင်မည်", adminSystem: "SUPPORT SYSTEM", adminRole: "Role: Admin",
    adminTabDashboard: "အနှစ်ချုပ် (Dashboard)", adminTabUsers: "အကောင့်ဖွင့်ထားသော User များ", adminTabPoints: "Point တောင်းဆိုမှုများ", adminTabHistory: "ငွေသွင်းမှတ်တမ်းများ",
    adminTabSettings: "စနစ် အပြင်အဆင်များ", adminTabPromo: "ပရိုမိုးရှင်း စီမံရန်", adminTabFaq: "အမေးအဖြေ (FAQ) စီမံရန်", adminTabUpload: "ဇာတ်ကား / ဇာတ်လမ်းတွဲ တင်ရန်", 
    adminTabLogs: "အက်ဒမင် စီမံမှု မှတ်တမ်းများ",
    userMgmt: "အသုံးပြုသူများ စီမံရန်", searchUser: "Username (သို့) Email ရှာရန်...", searchPoint: "Username သို့မဟုတ် ID Code ဖြင့်ရှာပါ...", 
    createUser: "အကောင့်ဖွင့်ပေးရန်", pointReqs: "Point တောင်းဆိုမှုများ (Pending)", addCat: "အမျိုးအစား အသစ်ထည့်ရန်", 
    uploadVid: "ဇာတ်ကား / ဇာတ်လမ်းတွဲ တင်ရန်", genSlots: "အပိုင်းများ ဖန်တီးရန်", saveBtn: "သိမ်းမည်", updateBtn: "ပြင်ဆင်မည်", titleEnPlaceholder: "ခေါင်းစဉ် (English)",
    titleMmPlaceholder: "ခေါင်းစဉ် (Myanmar)", descPlaceholder: "အကြောင်းအရာ စာသား (Body)", imgPlaceholder: "ပုံ Link",
    tgLinkPlaceholder: "VIP Telegram Link", qrLinkPlaceholder: "QR ပုံ Link ထည့်ပါ...", totEps: "စုစုပေါင်း အပိုင်း", newCatName: "အမျိုးအစား အမည်သစ်...", addBtn: "ထည့်မည်",
    approveBtn: "ထည့်ပေးမည်", rejectBtn: "ပယ်ဖျက်မည်", noReqs: "တောင်းဆိုမှုများ မရှိပါ။", cancelBtn: "Cancel", alertNotReleased: "မထုတ်ပြန်ရသေးပါ!",
    alertOrJoinVip: "အထိ စောင့်ပါ သို့မဟုတ် VIP သို့ ဝင်ပါ။", msgExists: "ဒီ Username (သို့) Email ဖွင့်ပြီးသားရှိနေပါသည်။",
    msgSuccess: "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။", msgLoginSucc: "Login ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။", msgWrong: "Username သို့မဟုတ် Password မှားယွင်းနေပါသည်။",
    msgPointSent: "ပေးပို့မှု အောင်မြင်ပါသည်။ Admin မှ စစ်ဆေးပေးပါမည်။", msgApproved: "Points ထည့်ပေးလိုက်ပါပြီ။", msgContentAdded: "အချက်အလက် သိမ်းဆည်းပြီးပါပြီ။",
    msgUploaded: "ဇာတ်ကားအချက်အလက် သိမ်းဆည်းပြီးပါပြီ။", msgVipSuccess: "VIP ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်။",
    msgNotEnough: "Points မလုံလောက်ပါ။ လိုအပ်သည် - ", msgUserSaved: "အချက်အလက် ပြင်ဆင်/သိမ်းဆည်း ပြီးပါပြီ!", msgDeleted: "ဖျက်သိမ်းပြီးပါပြီ။",
    msgCopied: "ကူးယူပြီးပါပြီ!", payMenuDeposit: "ငွေသွင်းရန်", payMenuHistory: "မိမိမှတ်တမ်း", paySelectMethod: "ငွေသွင်းရန် ရွေးချယ်ပါ",
    payBank: "ဘဏ်", payEwallet: "E - ပိုက်ဆံအိတ်", payAccountNo: "အကောင့်နံပါတ် (Account No)", payTxnId: "ငွေလွှဲ ID", paySubmitBtn: "တင်သွင်းရန်", 
    payWarnTitle: "အရေးကြီးသတိပေးချက်", payWarnDesc: "ငွေလွှဲရာတွင် Description (မှတ်ချက်) နေရာ၌ ဘာမှမရေးပါနှင့်။",
    payWarnTime: "ငွေသွင်းထားသူများအနေဖြင့် မနက် ၁ နာရီမှ မနက် ၆ နာရီအတွင်း၊ နေ့ခင်း ၁၂ နာရီမှ ည ၉ နာရီအတွင်းသာ သွင်းပေးပါရန်။ ကျန်သောအချိန်များတွင် Admin မရှိပါသဖြင့် စောင့်ဆိုင်းပေးရပါမည်။",
    statusPending: "စောင့်ဆိုင်းဆဲ", statusSuccess: "အောင်မြင်ပါပြီ", statusRejected: "ငြင်းပယ်ခံရသည်",
    changePwd: "စကားဝှက်ပြောင်းလဲရန်", contactUs: "ဆက်သွယ်ရန်", duplicateId: "ဒီ ငွေလွှဲ ID ကို အသုံးပြုပြီးသားဖြစ်နေပါသည် (Already used).", remarkLabel: "အကြောင်းပြချက်: ",
    createUserTitle: "အကောင့်သစ်ဖန်တီးရန်", editUserTitle: "အကောင့် ပြင်ဆင်ရန်", pointsInput: "Points (မှတ်)", role: "အဆင့်သတ်မှတ်ချက် (Role)",
    confirmDelTitle: "သေချာပြီလား?", confirmDelDesc: "ဤအချက်အလက်ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား? ဖျက်ပြီးပါက ပြန်ယူ၍မရပါ။",
    confirmRejectTitle: "ပယ်ချရသည့် အကြောင်းရင်း", rejectPlaceholder: "အကြောင်းပြချက်ကို ရေးပါ...", 
    oldPwd: "လက်ရှိ စကားဝှက်", newPwd: "စကားဝှက် အသစ်", confirmPwd: "စကားဝှက် အသစ် (အတည်ပြုရန်)", pwdMismatch: "စကားဝှက်များ မတူညီပါ!", wrongOldPwd: "လက်ရှိ စကားဝှက် မှားယွင်းနေပါသည်!",
    choosePlatform: "ကြည့်ရှုမည့် နေရာကို ရွေးချယ်ပါ", watchOn: "ကြည့်ရှုရန် -",
    downloadQR: "QR ကို ဒေါင်းလုဒ်လုပ်ရန်",
    rememberMe: "နောက်တစ်ခါ ဝင်စရာမလိုအောင် မှတ်သားထားမည်",
    notifications: "အသိပေးချက်များ", noNoti: "အသိပေးချက် အသစ်မရှိပါ။", markAllRead: "အားလုံးကို ဖတ်ပြီးအဖြစ်မှတ်မည်", inbox: "အသိပေးချက်များ (Inbox)"
  }
};

// ------------------------------------------------------------------
// GLOBAL HELPERS
// ------------------------------------------------------------------
const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12; h = h ? h : 12; 
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${h}:${m} ${ampm}`;
};

const getSocialIcon = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes('facebook') || lower.includes('fb')) return <Globe className="w-4 h-4 text-[#1877F2]"/>;
  if (lower.includes('telegram') || lower.includes('tg')) return <Send className="w-4 h-4 text-[#0088cc]"/>;
  if (lower.includes('viber')) return <MessageCircle className="w-4 h-4 text-[#7360f2]"/>;
  if (lower.includes('phone') || lower.includes('call') || lower.includes('whatsapp')) return <Phone className="w-4 h-4 text-emerald-500"/>;
  return <Link2 className="w-4 h-4 text-[#fcd385]"/>;
};

const MessageSquareIcon = ({unreadCount}: {unreadCount: number}) => (
  <div className="relative">
    <MessageCircle className="w-4 h-4 text-[#fcd385]" />
    {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 w-2.5 h-2.5 rounded-full border border-black animate-pulse"></span>}
  </div>
);

// ------------------------------------------------------------------
// MAIN APP COMPONENT
// ------------------------------------------------------------------
export default function SweetieWorldApp() {
  const [isClient, setIsClient] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataFetched, setIsDataFetched] = useState(false); // NEW: Data အောင်မြင်စွာ ယူပြီးမှ Save ရန် လုံခြုံရေး
  const [lang, setLang] = useState<'mm' | 'en'>('mm');
  const t = TRANSLATIONS[lang];

  // DATA STATES
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [shows, setShows] = useState<VideoCardData[]>(INITIAL_SHOWS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [platforms, setPlatforms] = useState<string[]>(INITIAL_PLATFORMS);
  const [promotions, setPromotions] = useState<PromoItem[]>([]);
  const [faqs, setFaqs] = useState<ContentItem[]>([]);
  const [pointRequests, setPointRequests] = useState<PointRequest[]>([]);
  const [paymentProviders, setPaymentProviders] = useState(INITIAL_PROVIDERS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLogData[]>([]);
  
  // USER / AUTH STATES
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwdOld, setShowPwdOld] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);

  // UI STATES
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false); 
  const [isGeneratingTgLink, setIsGeneratingTgLink] = useState(false);
  const [userMenuTab, setUserMenuTab] = useState<'menu' | 'messages'>('menu');
  const [activeTab, setActiveTab] = useState<'home' | 'promo' | 'faq'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [contactFabOpen, setContactFabOpen] = useState(false);
  const [userDetailModal, setUserDetailModal] = useState<UserData | null>(null);
  
  // NEW: Dashboard Modal States
  const [showInactiveUsersModal, setShowInactiveUsersModal] = useState(false);
  const [showPointsSpentModal, setShowPointsSpentModal] = useState(false);
  const [showUserPointsModal, setShowUserPointsModal] = useState(false);
  const [inactiveUserSearch, setInactiveUserSearch] = useState('');
  const [pointsSpentSearch, setPointsSpentSearch] = useState('');
  const [userPointsSearch, setUserPointsSearch] = useState('');
  const [selectedMethodForDetail, setSelectedMethodForDetail] = useState<string | null>(null);
  // NEW: Promotion Popup State
  const [showWelcomePromo, setShowWelcomePromo] = useState(false);

  // PAYMENT STATES
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [payStep, setPayStep] = useState<'menu' | 'providers' | 'form' | 'history'>('menu');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [idCodeInput, setIdCodeInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

  // CONTENT STATES
  const [selectedShow, setSelectedShow] = useState<VideoCardData | null>(null);
  const [vipModalShow, setVipModalShow] = useState<VideoCardData | null>(null);
  const [scheduleAlert, setScheduleAlert] = useState<{isOpen: boolean, date: string, show: VideoCardData} | null>(null);
  const [platformSelectModal, setPlatformSelectModal] = useState<{ep: EpisodeData, show: VideoCardData} | null>(null);

  // USER DETAIL MODAL HISTORY STATES
  const [userDetailSearch, setUserDetailSearch] = useState('');
  const [userDetailDateFrom, setUserDetailDateFrom] = useState('');
  const [userDetailDateTo, setUserDetailDateTo] = useState('');
  const [userDetailTypeFilter, setUserDetailTypeFilter] = useState('All'); 
  const [userDetailHistoryPage, setUserDetailHistoryPage] = useState(1);
  const [userDetailHistoryPerPage, setUserDetailHistoryPerPage] = useState(10);

  // ADMIN STATES
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'users' | 'points' | 'history' | 'logs' | 'settings' | 'promo' | 'faq' | 'upload' | 'uploaded_content'>('dashboard');
  const [dashDateFrom, setDashDateFrom] = useState('');
  const [dashDateTo, setDashDateTo] = useState('');
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminPointSearch, setAdminPointSearch] = useState('');
  const [adminHistorySearch, setAdminHistorySearch] = useState('');
  const [adminLogSearch, setAdminLogSearch] = useState('');
  const [adminUploadedSearch, setAdminUploadedSearch] = useState('');
  const [adminPromoSearch, setAdminPromoSearch] = useState('');
  const [adminFaqSearch, setAdminFaqSearch] = useState('');
  const [approveAmounts, setApproveAmounts] = useState<Record<string, number>>({});
  const [editUserModal, setEditUserModal] = useState<{isOpen: boolean, mode: 'create'|'edit', oldUsername?: string}>({isOpen: false, mode: 'create'});
  const [editUserForm, setEditUserForm] = useState<UserData>({username: '', email: '', password: '', role: 'user', points: 0, vip: false, unlockedShows: [], createdAt: '', lastLoginAt: '', pointHistory: []});
  const [editUserRemark, setEditUserRemark] = useState(''); 
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [newPromo, setNewPromo] = useState<Partial<PromoItem>>({ title_en: '', body_en: '', title_mm: '', body_mm: '', image: '' });
  const [newFaq, setNewFaq] = useState({ title_en: '', body_en: '', title_mm: '', body_mm: '' });
  const [newVideo, setNewVideo] = useState<Partial<VideoCardData>>({ episodes: [], title_en: '', title_mm: '', pointsPerEp: 20 });
  const [epCount, setEpCount] = useState(1);
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [newProvider, setNewProvider] = useState({ name: '', type: 'banks', accountNo: '', logo: '' });
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '', logo: '' });

  // REUSABLE MODALS
  const [alertModal, setAlertModal] = useState<{message: string, actionText?: string, onAction?: () => void} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{message?: string, onConfirm: () => void} | null>(null);
  const [promptModal, setPromptModal] = useState<{title: string, placeholder: string, onSubmit: (val: string) => void} | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');

  // PAGINATION & FILTERS
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);
  const [showsPage, setShowsPage] = useState(1);
  const [showsPerPage, setShowsPerPage] = useState(12);
  const [adminLogPage, setAdminLogPage] = useState(1);
  const [adminLogPerPage, setAdminLogPerPage] = useState(10);
  const [pointsSpentPage, setPointsSpentPage] = useState(1);
  const [pointsSpentPerPage, setPointsSpentPerPage] = useState(10);
  const [methodDetailPage, setMethodDetailPage] = useState(1);
  const [methodDetailPerPage, setMethodDetailPerPage] = useState(10);
  const [userPointsPage, setUserPointsPage] = useState(1);
  const [userPointsPerPage, setUserPointsPerPage] = useState(10);
  
  const [bulkDeleteDateFrom, setBulkDeleteDateFrom] = useState('');
  const [bulkDeleteDateTo, setBulkDeleteDateTo] = useState('');
  
  const [adminLogBulkDateFrom, setAdminLogBulkDateFrom] = useState('');
  const [adminLogBulkDateTo, setAdminLogBulkDateTo] = useState('');

  const notiRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false); // NEW: Sync လုပ်နေစဉ် Auto-Save ခဏပိတ်ရန်

  // ==========================================
  // 2. HELPER FUNCTIONS
  // ==========================================
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t.msgCopied);
  };

  const handleDownloadQR = async (url: string, providerName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${providerName}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      showToast("QR Code Downloaded!");
    } catch (error) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${providerName}_QR.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderPagination = (currentPage: number, setPage: (p: number) => void, itemsPerPage: number, setItemsPerPage: (p: number) => void, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    return (
      <div className="flex flex-wrap justify-between items-center mt-4 bg-black/40 p-3 rounded-xl border border-zinc-800 gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          <span>{lang === 'en' ? 'Show' : 'ပြသရန်'}</span>
          <select value={itemsPerPage} onChange={e => {setItemsPerPage(Number(e.target.value)); setPage(1);}} className="bg-black border border-zinc-700 rounded px-2 py-1 text-white outline-none cursor-pointer">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>{lang === 'en' ? 'entries' : 'ခု'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-xs font-bold transition">Prev</button>
          <span className="text-xs font-bold text-zinc-400">{lang === 'en' ? 'Page' : 'စာမျက်နှာ'} {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-xs font-bold transition">Next</button>
        </div>
      </div>
    );
  };

  // ==========================================
  // 3. USE EFFECTS
  // ==========================================
  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        const fetchDoc = async (colName: string, setFn: any, defaultVal: any) => {
           const snap = await getDoc(doc(db, "SiteData", colName));
           if (snap.exists() && snap.data().data && snap.data().data.length > 0) { setFn(snap.data().data); } else if (defaultVal) { setFn(defaultVal); }
        };
        const snapConfig = await getDoc(doc(db, "SiteData", "siteConfig"));
        if (snapConfig.exists() && snapConfig.data().data) {
            let loadedData = snapConfig.data().data;
            if (!loadedData.socialLinks) {
               loadedData.socialLinks = [
                  { id: '1', platform: 'Facebook', url: loadedData.fbLink || '#', logo: '' },
                  { id: '2', platform: 'Telegram', url: loadedData.tgLink || '#', logo: '' },
                  { id: '3', platform: 'Viber', url: loadedData.viberLink || '#', logo: '' }
               ];
            }
            setSiteConfig(loadedData);
        } else {
            setSiteConfig(DEFAULT_CONFIG);
        }
        await fetchDoc("users", setUsers, INITIAL_USERS);
        const showsSnap = await getDoc(doc(db, "SiteData", "shows"));
        if (showsSnap.exists() && showsSnap.data().data && showsSnap.data().data.length > 0) {
           const parsedShows = showsSnap.data().data;
           const migratedShows = parsedShows.map((s: any) => ({
              ...s, episodes: s.episodes.map((ep: any) => ({ ...ep, links: ep.links ? ep.links : (ep.link ? [{ platform: 'Default', url: ep.link }] : []) }))
           }));
           setShows(migratedShows);
        } else { setShows(INITIAL_SHOWS); }
        await fetchDoc("categories", setCategories, INITIAL_CATEGORIES);
        await fetchDoc("platforms", setPlatforms, INITIAL_PLATFORMS);
        await fetchDoc("promotions", setPromotions, [{ id: '1', title_en: 'Welcome Bonus', body_en: 'New members get free VIP trial for 3 days!', title_mm: 'အကောင့်သစ် Bonus', body_mm: 'အကောင့်အသစ် ဖွင့်သူများအတွက် VIP ၃ ရက် အခမဲ့ရရှိမည်!' }]);
        await fetchDoc("faqs", setFaqs, [{ id: '1', title_en: 'How to buy points?', body_en: 'Transfer via KPay or WavePay. Then submit your Transaction ID.', title_mm: 'Point ဘယ်လိုဝယ်ရမလဲ?', body_mm: 'KPay, WavePay မှ ငွေလွှဲပါ။ ပြီးလျှင် Transaction ID အား ထည့်ပေးပါ။' }]);
        await fetchDoc("pointRequests", setPointRequests, []);
        await fetchDoc("notifications", setNotifications, []);
        await fetchDoc("adminLogs", setAdminLogs, []);
        const providerSnap = await getDoc(doc(db, "SiteData", "paymentProviders"));
        if (providerSnap.exists() && providerSnap.data().data) { setPaymentProviders(providerSnap.data().data); } else { setPaymentProviders(INITIAL_PROVIDERS); }
        
        // NEW: Error မတက်ဘဲ အကုန်အောင်မြင်မှသာ True ပြောင်းပေးမည်
        setIsDataFetched(true); 
      } catch(e) { console.error("Firebase fetch error", e); } finally { setIsInitialLoad(false); }
    };
    loadData();

    const handleClickOutside = (event: any) => { if (notiRef.current && !notiRef.current.contains(event.target)) { setNotiDropdownOpen(false); } };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitialLoad || users.length === 0) return;
    const savedUser = localStorage.getItem('jbsehunjaes_auth');
    
    if (savedUser && !currentUser) {
      const found = users.find(u => u.username === savedUser);
      if (found) {
        setCurrentUser(found);
      } else {
        localStorage.removeItem('jbsehunjaes_auth');
      }
    } 
    // Login Box ကို အလိုအလျောက် ပေါ်မလာစေရန် ဖြုတ်ထားပါသည်
  }, [isInitialLoad]); // users ကို dependency ကနေ ဖြုတ်ထားပါတယ် (ခဏခဏ Box မပေါ်စေဖို့ပါ)

  const syncLatestData = async () => {
    isSyncing.current = true; // NEW: Auto-save များကို ခဏပိတ်ထားမည်
    try {
      const pSnap = await getDoc(doc(db, "SiteData", "pointRequests"));
      if (pSnap.exists() && pSnap.data().data) {
         setPointRequests(prev => JSON.stringify(prev) !== JSON.stringify(pSnap.data().data) ? pSnap.data().data : prev);
      }
      const uSnap = await getDoc(doc(db, "SiteData", "users"));
      if (uSnap.exists() && uSnap.data().data) {
         const fetchedUsers = uSnap.data().data;
         setUsers(prev => JSON.stringify(prev) !== JSON.stringify(fetchedUsers) ? fetchedUsers : prev);
         setCurrentUser(prev => {
            if (!prev) return prev;
            const updated = fetchedUsers.find((u: UserData) => u.username === prev.username);
            return (updated && JSON.stringify(prev) !== JSON.stringify(updated)) ? updated : prev;
         });
      }
      const nSnap = await getDoc(doc(db, "SiteData", "notifications"));
      if (nSnap.exists() && nSnap.data().data) {
         setNotifications(prev => JSON.stringify(prev) !== JSON.stringify(nSnap.data().data) ? nSnap.data().data : prev);
      }
      const lSnap = await getDoc(doc(db, "SiteData", "adminLogs"));
      if (lSnap.exists() && lSnap.data().data) {
         setAdminLogs(prev => JSON.stringify(prev) !== JSON.stringify(lSnap.data().data) ? lSnap.data().data : prev);
      }
    } catch(e) {
      console.error("Sync error:", e);
    } finally {
      setTimeout(() => { isSyncing.current = false; }, 1000); // NEW: စက္ကန့်ဝက်အကြာမှ Auto-save ပြန်ဖွင့်မည်
    }
  };

  useEffect(() => {
    if (isInitialLoad) return;
    const interval = setInterval(() => { syncLatestData(); }, 30000); 
    
    // --- ထပ်ဖြည့်ရန်: Browser Tab ကို ပြန်ဝင်ကြည့်တာနဲ့ ချက်ချင်း Sync လုပ်ပေးရန် ---
    const handleFocus = () => { syncLatestData(); };
    window.addEventListener('focus', handleFocus);

    return () => {
       clearInterval(interval);
       window.removeEventListener('focus', handleFocus);
    };
  }, [isInitialLoad]);

  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "users"), { data: users }); }, [users, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "shows"), { data: shows }); }, [shows, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "categories"), { data: categories }); }, [categories, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "platforms"), { data: platforms }); }, [platforms, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "promotions"), { data: promotions }); }, [promotions, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "faqs"), { data: faqs }); }, [faqs, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "pointRequests"), { data: pointRequests }); }, [pointRequests, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "notifications"), { data: notifications }); }, [notifications, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "adminLogs"), { data: adminLogs }); }, [adminLogs, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "paymentProviders"), { data: paymentProviders }); }, [paymentProviders, isInitialLoad, isDataFetched]);
  useEffect(() => { if (!isInitialLoad && isDataFetched && !isSyncing.current) setDoc(doc(db, "SiteData", "siteConfig"), { data: siteConfig }); }, [siteConfig, isInitialLoad, isDataFetched]);

  // NEW: Direct Link ဖြင့် ဝင်လာပါက ဇာတ်ကားကို အလိုလို ဖွင့်ပေးမည်
  useEffect(() => {
    if (shows.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const showIdFromUrl = urlParams.get('show');
      if (showIdFromUrl) {
        const foundShow = shows.find(s => s.id === showIdFromUrl);
        if (foundShow) {
          setSelectedShow(foundShow);
        }
      }
    }
  }, [shows]);
  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const handleGetTelegramLink = async (channelId: string) => {
    if (!channelId) return showToast("Channel ID မရှိပါ။ Admin သို့ဆက်သွယ်ပါ။");
    
    setIsGeneratingTgLink(true);
    try {
      // Backend API ကို လှမ်းခေါ်မည်
      const res = await fetch('/api/get-tg-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId })
      });
      const data = await res.json();
      
      if (data.success && data.link) {
        // အောင်မြင်ပါက ထွက်လာသော One-Time Link ကို Tab အသစ်ဖြင့် ဖွင့်ပေးမည်
        window.open(data.link, '_blank');
      } else {
         setAlertModal({ message: "Link ထုတ်ယူ၍ မရပါ။ (Admin မှ Bot ကို Channel တွင် Admin ခန့်ထားခြင်း ရှိမရှိ စစ်ဆေးပါ)" });
      }
    } catch (error) {
      setAlertModal({ message: "Internet Connection Error! Please try again." });
    } finally {
      setIsGeneratingTgLink(false);
    }
  };

  const handleExportCSV = () => {
    if (pointRequests.length === 0) return showToast("No data to export.");
    const headers = ["Date", "Username", "Provider", "Transaction ID", "Requested Amount", "Approved Amount", "Status", "Remark"];
    const csvContent = [
       headers.join(","),
       ...pointRequests.map(r => [
          `"${formatDateTime(r.date)}"`,
          `"${r.username}"`,
          `"${r.provider}"`,
          `"${r.idCode}"`,
          `"${r.requestedAmount || ''}"`,
          `"${r.amount || ''}"`,
          `"${r.status}"`,
          `"${r.remark || ''}"`
       ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NEW: User Backup ဒေါင်းလုဒ်လုပ်မည့် Function
  const handleDownloadUsersBackup = () => {
    if (users.length === 0) return showToast("No users to backup.");
    const headers = ["Username", "Email", "Password", "Role", "Points", "Registered Date", "Last Login Date"];
    const csvContent = [
       headers.join(","),
       ...users.map(u => [
          `"${u.username}"`,
          `"${u.email}"`,
          `"${u.password || ''}"`,
          `"${u.role}"`,
          `"${u.points}"`,
          `"${formatDateTime(u.createdAt || '')}"`,
          `"${formatDateTime(u.lastLoginAt || '')}"`
       ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Users_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("User Backup Downloaded Successfully!");
  };

  // NEW: Shows (Movies/Series) Backup ဒေါင်းလုဒ်လုပ်မည့် Function
  const handleDownloadShowsBackup = () => {
    if (shows.length === 0) return showToast("No shows to backup.");
    const headers = ["ID", "Title (EN)", "Title (MM)", "Category", "Total Episodes", "Points Per Ep", "VIP Telegram Link", "Episodes Info"];
    const csvContent = [
       headers.join(","),
       ...shows.map(s => {
          // အပိုင်းတစ်ခုချင်းစီရဲ့ Link အစစ် (URL) တွေကိုပါ ထည့်သွင်းမည်
          const epsInfo = s.episodes.map(ep => {
              const linksStr = ep.links && ep.links.length > 0 
                  ? ep.links.map(l => `${l.platform}: ${l.url}`).join(" , ") 
                  : "No Link";
              return `${ep.epLabel} [${linksStr}]`;
          }).join(" | ");
          
          return [
            `"${s.id}"`,
            `"${s.title_en || ''}"`,
            `"${s.title_mm || ''}"`,
            `"${s.category || ''}"`,
            `"${s.totalEpisodes}"`,
            `"${s.pointsPerEp}"`,
            `"${s.vipTelegramLink || ''}"`,
            `"${epsInfo}"`
          ].join(",");
       })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Movies_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Movies Backup Downloaded Successfully!");
  };

	const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // --- NEW: Database မှ နောက်ဆုံး Users စာရင်းကို အရင်ဆွဲယူမည် (အကောင့်ပျောက်ခြင်းမှ ကာကွယ်ရန်) ---
    const uSnap = await getDoc(doc(db, "SiteData", "users"));
    let latestUsers = users;
    if (uSnap.exists() && uSnap.data().data) {
       latestUsers = uSnap.data().data;
    }
    
    // --- ထပ်ဖြည့်ရန်: Point Request History ကိုပါ နောက်ဆုံးဟာ လှမ်းဆွဲမည် ---
    const pSnap = await getDoc(doc(db, "SiteData", "pointRequests"));
    if (pSnap.exists() && pSnap.data().data) {
       setPointRequests(pSnap.data().data);
    }

    if (authMode === 'register') {
      const exists = latestUsers.find(u => u.username.toLowerCase() === authForm.username.trim().toLowerCase() || u.email.toLowerCase() === authForm.email.trim().toLowerCase());
      if (exists) return setAuthError(t.msgExists);
      const newUser: UserData = { 
        ...authForm, role: 'user', points: 0, vip: false, unlockedShows: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        pointHistory: []
      };

      // --- NEW: ADMIN NOTIFICATION (USER အသစ် ဝင်လာကြောင်း အသိပေးမည်) ---
      const newNoti: NotificationData = {
        id: Date.now().toString()+'_noti', 
        targetUser: 'admin',
        message: `New User Registered: ${newUser.username}`, 
        detail: `Email: ${newUser.email}`,
        date: new Date().toISOString(), 
        isRead: false, 
        actionType: 'new_user'
      };
      setNotifications([newNoti, ...notifications]);
      // -----------------------------------------------------------

      const updatedUsersList = [newUser, ...latestUsers];
      setUsers(updatedUsersList); // အကောင့်သစ်ကို အပေါ်ဆုံးရောက်အောင် ပြင်ပါသည်
      setDoc(doc(db, "SiteData", "users"), { data: updatedUsersList }); // ချက်ချင်း Save မည်

      setCurrentUser(newUser);
      if (rememberMe) localStorage.setItem('jbsehunjaes_auth', newUser.username);
      else localStorage.removeItem('jbsehunjaes_auth');
      showToast(t.msgSuccess);
      setAuthModalOpen(false);
      setAuthForm({ username: '', email: '', password: '' });
      setShowAuthPassword(false);
      setShowWelcomePromo(true);
      
    } else if (authMode === 'login') {
      const inputUsernameOrEmail = authForm.username.trim().toLowerCase();
      const user = latestUsers.find(u => 
        (u.username.toLowerCase() === inputUsernameOrEmail || u.email.toLowerCase() === inputUsernameOrEmail) && 
        u.password === authForm.password
      );
      if (user) {
        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
        const updatedUsersList = latestUsers.map(u => u.username === updatedUser.username ? updatedUser : u);
        setUsers(updatedUsersList);
        setDoc(doc(db, "SiteData", "users"), { data: updatedUsersList }); // ချက်ချင်း Save မည်

        setCurrentUser(updatedUser);
        if (rememberMe) localStorage.setItem('jbsehunjaes_auth', updatedUser.username);
        else localStorage.removeItem('jbsehunjaes_auth');
        showToast(t.msgLoginSucc);
        setAuthModalOpen(false);
        setAuthForm({ username: '', email: '', password: '' });
        setShowAuthPassword(false);
        setShowWelcomePromo(true);
      } else {
        setAuthError(t.msgWrong);
      }
      
    } else if (authMode === 'forgot') {
      const user = latestUsers.find(u => u.username.toLowerCase() === authForm.username.trim().toLowerCase() && u.email.toLowerCase() === authForm.email.trim().toLowerCase());
      if (user) {
         setAlertModal({ message: `Password: ${user.password}` });
         setAuthMode('login');
      } else {
         setAuthError(t.msgWrong);
      }
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if(!currentUser) return;
    if(pwdForm.old !== currentUser.password) {
       return setAlertModal({ message: t.wrongOldPwd });
    }
    if(pwdForm.new !== pwdForm.confirm) {
       return setAlertModal({ message: t.pwdMismatch });
    }
    const updatedUsers = users.map(u => u.username === currentUser.username ? {...u, password: pwdForm.new.trim()} : u);
    setUsers(updatedUsers);
    setCurrentUser({...currentUser, password: pwdForm.new.trim()});
    showToast("Password updated successfully!");
    setChangePwdModalOpen(false);
    setPwdForm({ old: '', new: '', confirm: '' });
    setShowPwdOld(false); setShowPwdNew(false); setShowPwdConfirm(false);
  };

  const handlePointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProvider || !idCodeInput.trim() || !amountInput.trim()) return;
    const isDuplicate = pointRequests.some(r => r.idCode.trim().toLowerCase() === idCodeInput.trim().toLowerCase());
    if (isDuplicate) return setAlertModal({ message: t.duplicateId });
    const newReq: PointRequest = {
      id: Date.now().toString(), username: currentUser.username, provider: selectedProvider.name,
      idCode: idCodeInput.trim(), requestedAmount: Number(amountInput), date: new Date().toISOString(), status: 'pending'
    };
    const newNoti: NotificationData = {
      id: Date.now().toString()+'_noti', targetUser: 'admin',
      message: `Point Request from ${currentUser.username} (ID: ${idCodeInput.trim()}) - Amount: ${amountInput}`,
      date: new Date().toISOString(), isRead: false, actionType: 'point_request'
    };
    setNotifications([newNoti, ...notifications]);
    setPointRequests([newReq, ...pointRequests]);
    showToast(t.msgPointSent);
    setIdCodeInput('');
    setAmountInput('');
    setPayStep('history');
  };

  const handleAdminSaveUser = () => {
    if (!editUserRemark.trim() && editUserModal.mode === 'edit') return setAlertModal({ message: "လုပ်ဆောင်ရသည့် အကြောင်းရင်း (Remark) ကို ထည့်ပေးပါ။" });
    
    // NEW: ရိုက်ထည့်လိုက်သော Point ကို လက်ရှိ Point နှင့် အလိုလိုပေါင်းပေးမည့်စနစ်
    const adjustment = Number(editUserForm.pointAdjustment) || 0;
    const finalPoints = editUserForm.points + adjustment;

    // Firebase Error မတက်အောင် pointAdjustment ကို Object ထဲကနေ အပြီးတိုင် ဖယ်ထုတ်လိုက်ပါမည်
    const { pointAdjustment, ...cleanEditUserForm } = editUserForm;

    if (editUserModal.mode === 'create') {
      const exists = users.find(u => u.username.toLowerCase() === editUserForm.username.trim().toLowerCase() || u.email.toLowerCase() === editUserForm.email.trim().toLowerCase());
      if (exists) return setAlertModal({ message: t.msgExists });
      const newUser = {
         ...cleanEditUserForm, 
         points: finalPoints, // တွက်ပြီးသား Point ကို သိမ်းမည်
         username: editUserForm.username.trim(), email: editUserForm.email.trim(),
         createdAt: new Date().toISOString(),
         lastLoginAt: new Date().toISOString(),
         pointHistory: []
      };
      setUsers([newUser, ...users]);
    } else {
      const oldUser = users.find(u => u.username === editUserModal.oldUsername);
      let newPointHistory = oldUser?.pointHistory || [];
      
      if (oldUser && finalPoints !== oldUser.points) { // ပြောင်းလဲသွားသော Point ဖြင့် စစ်ဆေးမည်
         const pointDiff = finalPoints - oldUser.points;
         const newLog: UserHistoryLog = {
            id: Date.now().toString(),
            type: 'admin_bonus',
            title: pointDiff > 0 ? `Admin Added Points (${editUserRemark || 'No remark'})` : `Admin Deducted Points (${editUserRemark || 'No remark'})`,
            amount: pointDiff,
            date: new Date().toISOString()
         };
         newPointHistory = [newLog, ...newPointHistory];
      }

      const updatedUser = {
         ...cleanEditUserForm, 
         points: finalPoints, // တွက်ပြီးသား Point ကို သိမ်းမည်
         username: editUserForm.username.trim(), 
         email: editUserForm.email.trim(),
         pointHistory: newPointHistory
      };

      setUsers(users.map(u => u.username === editUserModal.oldUsername ? updatedUser : u));
      if(currentUser?.username === editUserModal.oldUsername) setCurrentUser(updatedUser);
      
      if(editUserRemark.trim() && currentUser) {
         const newLog: AdminLogData = { id: Date.now().toString()+'_log', adminName: currentUser.username, targetUser: editUserForm.username.trim(), action: 'Edit User Profile', remark: editUserRemark.trim(), date: new Date().toISOString() };
         const newNoti: NotificationData = { id: Date.now().toString()+'_noti', targetUser: editUserForm.username.trim(), message: `Admin မှ သင့်အကောင့်အား ပြင်ဆင်မှုပြုလုပ်ခဲ့ပါသည်။ (Admin Action)`, detail: editUserRemark.trim(), date: new Date().toISOString(), isRead: false, actionType: 'admin_edit' };
         setAdminLogs([newLog, ...adminLogs]);
         setNotifications([newNoti, ...notifications]);
      }
    }
    showToast(t.msgUserSaved);
    setEditUserModal({isOpen: false, mode: 'create'});
    setShowAuthPassword(false);
    setEditUserRemark('');
  };

  const handleNotiClick = (n: NotificationData) => {
     // ၁။ Local မှာ "ဖတ်ပြီး" လို့ အရင်ပြောင်းမည်
     const updatedNotis = notifications.map(x => x.id === n.id ? {...x, isRead: true} : x);
     setNotifications(updatedNotis);
     
     // ၂။ Race Condition ကိုကျော်ဖြတ်ရန် Firebase ဆီသို့ "ဖတ်ပြီးကြောင်း" တိုက်ရိုက်လှမ်းသိမ်းမည်
     setDoc(doc(db, "SiteData", "notifications"), { data: updatedNotis });

     setNotiDropdownOpen(false);
     if(n.actionType === 'point_request') { setAdminDashboardOpen(true); setAdminActiveTab('points'); } 
     else if (n.actionType === 'point_approve' || n.actionType === 'point_reject') { setPayStep('history'); setPointModalOpen(true); } 
     else if (n.actionType === 'admin_edit') { setUserMenuTab('messages'); setUserMenuOpen(true); }
     else if (n.actionType === 'new_user') {
      setAdminDashboardOpen(true);
      setAdminActiveTab('users');
      const username = n.message.replace('New User Registered: ', '');
      const user = users.find(u => u.username === username);
      if (user) setUserDetailModal(user); // User Detail Box ကို အလိုအလျောက် ဖွင့်ပေးမည်
   }
   // NEW: ဇာတ်ကားသစ် သို့မဟုတ် အပိုင်းသစ် Noti ကိုနှိပ်လျှင် ဇာတ်ကားဆီ တိုက်ရိုက်သွားမည်
   else if (n.actionType === 'new_upload' || n.actionType === 'ep_update') {
      // Noti စာသားထဲမှ " " ကြားရှိ ဇာတ်ကားနာမည်ကို ဆွဲထုတ်မည်
      const match = n.message.match(/"([^"]+)"/);
      if (match) {
         const title = match[1];
         const foundShow = shows.find(s => s.title_mm === title || s.title_en === title);
         if (foundShow) {
            setAdminDashboardOpen(false); // Admin Panel ပွင့်နေရင် ပိတ်မည်
            setActiveTab('home'); // Home Tab သို့ ပြောင်းမည်
            setSelectedShow(foundShow); // ဇာတ်ကား Box ကို ဖွင့်မည်
            window.scrollTo({top:0, behavior: 'smooth'});
            return;
         }
      }
      // ဇာတ်ကားကို ရှာမတွေ့ပါက (သို့မဟုတ် ဖျက်လိုက်မိပါက) ပုံမှန်အတိုင်း Inbox ကိုသာ ပြမည်
      setUserMenuTab('messages');
      setUserMenuOpen(true);
   }
};

  const getRequiredPoints = (show: VideoCardData) => {
    const unreleasedCount = show.episodes.filter(ep => !ep.links || ep.links.length === 0).length;
    return unreleasedCount * (show.pointsPerEp ?? 20);
  };

  // ==========================================
  // 5. COMPUTED VARIABLES
  // ==========================================
  const recordsToDelete = (bulkDeleteDateFrom && bulkDeleteDateTo) ? pointRequests.filter(r => {
    const reqD = new Date(r.date).getTime();
    const fromD = new Date(bulkDeleteDateFrom); fromD.setHours(0, 0, 0, 0);
    const toD = new Date(bulkDeleteDateTo); toD.setHours(23, 59, 59, 999);
    return reqD >= fromD.getTime() && reqD <= toD.getTime();
  }) : [];

  const logsToDelete = (adminLogBulkDateFrom && adminLogBulkDateTo) ? adminLogs.filter(l => {
    const logD = new Date(l.date).getTime();
    const fromD = new Date(adminLogBulkDateFrom); fromD.setHours(0, 0, 0, 0);
    const toD = new Date(adminLogBulkDateTo); toD.setHours(23, 59, 59, 999);
    return logD >= fromD.getTime() && logD <= toD.getTime();
  }) : [];

  const filteredShows = shows.filter(s => {
    // ဒီနေရာလေးမှာ Latest Releases ကိုပါ ထပ်ပေါင်းထည့်လိုက်ပါ
    const matchCat = activeCategory === 'All' || activeCategory === 'Latest Releases' || s.category === activeCategory;
    const matchSearch = (s.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) || s.title_mm?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const adminFilteredUsers = users.filter(u => u.username.toLowerCase().includes(adminUserSearch.toLowerCase()) || u.email.toLowerCase().includes(adminUserSearch.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const paginatedUsers = adminFilteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

  const adminPendingPoints = pointRequests.filter(p => p.status === 'pending');
  const adminFilteredPoints = adminPendingPoints.filter(p => p.username.toLowerCase().includes(adminPointSearch.toLowerCase()) || p.idCode.toLowerCase().includes(adminPointSearch.toLowerCase()));

  const adminFilteredHistory = pointRequests.filter(r => r.username.toLowerCase().includes(adminHistorySearch.toLowerCase()) || r.idCode.toLowerCase().includes(adminHistorySearch.toLowerCase()));
  const paginatedHistory = adminFilteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  const adminFilteredLogs = adminLogs.filter(l => l.adminName.toLowerCase().includes(adminLogSearch.toLowerCase()) || l.targetUser.toLowerCase().includes(adminLogSearch.toLowerCase()) || l.action.toLowerCase().includes(adminLogSearch.toLowerCase()));
  const paginatedLogs = adminFilteredLogs.slice((adminLogPage - 1) * adminLogPerPage, adminLogPage * adminLogPerPage);

  const adminUploadedShowsFiltered = shows.filter(s => (s.title_en?.toLowerCase().includes(adminUploadedSearch.toLowerCase()) || s.title_mm?.toLowerCase().includes(adminUploadedSearch.toLowerCase())));
  const paginatedShows = adminUploadedShowsFiltered.slice((showsPage - 1) * showsPerPage, showsPage * showsPerPage);

  const adminFilteredPromos = promotions.filter(p => (p.title_en?.toLowerCase().includes(adminPromoSearch.toLowerCase()) || p.title_mm?.toLowerCase().includes(adminPromoSearch.toLowerCase())));
  const adminFilteredFaqs = faqs.filter(f => (f.title_en?.toLowerCase().includes(adminFaqSearch.toLowerCase()) || f.title_mm?.toLowerCase().includes(adminFaqSearch.toLowerCase())));

  // NEW: Pre-calculated Paginated Data for Modals
  const pointsSpentLogs = users.flatMap(u => 
      (u.pointHistory || [])
      .filter(log => log.type === 'buy_vip')
      .map(log => {
          const matchedShow = shows.find(s => s.id === log.title || s.title_en === log.title || s.title_mm === log.title);
          const displayTitle = matchedShow 
            ? `${matchedShow.title_en || ''} ${matchedShow.title_en && matchedShow.title_mm ? ' / ' : ''} ${matchedShow.title_mm || ''}` 
            : log.title;
          return { username: u.username, title: displayTitle, amount: Math.abs(log.amount), date: log.date };
      })
  ).filter(log => log.username.toLowerCase().includes((pointsSpentSearch || '').toLowerCase()))
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const paginatedPointsSpentLogs = pointsSpentLogs.slice((pointsSpentPage - 1) * pointsSpentPerPage, pointsSpentPage * pointsSpentPerPage);

  const methodDetailLogs = pointRequests.filter(req => {
      if (req.status !== 'approved' || req.provider !== selectedMethodForDetail) return false;
      if (dashDateFrom && dashDateTo) {
         const fromD = new Date(dashDateFrom).setHours(0,0,0,0);
         const toD = new Date(dashDateTo).setHours(23,59,59,999);
         const d = new Date(req.date).getTime();
         return d >= fromD && d <= toD;
      }
      return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const paginatedMethodDetailLogs = methodDetailLogs.slice((methodDetailPage - 1) * methodDetailPerPage, methodDetailPage * methodDetailPerPage);

  const myNotis = notifications.filter(n => n.targetUser === 'all' || n.targetUser === currentUser?.username || (currentUser?.role === 'admin' && n.targetUser === 'admin')).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const unreadNotiCount = myNotis.filter(n => !n.isRead).length;

  // DERIVED DATA FOR USER DETAIL HISTORY
  let combinedHistory: any[] = [];
  if (userDetailModal) {
      const userReqs = pointRequests.filter(p => p.username === userDetailModal.username).map(r => ({
          id: r.id, date: r.date, type: 'Deposit', paymentType: r.provider, txnId: r.idCode, amount: r.amount || r.requestedAmount, status: r.status, remark: r.remark
      }));
      const userBonus = (userDetailModal.pointHistory || []).map(b => {
          let displayTitle = b.title;
          if (b.type === 'buy_vip') {
              const matchedShow = shows.find(s => s.id === b.title || s.title_en === b.title || s.title_mm === b.title);
              if (matchedShow) displayTitle = matchedShow.title_mm || matchedShow.title_en || b.title;
          }
          return {
              id: b.id, date: b.date, 
              type: b.type === 'admin_bonus' ? 'Admin Adjustment' : b.type === 'buy_vip' ? 'Buy VIP' : 'Usage',
              paymentType: 'System', txnId: 'N/A', amount: b.amount, status: 'approved', remark: displayTitle
          };
      });
      combinedHistory = [...userReqs, ...userBonus].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (userDetailSearch) {
          combinedHistory = combinedHistory.filter(h =>
              (h.txnId && h.txnId.toLowerCase().includes(userDetailSearch.toLowerCase())) ||
              (h.paymentType && h.paymentType.toLowerCase().includes(userDetailSearch.toLowerCase())) ||
              (h.remark && h.remark.toLowerCase().includes(userDetailSearch.toLowerCase()))
          );
      }
      if (userDetailTypeFilter !== 'All') {
          combinedHistory = combinedHistory.filter(h => h.type === userDetailTypeFilter);
      }
      if (userDetailDateFrom && userDetailDateTo) {
          combinedHistory = combinedHistory.filter(h => {
              const hDate = new Date(h.date).getTime();
              const fDate = new Date(userDetailDateFrom).setHours(0,0,0,0);
              const tDate = new Date(userDetailDateTo).setHours(23,59,59,999);
              return hDate >= fDate && hDate <= tDate;
          });
      }
  }
  const paginatedUserHistory = combinedHistory.slice((userDetailHistoryPage - 1) * userDetailHistoryPerPage, userDetailHistoryPage * userDetailHistoryPerPage);


  if (!isClient) return null;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-[#fcd385]">
        <div className="w-12 h-12 border-4 border-[#fcd385] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest uppercase text-sm">Loading Jbsehunjae’s World...</p>
      </div>
    );
  }

  // ==========================================
  // 6. RENDER JSX
  // ==========================================
  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 pb-20" style={{ fontFamily: '"Georgia", "Times New Roman", "Myanmar Text", serif' }}>
      
      {/* CSS For Right to Left Marquee & Calendar Icon Invert */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marqueeRTL {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-rtl {
          display: inline-block;
          white-space: nowrap;
          animation: marqueeRTL 20s linear infinite;
          will-change: transform;
        }
        ::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
      `}} />

      {/* --- TOAST --- */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[300] flex items-center gap-3 bg-[#6b1111] text-[#fcd385] border border-[#fcd385] px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* --- MOBILE SIDEBAR MENU (HAMBURGER) --- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex font-sans lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#161616] h-full shadow-2xl flex flex-col border-r border-[#fcd385]/20 animate-slide-in">
             <div className="flex justify-between items-center p-5 border-b border-[#fcd385]/20 bg-[#1a1a1a]">
                <h3 className="text-lg font-black text-[#fcd385] tracking-wider italic">Menu</h3>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white transition p-1"><X className="w-6 h-6"/></button>
             </div>
             
             {/* Unauthenticated User Quick Actions in Sidebar */}
             {!currentUser && (
                <div className="p-4 flex gap-2 border-b border-zinc-800">
                  <button onClick={() => {setAuthMode('login'); setAuthModalOpen(true); setSidebarOpen(false);}} className="flex-1 text-sm font-bold bg-[#fcd385] text-[#3e1717] py-2 rounded-md hover:bg-yellow-400 transition shadow">{t.loginBtn}</button>
                  <button onClick={() => {setAuthMode('register'); setAuthModalOpen(true); setSidebarOpen(false);}} className="flex-1 text-sm font-bold border border-[#fcd385] text-[#fcd385] py-2 rounded-md hover:bg-[#fcd385]/10 transition">{t.signUpBtn}</button>
                </div>
             )}

             <nav className="flex-1 overflow-y-auto p-4 flex flex-col">
                <div className="space-y-3">
                  <button onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'home' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><Home className="w-5 h-5"/> {t.home}</button>
                  <button onClick={() => {setActiveTab('promo'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'promo' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><Gift className="w-5 h-5"/> {t.promotions}</button>
                  <button onClick={() => {setActiveTab('faq'); setAdminDashboardOpen(false); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition ${activeTab === 'faq' && !adminDashboardOpen ? 'bg-[#fcd385] text-[#3e1717]' : 'bg-[#1f1f1f] text-zinc-300 hover:text-white border border-zinc-800'}`}><HelpCircle className="w-5 h-5"/> {t.faq}</button>
                  
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => {syncLatestData(); setAdminDashboardOpen(true); setSidebarOpen(false);}} className="w-full mt-6 flex items-center gap-3 p-3 rounded-xl font-bold bg-red-900/50 text-red-200 border border-red-500/30 hover:bg-red-800 transition">
                      <ShieldCheck className="w-5 h-5"/> {t.adminPanel}
                    </button>
                  )}
                </div>

                {/* Dynamic Contact Links inside Sidebar (Available anytime) */}
                <div className="mt-8 pt-6 border-t border-[#fcd385]/10">
                   <h4 className="text-xs font-bold text-[#fcd385] mb-3 uppercase tracking-wider">{lang === 'en' ? 'Contact Us' : 'ဆက်သွယ်ရန်'}</h4>
                   <div className="space-y-2">
                      {siteConfig.socialLinks?.map(link => (
                         <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 bg-black/20 hover:bg-white/5 rounded-xl transition text-zinc-300 hover:text-white font-bold text-sm">
                           {link.logo ? <img src={link.logo} alt={link.platform} className="w-5 h-5 object-contain rounded-full" /> : getSocialIcon(link.platform)} 
                           {link.platform}
                         </a>
                      ))}
                   </div>
                </div>
             </nav>
          </div>
        </div>
      )}

      {/* --- DESKTOP & MOBILE NAVIGATION HEADER --- */}
      <header className="sticky top-0 z-40 bg-[#161616]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex flex-wrap gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 lg:gap-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-300 hover:text-white"><Menu className="w-7 h-7" /></button>
          <a href="#" className="flex items-center gap-2 group" onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false); setSelectedShow(null);}}>
            <div className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-[#fcd385] to-[#d4af37] bg-clip-text text-transparent italic">Jbsehunjae’s World</div>
          </a>
          <nav className="hidden lg:flex items-center gap-1 bg-[#1f1f1f] p-1 rounded-xl border border-zinc-800 font-sans">
            <button onClick={() => {setActiveTab('home'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'home' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><Home className="w-4 h-4"/> {t.home}</button>
            <button onClick={() => {setActiveTab('promo'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'promo' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><Gift className="w-4 h-4"/> {t.promotions}</button>
            <button onClick={() => {setActiveTab('faq'); setAdminDashboardOpen(false);}} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition ${activeTab === 'faq' && !adminDashboardOpen ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-white'}`}><HelpCircle className="w-4 h-4"/> {t.faq}</button>
            
            {/* Desktop Contact Us Dropdown (Visible to everyone) */}
            <div className="relative group hidden lg:block">
               <button className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition text-zinc-400 hover:text-white`}>
                  <Phone className="w-4 h-4"/> {t.contactUs}
               </button>
               <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a1a] border border-[#fcd385]/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                  {siteConfig.socialLinks?.map(link => (
                     <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-white/5 transition text-zinc-300 hover:text-white font-bold text-sm">
                       {link.logo ? <img src={link.logo} alt={link.platform} className="w-5 h-5 object-contain rounded-full bg-white/10 p-0.5" /> : getSocialIcon(link.platform)} 
                       {link.platform}
                     </a>
                  ))}
               </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-[#1f1f1f] border border-zinc-700 hover:border-[#fcd385]/50 rounded-lg px-2 py-1.5 sm:px-2 sm:py-1.5 transition cursor-pointer font-sans shrink-0">
            <Globe className="w-4 h-4 text-[#fcd385]" />
            <select value={lang} onChange={(e) => setLang(e.target.value as 'mm' | 'en')} className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer">
              <option value="mm">မြန်မာ</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="relative hidden sm:block font-sans">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[#1f1f1f] border border-zinc-700 pl-9 pr-4 py-1.5 rounded-full text-xs text-white focus:outline-none focus:border-[#fcd385] w-48 transition-all" />
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-4 font-sans relative">
              {currentUser.role === 'admin' && (
                <button onClick={() => {syncLatestData(); setAdminDashboardOpen(true);}} className="hidden sm:flex text-xs bg-gradient-to-r from-[#b30000] to-[#660000] hover:brightness-110 px-3 py-1.5 rounded-lg font-bold transition items-center gap-1 shadow-lg">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </button>
              )}
              
              {/* NOTIFICATION BELL */}
              <div className="relative shrink-0" ref={notiRef}>
                 <button onClick={() => {setNotiDropdownOpen(!notiDropdownOpen);}} className="p-2 bg-[#1f1f1f] rounded-full border border-zinc-700 hover:border-[#fcd385]/50 transition relative flex items-center justify-center">
                    <Bell className={`w-5 h-5 ${unreadNotiCount > 0 ? 'text-[#fcd385]' : 'text-zinc-400'}`} />
                    {unreadNotiCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-[#161616] animate-pulse">{unreadNotiCount}</span>}
                 </button>
                 
                 {/* NOTIFICATION DROPDOWN */}
                 {notiDropdownOpen && (
                   <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-12 sm:mt-1 w-auto sm:w-[320px] max-h-[70vh] sm:max-h-[80vh] bg-[#1a1a1a] border border-[#fcd385]/30 shadow-2xl rounded-2xl z-[200] flex flex-col overflow-hidden animate-fade-in mx-auto">
                      <div className="p-4 border-b border-zinc-800 bg-[#161616] flex justify-between items-center">
                        <h4 className="font-bold text-[#fcd385] flex items-center gap-2"><Bell className="w-4 h-4"/> {t.notifications}</h4>
                        {myNotis.length > 0 && <button onClick={() => setNotifications(notifications.map(n => (n.targetUser === 'all' || n.targetUser === currentUser.username || (currentUser.role === 'admin' && n.targetUser === 'admin')) ? { ...n, isRead: true } : n))} className="text-[10px] text-zinc-400 hover:text-white transition">{t.markAllRead}</button>}
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                         {myNotis.length === 0 ? <p className="text-xs text-zinc-500 text-center py-6">{t.noNoti}</p> : myNotis.map(n => (
                           <div key={n.id} onClick={() => handleNotiClick(n)} className={`p-4 border-b border-zinc-800/50 cursor-pointer hover:bg-black/40 transition flex gap-3 ${n.isRead ? 'opacity-60' : 'bg-[#2b0303]/30 border-l-2 border-l-[#fcd385]'}`}>
                              <div className="shrink-0 mt-1">
                                {n.actionType === 'point_request' ? <AlertCircle className="w-5 h-5 text-yellow-400"/> : n.actionType === 'point_approve' ? <CheckCircle className="w-5 h-5 text-emerald-400"/> : n.actionType === 'point_reject' ? <XCircle className="w-5 h-5 text-red-500"/> : <Mail className="w-5 h-5 text-blue-400"/>}
                              </div>
                              <div>
                                <p className={`text-xs ${n.isRead ? 'text-zinc-300' : 'text-white font-bold'} mb-1`}>{n.message}</p>
                                <span className="text-[9px] text-zinc-500">{formatDateTime(n.date)}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              {/* BIGGER POINTS BUTTON */}
              <button onClick={() => {syncLatestData(); setPayStep('menu'); setPointModalOpen(true);}} className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#2b0303] to-[#1a0101] border-2 border-[#fcd385] text-[#fcd385] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-black shadow-[0_0_10px_rgba(252,211,133,0.3)] hover:brightness-110 transition shrink-0">
                <Coins className="w-5 h-5 sm:w-5 sm:h-5 text-yellow-400" /> <span>{currentUser.points} {t.pts}</span>
              </button>
              
              {/* BIGGER USER PROFILE BUTTON */}
              <div onClick={() => {syncLatestData(); setUserMenuTab('menu'); setUserMenuOpen(true);}} className="cursor-pointer p-2 sm:p-2 bg-[#fcd385] rounded-full hover:bg-yellow-400 transition shadow-[0_0_10px_rgba(252,211,133,0.4)] border-2 border-[#d4af37] flex items-center justify-center shrink-0">
                 <User className="w-5 h-5 sm:w-5 sm:h-5 text-[#3e1717]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-sans">
              <button onClick={() => {setAuthForm({username:'', email:'', password:''}); setAuthError(''); setAuthMode('login'); setAuthModalOpen(true);}} className="text-xs sm:text-sm font-bold bg-[#fcd385] text-[#3e1717] px-3 sm:px-5 py-1.5 rounded-md hover:bg-yellow-400 transition shadow-lg">{t.loginBtn}</button>
              <button onClick={() => {setAuthForm({username:'', email:'', password:''}); setAuthError(''); setAuthMode('register'); setAuthModalOpen(true);}} className="hidden sm:block text-sm font-bold border border-[#fcd385] text-[#fcd385] px-5 py-1.5 rounded-md hover:bg-[#fcd385]/10 transition">{t.signUpBtn}</button>
            </div>
          )}
        </div>
      </header>

      {/* --- MARQUEE BELOW HEADER (RIGHT TO LEFT) FOR EVERYONE --- */}
      {(siteConfig.marqueeEn || siteConfig.marqueeMm) && (
        <div className="bg-gradient-to-r from-[#1a0101] via-[#2b0303] to-[#1a0101] text-[#fcd385] py-2 overflow-hidden border-b border-[#fcd385]/20 flex w-full">
          <div className="animate-marquee-rtl text-xs font-bold font-sans w-full">
            {lang === 'en' ? siteConfig.marqueeEn : siteConfig.marqueeMm}
          </div>
        </div>
      )}

      {/* --- RE-SIZED USER PROFILE SLIDE MENU --- */}
      {userMenuOpen && currentUser && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUserMenuOpen(false)} />
          <div className="relative w-72 max-w-[75%] bg-[#5c0909] h-full shadow-2xl flex flex-col animate-slide-in border-l border-[#fcd385]/30">
             
             {userMenuTab === 'menu' ? (
               <>
                 <div className="flex justify-between items-center p-4 border-b border-[#fcd385]/20">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full border border-[#fcd385] flex items-center justify-center bg-black/30">
                         <User className="w-4 h-4 text-[#fcd385]"/>
                       </div>
                       <h3 className="text-base font-bold text-white uppercase tracking-wider">{currentUser.username}</h3>
                    </div>
                    <button onClick={() => setUserMenuOpen(false)} className="text-white hover:text-[#fcd385] transition"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="p-4 bg-black/20 border-b border-[#fcd385]/10">
                    <p className="text-xs text-zinc-300 mb-1">{t.balance}</p>
                    <p className="text-2xl font-black text-[#fcd385]">Ks. {currentUser.points}</p>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col">
                    <button onClick={() => setUserMenuTab('messages')} className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-xl transition text-white font-bold text-sm">
                      <div className="flex items-center gap-3 relative"><MessageSquareIcon unreadCount={unreadNotiCount}/> {t.inbox}</div>
                      <ChevronRight className="w-4 h-4 text-white/50"/>
                    </button>
                    <button onClick={() => {setChangePwdModalOpen(true); setUserMenuOpen(false);}} className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-xl transition text-white font-bold text-sm">
                      <div className="flex items-center gap-3"><Key className="w-4 h-4"/> {t.changePwd}</div>
                      <ChevronRight className="w-4 h-4 text-white/50"/>
                    </button>
                    <button onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('jbsehunjaes_auth'); // Logout တဲ့အခါ Remember Me ပါဖျက်မည်
                      setUserMenuOpen(false);
                    }} className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-xl transition text-white font-bold text-sm">
                      <div className="flex items-center gap-3"><LogOut className="w-4 h-4"/> {t.logout}</div>
                      <ChevronRight className="w-4 h-4 text-white/50"/>
                    </button>

                    {/* Dynamic Contact Links inside Profile */}
                    <div className="mt-auto pt-6 border-t border-[#fcd385]/10">
                      <h4 className="text-xs font-bold text-[#fcd385] mb-3">{t.contactUs}</h4>
                      <div className="space-y-2">
                        {siteConfig.socialLinks?.map(link => (
                           <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 bg-black/20 hover:bg-white/5 rounded-xl transition text-zinc-300 hover:text-white font-bold text-sm">
                             {link.logo ? <img src={link.logo} alt={link.platform} className="w-5 h-5 object-contain rounded-full" /> : getSocialIcon(link.platform)} 
                             {link.platform}
                           </a>
                        ))}
                      </div>
                    </div>
                 </div>
               </>
             ) : (
               // INBOX TAB
               <div className="flex flex-col h-full bg-[#161616]">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setUserMenuTab('menu')} className="p-1 rounded text-zinc-400 hover:text-white transition bg-black/50"><ChevronLeft className="w-5 h-5"/></button>
                      <h3 className="font-bold text-[#fcd385] flex items-center gap-2"><Mail className="w-4 h-4"/> {t.inbox}</h3>
                    </div>
                    {myNotis.length > 0 && <button onClick={() => setNotifications(notifications.map(n => (n.targetUser === 'all' || n.targetUser === currentUser.username || (currentUser.role === 'admin' && n.targetUser === 'admin')) ? { ...n, isRead: true } : n))} className="text-[10px] text-zinc-400 hover:text-white transition">{t.markAllRead}</button>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                     {myNotis.length === 0 ? <p className="text-zinc-500 text-xs text-center py-6">{t.noNoti}</p> : myNotis.map(n => (
                       <div key={n.id} className={`p-4 rounded-xl border flex flex-col gap-2 shadow-inner transition ${n.isRead ? 'bg-[#1f1f1f] border-zinc-800' : 'bg-[#2b0303] border-[#fcd385]/30'}`} onClick={() => { if(!n.isRead) setNotifications(notifications.map(x => x.id === n.id ? {...x, isRead: true} : x)) }}>
                          <div className="flex justify-between items-start gap-2">
                             <p className={`text-xs ${n.isRead ? 'text-zinc-300' : 'text-white font-bold'}`}>{n.message}</p>
                             {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#fcd385] shrink-0 mt-1"></span>}
                          </div>
                          {n.detail && <p className="text-[11px] text-zinc-400 bg-black/40 p-2 rounded-lg border border-zinc-800/50 leading-relaxed font-bold tracking-wide italic">{n.detail}</p>}
                          <p className="text-[9px] text-zinc-500 mt-1">{formatDateTime(n.date)}</p>
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* --- MOBILE SEARCH BAR --- */}
      <div className="sm:hidden px-4 pt-4 font-sans">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#1f1f1f] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {adminDashboardOpen && currentUser?.role === 'admin' ? (
        <div className="flex flex-col md:flex-row min-h-[85vh] mt-1 border-t border-zinc-800">
          <aside className="w-full md:w-72 bg-[#361c1c] md:min-h-full border-r border-[#4a2626] flex flex-col">
             <div className="p-5 border-b border-[#4a2626] bg-[#2a1414]">
                <h2 className="text-[#ff9d9d] font-black text-lg flex items-center gap-2 mb-4"><LayoutDashboard className="w-5 h-5"/> {t.adminSystem}</h2>
             </div>
             <nav className="flex-1 py-4 flex flex-col gap-1 font-sans">
                <button onClick={() => {syncLatestData(); setAdminActiveTab('dashboard')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'dashboard' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}>
                  <LayoutDashboard className="w-5 h-5"/> {t.adminTabDashboard}
                </button>
                <button onClick={() => {syncLatestData(); setAdminActiveTab('users')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'users' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Users className="w-5 h-5"/> {t.adminTabUsers}</button>
                <button onClick={() => {syncLatestData(); setAdminActiveTab('points')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'points' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}>
                  <div className="relative"><Bell className="w-5 h-5"/>{adminPendingPoints.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"/>}</div> 
                  {t.adminTabPoints}
                </button>
                <button onClick={() => {syncLatestData(); setAdminActiveTab('history')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'history' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Clock className="w-5 h-5"/> {t.adminTabHistory}</button>
                
                <button onClick={() => {syncLatestData(); setAdminActiveTab('logs')}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'logs' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Edit className="w-5 h-5"/> {t.adminTabLogs}</button>

                <button onClick={() => setAdminActiveTab('settings')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'settings' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Settings className="w-5 h-5"/> {t.adminTabSettings}</button>
                <button onClick={() => setAdminActiveTab('promo')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'promo' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Gift className="w-5 h-5"/> {t.adminTabPromo}</button>
                <button onClick={() => setAdminActiveTab('faq')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'faq' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><HelpCircle className="w-5 h-5"/> {t.adminTabFaq}</button>
                <button onClick={() => setAdminActiveTab('upload')} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'upload' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><Upload className="w-5 h-5"/> {t.adminTabUpload}</button>
                {/* NEW MENU ITEM */}
                <button onClick={() => {syncLatestData(); setAdminActiveTab('uploaded_content');}} className={`w-full text-left px-6 py-3 flex items-center gap-3 text-sm font-bold transition ${adminActiveTab === 'uploaded_content' ? 'text-[#ff9d9d] bg-black/20 border-r-4 border-[#ff9d9d]' : 'text-zinc-300 hover:bg-black/10'}`}><ListVideo className="w-5 h-5"/> {lang === 'en' ? 'Uploaded Content' : 'တင်ထားသော ဇာတ်ကားများ'}</button>
              </nav>
          </aside>

          <main className="flex-1 p-4 md:p-8 bg-[#111111]">

            {/* ====== NEW DASHBOARD SECTION ====== */}
            {adminActiveTab === 'dashboard' && (
              <div className="animate-fade-in space-y-6 font-sans">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabDashboard}</h3>
                
                {/* Date Filters (From & To) */}
                <div className="bg-[#1f1f1f] p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2">
                     <label className="text-xs font-bold text-zinc-400">From Date:</label>
                     <input type="date" value={dashDateFrom} onChange={e => setDashDateFrom(e.target.value)} className="bg-black border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                   </div>
                   <div className="flex items-center gap-2">
                     <label className="text-xs font-bold text-zinc-400">To Date:</label>
                     <input type="date" value={dashDateTo} onChange={e => setDashDateTo(e.target.value)} className="bg-black border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                   </div>
                   <button onClick={() => {setDashDateFrom(''); setDashDateTo('');}} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg font-bold transition shadow-lg">Clear Filter</button>
                </div>

                {(() => {
                   // Calculate Users Status (Last 1 Month = Active)
                   const thirtyDaysAgo = new Date();
                   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                   
                   const totalUsers = users.length;
                   const activeUsers = users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) >= thirtyDaysAgo).length;
                   const inactiveUsers = totalUsers - activeUsers;
                   const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
                   
                   // NEW: User များ VIP ဝယ်ရန် သုံးလိုက်သော Point အားလုံးကို ပေါင်းခြင်း
                   const totalPointsSpent = users.reduce((sum, u) => {
                      const spent = (u.pointHistory || []).filter(log => log.type === 'buy_vip').reduce((s, log) => s + Math.abs(log.amount), 0);
                      return sum + spent;
                   }, 0);

                   // 1. Get ONLY Approved Point Requests and apply Date Filter
                   let filteredReqs = pointRequests.filter(req => req.status === 'approved');
                   if (dashDateFrom && dashDateTo) {
                     const fromD = new Date(dashDateFrom).setHours(0,0,0,0);
                     const toD = new Date(dashDateTo).setHours(23,59,59,999);
                     filteredReqs = filteredReqs.filter(req => {
                       const d = new Date(req.date).getTime();
                       return d >= fromD && d <= toD;
                     });
                   }

                   // 2. Group by Payment Provider 
                   const providerStats: Record<string, {count: number, amount: number}> = {};
                   let grandTotalCount = 0;
                   let grandTotalAmount = 0;

                   filteredReqs.forEach(req => {
                      const prov = req.provider || 'Unknown';
                      const amt = req.amount || 0; // Only uses the actually approved amount
                      if (!providerStats[prov]) providerStats[prov] = { count: 0, amount: 0 };
                      providerStats[prov].count += 1;
                      providerStats[prov].amount += amt;
                      grandTotalCount += 1;
                      grandTotalAmount += amt;
                   });

                   const maxAmount = Math.max(...Object.values(providerStats).map(p => p.amount), 1);

                   return (
                     <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                           <div className="bg-gradient-to-br from-[#1a1a1a] to-black p-4 rounded-xl border border-zinc-800 shadow-lg">
                              <p className="text-xs text-zinc-500 font-bold mb-1">Total Users</p>
                              <p className="text-2xl font-black text-white">{totalUsers}</p>
                           </div>
                           <div className="bg-gradient-to-br from-emerald-900/20 to-black p-4 rounded-xl border border-emerald-900/50 shadow-lg relative overflow-hidden">
                              <p className="text-xs text-emerald-500/70 font-bold mb-1">Active Users (30d)</p>
                              <p className="text-2xl font-black text-emerald-400">{activeUsers}</p>
                           </div>
                           <div onClick={() => setShowInactiveUsersModal(true)} className="bg-gradient-to-br from-red-900/20 to-black p-4 rounded-xl border border-red-900/50 shadow-lg relative overflow-hidden cursor-pointer hover:border-red-500 transition group">
                              <p className="text-xs text-red-500/70 font-bold mb-1 group-hover:text-red-400 transition">Inactive Users</p>
                              <p className="text-2xl font-black text-red-400">{inactiveUsers}</p>
                           </div>
                           <div onClick={() => setShowUserPointsModal(true)} className="bg-gradient-to-br from-[#3e1717] to-black p-4 rounded-xl border border-[#fcd385]/30 shadow-lg cursor-pointer hover:border-[#fcd385] transition group">
                              <p className="text-xs text-[#fcd385]/70 font-bold mb-1 group-hover:text-[#fcd385] transition">Total Points (Remaining) <span className="text-[9px] text-zinc-500 ml-1">(View Detail)</span></p>
                              <p className="text-2xl font-black text-[#fcd385]">{totalPoints.toLocaleString()} <span className="text-xs">PTS</span></p>
                           </div>
                           {/* NEW: Total Points Spent Card */}
                           <div onClick={() => setShowPointsSpentModal(true)} className="bg-gradient-to-br from-purple-900/20 to-black p-4 rounded-xl border border-purple-500/30 shadow-lg cursor-pointer hover:border-purple-400 transition group">
                              <p className="text-xs text-purple-400/70 font-bold mb-1 group-hover:text-purple-300 transition">Total Points Spent</p>
                              <p className="text-2xl font-black text-purple-400">{totalPointsSpent.toLocaleString()} <span className="text-xs">PTS</span></p>
                           </div>
                        </div>

                        {/* Table and 3D Chart Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           
                           {/* Data Table */}
                           <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 shadow-xl overflow-x-auto">
                              <h4 className="text-sm font-bold text-white mb-4">Approved Transactions (By Method)</h4>
                              <table className="w-full text-left text-sm text-zinc-300">
                                 <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                                    <tr>
                                       <th className="px-4 py-3">Payment Method</th>
                                       <th className="px-4 py-3 text-right">Transactions</th>
                                       <th className="px-4 py-3 text-right">Total Amount</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {Object.keys(providerStats).length === 0 ? (
                                       <tr><td colSpan={3} className="text-center py-6 text-zinc-500 text-xs">No records found for selected dates.</td></tr>
                                    ) : (
                                       Object.entries(providerStats).map(([prov, stats]) => (
                                         <tr key={prov} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                                            <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline hover:text-blue-300" onClick={() => setSelectedMethodForDetail(prov)}>
                                                {prov} <span className="text-[10px] text-zinc-500 ml-1">(View Detail)</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{stats.count}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400">{stats.amount.toLocaleString()}</td>
                                         </tr>
                                       ))
                                    )}
                                 </tbody>
                                 {Object.keys(providerStats).length > 0 && (
                                    <tfoot>
                                       <tr className="bg-black/40 font-bold border-t-2 border-zinc-700">
                                          <td className="px-4 py-3 text-[#fcd385]">Grand Total</td>
                                          <td className="px-4 py-3 text-right text-[#fcd385] font-mono">{grandTotalCount}</td>
                                          <td className="px-4 py-3 text-right text-emerald-400 font-mono text-base">{grandTotalAmount.toLocaleString()}</td>
                                       </tr>
                                    </tfoot>
                                 )}
                              </table>
                           </div>

                           {/* 3D Bar Chart */}
                           <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 shadow-xl flex flex-col">
                              <h4 className="text-sm font-bold text-white mb-6">Payment Distribution Chart</h4>
                              <div className="flex-1 flex items-end justify-around gap-2 pt-10 pb-4 h-64 border-b-2 border-zinc-700 relative">
                                 {Object.keys(providerStats).length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">No data to display</div>
                                 ) : (
                                    Object.entries(providerStats).map(([prov, stats], idx) => {
                                       const heightPercent = (stats.amount / maxAmount) * 100;
                                       // Multiple Colors for different payment methods
                                       const colors = [
                                          'from-blue-600 to-blue-900 border-blue-400',
                                          'from-emerald-600 to-emerald-900 border-emerald-400',
                                          'from-yellow-500 to-yellow-800 border-yellow-300',
                                          'from-purple-600 to-purple-900 border-purple-400',
                                          'from-red-600 to-red-900 border-red-400'
                                       ];
                                       const colorClass = colors[idx % colors.length];

                                       return (
                                         <div key={prov} className="flex flex-col items-center justify-end w-full group">
                                            {/* Tooltip Value (Hover) */}
                                            <span className="text-xs font-mono text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded shadow-lg">
                                               {stats.amount.toLocaleString()}
                                            </span>
                                            
                                            {/* CSS 3D Pillar */}
                                            <div 
                                              className={`w-12 sm:w-16 rounded-t-sm bg-gradient-to-b ${colorClass} border-t-2 border-l border-r border-black shadow-[4px_4px_10px_rgba(0,0,0,0.8)] relative transition-all duration-500 group-hover:brightness-125`}
                                              style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                            >
                                              {/* 3D side shadow effect */}
                                              <div className="absolute top-0 right-0 bottom-0 w-3 bg-black/30 rounded-tr-sm"></div>
                                            </div>
                                            
                                            {/* Label Name */}
                                            <span className="text-[10px] font-bold text-zinc-400 mt-3 text-center truncate w-full px-1" title={prov}>{prov}</span>
                                         </div>
                                       )
                                    })
                                 )}
                              </div>
                           </div>

                        </div>
                     </div>
                   );
                })()}
              </div>
            )}
            
            {/* ====== END NEW DASHBOARD SECTION ====== */}

            {adminActiveTab === 'users' && (
              <div className="animate-fade-in space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.userMgmt}</h3>
                    <button onClick={handleDownloadUsersBackup} className="flex items-center gap-1.5 text-xs bg-blue-900/40 border border-blue-700/50 hover:border-blue-400 text-blue-400 px-3 py-2 rounded-lg transition shadow-lg">
                        <Download className="w-4 h-4" /> Backup Data (Excel)
                    </button>
                 </div>
                 <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 overflow-x-auto font-sans">
                   
                   {/* User Search & Add User Section */}
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 min-w-[600px]">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder={t.searchUser} value={adminUserSearch}
                          onChange={e => {setAdminUserSearch(e.target.value); setUsersPage(1);}}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      <button onClick={() => {
                        setEditUserForm({username: '', email: '', password: '', role: 'user', points: 0, vip: false, unlockedShows: [], createdAt: '', lastLoginAt: '', pointHistory: []});
                        setEditUserModal({isOpen: true, mode: 'create'});
                      }} className="bg-[#fcd385] text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-yellow-400 transition whitespace-nowrap">
                        <UserPlus className="w-4 h-4" /> {t.createUser}
                      </button>
                   </div>

                   <div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800">
                     <table className="w-full text-left text-sm text-zinc-300 min-w-[700px]">
                       <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                          <tr>
                             <th className="px-4 py-3">User Info</th>
                             <th className="px-4 py-3">Role</th>
                             <th className="px-4 py-3">Points Balance</th>
                             <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody>
                         {paginatedUsers.length === 0 ? (
                           <tr><td colSpan={4} className="text-center py-8 text-zinc-500 text-sm">No users found.</td></tr>
                         ) : paginatedUsers.map(u => (
                           <tr key={u.username} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                             <td className="px-4 py-3">
                                <p className="text-sm font-bold text-white">{u.username}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{u.email}</p>
                             </td>
                             <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${u.role==='admin' ? 'bg-red-900/50 text-red-300 border border-red-800/50' : 'bg-zinc-800 text-zinc-300'}`}>{u.role}</span>
                             </td>
                             <td className="px-4 py-3">
                                <span className="text-[#fcd385] font-bold text-sm bg-[#3e1717] px-3 py-1 rounded-lg border border-[#fcd385]/30 shadow-inner">{u.points} PTS</span>
                             </td>
                             <td className="px-4 py-3 text-right">
                               <div className="flex justify-end gap-2">
                                 <button onClick={() => setUserDetailModal(u)} className="p-2 bg-zinc-800 rounded text-emerald-400 hover:bg-zinc-700 transition" title="View Details"><Eye className="w-4 h-4"/></button>
                                 <button onClick={() => {setEditUserForm({...u}); setEditUserRemark(''); setEditUserModal({isOpen: true, mode: 'edit', oldUsername: u.username});}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700 transition" title="Edit User"><Edit className="w-4 h-4"/></button>
                                 {u.username !== currentUser.username && (
                                   <button onClick={() => setConfirmModal({
                                      message: t.confirmDelDesc,
                                      onConfirm: () => setUsers(users.filter(user => user.username !== u.username))
                                   })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700 transition" title="Delete User"><Trash2 className="w-4 h-4"/></button>
                                 )}
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   
                   {/* Pagination UI */}
                   {adminFilteredUsers.length > 0 && renderPagination(usersPage, setUsersPage, usersPerPage, setUsersPerPage, adminFilteredUsers.length)}

                 </div>
              </div>
            )}

            {adminActiveTab === 'points' && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.pointReqs}</h3>
                  <button onClick={syncLatestData} className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-[#fcd385] px-3 py-2 rounded-lg transition shadow-lg border border-zinc-700">
                      <RefreshCw className="w-4 h-4" /> Sync
                  </button>
                </div>
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 font-sans">
                  <div className="space-y-3">
                    {adminFilteredPoints.length === 0 ? <p className="text-zinc-500 text-sm py-4">{t.noReqs}</p> : adminFilteredPoints.map(req => (
                      <div key={req.id} className="bg-black/40 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between border border-[#fcd385]/30 shadow-lg gap-4">
                        <div>
                          <p className="text-sm font-bold text-white mb-1">User: <span className="text-blue-400">{req.username}</span></p>
                          <p className="text-xs text-zinc-400 mb-0.5">Provider: {req.provider}</p>
                          <p className="text-xs text-[#fcd385] font-bold">Txn ID: {req.idCode}</p>
                          {req.requestedAmount && <p className="text-xs text-emerald-400 font-bold mt-0.5">Amount: {req.requestedAmount}</p>}
                          <p className="text-[10px] text-zinc-500 mt-1">{formatDateTime(req.date)}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input 
                            type="number" min="1" placeholder="Amount" value={approveAmounts[req.id] || req.requestedAmount || ''}
                            onChange={(e) => setApproveAmounts({...approveAmounts, [req.id]: Number(e.target.value)})}
                            className="w-24 bg-zinc-900 border border-zinc-700 p-2 text-sm text-white rounded-lg focus:outline-none focus:border-[#fcd385]"
                          />
                          <button onClick={() => {
                            const amount = approveAmounts[req.id] || req.requestedAmount || 0;
                            if (amount <= 0) return setAlertModal({ message: "Please enter a valid amount." });
                            
                            const newNoti: NotificationData = {
                              id: Date.now().toString()+'_noti', targetUser: req.username,
                              message: `ID ${req.idCode} အတွက် Point ထည့်သွင်းပေးလိုက်ပါပြီ။`, detail: `+${amount} PTS ဖြည့်သွင်းပြီးပါပြီ။`,
                              date: new Date().toISOString(), isRead: false, actionType: 'point_approve'
                            };

                            setUsers(users.map(u => u.username === req.username ? { ...u, points: u.points + amount } : u));
                            setPointRequests(pointRequests.map(p => p.id === req.id ? { ...p, status: 'approved', amount } : p));
                            setNotifications([newNoti, ...notifications]);
                            showToast(`${amount} ${t.msgApproved}`);
                          }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition flex-1 md:flex-none">
                            {t.approveBtn}
                          </button>
                          
                          {/* Reject with Remark 3D Modal */}
                          <button onClick={() => {
                             setPromptModal({
                               title: t.confirmRejectTitle,
                               placeholder: t.rejectPlaceholder,
                               onSubmit: (reason) => {
                                 const newNoti: NotificationData = {
                                   id: Date.now().toString()+'_noti', targetUser: req.username,
                                   message: `ID ${req.idCode} အတွက် ပယ်ချလိုက်ပါသည်။ Remark ကိုဖတ်ရန်နှိပ်ပါ။`, detail: reason,
                                   date: new Date().toISOString(), isRead: false, actionType: 'point_reject'
                                 };
                                 setPointRequests(pointRequests.map(p => p.id === req.id ? { ...p, status: 'rejected', remark: reason } : p));
                                 setNotifications([newNoti, ...notifications]);
                                 showToast("Request Rejected");
                               }
                             });
                          }} className="bg-red-800 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition flex-1 md:flex-none">
                            {t.rejectBtn}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'history' && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabHistory}</h3>
                  <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs bg-emerald-900/40 border border-emerald-700/50 hover:border-emerald-400 text-emerald-400 px-3 py-2 rounded-lg transition shadow-lg">
                      <FileSpreadsheet className="w-4 h-4" /> {lang === 'en' ? 'Export CSV' : 'Excel ဆွဲချမည်'}
                  </button>
                </div>
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 font-sans">
                  
                  {/* Bulk Delete Section WITH CALENDAR FIX */}
                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-red-400 mb-2">Delete Records (Date Range)</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-auto">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                          <input 
                            type="date" 
                            value={bulkDeleteDateFrom} 
                            onChange={e => setBulkDeleteDateFrom(e.target.value)} 
                            className="w-full bg-black/50 border border-red-900/50 pl-9 pr-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 outline-none"
                          />
                        </div>
                        <span className="text-zinc-500 font-bold text-xs px-2">{lang === 'en' ? 'TO' : 'အထိ'}</span>
                        <div className="relative w-full sm:w-auto">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                          <input 
                            type="date" 
                            value={bulkDeleteDateTo} 
                            onChange={e => setBulkDeleteDateTo(e.target.value)} 
                            className="w-full bg-black/50 border border-red-900/50 pl-9 pr-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    {(bulkDeleteDateFrom && bulkDeleteDateTo) && (
                       <div className="flex items-center gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                         <span className="text-sm font-bold text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-900/50">
                           {recordsToDelete.length} records found
                         </span>
                         <button 
                           disabled={recordsToDelete.length === 0}
                           onClick={() => {
                             setConfirmModal({
                               message: `Are you sure you want to delete ${recordsToDelete.length} records? This action cannot be undone.`,
                               onConfirm: () => {
                                 const remaining = pointRequests.filter(r => !recordsToDelete.includes(r));
                                 setPointRequests(remaining);
                                 setBulkDeleteDateFrom('');
                                 setBulkDeleteDateTo('');
                                 showToast(`${recordsToDelete.length} records deleted.`);
                               }
                             })
                           }}
                           className="bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                         >
                           <Trash2 className="w-4 h-4"/> Delete All Selected
                         </button>
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" placeholder="Search User or Txn ID..." value={adminHistorySearch}
                        onChange={e => {setAdminHistorySearch(e.target.value); setHistoryPage(1);}}
                        className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                      />
                    </div>
                  </div>
		<div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800">
                     <table className="w-full text-left text-sm text-zinc-300 min-w-[800px]">
                       <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                          <tr>
                             <th className="px-4 py-3">Date</th>
                             <th className="px-4 py-3">User</th>
                             <th className="px-4 py-3">Provider / Txn ID</th>
                             <th className="px-4 py-3 text-right">Amount</th>
                             <th className="px-4 py-3 text-center">Status</th>
                             <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody>
                         {paginatedHistory.length === 0 ? (
                           <tr><td colSpan={6} className="text-center py-8 text-zinc-500 text-sm">No records found.</td></tr>
                         ) : paginatedHistory.map((req, i) => (
                           <tr key={i} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                             <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(req.date)}</td>
                             <td className="px-4 py-3 font-bold text-blue-400">{req.username}</td>
                             <td className="px-4 py-3">
                                <p className="text-xs text-zinc-300">{req.provider}</p>
                                <p className="text-[11px] text-[#fcd385] font-mono mt-0.5 tracking-wider">{req.idCode}</p>
                             </td>
                             <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                {req.requestedAmount || req.amount}
                             </td>
                             <td className="px-4 py-3 text-center">
                               {req.status === 'pending' && <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded font-bold uppercase">{t.statusPending}</span>}
                               {req.status === 'approved' && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded font-bold uppercase">{t.statusSuccess} (+{req.amount})</span>}
                               {req.status === 'rejected' && <div className="flex flex-col items-center gap-1"><span className="text-[10px] bg-red-900/50 text-red-400 px-2 py-1 rounded font-bold uppercase">{t.statusRejected}</span>{req.remark && <span className="text-[9px] text-red-300 italic max-w-[120px] truncate" title={req.remark}>{req.remark}</span>}</div>}
                             </td>
                             <td className="px-4 py-3 text-right">
                               <button onClick={() => {
                                 setConfirmModal({
                                   message: t.confirmDelDesc,
                                   onConfirm: () => {
                                      setPointRequests(pointRequests.filter(p => p.id !== req.id));
                                      showToast(t.msgDeleted);
                                   }
                                 });
                               }} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700 transition"><Trash2 className="w-4 h-4"/></button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                  {/* Pagination UI */}
                  {adminFilteredHistory.length > 0 && renderPagination(historyPage, setHistoryPage, historyPerPage, setHistoryPerPage, adminFilteredHistory.length)}
                </div>
              </div>
            )}

            {/* NEW ADMIN LOGS TAB */}
            {adminActiveTab === 'logs' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{lang === 'en' ? 'Admin Action Logs' : 'အက်ဒမင် စီမံမှု မှတ်တမ်းများ'}</h3>
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 font-sans">
                  
                  {/* Bulk Delete Section WITH CALENDAR FIX */}
                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-red-400 mb-2">Clear Old Logs (Date Range)</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-auto">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                          <input 
                            type="date" 
                            value={adminLogBulkDateFrom} 
                            onChange={e => setAdminLogBulkDateFrom(e.target.value)} 
                            className="w-full bg-black/50 border border-red-900/50 pl-9 pr-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 outline-none"
                          />
                        </div>
                        <span className="text-zinc-500 font-bold text-xs px-2">{lang === 'en' ? 'TO' : 'အထိ'}</span>
                        <div className="relative w-full sm:w-auto">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                          <input 
                            type="date" 
                            value={adminLogBulkDateTo} 
                            onChange={e => setAdminLogBulkDateTo(e.target.value)} 
                            className="w-full bg-black/50 border border-red-900/50 pl-9 pr-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    {(adminLogBulkDateFrom && adminLogBulkDateTo) && (
                       <div className="flex items-center gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                         <span className="text-sm font-bold text-red-300 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-900/50">
                           {logsToDelete.length} logs found
                         </span>
                         <button 
                           disabled={logsToDelete.length === 0}
                           onClick={() => {
                             setConfirmModal({
                               message: `Are you sure you want to delete ${logsToDelete.length} logs? This action cannot be undone.`,
                               onConfirm: () => {
                                 const remaining = adminLogs.filter(r => !logsToDelete.includes(r));
                                 setAdminLogs(remaining);
                                 setAdminLogBulkDateFrom('');
                                 setAdminLogBulkDateTo('');
                                 showToast(`${logsToDelete.length} logs deleted.`);
                               }
                             })
                           }}
                           className="bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                         >
                           <Trash2 className="w-4 h-4"/> Delete All Selected
                         </button>
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" placeholder="Search Admin, User or Action..." value={adminLogSearch}
                        onChange={e => {setAdminLogSearch(e.target.value); setAdminLogPage(1);}}
                        className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {paginatedLogs.length === 0 ? (
                       <p className="text-zinc-500 text-sm py-4">No action logs found.</p>
                    ) : (
                      paginatedLogs.map((log, i) => (
                        <div key={i} className="bg-black/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-zinc-800 gap-4 hover:border-zinc-600 transition">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded font-bold uppercase">{log.action}</span>
                               <span className="text-xs text-zinc-500 font-mono">{formatDateTime(log.date)}</span>
                            </div>
                            <p className="text-sm text-white mb-1"><span className="text-zinc-400">By Admin:</span> <span className="font-bold text-blue-400">{log.adminName}</span> <span className="text-zinc-400 mx-1">➜</span> <span className="text-zinc-400">To User:</span> <span className="font-bold text-[#fcd385]">{log.targetUser}</span></p>
                            <p className="text-xs text-zinc-300 bg-[#161616] border border-zinc-800 p-2 rounded mt-2 font-bold italic tracking-wide"><span className="text-zinc-500 mr-1">Remark:</span> {log.remark}</p>
                          </div>
                          <button onClick={() => {
                            setConfirmModal({
                              message: t.confirmDelDesc,
                              onConfirm: () => { setAdminLogs(adminLogs.filter(p => p.id !== log.id)); showToast(t.msgDeleted); }
                            });
                          }} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700 transition"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Pagination UI */}
                  {adminFilteredLogs.length > 0 && renderPagination(adminLogPage, setAdminLogPage, adminLogPerPage, setAdminLogPerPage, adminFilteredLogs.length)}
                </div>
              </div>
            )}

            {/* SYSTEM SETTINGS TAB */}
            {adminActiveTab === 'settings' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabSettings}</h3>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                  <div className="space-y-6">
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Marquee / Announcement Text</h4>
                      <input type="text" placeholder="English Version" value={siteConfig.marqueeEn || ''} onChange={e => setSiteConfig({...siteConfig, marqueeEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] mb-3" />
                      <input type="text" placeholder="Myanmar Version" value={siteConfig.marqueeMm || ''} onChange={e => setSiteConfig({...siteConfig, marqueeMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Deposit Guide (Side Panel)</h4>
                      <textarea placeholder="English Version" rows={3} value={siteConfig.depositGuideEn || ''} onChange={e => setSiteConfig({...siteConfig, depositGuideEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] mb-3" />
                      <textarea placeholder="Myanmar Version" rows={3} value={siteConfig.depositGuideMm || ''} onChange={e => setSiteConfig({...siteConfig, depositGuideMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-red-400 mb-4 border-b border-zinc-800 pb-2">Important Notice (Payment form)</h4>
                      <textarea placeholder="English Version" rows={2} value={siteConfig.paymentWarningEn || ''} onChange={e => setSiteConfig({...siteConfig, paymentWarningEn: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-red-400 mb-3" />
                      <textarea placeholder="Myanmar Version" rows={2} value={siteConfig.paymentWarningMm || ''} onChange={e => setSiteConfig({...siteConfig, paymentWarningMm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-red-400" />
                    </div>

                    {/* DYNAMIC CONTACT LINKS */}
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Contact Links (Dynamic)</h4>
                      <div className="space-y-3">
                        {siteConfig.socialLinks?.map((link, idx) => (
                           <div key={link.id} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-zinc-800">
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <div className="bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white w-full sm:w-32 flex items-center gap-2 shrink-0">
                                   {link.logo ? <img src={link.logo} alt="" className="w-4 h-4 object-contain" /> : getSocialIcon(link.platform)}
                                   <span className="truncate">{link.platform}</span>
                                </div>
                                <input type="text" placeholder="URL Link..." value={link.url} onChange={e => {
                                    const updated = [...siteConfig.socialLinks];
                                    updated[idx].url = e.target.value;
                                    setSiteConfig({...siteConfig, socialLinks: updated});
                                }} className="w-full sm:flex-1 bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                                <button onClick={() => {
                                    const updated = siteConfig.socialLinks.filter(l => l.id !== link.id);
                                    setSiteConfig({...siteConfig, socialLinks: updated});
                                }} className="w-full sm:w-auto p-2 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition flex justify-center"><Trash2 className="w-4 h-4"/></button>
                              </div>
                              <input type="text" placeholder="Logo URL (Optional)..." value={link.logo || ''} onChange={e => {
                                  const updated = [...siteConfig.socialLinks];
                                  updated[idx].logo = e.target.value;
                                  setSiteConfig({...siteConfig, socialLinks: updated});
                              }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-[#fcd385]" />
                           </div>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-zinc-800">
                         <input type="text" placeholder="Name (e.g. WhatsApp)" value={newSocialLink.platform} onChange={e => setNewSocialLink({...newSocialLink, platform: e.target.value})} className="bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] w-full sm:w-1/4" />
                         <input type="text" placeholder="URL Link..." value={newSocialLink.url} onChange={e => setNewSocialLink({...newSocialLink, url: e.target.value})} className="bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] w-full sm:w-1/3" />
                         <input type="text" placeholder="Logo Image URL..." value={newSocialLink.logo} onChange={e => setNewSocialLink({...newSocialLink, logo: e.target.value})} className="bg-black border border-zinc-700 p-2 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] w-full sm:w-1/3" />
                         <button onClick={() => {
                             if (newSocialLink.platform.trim() && newSocialLink.url.trim()) {
                                 setSiteConfig({
                                    ...siteConfig,
                                    socialLinks: [...(siteConfig.socialLinks || []), { id: Date.now().toString(), platform: newSocialLink.platform, url: newSocialLink.url, logo: newSocialLink.logo }]
                                 });
                                 setNewSocialLink({ platform: '', url: '', logo: '' });
                                 showToast('Link added successfully');
                             }
                         }} className="bg-[#fcd385] text-black px-4 py-2 rounded-lg text-sm font-bold w-full sm:w-auto">{t.addBtn}</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Payment Methods (QR Codes)</h4>
                      
                      {paymentProviders.banks.length > 0 && <p className="text-xs text-zinc-400 mb-2 mt-4 font-bold uppercase tracking-wider">{t.payBank}</p>}
                      <div className="space-y-3">
                        {paymentProviders.banks.map((p, idx) => (
                          <div key={p.id} className="bg-black/40 p-3 rounded-lg border border-zinc-800 space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3 w-40">
                                 {p.logo ? (
                                    <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain rounded-full bg-white p-0.5" />
                                 ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${p.color}`}>{p.name[0]}</div>
                                 )}
                                 <span className="text-white font-bold text-sm">{p.name}</span>
                               </div>
                               <button onClick={() => setConfirmModal({
                                  message: "Delete this bank provider?",
                                  onConfirm: () => setPaymentProviders({...paymentProviders, banks: paymentProviders.banks.filter((b:any) => b.id !== p.id)})
                               })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                             </div>
                             <div className="flex flex-col gap-2 mt-2">
                               <input type="text" placeholder={t.qrLinkPlaceholder} value={p.qrImage || ''} onChange={e => {
                                   const newBanks = [...paymentProviders.banks]; newBanks[idx].qrImage = e.target.value;
                                   setPaymentProviders({...paymentProviders, banks: newBanks});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Account Number..." value={p.accountNo || ''} onChange={e => {
                                   const newBanks = [...paymentProviders.banks]; newBanks[idx].accountNo = e.target.value;
                                   setPaymentProviders({...paymentProviders, banks: newBanks});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Logo Image URL (Optional)..." value={p.logo || ''} onChange={e => {
                                   const newBanks = [...paymentProviders.banks]; newBanks[idx].logo = e.target.value;
                                   setPaymentProviders({...paymentProviders, banks: newBanks});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-[#fcd385]" />
                             </div>
                          </div>
                        ))}
                      </div>

                      {paymentProviders.ewallets.length > 0 && <p className="text-xs text-zinc-400 mb-2 mt-6 font-bold uppercase tracking-wider">{t.payEwallet}</p>}
                      <div className="space-y-3">
                        {paymentProviders.ewallets.map((p, idx) => (
                          <div key={p.id} className="bg-black/40 p-3 rounded-lg border border-zinc-800 space-y-2">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3 w-40">
                                 {p.logo ? (
                                    <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain rounded-full bg-white p-0.5" />
                                 ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${p.color}`}>{p.name[0]}</div>
                                 )}
                                 <span className="text-white font-bold text-sm">{p.name}</span>
                               </div>
                               <button onClick={() => setConfirmModal({
                                  message: "Delete this E-Wallet provider?",
                                  onConfirm: () => setPaymentProviders({...paymentProviders, ewallets: paymentProviders.ewallets.filter((e:any) => e.id !== p.id)})
                               })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                             </div>
                             <div className="flex flex-col gap-2 mt-2">
                               <input type="text" placeholder={t.qrLinkPlaceholder} value={p.qrImage || ''} onChange={e => {
                                   const newEwallets = [...paymentProviders.ewallets]; newEwallets[idx].qrImage = e.target.value;
                                   setPaymentProviders({...paymentProviders, ewallets: newEwallets});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Account Number (Phone)..." value={p.accountNo || ''} onChange={e => {
                                   const newEwallets = [...paymentProviders.ewallets]; newEwallets[idx].accountNo = e.target.value;
                                   setPaymentProviders({...paymentProviders, ewallets: newEwallets});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                               <input type="text" placeholder="Logo Image URL (Optional)..." value={p.logo || ''} onChange={e => {
                                   const newEwallets = [...paymentProviders.ewallets]; newEwallets[idx].logo = e.target.value;
                                   setPaymentProviders({...paymentProviders, ewallets: newEwallets});
                                 }} className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-[#fcd385]" />
                             </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
                        <input type="text" placeholder="Name (e.g. KBZ Pay)" value={newProvider.name || ''} onChange={e => setNewProvider({...newProvider, name: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                        <input type="text" placeholder="Account No" value={newProvider.accountNo || ''} onChange={e => setNewProvider({...newProvider, accountNo: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                        <select value={newProvider.type || ''} onChange={e => setNewProvider({...newProvider, type: e.target.value})} className="bg-black border border-zinc-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#fcd385] w-full sm:w-auto">
                          <option value="banks">Bank</option>
                          <option value="ewallets">E-Wallet</option>
                        </select>
                        <button onClick={() => {
                          if(newProvider.name.trim()) {
                            const newProv = { id: 'prov-'+Date.now(), name: newProvider.name, qrImage: '', color: 'bg-zinc-600', accountNo: newProvider.accountNo, logo: newProvider.logo };
                            if (newProvider.type === 'banks') {
                              setPaymentProviders({...paymentProviders, banks: [...paymentProviders.banks, newProv]});
                            } else {
                              setPaymentProviders({...paymentProviders, ewallets: [...paymentProviders.ewallets, newProv]});
                            }
                            setNewProvider({ name: '', type: 'banks', accountNo: '', logo: '' });
                            showToast("Payment method added.");
                          }
                        }} className="bg-[#fcd385] px-4 py-2 sm:py-0 rounded-lg text-black text-sm font-bold w-full sm:w-auto">{t.addBtn}</button>
                      </div>
                    </div>

                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Manage Categories</h4>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newCategory || ''} onChange={(e) => setNewCategory(e.target.value)} placeholder={t.newCatName} className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                         <button onClick={() => {if(newCategory && !categories.includes(newCategory)){ setCategories([...categories, newCategory]); setNewCategory(''); showToast('Category Added');}}} className="bg-[#fcd385] px-5 rounded-lg text-black text-sm font-bold">{t.addBtn}</button>
                      </div>
                      <div className="space-y-2">
                        {categories.map((c, idx) => (
                          <div key={c} className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800">
                             <span className="text-sm text-white font-bold">{c}</span>
                             {c !== 'All' && (
                               <div className="flex items-center gap-1.5">
                                 {/* အပေါ်ရွှေ့ရန် ခလုတ် (▲) */}
                                 {idx > 1 && (
                                   <button onClick={() => {
                                     const newCats = [...categories];
                                     const temp = newCats[idx - 1];
                                     newCats[idx - 1] = newCats[idx];
                                     newCats[idx] = temp;
                                     setCategories(newCats);
                                   }} className="p-1.5 bg-blue-900/30 rounded text-blue-400 hover:bg-blue-900 transition text-xs font-black shadow-inner" title="Move Up">▲</button>
                                 )}
                                 {/* အောက်ရွှေ့ရန် ခလုတ် (▼) */}
                                 {idx < categories.length - 1 && (
                                   <button onClick={() => {
                                     const newCats = [...categories];
                                     const temp = newCats[idx + 1];
                                     newCats[idx + 1] = newCats[idx];
                                     newCats[idx] = temp;
                                     setCategories(newCats);
                                   }} className="p-1.5 bg-blue-900/30 rounded text-blue-400 hover:bg-blue-900 transition text-xs font-black shadow-inner" title="Move Down">▼</button>
                                 )}
                                 {/* ဖျက်ရန် ခလုတ် */}
                                 <button onClick={() => setConfirmModal({
                                    message: t.confirmDelDesc,
                                    onConfirm: () => setCategories(categories.filter(cat => cat !== c))
                                 })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition ml-2"><Trash2 className="w-4 h-4"/></button>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NEW PLATFORM MANAGE SECTION */}
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 border-b border-zinc-800 pb-2">Manage Platforms (Link Types)</h4>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newPlatform || ''} onChange={(e) => setNewPlatform(e.target.value)} placeholder="New Platform Name..." className="bg-black border border-zinc-700 p-2.5 rounded-lg flex-1 text-sm text-white focus:outline-none focus:border-[#fcd385]" />
                         <button onClick={() => {if(newPlatform && !platforms.includes(newPlatform)){ setPlatforms([...platforms, newPlatform]); setNewPlatform(''); showToast('Platform Added');}}} className="bg-[#fcd385] px-5 rounded-lg text-black text-sm font-bold">{t.addBtn}</button>
                      </div>
                      <div className="space-y-2">
                        {platforms.map(p => (
                          <div key={p} className="flex justify-between items-center bg-black p-3 rounded-lg border border-zinc-800">
                             <span className="text-sm text-white font-bold">{p}</span>
                             <button onClick={() => setConfirmModal({
                                message: t.confirmDelDesc,
                                onConfirm: () => setPlatforms(platforms.filter(plat => plat !== p))
                             })} className="p-1.5 bg-red-900/30 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button onClick={() => showToast(t.msgUserSaved)} className="bg-[#fcd385] text-[#3e0a0a] px-10 py-3.5 rounded-xl text-sm font-black hover:brightness-110 transition shadow-lg">
                    SAVE ALL SETTINGS
                  </button>
                </div>
              </div>
            )}

            {/* SEPARATED PROMOTIONS TAB */}
            {adminActiveTab === 'promo' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabPromo}</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                  {/* PROMO EDIT SECTION */}
                  <div>
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 mb-4">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 flex items-center gap-2"><Gift className="w-4 h-4"/> {editingPromoId ? "Edit Promotion" : "Add Promotion"}</h4>
                      
                      {/* ADDED IMAGE SUPPORT FOR PROMOTIONS */}
                      <div className="mb-4">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">Promotion Image URL (Optional)</label>
                        <input type="text" placeholder="https://..." value={newPromo.image || ''} onChange={e => setNewPromo({...newPromo, image: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                      </div>

                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">English</label>
                        <input type="text" placeholder="Title (EN)" value={newPromo.title_en || ''} onChange={e => setNewPromo({...newPromo, title_en: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Description (EN)" value={newPromo.body_en || ''} onChange={e => setNewPromo({...newPromo, body_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">Myanmar (မြန်မာ)</label>
                        <input type="text" placeholder="Title (MM)" value={newPromo.title_mm || ''} onChange={e => setNewPromo({...newPromo, title_mm: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Description (MM)" value={newPromo.body_mm || ''} onChange={e => setNewPromo({...newPromo, body_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (editingPromoId) {
                            setPromotions(promotions.map(p => p.id === editingPromoId ? { ...newPromo, id: editingPromoId } as PromoItem : p));
                            setEditingPromoId(null);
                          } else {
                            setPromotions([...promotions, {id: Date.now().toString(), ...newPromo} as PromoItem]); 
                          }
                          setNewPromo({title_en:'', body_en:'', title_mm:'', body_mm:'', image: ''}); 
                          showToast(t.msgContentAdded);
                        }} className="flex-1 bg-[#fcd385] text-black py-2.5 rounded-lg text-sm font-bold">{editingPromoId ? t.updateBtn : t.addBtn}</button>
                        {editingPromoId && <button onClick={() => {setEditingPromoId(null); setNewPromo({title_en:'', body_en:'', title_mm:'', body_mm:'', image: ''});}} className="px-4 bg-zinc-700 text-white rounded-lg font-bold">{t.cancelBtn}</button>}
                      </div>
                    </div>
                  </div>
                  
                  {/* PROMO LIST SECTION */}
                  <div>
                    <div className="space-y-3">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder="Search Promotions..." value={adminPromoSearch || ''}
                          onChange={e => setAdminPromoSearch(e.target.value)}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      {adminFilteredPromos.map(p => (
                        <div key={p.id} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                           <div className="flex items-center gap-3 overflow-hidden">
                             {p.image && <img src={p.image} alt="Promo" className="w-10 h-10 object-cover rounded shadow" />}
                             <div className="truncate pr-4 text-sm text-white font-bold">{p.title_en || p.title_mm}</div>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => {setEditingPromoId(p.id); setNewPromo(p); window.scrollTo(0,0);}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setPromotions(promotions.filter(x => x.id !== p.id)); showToast(t.msgDeleted); }
                             })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SEPARATED FAQ TAB */}
            {adminActiveTab === 'faq' && (
              <div className="animate-fade-in space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{t.adminTabFaq}</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                  
                  {/* FAQ EDIT SECTION */}
                  <div>
                    <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 mb-4">
                      <h4 className="text-sm font-bold text-[#fcd385] mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> {editingFaqId ? "Edit FAQ" : "Add FAQ"}</h4>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">English</label>
                        <input type="text" placeholder="Question (EN)" value={newFaq.title_en || ''} onChange={e => setNewFaq({...newFaq, title_en: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Answer (EN)" value={newFaq.body_en || ''} onChange={e => setNewFaq({...newFaq, body_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-zinc-700">
                        <label className="text-xs text-zinc-400 mb-2 block font-bold uppercase tracking-wider">Myanmar (မြန်မာ)</label>
                        <input type="text" placeholder="Question (MM)" value={newFaq.title_mm || ''} onChange={e => setNewFaq({...newFaq, title_mm: e.target.value})} className="w-full mb-3 bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" />
                        <textarea placeholder="Answer (MM)" value={newFaq.body_mm || ''} onChange={e => setNewFaq({...newFaq, body_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-lg focus:border-[#fcd385] outline-none" rows={2}/>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (editingFaqId) {
                            setFaqs(faqs.map(f => f.id === editingFaqId ? { ...newFaq, id: editingFaqId } : f));
                            setEditingFaqId(null);
                          } else {
                            setFaqs([...faqs, {id: Date.now().toString(), ...newFaq}]); 
                          }
                          setNewFaq({title_en:'', body_en:'', title_mm:'', body_mm:''}); 
                          showToast(t.msgContentAdded);
                        }} className="flex-1 bg-[#fcd385] text-black py-2.5 rounded-lg text-sm font-bold">{editingFaqId ? t.updateBtn : t.addBtn}</button>
                        {editingFaqId && <button onClick={() => {setEditingFaqId(null); setNewFaq({title_en:'', body_en:'', title_mm:'', body_mm:''});}} className="px-4 bg-zinc-700 text-white rounded-lg font-bold">{t.cancelBtn}</button>}
                      </div>
                    </div>
                  </div>

                  {/* FAQ LIST SECTION */}
                  <div>
                    <div className="space-y-3">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" placeholder="Search FAQs..." value={adminFaqSearch || ''}
                          onChange={e => setAdminFaqSearch(e.target.value)}
                          className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                        />
                      </div>
                      {adminFilteredFaqs.map(f => (
                        <div key={f.id} className="bg-[#1f1f1f] border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                           <div className="truncate pr-4 text-sm text-white font-bold">{f.title_en || f.title_mm}</div>
                           <div className="flex gap-2">
                             <button onClick={() => {setEditingFaqId(f.id); setNewFaq(f); window.scrollTo(0,0);}} className="p-2 bg-zinc-800 rounded text-blue-400 hover:bg-zinc-700"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setFaqs(faqs.filter(x => x.id !== f.id)); showToast(t.msgDeleted); }
                             })} className="p-2 bg-zinc-800 rounded text-red-400 hover:bg-zinc-700"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {adminActiveTab === 'upload' && (
              <div className="animate-fade-in space-y-6 font-sans">
                <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3 font-serif">
                   {editingShowId ? "Edit Movie / Series" : t.uploadVid}
                </h3>
                
                <div className="bg-[#1f1f1f] p-5 md:p-8 rounded-2xl border border-zinc-800 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.titleEnPlaceholder}</label>
                      <input type="text" value={newVideo.title_en || ''} onChange={e => setNewVideo({...newVideo, title_en: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.titleMmPlaceholder}</label>
                      <input type="text" value={newVideo.title_mm || ''} onChange={e => setNewVideo({...newVideo, title_mm: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">{t.imgPlaceholder}</label>
                      <input type="text" value={newVideo.image || ''} onChange={e => setNewVideo({...newVideo, image: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1.5">Category</label>
                      <select value={newVideo.category || categories[0]} onChange={e => setNewVideo({...newVideo, category: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#fcd385] mb-1.5 font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> {t.tgLinkPlaceholder}</label>
                      <input type="text" placeholder="https://t.me/..." value={newVideo.vipTelegramLink || ''} onChange={e => setNewVideo({...newVideo, vipTelegramLink: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>
                    
                    <div>
                      <label className="block text-zinc-400 mb-1.5">Point Price (Per Unreleased Ep)</label>
                      <input type="number" min="0" value={newVideo.pointsPerEp ?? 20} onChange={e => setNewVideo({...newVideo, pointsPerEp: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-zinc-400 mb-1.5">{t.descPlaceholder}</label>
                      <textarea value={newVideo.description || ''} onChange={e => setNewVideo({...newVideo, description: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#fcd385]" rows={3} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-zinc-400 mb-1.5">{t.totEps}</label>
                      <div className="flex gap-2">
                        <input type="number" min="0" value={epCount ?? 0} onChange={e => setEpCount(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white flex-1 focus:outline-none focus:border-[#fcd385]" />
                        <button onClick={() => {
                          // PRESERVE EXISTING LINKS LOGIC
                          const existingEps = newVideo.episodes || [];
                          const newEps = [...existingEps];
                          
                          if (epCount > newEps.length) {
                             // Add new empty slots
                             for(let i = newEps.length + 1; i <= epCount; i++) {
                                newEps.push({epLabel: `EP ${i}`, links: [], releaseDateRaw: '', releaseDate: ''});
                             }
                          } else if (epCount < newEps.length) {
                             // Truncate if reduced
                             newEps.length = epCount;
                          }
                          
                          setNewVideo({...newVideo, totalEpisodes: epCount, episodes: newEps, pointsPerEp: newVideo.pointsPerEp ?? 20});
                        }} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-white font-bold transition">{t.genSlots}</button>
                      </div>
                    </div>

                  </div>

                  {newVideo.episodes && (
                    <div className="mt-8 space-y-4 p-5 rounded-xl border border-zinc-700 bg-black/40">
                      {newVideo.episodes.length > 0 && <h4 className="text-sm font-bold text-[#fcd385] mb-4">Episode Links / Schedule Data</h4>}
                      {newVideo.episodes.map((ep, idx) => (
                        <div key={idx} className="flex flex-col gap-3 w-full bg-black p-4 rounded-lg border border-zinc-800">
                          
                          {/* Top Row: EP Label, Schedule, Add Link Button */}
                          <div className="flex flex-wrap items-center gap-3">
                            <input type="text" value={ep.epLabel || ''} onChange={e => {
                              const eps = [...newVideo.episodes!]; eps[idx].epLabel = e.target.value; setNewVideo({...newVideo, episodes: eps});
                            }} className="bg-[#3e1717] text-[#fcd385] text-xs font-bold px-2 py-2.5 rounded w-24 text-center outline-none border border-zinc-800 focus:border-[#fcd385]" />
                            
                            <span className="text-zinc-600 text-xs">Schedule:</span>
                            <div className="flex-1 flex gap-2 min-w-[200px]">
                              {/* Date Picker (Calendar နဲ့ ရွေးရန်) */}
                              <div className="relative flex-1">
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                  type="date" 
                                  value={(ep.releaseDateRaw || '').includes('|||') ? ep.releaseDateRaw!.split('|||')[0] : (ep.releaseDateRaw || '').split('T')[0]} 
                                  onChange={e => {
                                    const eps = [...newVideo.episodes!]; 
                                    const newDate = e.target.value;
                                    const oldRaw = eps[idx].releaseDateRaw || '';
                                    const currentTime = oldRaw.includes('|||') ? oldRaw.split('|||')[1] : '';
                                    eps[idx].releaseDateRaw = `${newDate}|||${currentTime}`;
                                    
                                    const d = new Date(newDate);
                                    const fd = !isNaN(d.getTime()) ? `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}` : newDate;
                                    eps[idx].releaseDate = currentTime ? `${fd} ${currentTime}` : fd;
                                    setNewVideo({...newVideo, episodes: eps});
                                  }} 
                                  className="bg-zinc-900 pl-9 pr-2 py-2.5 rounded text-xs text-white border border-zinc-800 w-full outline-none focus:border-[#fcd385]" 
                                />
                              </div>
                              {/* Time Input (အချိန်ကို ကိုယ်တိုင်ရိုက်ထည့်ရန်) */}
                              <div className="relative flex-1">
                                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                  type="text" 
                                  placeholder="e.g. 9:00 AM"
                                  value={(ep.releaseDateRaw || '').includes('|||') ? ep.releaseDateRaw!.split('|||')[1] : ''} 
                                  onChange={e => {
                                    const eps = [...newVideo.episodes!]; 
                                    const oldRaw = eps[idx].releaseDateRaw || '';
                                    const currentDate = oldRaw.includes('|||') ? oldRaw.split('|||')[0] : oldRaw.split('T')[0];
                                    const newTime = e.target.value;
                                    eps[idx].releaseDateRaw = `${currentDate}|||${newTime}`;
                                    
                                    const d = new Date(currentDate);
                                    const fd = currentDate && !isNaN(d.getTime()) ? `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}` : currentDate;
                                    eps[idx].releaseDate = newTime ? `${fd} ${newTime}` : fd;
                                    setNewVideo({...newVideo, episodes: eps});
                                  }} 
                                  className="bg-zinc-900 pl-9 pr-2 py-2.5 rounded text-xs text-white border border-zinc-800 w-full outline-none focus:border-[#fcd385]" 
                                />
                              </div>
                            </div>

                            <button onClick={() => {
    const eps = [...newVideo.episodes!];
    if(!eps[idx].links) eps[idx].links = [];
    eps[idx].links.push({platform: platforms.length > 0 ? platforms[0] : 'Other', url: ''});
    setNewVideo({...newVideo, episodes: eps});
}} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-3 py-2 rounded font-bold uppercase transition flex items-center gap-1"><Plus className="w-3 h-3"/> Add Link</button>
</div>

{/* AUTO-LINK TAG DISPLAY (NEW) */}
<div className="w-full flex items-center gap-2 mt-2 bg-blue-900/10 border border-blue-900/30 p-2 rounded-lg">
  <span className="text-[10px] text-zinc-400 font-bold uppercase">Auto-Link Tag (Telegram တွင်ထည့်ရန်):</span>
  {editingShowId ? (
    <code className="text-[11px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded font-mono select-all border border-blue-800/50">
       #{editingShowId}_ep{idx + 1}
    </code>
  ) : (
    <span className="text-[10px] text-yellow-500 italic font-bold">Save Movie First to get Tag!</span>
  )}
</div>
                          
                          {/* Links Row Mapping */}
                          {ep.links && ep.links.length > 0 && (
                            <div className="space-y-2 pl-4 border-l-2 border-zinc-800 mt-2">
                              {ep.links.map((lnk, lIdx) => (
                                <div key={lIdx} className="flex gap-2 items-center">
                                   <select value={lnk.platform || ''} onChange={e => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links[lIdx].platform = e.target.value;
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="bg-zinc-800 text-white text-xs p-2 rounded outline-none border border-zinc-700 w-24 sm:w-32">
                                      {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                   </select>
                                   <input type="text" placeholder="URL..." value={lnk.url || ''} onChange={e => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links[lIdx].url = e.target.value;
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="bg-zinc-900 p-2 rounded text-xs flex-1 text-white border border-zinc-800 outline-none focus:border-[#fcd385]" />
                                   <button onClick={() => {
                                     const eps = [...newVideo.episodes!];
                                     eps[idx].links.splice(lIdx, 1);
                                     setNewVideo({...newVideo, episodes: eps});
                                   }} className="p-1.5 bg-red-900/50 rounded text-red-400 hover:bg-red-900 transition"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => {
                          if(!newVideo.title_en && !newVideo.title_mm) return;
                          const itemToSave = {
                            id: editingShowId || `vid-${Date.now()}`, 
                            title_en: newVideo.title_en || '', title_mm: newVideo.title_mm || '', 
                            image: newVideo.image || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700',
                            category: newVideo.category || categories[0], description: newVideo.description || '', 
                            totalEpisodes: newVideo.totalEpisodes ?? 0, episodes: newVideo.episodes || [], 
                            vipTelegramLink: newVideo.vipTelegramLink || '', pointsPerEp: newVideo.pointsPerEp ?? 20
                          };
                          if (editingShowId) {
                            // Update လုပ်လိုက်တဲ့ ဇာတ်ကားကို လက်ရှိနေရာကနေဖယ်ပြီး အပေါ်ဆုံးသို့ ပို့ပေးရန်
                            const updatedShows = [itemToSave, ...shows.filter(s => s.id !== editingShowId)];
                            setShows(updatedShows);
                            setDoc(doc(db, "SiteData", "shows"), { data: updatedShows }); // ချက်ချင်း Database ပေါ် တိုက်ရိုက်တင်မည်
                            setEditingShowId(null);
                          } else {
                            const updatedShows = [itemToSave, ...shows];
                            setShows(updatedShows);
                            setDoc(doc(db, "SiteData", "shows"), { data: updatedShows }); // ချက်ချင်း Database ပေါ် တိုက်ရိုက်တင်မည်
                            
                            // --- NEW: NOTIFY ALL USERS ON NEW MOVIE ---
                            const newTitle = itemToSave.title_mm || itemToSave.title_en;
                            const newNoti: NotificationData = {
                               id: Date.now().toString()+'_noti',
                               targetUser: 'all',
                               message: `"${newTitle}" ဇာတ်လမ်းသစ် တင်လိုက်ပါပြီ။`,
                               date: new Date().toISOString(),
                               isRead: false,
                               actionType: 'new_upload'
                            };
                            const updatedNotis = [newNoti, ...notifications];
                            setNotifications(updatedNotis);
                            setDoc(doc(db, "SiteData", "notifications"), { data: updatedNotis }); // Noti ကိုပါ ချက်ချင်း Database ပေါ် တင်မည်
                            // ------------------------------------------
                          }
                          showToast(t.msgUploaded); 
                          setNewVideo({episodes:[], title_en: '', title_mm: '', vipTelegramLink: '', pointsPerEp: 20});
                        }} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-lg shadow-lg hover:brightness-110 transition">
                          {editingShowId ? t.updateBtn : t.saveBtn}
                        </button>
                        {editingShowId && (
                          <button onClick={() => {setEditingShowId(null); setNewVideo({episodes:[], title_en: '', title_mm: '', vipTelegramLink: '', pointsPerEp: 20});}} className="px-6 bg-zinc-700 text-white font-bold py-3 rounded-lg shadow-lg hover:brightness-110 transition">
                            {t.cancelBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- NEW SEPARATED TAB: UPLOADED CONTENT --- */}
            {adminActiveTab === 'uploaded_content' && (
              <div className="animate-fade-in space-y-6 font-sans">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold text-white border-l-4 border-[#fcd385] pl-3">{lang === 'en' ? 'Uploaded Content' : 'တင်ထားသော ဇာတ်ကားများ'}</h3>
                   <button onClick={handleDownloadShowsBackup} className="flex items-center gap-1.5 text-xs bg-blue-900/40 border border-blue-700/50 hover:border-blue-400 text-blue-400 px-3 py-2 rounded-lg transition shadow-lg">
                       <Download className="w-4 h-4" /> Backup Movies (Excel)
                   </button>
                </div>
                
                <div className="bg-[#1f1f1f] p-5 rounded-2xl border border-zinc-800 shadow-xl">

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        type="text" placeholder="Search by Title..." value={adminUploadedSearch || ''}
                        onChange={e => {setAdminUploadedSearch(e.target.value); setShowsPage(1);}}
                        className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" 
                      />
                    </div>
                  </div>
                  
                  {/* Changed grid layout for 12 items (4 items per row on Desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedShows.length > 0 ? paginatedShows.map(s => (
                      <div key={s.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                         <div>
                            <div className="flex gap-3 items-start mb-2">
                              <img src={s.image} alt="Thumb" className="w-16 h-9 object-cover rounded shadow" />
                              <div>
                                <p className="font-bold text-white text-sm line-clamp-1">{s.title_en || s.title_mm}</p>
                                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 mt-1 inline-block">{s.category}</span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-500">{s.totalEpisodes} Episodes</p>
                         </div>
                         <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
                           <button onClick={() => {
                             setAdminActiveTab('upload');
                             setEditingShowId(s.id); setNewVideo(s); setEpCount(s.totalEpisodes); window.scrollTo({top:0, behavior: 'smooth'});
                           }} className="bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-900 transition flex items-center gap-1"><Edit className="w-3 h-3"/> Edit</button>
                           <button onClick={() => setConfirmModal({
                               message: t.confirmDelDesc,
                               onConfirm: () => { setShows(shows.filter(x => x.id !== s.id)); showToast(t.msgDeleted); }
                           })} className="bg-red-900/50 text-red-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-900 transition flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                         </div>
                      </div>
                    )) : (
                      <p className="text-zinc-500 text-xs py-2 col-span-full text-center">No uploaded shows found.</p>
                    )}
                  </div>
                  {/* Pagination UI */}
                  {adminUploadedShowsFiltered.length > 0 && renderPagination(showsPage, setShowsPage, showsPerPage, setShowsPerPage, adminUploadedShowsFiltered.length)}
                </div>
              </div>
            )}

          </main>
        </div>

      ) : activeTab === 'promo' ? (
        <main className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in pb-10">
          <h2 className="text-2xl font-bold text-[#fcd385] mb-6 flex items-center gap-2"><Gift className="w-6 h-6"/> {t.promotions}</h2>
          <div className="space-y-4">
            {promotions.map(p => (
              <div key={p.id} className="bg-gradient-to-r from-[#2b0303] to-[#1a1a1a] p-6 rounded-2xl border border-[#fcd385]/20 shadow-lg font-sans overflow-hidden">
                {p.image && <img src={p.image} alt="Promotion" className="w-full h-auto max-h-64 object-cover rounded-xl mb-4 border border-zinc-800" />}
                <h3 className="text-lg font-black text-white mb-2">{lang === 'en' ? (p.title_en || p.title_mm) : (p.title_mm || p.title_en)}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{lang === 'en' ? (p.body_en || p.body_mm) : (p.body_mm || p.body_en)}</p>
              </div>
            ))}
          </div>
        </main>
      ) : activeTab === 'faq' ? (
        <main className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in pb-10">
          <h2 className="text-2xl font-bold text-[#fcd385] mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6"/> {t.faq}</h2>
          <div className="space-y-4 font-sans">
            {faqs.map(f => (
              <div key={f.id} className="bg-[#1f1f1f] p-5 rounded-xl border border-zinc-800">
                <h3 className="text-base font-bold text-[#fcd385] mb-2">Q: {lang === 'en' ? (f.title_en || f.title_mm) : (f.title_mm || f.title_en)}</h3>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap">A: {lang === 'en' ? (f.body_en || f.body_mm) : (f.body_mm || f.body_en)}</p>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* HOME VIEW */
        <>
         
<div className="w-full px-4 mt-6 font-sans">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              
              {/* All ခလုတ် (Category လိုက် အတန်းခွဲပြရန်) */}
              <button onClick={() => setActiveCategory('All')}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  activeCategory === 'All' ? 'bg-[#3e1717] text-[#fcd385] border-[#fcd385]' : 'bg-[#1f1f1f] text-zinc-400 border-zinc-800 hover:text-white'
                }`}>
                {lang === 'en' ? 'All' : 'အားလုံး'}
              </button>

              {/* Latest Releases ခလုတ် (Grid ဖြင့် အကုန်ရောပြရန်) */}
              <button onClick={() => setActiveCategory('Latest Releases')}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  activeCategory === 'Latest Releases' ? 'bg-[#3e1717] text-[#fcd385] border-[#fcd385]' : 'bg-[#1f1f1f] text-zinc-400 border-zinc-800 hover:text-white'
                }`}>
                {t.latestReleases}
              </button>

              {/* ကျန်တဲ့ Category အခြားခလုတ်များ */}
              {categories.filter(c => c !== 'All').map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    activeCategory === cat ? 'bg-[#3e1717] text-[#fcd385] border-[#fcd385]' : 'bg-[#1f1f1f] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}>
                  {cat}
                </button>
              ))}
              
            </div>
          </div>

		<main className="w-full px-4 mt-6 pb-12 font-sans">
            {activeCategory === 'All' && !searchQuery ? (
              <div className="space-y-8">
                {categories.filter(c => c !== 'All').map(cat => {
                  const catShows = shows.filter(s => s.category === cat);
                  if (catShows.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:text-[#fcd385] transition" onClick={() => setActiveCategory(cat)}>
                          Top {cat} <ChevronRight className="w-5 h-5 text-[#fcd385]" />
                        </h2>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {catShows.map(item => (
                          <div key={item.id} onClick={() => setSelectedShow(item)} className="w-[240px] sm:w-[280px] flex-none bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#fcd385]/50 transition flex flex-col shadow-lg">
                            <div className="aspect-[16/9] relative overflow-hidden bg-black">
                              <img src={item.image} alt={item.title_en} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <div className="w-10 h-10 rounded-full bg-[#fcd385]/90 flex items-center justify-center shadow-xl"><Play className="w-4 h-4 text-[#3e1717] ml-0.5" /></div>
                              </div>
                              <div className="absolute top-2 left-2 bg-[#2b0303] border border-[#fcd385]/50 text-[#fcd385] text-[10px] font-bold px-2 py-0.5 rounded shadow">{item.totalEpisodes} EP</div>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <h3 className="text-sm font-bold text-white truncate">{lang === 'en' ? (item.title_en || item.title_mm) : (item.title_mm || item.title_en)}</h3>
                              <p className="text-[11px] text-zinc-400 mt-1">{item.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredShows.length > 0 ? filteredShows.map(item => (
                  <div key={item.id} onClick={() => setSelectedShow(item)} className="bg-[#1a1a1a] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#fcd385]/50 transition flex flex-col shadow-lg">
                    <div className="aspect-[16/9] relative overflow-hidden bg-black">
                      <img src={item.image} alt={item.title_en} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <div className="w-12 h-12 rounded-full bg-[#fcd385]/90 flex items-center justify-center shadow-xl"><Play className="w-5 h-5 text-[#3e1717] ml-1" /></div>
                      </div>
                      <div className="absolute top-2 left-2 bg-[#2b0303] border border-[#fcd385]/50 text-[#fcd385] text-[10px] font-bold px-2 py-0.5 rounded shadow">{item.totalEpisodes} EP</div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{lang === 'en' ? (item.title_en || item.title_mm) : (item.title_mm || item.title_en)}</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">{item.category}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-10 text-center text-zinc-500 text-sm">No shows found.</div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* --- FLOATING CONTACT BUTTON (FAB) --- */}
      <div className="fixed bottom-6 right-6 z-[150] font-sans flex flex-col items-end">
         {/* Popup Menu */}
         {contactFabOpen && (
            <div className="mb-4 bg-[#1a1a1a] border border-[#fcd385]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col w-56 animate-fade-in origin-bottom-right">
               <div className="bg-gradient-to-r from-[#2b0303] to-[#1a0101] p-4 border-b border-[#fcd385]/20 flex justify-between items-center">
                 <h4 className="text-[#fcd385] text-sm font-black tracking-wider">{t.contactUs}</h4>
                 <button onClick={() => setContactFabOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4"/></button>
               </div>
               <div className="p-2 space-y-1">
                 {siteConfig.socialLinks?.length === 0 ? <p className="text-xs text-zinc-500 p-2 text-center">No links available</p> : siteConfig.socialLinks?.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={() => setContactFabOpen(false)} className="flex items-center gap-3 p-3 bg-black/20 hover:bg-[#fcd385]/10 rounded-xl transition text-zinc-300 hover:text-[#fcd385] font-bold text-sm">
                      {link.logo ? <img src={link.logo} alt={link.platform} className="w-6 h-6 object-contain rounded-full bg-white/10 p-0.5" /> : getSocialIcon(link.platform)} 
                      {link.platform}
                    </a>
                 ))}
               </div>
            </div>
         )}
         {/* Main Button */}
         <button 
           onClick={() => setContactFabOpen(!contactFabOpen)}
           className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(252,211,133,0.4)] transition-all duration-300 ${contactFabOpen ? 'bg-zinc-800 text-white hover:bg-zinc-700 scale-90' : 'bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] hover:scale-110'}`}
         >
           {contactFabOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
         </button>
      </div>

      {/* --- ALL ROOT LEVEL MODALS --- */}

      {/* Video Player Modal (Fixed for Viewing Uploaded Video & VIP Implementation) */}
      {selectedShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
           <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
              
              {/* NEW: Copy Link Button & Close Button */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                 <button onClick={() => {
                    const directLink = `${window.location.origin}${window.location.pathname}?show=${selectedShow.id}`;
                    handleCopy(directLink);
                 }} className="text-white/50 hover:text-white bg-black/50 p-1.5 rounded-full transition" title="Copy Direct Link">
                    <Link2 className="w-5 h-5"/>
                 </button>
                 <button onClick={() => {
                    setSelectedShow(null);
                    // Box ပိတ်လိုက်လျှင် URL မှ ?show=... ကို ဖျက်ပေးမည်
                    window.history.replaceState({}, document.title, window.location.pathname);
                 }} className="text-white/50 hover:text-white bg-black/50 p-1.5 rounded-full transition"><X className="w-5 h-5"/></button>
              </div>

              <div className="h-48 sm:h-64 relative shrink-0">
                 <img src={selectedShow.image} alt="cover" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent"></div>
                 <div className="absolute bottom-4 left-4 right-4">
                   <h2 className="text-2xl font-black text-white drop-shadow-lg">{lang === 'en' ? (selectedShow.title_en || selectedShow.title_mm) : (selectedShow.title_mm || selectedShow.title_en)}</h2>
                   <p className="text-sm text-[#fcd385] font-bold">{selectedShow.category} • {selectedShow.totalEpisodes} {t.episodes}</p>
                 </div>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                 <p className="text-sm text-zinc-300 mb-6">{selectedShow.description}</p>
                 <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-[#fcd385] pl-3">{t.episodes}</h3>
                 
                 {/* RECREATED EXACT EPISODE GRID FROM SCREENSHOT */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {selectedShow.episodes.map((ep, idx) => {
                      const isReleased = ep.links && ep.links.length > 0;
                      const isVipUnlocked = currentUser?.unlockedShows?.includes(selectedShow.id);
                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <button onClick={() => {
                             // User အကောင့်မဝင်ထားရင် Login Box ကို အရင်ပြမည်
                             if (!currentUser) {
                                setAuthMode('login');
                                setAuthModalOpen(true);
                                return; // အောက်က Code တွေကို ဆက်မလုပ်အောင် တားထားမည်
                             }

                             if(isReleased) {
                                // NEW: Link ၁ ခုတည်းဆိုရင် တန်းသွားမည်၊ ၂ ခုနှင့်အထက်မှသာ ရွေးခိုင်းမည်
                                if (ep.links && ep.links.length === 1) {
                                   window.open(ep.links[0].url, '_blank');
                                } else {
                                   setPlatformSelectModal({ep, show: selectedShow});
                                }
                             } else {
                                if (isVipUnlocked) {
                                   if (selectedShow.vipTelegramLink) {
                                      handleGetTelegramLink(selectedShow.vipTelegramLink || '');
                                   } else {
                                      showToast("VIP Link not provided yet.");
                                   }
                                } else {
                                   setScheduleAlert({isOpen: true, date: ep.releaseDate, show: selectedShow});
                                }
                             }
                          }} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${isReleased ? 'bg-[#1a1a1a] border-[#fcd385]/20 hover:border-[#fcd385]/50 text-white' : 'bg-[#1a1a1a] border-zinc-800 text-zinc-300 hover:bg-black/80'}`}>
                             <span className="font-bold text-sm text-white mb-1">{ep.epLabel}</span>
                             
                             <div className={`text-xs px-3 py-1.5 rounded-md font-bold w-full text-center ${isReleased ? 'bg-[#3e0a0a] text-red-200' : isVipUnlocked ? 'bg-[#fcd385]/20 text-[#fcd385]' : 'bg-black/50 text-zinc-500'}`}>
                                {isReleased ? t.watchBtn : isVipUnlocked ? (lang === 'en' ? 'Watch VIP' : 'VIP ကြည့်ရန်') : t.waitBtn}
                             </div>
                          </button>
                          {!isReleased && ep.releaseDate && (
                             <span className="text-[10px] text-zinc-500 text-center mt-1">{ep.releaseDate}</span>
                          )}
                        </div>
                      )
                   })}
                 </div>

                 {/* VIP BANNER SECTION FROM SCREENSHOT */}
                 <div className="mt-8 pt-6 border-t border-zinc-800">
                    {selectedShow.totalEpisodes === 0 ? (
                       <div className="p-4 rounded-xl border border-zinc-800 bg-black/50 text-center shadow-inner">
                          <p className="text-[#fcd385] text-sm font-bold flex items-center justify-center gap-2">
                             <Clock className="w-5 h-5"/> {lang === 'en' ? 'Coming Soon...' : 'မကြာမီ လာမည်...'}
                          </p>
                       </div>
                    ) : currentUser?.unlockedShows?.includes(selectedShow.id) ? (
                       <div className="p-4 rounded-xl border border-[#fcd385]/50 bg-gradient-to-r from-[#3e1717] to-[#1a0101] flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <h4 className="text-[#fcd385] font-black flex items-center gap-2"><Sparkles className="w-5 h-5"/> {t.vipUnlockedTitle}</h4>
                            <p className="text-zinc-300 text-xs sm:text-sm mt-1">{t.vipUnlockedDesc}</p>
                          </div>
                          {selectedShow.vipTelegramLink && (
   <button 
     // ဒီနေရာလေးတွင် || '' ထည့်ပေးလိုက်ပါ 👇
     onClick={() => handleGetTelegramLink(selectedShow.vipTelegramLink || '')}
     disabled={isGeneratingTgLink}
     className="shrink-0 px-6 py-2 bg-[#fcd385] text-[#3e1717] font-black rounded-lg hover:bg-yellow-400 transition shadow-[0_0_15px_rgba(252,211,133,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
   >
      {isGeneratingTgLink ? (
        <>
          <span className="w-4 h-4 border-2 border-[#3e1717] border-t-transparent rounded-full animate-spin"></span> Loading...
        </>
      ) : (
        "Watch on Telegram"
      )}
   </button>
)}
                       </div>
                    ) : getRequiredPoints(selectedShow) > 0 ? (
                       <div className="p-4 rounded-xl border border-red-900/50 bg-gradient-to-r from-[#2b0303] to-[#1a0101] flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                             <h4 className="text-[#fcd385] font-black flex items-center gap-2"><Sparkles className="w-5 h-5"/> {t.vipTitle}</h4>
                             <p className="text-zinc-300 text-xs sm:text-sm mt-1">{t.vipDesc}</p>
                          </div>
                          <button onClick={() => setVipModalShow(selectedShow)} className="shrink-0 px-6 py-2.5 bg-[#fcd385] text-[#3e1717] font-black rounded-lg hover:bg-yellow-400 transition shadow-[0_0_15px_rgba(252,211,133,0.2)]">
                             {t.joinVip}
                          </button>
                       </div>
                    ) : (
                       <div className="p-4 rounded-xl border border-zinc-800 bg-black/50 text-center">
                          <p className="text-zinc-400 text-sm font-bold">{t.allEpsAvailable}</p>
                       </div>
                    )}
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* 3D User Detail Info Modal (Combined Table with Enhanced Filters) */}
      {userDetailModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
             
             {/* Header */}
             <div className="p-5 border-b border-[#fcd385]/20 flex justify-between items-center bg-black/40">
               <h2 className="text-xl font-black text-[#fcd385] flex items-center gap-2"><User className="w-5 h-5"/> User Detail: {userDetailModal.username}</h2>
               <div className="flex items-center gap-4">
                 {/* NEW: Edit User Button */}
                 <button onClick={() => {
                    setEditUserForm({...userDetailModal});
                    setEditUserRemark('');
                    setEditUserModal({isOpen: true, mode: 'edit', oldUsername: userDetailModal.username});
                    setUserDetailModal(null); // Detail Box ကို ခဏပိတ်ပြီး Edit Box ကို ဖွင့်ပေးမည်
                 }} className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-700/50 hover:border-blue-400 text-blue-400 px-3 py-1.5 rounded-lg transition shadow-lg text-sm font-bold">
                    <Edit className="w-4 h-4"/> Edit User
                 </button>
                 
                 <button onClick={() => setUserDetailModal(null)} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
               </div>
             </div>

             {/* Body - Scrollable */}
             <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
               
               {/* Basic Info Grid (Updated with Last Login) */}
               <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Email</p>
                    <p className="text-sm font-bold text-white truncate">{userDetailModal.email}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Password</p>
                    <p className="text-sm font-bold text-red-400 font-mono">{userDetailModal.password}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Registration Date</p>
                    <p className="text-xs font-bold text-white">{formatDateTime(userDetailModal.createdAt || '') || 'N/A'}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Last Login Date/Time</p>
                    <p className="text-xs font-bold text-emerald-400">{formatDateTime(userDetailModal.lastLoginAt || '') || 'N/A'}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-[#fcd385]/30">
                    <p className="text-xs text-[#fcd385] mb-1">Total Balance</p>
                    <p className="text-lg font-black text-[#fcd385]">{userDetailModal.points} PTS</p>
                  </div>
               </div>

               {/* Combined Table Section */}
               <div className="bg-[#1f1f1f] border border-[#fcd385]/20 rounded-xl flex flex-col flex-1 shadow-inner">
                  {/* Table Filters */}
                  <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/40 rounded-t-xl">
                     <h3 className="text-sm font-bold text-[#fcd385] flex items-center gap-2 w-full sm:w-auto"><ListVideo className="w-4 h-4"/> Transactions History</h3>
                     <div className="flex-1 w-full flex flex-wrap gap-2 justify-end items-center">
                       
                       {/* TYPE DROPDOWN FILTER */}
                       <div className="relative flex items-center bg-black border border-zinc-700 rounded-lg px-2">
                         <Filter className="w-4 h-4 text-zinc-400" />
                         <select value={userDetailTypeFilter} onChange={e => {setUserDetailTypeFilter(e.target.value); setUserDetailHistoryPage(1);}} className="bg-transparent pl-2 pr-4 py-2 text-xs text-white focus:outline-none cursor-pointer">
                            <option value="All">All Types</option>
                            <option value="Deposit">Deposit (Cash In)</option>
                            <option value="Buy VIP">Buy VIP</option>
                            <option value="Admin Adjustment">Admin Adjustment</option>
                         </select>
                       </div>

                       <div className="relative flex-1 min-w-[200px]">
                         <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                         <input type="text" placeholder="Search by Method, Txn ID, Remark..." value={userDetailSearch} onChange={e => {setUserDetailSearch(e.target.value); setUserDetailHistoryPage(1);}} className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                       </div>
                       <div className="flex items-center gap-2">
                         <input type="date" value={userDetailDateFrom} onChange={e => {setUserDetailDateFrom(e.target.value); setUserDetailHistoryPage(1);}} className="bg-black border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                         <span className="text-zinc-500 text-xs">To</span>
                         <input type="date" value={userDetailDateTo} onChange={e => {setUserDetailDateTo(e.target.value); setUserDetailHistoryPage(1);}} className="bg-black border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                       </div>
                     </div>
                  </div>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                       <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                          <tr>
                             <th className="px-4 py-3">Date/Time</th>
                             <th className="px-4 py-3">Type</th>
                             <th className="px-4 py-3">Method</th>
                             <th className="px-4 py-3">Txn ID</th>
                             <th className="px-4 py-3 text-right">Amount</th>
                             <th className="px-4 py-3 text-center">Status</th>
                             <th className="px-4 py-3">Remark</th>
                          </tr>
                       </thead>
                       <tbody>
                         {paginatedUserHistory.length === 0 ? (
                           <tr><td colSpan={7} className="text-center py-8 text-zinc-500">No records found.</td></tr>
                         ) : paginatedUserHistory.map((h, i) => (
                           <tr key={i} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                             <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(h.date)}</td>
                             
                             <td className="px-4 py-3 font-bold">
                               <span className={`px-2 py-0.5 rounded ${h.type === 'Deposit' ? 'bg-emerald-900/30 text-emerald-400' : h.type === 'Buy VIP' ? 'bg-[#3e1717] text-[#fcd385]' : 'bg-purple-900/30 text-purple-400'}`}>
                                  {h.type}
                               </span>
                             </td>
                             <td className="px-4 py-3 text-blue-400 font-bold">{h.paymentType}</td>

                             <td className="px-4 py-3 font-mono text-zinc-400">{h.txnId}</td>
                             <td className={`px-4 py-3 text-right font-bold ${h.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.amount > 0 ? '+' : ''}{h.amount}</td>
                             <td className="px-4 py-3 text-center">
                               <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${h.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400' : h.status === 'rejected' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>{h.status}</span>
                             </td>
                             <td className="px-4 py-3 min-w-[250px] whitespace-pre-wrap break-words leading-relaxed" title={h.remark || '-'}>{h.remark || '-'}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div className="p-4 border-t border-zinc-800">
                     {combinedHistory.length > 0 && renderPagination(userDetailHistoryPage, setUserDetailHistoryPage, userDetailHistoryPerPage, setUserDetailHistoryPerPage, combinedHistory.length)}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Point / Payment Modal (3D Gradient Style) */}
      {pointModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-lg p-0 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
             {/* Header */}
             <div className="bg-black/40 border-b border-[#fcd385]/20 p-4 flex justify-between items-center rounded-t-2xl">
               <div className="flex items-center gap-3">
                 {payStep !== 'menu' && (
                   <button onClick={() => setPayStep(payStep === 'form' ? 'providers' : 'menu')} className="p-1.5 bg-black/50 hover:bg-black rounded-lg text-[#fcd385] hover:text-white transition">
                     <ChevronLeft className="w-5 h-5"/>
                   </button>
                 )}
                 <h3 className="text-lg font-black text-[#fcd385] uppercase tracking-wider flex items-center gap-2">
                   <Coins className="w-5 h-5" /> 
                   {payStep === 'menu' ? 'Points Center' : payStep === 'providers' ? t.paySelectMethod : payStep === 'form' ? t.payMenuDeposit : t.payMenuHistory}
                 </h3>
               </div>
               <button onClick={() => {setPointModalOpen(false); setPayStep('menu');}} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
             </div>

             {/* Body */}
             <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
               
               {payStep === 'menu' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <button onClick={() => setPayStep('providers')} className="bg-gradient-to-br from-[#3e1717] to-[#1a0101] border border-[#fcd385]/30 p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#fcd385] hover:shadow-[0_0_15px_rgba(252,211,133,0.2)] transition group">
                      <div className="w-12 h-12 rounded-full bg-[#fcd385]/10 flex items-center justify-center group-hover:scale-110 transition border border-[#fcd385]/20">
                        <CreditCard className="w-6 h-6 text-[#fcd385]" />
                      </div>
                      <span className="font-bold text-white">{t.payMenuDeposit}</span>
                   </button>
                   <button onClick={() => setPayStep('history')} className="bg-black/50 border border-zinc-700 p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-zinc-500 transition group shadow-inner">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition border border-zinc-800">
                        <Clock className="w-6 h-6 text-zinc-300" />
                      </div>
                      <span className="font-bold text-white">{t.payMenuHistory}</span>
                   </button>
                 </div>
               )}

               {payStep === 'providers' && (
                 <div className="space-y-6">
                   {paymentProviders.banks.length > 0 && (
                     <div>
                       <p className="text-xs text-zinc-500 font-bold mb-3 uppercase tracking-wider">{t.payBank}</p>
                       <div className="grid grid-cols-2 gap-3">
                         {paymentProviders.banks.map(p => (
                           <button key={p.id} onClick={() => {setSelectedProvider(p); setPayStep('form');}} className="bg-black/50 border border-zinc-800 hover:border-[#fcd385]/50 p-4 rounded-xl flex flex-col items-center gap-2 transition">
                             {p.logo ? <img src={p.logo} alt={p.name} className="w-10 h-10 object-contain rounded-full bg-white p-1" /> : <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${p.color}`}>{p.name[0]}</div>}
                             <span className="text-xs font-bold text-white">{p.name}</span>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                   {paymentProviders.ewallets.length > 0 && (
                     <div>
                       <p className="text-xs text-zinc-500 font-bold mb-3 uppercase tracking-wider">{t.payEwallet}</p>
                       <div className="grid grid-cols-2 gap-3">
                         {paymentProviders.ewallets.map(p => (
                           <button key={p.id} onClick={() => {setSelectedProvider(p); setPayStep('form');}} className="bg-black/50 border border-zinc-800 hover:border-[#fcd385]/50 p-4 rounded-xl flex flex-col items-center gap-2 transition">
                             {p.logo ? <img src={p.logo} alt={p.name} className="w-10 h-10 object-contain rounded-full bg-white p-1" /> : <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${p.color}`}>{p.name[0]}</div>}
                             <span className="text-xs font-bold text-white">{p.name}</span>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {payStep === 'form' && selectedProvider && (
                 <div className="space-y-5">
                    {/* Warning Note */}
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-400 mb-1">{lang === 'en' ? siteConfig.paymentWarningEn : siteConfig.paymentWarningMm}</p>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl flex flex-col items-center text-center shadow-inner">
                      {selectedProvider.logo ? <img src={selectedProvider.logo} alt={selectedProvider.name} className="w-12 h-12 object-contain rounded-full bg-white p-1 mb-2" /> : <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${selectedProvider.color}`}>{selectedProvider.name[0]}</div>}
                      <h4 className="text-white font-bold mb-1">{selectedProvider.name}</h4>
                      
                      {selectedProvider.accountNo && (
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-700 mt-2">
                          <span className="text-sm text-zinc-300">{t.payAccountNo}:</span>
                          <span className="font-mono text-[#fcd385] font-bold">{selectedProvider.accountNo}</span>
                          <button onClick={() => handleCopy(selectedProvider.accountNo)} className="text-blue-400 hover:text-blue-300 ml-2"><Copy className="w-4 h-4"/></button>
                        </div>
                      )}

                      {selectedProvider.qrImage && (
                        <div className="mt-4 flex flex-col items-center">
                          <div className="bg-white p-2 rounded-xl border-4 border-[#fcd385]/30 shadow-lg">
                             <img src={selectedProvider.qrImage} alt="QR Code" className="w-40 h-40 object-cover rounded-lg" />
                          </div>
                          <button onClick={() => handleDownloadQR(selectedProvider.qrImage, selectedProvider.name)} className="mt-3 text-xs bg-zinc-800 hover:bg-[#fcd385] text-white hover:text-black px-4 py-2 rounded-lg transition flex items-center gap-2 font-bold">
                            <Download className="w-4 h-4"/> {t.downloadQR}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-black/40 p-4 rounded-xl border border-zinc-800 space-y-4">
                       <p className="text-xs text-zinc-400 font-bold whitespace-pre-wrap">{lang === 'en' ? siteConfig.depositGuideEn : siteConfig.depositGuideMm}</p>
                       <form onSubmit={handlePointSubmit} className="space-y-4 pt-2">
                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">{t.payTxnId} နံပါတ်အကုန်ရိုက်ထည့်ပေးပါ</label>
                            <input type="text" required placeholder="e.g. 123456789" value={idCodeInput} onChange={e => setIdCodeInput(e.target.value)} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-300 mb-1">Amount</label>
                            <input type="number" min="1" required placeholder="e.g. 1000" value={amountInput} onChange={e => setAmountInput(e.target.value)} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                          </div>
                          <button type="submit" className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">{t.paySubmitBtn}</button>
                       </form>
                    </div>
                 </div>
               )}

               {payStep === 'history' && (
                 <div className="space-y-3">
                   {pointRequests.filter(r => r.username === currentUser?.username).length === 0 ? (
                     <p className="text-zinc-500 text-sm text-center py-6">No transaction history.</p>
                   ) : pointRequests.filter(r => r.username === currentUser?.username).map(req => (
                     <div key={req.id} className="bg-black/40 border border-zinc-800 p-4 rounded-xl flex justify-between items-center gap-4 hover:border-zinc-700 transition">
                       <div>
                         <p className="text-xs text-zinc-400 mb-1">{req.provider}</p>
                         <p className="text-sm font-bold text-white mb-0.5">ID: <span className="font-mono text-[#fcd385]">{req.idCode}</span></p>
                         {req.requestedAmount && <p className="text-[11px] text-zinc-300 font-bold mb-1">Amount: {req.requestedAmount}</p>}
                         {req.remark && <p className="text-[10px] text-red-300 italic mb-1">Reason: {req.remark}</p>}
                         <p className="text-[10px] text-zinc-600">{formatDateTime(req.date)}</p>
                       </div>
                       <div className="shrink-0 text-right">
                         {req.status === 'pending' && <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-3 py-1.5 rounded-lg font-bold uppercase border border-yellow-700/50">{t.statusPending}</span>}
                         {req.status === 'approved' && <div className="flex flex-col items-end gap-1"><span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-3 py-1.5 rounded-lg font-bold uppercase border border-emerald-700/50">{t.statusSuccess}</span><span className="text-xs font-bold text-emerald-400">+{req.amount}</span></div>}
                         {req.status === 'rejected' && <span className="text-[10px] bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg font-bold uppercase border border-red-700/50">{t.statusRejected}</span>}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               
             </div>
          </div>
        </div>
      )}

      {/* 3D Edit/Create User Modal (Admin Panel) */}
      {editUserModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <h3 className="text-xl font-black text-white mb-6 text-center">{editUserModal.mode === 'create' ? t.createUserTitle : t.editUserTitle}</h3>
             <div className="space-y-4">
                {editUserModal.mode === 'edit' && (
                  <div>
                    <label className="block text-xs font-bold text-yellow-500 mb-1">{lang === 'en' ? 'Remark / Action Detail (Required)' : 'အက်ဒမင် မှတ်ချက် (User သို့ အသိပေးမည်) *မဖြစ်မနေထည့်ပါ'}</label>
                    <input type="text" placeholder="..." required value={editUserRemark} onChange={e => setEditUserRemark(e.target.value)} className="w-full bg-red-900/30 border border-yellow-500/50 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Username</label>
                  <input type="text" value={editUserForm.username} onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Email</label>
                  <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.password}</label>
                  <div className="relative w-full">
                     <input type={showAuthPassword ? "text" : "password"} value={editUserForm.password || ''} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                     <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                        {showAuthPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                     </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Current Points</label>
                    <input type="number" disabled value={editUserForm.points} className="w-full bg-black/30 border border-zinc-800 p-3 rounded-lg text-zinc-500 text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#fcd385] mb-1">Edit Points (+ / -)</label>
                    <input type="number" placeholder="e.g. 200 or -50" value={editUserForm.pointAdjustment ?? ''} onChange={e => setEditUserForm({...editUserForm, pointAdjustment: e.target.value})} className="w-full bg-black/50 border border-[#fcd385]/50 p-3 rounded-lg text-[#fcd385] font-bold text-sm focus:outline-none focus:border-[#fcd385] placeholder-[#fcd385]/30" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 mb-1">{t.role}</label>
                    <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value as 'admin'|'user'})} className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
             </div>
             <div className="flex gap-3 mt-6">
               <button onClick={() => {setEditUserModal({isOpen: false, mode: 'create'}); setShowAuthPassword(false); setEditUserRemark('');}} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={handleAdminSaveUser} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Save</button>
             </div>
          </div>
        </div>
      )}

      {/* Platform Select 3D Modal */}
      {platformSelectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center">
            <button onClick={() => setPlatformSelectModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 rounded-full bg-[#fcd385]/10 flex items-center justify-center mx-auto mb-4 border border-[#fcd385]/30 shadow-inner">
               <MonitorPlay className="w-8 h-8 text-[#fcd385]" />
            </div>
            <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: '"Georgia", serif' }}>{t.choosePlatform}</h3>
            <p className="text-sm text-zinc-400 mb-6">{platformSelectModal.ep.epLabel}</p>
            
            <div className="space-y-3">
               {platformSelectModal.ep.links.map((lnk, idx) => (
                  <button key={idx} onClick={() => {
                      window.open(lnk.url, '_blank');
                      setPlatformSelectModal(null);
                  }} className="w-full bg-black/50 border border-zinc-700 hover:border-[#fcd385] text-white font-bold py-3 rounded-xl shadow-inner hover:shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                     {lnk.platform === 'Facebook' ? <Globe className="w-5 h-5 text-blue-500" /> : lnk.platform === 'Telegram' ? <Send className="w-5 h-5 text-blue-400" /> : lnk.platform === 'Viber' ? <MessageCircle className="w-5 h-5 text-purple-500"/> : <Play className="w-5 h-5 text-[#fcd385]" />}
                     {t.watchOn} {lnk.platform}
                  </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Reusable 3D Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] transform transition-all scale-100">
             <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner">
               <Info className="w-6 h-6 text-[#fcd385]" />
             </div>
             <p className="text-center text-white font-bold mb-6 leading-relaxed">{alertModal.message}</p>
             <button onClick={() => {
                 if (alertModal.onAction) {
                     alertModal.onAction();
                 } else {
                     setAlertModal(null);
                 }
             }} className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-[0_0px_0_#a88621] active:translate-y-1 transition-all">
                {alertModal.actionText || 'OK'}
             </button>
          </div>
        </div>
      )}

      {/* Reusable 3D Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 shadow-inner">
                <HelpCircle className="w-6 h-6 text-[#fcd385]" />
             </div>
             <p className="text-center text-white font-bold mb-6">{confirmModal.message || t.confirmDelTitle}</p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmModal(null)} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-red-700 text-white font-black py-2.5 rounded-xl shadow-[0_4px_0_#7f1d1d] active:shadow-none active:translate-y-1 transition-all">Confirm</button>
             </div>
          </div>
        </div>
      )}

      {/* Reusable 3D Prompt Modal */}
      {promptModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <h3 className="text-lg font-bold text-white mb-4 text-center">{promptModal.title}</h3>
             <input 
               type="text" autoFocus placeholder={promptModal.placeholder} 
               value={promptInputValue} onChange={e => setPromptInputValue(e.target.value)} 
               className="w-full bg-black/50 border border-zinc-700 p-3 rounded-lg text-white mb-6 focus:outline-none focus:border-[#fcd385] shadow-inner"
             />
             <div className="flex gap-3">
               <button onClick={() => {setPromptModal(null); setPromptInputValue('');}} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
               <button onClick={() => { 
                 if(promptInputValue.trim() !== '') {
                   promptModal.onSubmit(promptInputValue); setPromptModal(null); setPromptInputValue('');
                 } else { setAlertModal({ message: "Input cannot be empty!" }); }
               }} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Submit</button>
             </div>
          </div>
        </div>
      )}

      {/* 3D Password Change Modal (With Eye Icon) */}
      {changePwdModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
             <button onClick={() => {setChangePwdModalOpen(false); setPwdForm({old:'', new:'', confirm:''}); setShowPwdOld(false); setShowPwdNew(false); setShowPwdConfirm(false);}} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
             <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 shadow-inner">
                <Key className="w-6 h-6 text-[#fcd385]" />
             </div>
             <h3 className="text-xl font-black text-white mb-6 text-center">{t.changePwd}</h3>
             
             <form onSubmit={handlePasswordUpdate} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.oldPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdOld ? "text" : "password"} required value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdOld(!showPwdOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdOld ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.newPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdNew ? "text" : "password"} required value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdNew(!showPwdNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">{t.confirmPwd}</label>
                  <div className="relative w-full">
                     <input type={showPwdConfirm ? "text" : "password"} required value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full bg-black/50 border border-zinc-700 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385] shadow-inner" />
                     <button type="button" onClick={() => setShowPwdConfirm(!showPwdConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">{showPwdConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
               </div>
               <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">Submit</button>
             </form>
          </div>
        </div>
      )}

      {/* Auth Modal (With Eye Icon and Remember Me) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#3e1717] via-[#2b0303] to-[#1a0101] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <button onClick={() => {setAuthModalOpen(false); setShowAuthPassword(false);}} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black text-[#fcd385] mb-6 text-center tracking-wide drop-shadow-md">
              {authMode === 'login' ? t.loginBtn : authMode === 'register' ? t.signUpBtn : t.getpwd}
            </h3>
            {authError && <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-xs p-2 rounded mb-4 text-center">{authError}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <input type="text" required placeholder={authMode === 'login' ? t.email : "Username"} value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
              {(authMode === 'register' || authMode === 'forgot') && (
                <input type="email" required placeholder="Email (Gmail)" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
              )}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="relative w-full">
                  <input type={showAuthPassword ? "text" : "password"} required placeholder={t.password} value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/40 border border-zinc-700/50 p-3 pr-10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fcd385]" />
                  <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                    {showAuthPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              )}
              
              {/* Remember Me Checkbox */}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#fcd385] rounded border-zinc-700" />
                  <label htmlFor="rememberMe" className="text-xs text-zinc-300 cursor-pointer select-none">{t.rememberMe}</label>
                </div>
              )}

              <button type="submit" className={`w-full font-black py-3 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all tracking-wide ${
                authMode === 'register' ? 'border border-[#fcd385] text-[#fcd385] bg-black/50' : 'bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717]'
              }`}>{authMode === 'login' ? t.loginBtn : authMode === 'register' ? t.signUpBtn : t.getpwd}</button>
            </form>
            <div className="mt-6 text-center text-xs space-y-2 text-white/80">
              {authMode === 'login' ? (
                <>
                  <p className="hover:text-white cursor-pointer" onClick={() => {setAuthError(''); setAuthMode('forgot'); setShowAuthPassword(false);}}>{t.forgotPwd}</p>
                  <p>{t.noAccount} <span className="text-[#fcd385] font-bold cursor-pointer underline" onClick={() => {setAuthError(''); setAuthMode('register'); setShowAuthPassword(false);}}>{t.signUpBtn}</span></p>
                </>
              ) : (
                <p>{t.backTo} <span className="text-[#fcd385] font-bold cursor-pointer underline" onClick={() => {setAuthError(''); setAuthMode('login'); setShowAuthPassword(false);}}>{t.loginBtn}</span></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Alert Modal */}
      {scheduleAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <button onClick={() => setScheduleAlert(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner">
               <Clock className="w-6 h-6 text-[#fcd385]" />
            </div>
            <div className="text-center mb-6 space-y-4">
               {scheduleAlert.show.vipTelegramLink ? (
                  <>
                     {/* VIP Link ရှိသော ကားများအတွက် (ယခင်အတိုင်း) */}
                     <p className="text-white font-bold leading-relaxed text-sm">{TRANSLATIONS.en.alertNotReleased} <span className="text-[#fcd385]">{scheduleAlert.date}</span>. {TRANSLATIONS.en.alertOrJoinVip}</p>
                     <p className="text-zinc-300 font-bold leading-relaxed text-sm border-t border-zinc-700 pt-4">{TRANSLATIONS.mm.alertNotReleased} <span className="text-[#fcd385]">{scheduleAlert.date}</span> {TRANSLATIONS.mm.alertOrJoinVip}</p>
                  </>
               ) : (
                  <>
                     {/* VIP Link မရှိသော Free ကားများအတွက် သီးသန့်စာသား */}
                     <p className="text-white font-bold leading-relaxed text-sm">Not released yet! Please wait for the update.</p>
                     <p className="text-zinc-300 font-bold leading-relaxed text-sm border-t border-zinc-700 pt-4">မကြာမီ တင်ပေးသွားမည်ဖြစ်ပါသဖြင့် {scheduleAlert.date && <><span className="text-[#fcd385]">{scheduleAlert.date}</span> အထိ</>} ခေတ္တစောင့်မျှော်ပေးပါ။</p>
                  </>
               )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setScheduleAlert(null)} className="flex-1 bg-zinc-800 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">OK</button>
              {/* VIP Link ရှိမှသာ VIP ဝင်မည် ခလုတ်ကို ပြပေးမည် */}
              {scheduleAlert.show.vipTelegramLink && (
                 <button onClick={() => {setScheduleAlert(null); setVipModalShow(scheduleAlert.show);}} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-2.5 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">{t.joinVip}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW VIP PAYMENT MODAL */}
      {vipModalShow && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm p-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <button onClick={() => setVipModalShow(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="w-16 h-16 rounded-full bg-[#fcd385]/10 flex items-center justify-center mx-auto mb-4 border border-[#fcd385]/30 shadow-inner">
               <Sparkles className="w-8 h-8 text-[#fcd385]" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 text-center">{t.unlockAll}</h3>
            <p className="text-sm text-zinc-400 mb-6 text-center">{t.unlockDesc}</p>
            
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 mb-6">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-sm">{t.required}</span>
                  <span className="text-[#fcd385] font-black">{getRequiredPoints(vipModalShow)} {t.pts}</span>
               </div>
               <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400 text-sm">{t.balance}</span>
                  <span className={`${(currentUser?.points || 0) >= getRequiredPoints(vipModalShow) ? 'text-emerald-400' : 'text-red-400'} font-black`}>
                     {currentUser?.points || 0} {t.pts}
                  </span>
               </div>
            </div>

            {currentUser ? (
              <div className="flex gap-3">
                <button onClick={() => setVipModalShow(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#3f3f46] active:shadow-none active:translate-y-1 transition-all">{t.cancelBtn}</button>
                <button onClick={() => {
                   const cost = getRequiredPoints(vipModalShow);
                   if (currentUser.points >= cost) {
                      
                      // NEW LOGIC: Record VIP Purchase in History
                      const newLog: UserHistoryLog = {
                         id: Date.now().toString(),
                         type: 'buy_vip',
                         title: vipModalShow.title_mm || vipModalShow.title_en || 'VIP Unlock',
                         amount: -cost,
                         date: new Date().toISOString()
                      };

                      const updatedUser = {
                         ...currentUser,
                         points: currentUser.points - cost,
                         unlockedShows: [...(currentUser.unlockedShows || []), vipModalShow.id],
                         pointHistory: [newLog, ...(currentUser.pointHistory || [])]
                      };
                      
                      setUsers(users.map(u => u.username === currentUser.username ? updatedUser : u));
                      setCurrentUser(updatedUser);
                      setVipModalShow(null);
                      showToast(t.msgVipSuccess);

                      // NEW LOGIC: VIP ဝင်ပြီးတာနဲ့ Telegram Private Channel ဆီ တန်းသွားမည်
                      if (vipModalShow.vipTelegramLink) {
                         handleGetTelegramLink(vipModalShow.vipTelegramLink);
                      } else {
                         showToast("VIP Link မထည့်ရသေးပါ။ Admin သို့ဆက်သွယ်ပါ။");
                      }
                   } else {
                      setVipModalShow(null); // VIP Box ကို ချက်ချင်းပိတ်မယ်
                      setAlertModal({ 
                        message: `${t.msgNotEnough}${cost} PTS`,
                        actionText: lang === 'en' ? 'Click to Buy Points' : 'Point ဝယ်ရန်နှိပ်ပါ',
                        onAction: () => {
                           setAlertModal(null);
                           setPayStep('providers');
                           setPointModalOpen(true);
                        }
                      });
                   }
                }} className="flex-1 bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2">
                   <Unlock className="w-4 h-4"/> {t.unlockBtn}
                </button>
              </div>
            ) : (
              <button onClick={() => {setVipModalShow(null); setAuthMode('login'); setAuthModalOpen(true);}} className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">
                 {t.loginBtn}
              </button>
            )}
          </div>
        </div>
      )}

	{/* --- NEW: USERS POINT BALANCES MODAL --- */}
      {showUserPointsModal && (() => {
         const userPointsLogs = users.filter(u => u.username.toLowerCase().includes((userPointsSearch || '').toLowerCase())).sort((a, b) => (b.points || 0) - (a.points || 0));
         const paginatedUserPoints = userPointsLogs.slice((userPointsPage - 1) * userPointsPerPage, userPointsPage * userPointsPerPage);
         return (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
             <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
                <div className="p-5 border-b border-[#fcd385]/20 flex justify-between items-center bg-black/40">
                  <h2 className="text-xl font-black text-[#fcd385] flex items-center gap-2"><Coins className="w-5 h-5"/> Users Point Balances</h2>
                  <button onClick={() => {setShowUserPointsModal(false); setUserPointsSearch('');}} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 border-b border-zinc-800 bg-black/20">
                  <div className="relative w-full max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" placeholder="Search by Username..." value={userPointsSearch} onChange={e => {setUserPointsSearch(e.target.value); setUserPointsPage(1);}} className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#fcd385]" />
                  </div>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                   <div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800 shadow-inner">
                      <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
                        <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                           <tr>
                              <th className="px-4 py-3">Username</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3 text-right">Points Balance</th>
                           </tr>
                        </thead>
                        <tbody>
                          {paginatedUserPoints.length === 0 ? (
                             <tr><td colSpan={3} className="text-center py-8 text-zinc-500 text-sm">No users found.</td></tr>
                          ) : paginatedUserPoints.map((u, idx) => (
                            <tr key={idx} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                              <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => {
                                  setShowUserPointsModal(false);
                                  setUserPointsSearch('');
                                  setUserDetailModal(u);
                              }}>{u.username}</td>
                              <td className="px-4 py-3 text-xs text-zinc-400">{u.email}</td>
                              <td className="px-4 py-3 text-right font-bold text-[#fcd385]">{u.points} PTS</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                   <div className="mt-4">
                      {userPointsLogs.length > 0 && renderPagination(userPointsPage, setUserPointsPage, userPointsPerPage, setUserPointsPerPage, userPointsLogs.length)}
                   </div>
                </div>
             </div>
           </div>
         );
      })()}

      {/* --- NEW: INACTIVE USERS MODAL --- */}
      {showInactiveUsersModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-red-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
             <div className="p-5 border-b border-red-900/50 flex justify-between items-center bg-black/40">
               <h2 className="text-xl font-black text-red-400 flex items-center gap-2"><Users className="w-5 h-5"/> Inactive Users (30+ Days)</h2>
               <button onClick={() => {setShowInactiveUsersModal(false); setInactiveUserSearch('');}} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
             </div>
             
             {/* Search Bar */}
             <div className="p-4 border-b border-zinc-800 bg-black/20">
               <div className="relative w-full max-w-md">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <input type="text" placeholder="Search by Username..." value={inactiveUserSearch} onChange={e => setInactiveUserSearch(e.target.value)} className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-red-500" />
               </div>
             </div>

             <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800 shadow-inner">
                   <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
                     <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                        <tr>
                           <th className="px-4 py-3">Username</th>
                           <th className="px-4 py-3">Email</th>
                           <th className="px-4 py-3 text-right">Points Remaining</th>
                           <th className="px-4 py-3 text-right">Last Login</th>
                        </tr>
                     </thead>
                     <tbody>
                       {users.filter(u => {
                          const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const isInactive = !(u.lastLoginAt && new Date(u.lastLoginAt) >= thirtyDaysAgo);
                          const matchSearch = u.username.toLowerCase().includes(inactiveUserSearch.toLowerCase());
                          return isInactive && matchSearch;
                       }).sort((a, b) => new Date(a.lastLoginAt || 0).getTime() - new Date(b.lastLoginAt || 0).getTime()).map(u => (
                         <tr key={u.username} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                           <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => {
                               setShowInactiveUsersModal(false);
                               setInactiveUserSearch('');
                               setUserDetailModal(u);
                           }}>{u.username}</td>
                           <td className="px-4 py-3 text-xs text-zinc-400">{u.email}</td>
                           <td className="px-4 py-3 text-right text-[#fcd385] font-bold">{u.points} PTS</td>
                           <td className="px-4 py-3 text-right text-red-400 text-xs">{formatDateTime(u.lastLoginAt || '') || 'Never'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- NEW: POINTS SPENT HISTORY MODAL --- */}
      {showPointsSpentModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-purple-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
             <div className="p-5 border-b border-purple-900/50 flex justify-between items-center bg-black/40">
               <h2 className="text-xl font-black text-purple-400 flex items-center gap-2"><ListVideo className="w-5 h-5"/> VIP Unlock History (Points Spent)</h2>
               <button onClick={() => {setShowPointsSpentModal(false); setPointsSpentSearch('');}} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
             </div>
             
             <div className="p-4 border-b border-zinc-800 bg-black/20">
               <div className="relative w-full max-w-md">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <input type="text" placeholder="Search by Username..." value={pointsSpentSearch} onChange={e => {setPointsSpentSearch(e.target.value); setPointsSpentPage(1);}} className="w-full bg-black border border-zinc-700 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500" />
               </div>
             </div>

             <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                <div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800 shadow-inner">
                   <table className="w-full text-left text-sm text-zinc-300 min-w-[700px]">
                     <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                        <tr>
                           <th className="px-4 py-3">Date / Time</th>
                           <th className="px-4 py-3">User</th>
                           <th className="px-4 py-3">Movie / Series (VIP)</th>
                           <th className="px-4 py-3 text-right">Points Spent</th>
                        </tr>
                     </thead>
                     <tbody>
                       {paginatedPointsSpentLogs.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-8 text-zinc-500 text-sm">No records found.</td></tr>
                       ) : paginatedPointsSpentLogs.map((log, idx) => (
                         <tr key={idx} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                           <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{formatDateTime(log.date)}</td>
                           <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => {
                               setShowPointsSpentModal(false);
                               setPointsSpentSearch('');
                               const user = users.find(u => u.username === log.username);
                               if(user) setUserDetailModal(user);
                           }}>{log.username}</td>
                           <td className="px-4 py-3 font-bold text-white">{log.title}</td>
                           <td className="px-4 py-3 text-right font-bold text-purple-400">-{log.amount} PTS</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                {/* Pagination For VIP History */}
                <div className="mt-4">
                   {pointsSpentLogs.length > 0 && renderPagination(pointsSpentPage, setPointsSpentPage, pointsSpentPerPage, setPointsSpentPerPage, pointsSpentLogs.length)}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- NEW: PAYMENT METHOD DETAIL MODAL --- */}
      {selectedMethodForDetail && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
            <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
               <div className="p-5 border-b border-blue-900/50 flex justify-between items-center bg-black/40">
                 <h2 className="text-xl font-black text-blue-400 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Transactions: {selectedMethodForDetail}</h2>
                 <button onClick={() => setSelectedMethodForDetail(null)} className="text-zinc-400 hover:text-white transition"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                  <div className="overflow-x-auto bg-black/20 rounded-xl border border-zinc-800 shadow-inner">
                     <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
                       <thead className="text-[10px] uppercase bg-black/60 text-zinc-400 border-b border-zinc-800">
                          <tr>
                             <th className="px-4 py-3">Date</th>
                             <th className="px-4 py-3">User</th>
                             <th className="px-4 py-3">Txn ID</th>
                             <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody>
                         {paginatedMethodDetailLogs.length === 0 ? (
                           <tr><td colSpan={4} className="text-center py-8 text-zinc-500 text-sm">No records found.</td></tr>
                         ) : paginatedMethodDetailLogs.map(req => (
                           <tr key={req.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition">
                             <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{formatDateTime(req.date)}</td>
                             <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline hover:text-blue-300" onClick={() => {
                                setSelectedMethodForDetail(null);
                                const user = users.find(u => u.username === req.username);
                                if (user) setUserDetailModal(user);
                             }}>{req.username}</td>
                             <td className="px-4 py-3 font-mono text-[#fcd385]">{req.idCode}</td>
                             <td className="px-4 py-3 text-right text-emerald-400 font-bold">+{req.amount}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                  {/* Pagination For Payment Detail */}
                  <div className="mt-4">
                     {methodDetailLogs.length > 0 && renderPagination(methodDetailPage, setMethodDetailPage, methodDetailPerPage, setMethodDetailPerPage, methodDetailLogs.length)}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- NEW: WELCOME PROMO MODAL --- */}
      {showWelcomePromo && promotions.length > 0 && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-gradient-to-b from-[#2b0303] to-[#161616] border border-[#fcd385]/30 rounded-2xl w-full max-w-sm relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
             <button onClick={() => setShowWelcomePromo(false)} className="absolute top-3 right-3 text-white/50 hover:text-white bg-black/50 p-1 rounded-full z-10"><X className="w-5 h-5"/></button>
             
             {(() => {
                const latestPromo = promotions[promotions.length - 1]; // နောက်ဆုံးတင်ထားသော Promotion ကိုယူမည်
                return (
                  <div className="flex flex-col">
                     {latestPromo.image ? (
                       <img src={latestPromo.image} alt="Promo" className="w-full h-48 object-cover border-b border-[#fcd385]/20" />
                     ) : (
                       <div className="w-full h-32 bg-[#3e1717] flex items-center justify-center border-b border-[#fcd385]/20">
                          <Gift className="w-12 h-12 text-[#fcd385]" />
                       </div>
                     )}
                     <div className="p-6 text-center">
                       <h3 className="text-xl font-black text-[#fcd385] mb-2">{lang === 'en' ? (latestPromo.title_en || latestPromo.title_mm) : (latestPromo.title_mm || latestPromo.title_en)}</h3>
                       <p className="text-sm text-zinc-300 mb-6 line-clamp-3 leading-relaxed">{lang === 'en' ? (latestPromo.body_en || latestPromo.body_mm) : (latestPromo.body_mm || latestPromo.body_en)}</p>
                       <button onClick={() => {
                          setShowWelcomePromo(false); // Box ကို ပိတ်မည်
                          setActiveTab('promo'); // Promo Menu ဆီကို ပြောင်းပေးမည်
                          setAdminDashboardOpen(false); // Admin Panel ပွင့်နေရင် ပိတ်ပေးမည်
                          window.scrollTo({top:0, behavior: 'smooth'}); // အပေါ်ဆုံးသို့ ပြန်ရွှေ့ပေးမည်
                       }} className="w-full bg-gradient-to-r from-[#fcd385] to-[#d4af37] text-[#3e1717] font-black py-3 rounded-xl shadow-[0_4px_0_#a88621] active:shadow-none active:translate-y-1 transition-all">
                          {lang === 'en' ? 'View Details' : 'အသေးစိတ် ကြည့်ရန်'}
                       </button>
                     </div>
                  </div>
                );
             })()}
          </div>
        </div>
      )}

    </div>
  );
}
