import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  Cpu,
  Zap,
  Code,
  FolderGit2,
  FileCode,
  Info,
  HelpCircle,
  Play,
  Share2,
  Radio,
  Wifi,
  Package,
  FileArchive
} from 'lucide-react';

export const ApkBuilderTab: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'github_actions' | 'capacitor_studio' | 'pwa_instant'>('github_actions');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Capacitor config content
  const capacitorConfigCode = `{
  "appId": "com.apexisp.hotspot",
  "appName": "Apex Hotspot Manager",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "cleartext": true,
    "androidScheme": "http"
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}`;

  // AndroidManifest.xml content
  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.apexisp.hotspot">

    <!-- Wi-Fi & Hotspot Hardware Broadcast Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    
    <!-- Location & Nearby Devices for Wi-Fi Scanning (Required by Android 10-14+) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" 
                     android:usesPermissionFlags="neverForLocation" />

    <!-- Foreground Service to keep Hotspot Signal alive while screen is locked -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Apex Hotspot Manager"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="Apex Hotspot Manager"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Background Service for Local-Only Wi-Fi Hotspot & Captive Routing -->
        <service
            android:name=".HotspotBroadcastService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="connectedDevice" />

    </application>
</manifest>`;

  // Kotlin Native Hotspot Service content
  const kotlinServiceCode = `package com.apexisp.hotspot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat

class HotspotBroadcastService : Service() {

    private var reservation: WifiManager.LocalOnlyHotspotReservation? = null
    private val TAG = "ApexHotspotService"
    private val CHANNEL_ID = "ApexHotspotChannel"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Apex Hotspot Signal Active")
            .setContentText("Broadcasting Hardware Wi-Fi Signal...")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        startForeground(101, notification)
        startNativeHotspot()
        return START_STICKY
    }

    private fun startNativeHotspot() {
        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                wifiManager.startLocalOnlyHotspot(object : WifiManager.LocalOnlyHotspotCallback() {
                    override fun onStarted(res: WifiManager.LocalOnlyHotspotReservation) {
                        super.onStarted(res)
                        reservation = res
                        val currentConfig = res.wifiConfiguration
                        Log.d(TAG, "Native Hotspot Started successfully! SSID: \${currentConfig?.SSID}")
                    }

                    override fun onStopped() {
                        super.onStopped()
                        Log.d(TAG, "Native Hotspot Stopped.")
                    }

                    override fun onFailed(reason: Int) {
                        super.onFailed(reason)
                        Log.e(TAG, "Native Hotspot Failed with reason: $reason")
                    }
                }, Handler(Looper.getMainLooper()))
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException: Location or NearByDevices permission required", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        reservation?.close()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Apex Hotspot Broadcast Service",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}`;

  // GitHub Actions Workflow content
  const githubActionsCode = `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Install Dependencies & Build
        run: |
          npm install
          npm run build

      - name: Setup Capacitor & Android Project
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap add android || true
          npx cap copy android

      - name: Build Debug APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ApexISP-Hotspot-Manager.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk`;

  return (
    <div className="space-y-6">
      {/* HIGHLIGHTED DIRECT 1-CLICK COMPLETE PROJECT ZIP DOWNLOAD BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg">
              <Package className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold uppercase">
                <FileArchive className="w-3 h-3" />
                এক ক্লিকে সম্পূর্ণ প্রজেক্ট ডাউনলোড (Full Source + APK Builder)
              </div>
              <h3 className="text-white font-extrabold text-base sm:text-lg">
                📦 সম্পূর্ণ প্রজেক্টের একক ZIP ফাইল ডাউনলোড করুন
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                AI Studio স্ক্রিনে খুঁজছেন কিন্তু পাচ্ছেন না? কোনো সমস্যা নেই! নিচের বাটনে চাপ দিন — আপনার জন্য সব সোর্স কোড, অ্যান্ড্রয়েড সেটিংস এবং GitHub Actions APK বিল্ডার স্ক্রিপ্টসহ সম্পূর্ণ প্রজেক্ট এখনই ডাউনলোড হয়ে যাবে।
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              id="apk-tab-direct-zip-btn"
              href="/ApexISP-Hotspot-Project.zip"
              download="ApexISP-Hotspot-Project.zip"
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-900/40 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>সম্পূর্ণ ZIP ডাউনলোড করুন</span>
              <span className="text-[10px] bg-slate-950/30 text-slate-950 px-2 py-0.5 rounded-full font-mono font-bold">~185 KB</span>
            </a>
          </div>
        </div>

        {/* 3 Quick Next Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
            <span>উপরের বাটনে চাপ দিয়ে <strong>ZIP ফাইলটি নামিয়ে নিন</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
            <span><strong>github.com</strong> এ নতুন রিপোজিটোরিতে এটি আপলোড করুন</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
            <span><strong>Actions</strong> ট্যাবে গিয়ে Run করলেই তৈরি হবে <strong>APK</strong></span>
          </div>
        </div>
      </div>

      {/* EXPLANATION BANNER: WHY APK IS REQUIRED FOR REAL RADIO BROADCASTING */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/70 border-2 border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-lg">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold uppercase">
              <Zap className="w-3 h-3 text-yellow-300" />
              কেন ব্রাউজারে সিগন্যাল অন্যান্য ফোনে একা একা দৃশ্যমান হয় না এবং APK কেন প্রয়োজন?
            </div>
            <h3 className="text-white font-extrabold text-base sm:text-lg">
              ওয়েব ব্রাউজার বনাম অ্যান্ড্রয়েড নেটিভ ওয়াইফাই হার্ডওয়্যার আর্কিটেকচার
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              গুগল ক্রোম বা যেকোনো ওয়েব ব্রাউজারের <strong className="text-white">Security Sandbox</strong> পলিসির কারণে কোনো ওয়েবপেজ সরাসরি ফোনের ফিজিক্যাল ওয়াইফাই রেডিও অ্যান্টেনা বা রেডিও ফ্রিকোয়েন্সি ড্রাইভ করতে পারে না। কিন্তু এটিকে <strong className="text-cyan-300">অ্যান্ড্রয়েড APK</strong> বানালে সেটি অপারেটিং সিস্টেমের <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs">WifiManager.startLocalOnlyHotspot()</code> এবং <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-xs">TetheringManager</code>-এর পূর্ণ অনুমোদন পায় — যার ফলে অ্যাপ চালু করলেই ফিজিক্যাল ওয়াইফাই অ্যান্টেনা থেকে আশেপাশের সব ফোনে হটস্পটের নাম ভেসে ওঠে!
            </p>
          </div>
        </div>

        {/* Feature comparison pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">১. হার্ডওয়্যার অ্যাক্সেস</span>
            <strong className="text-emerald-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              WifiManager Antenna Direct Access
            </strong>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">২. ব্যাকগ্রাউন্ড ব্রডকাস্ট</span>
            <strong className="text-cyan-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Foreground Service (স্ক্রিন অফেও চলে)
            </strong>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">৩. ক্যাপটিভ পোর্টাল রিডাইরেক্ট</span>
            <strong className="text-indigo-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Built-in HTTP &amp; DNS Redirect
            </strong>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">৪. মোবাইল অটো টেথারিং</span>
            <strong className="text-amber-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              1-Click System Hotspot Intent
            </strong>
          </div>
        </div>
      </div>

      {/* 3 BUILD METHODS SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              মোবাইল APK তৈরি করার ৩টি বাস্তবসম্মত পদ্ধতি
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              আপনার সুবিধা অনুযায়ী যেকোনো একটি পদ্ধতি বেছে নিয়ে মোবাইল অ্যাপ (.apk) তৈরি করে নিন:
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMethod('github_actions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedMethod === 'github_actions'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>পদ্ধতি ১: ফ্রি ক্লাউড বিল্ড (পিসি লাগবে না)</span>
            </button>

            <button
              onClick={() => setSelectedMethod('capacitor_studio')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedMethod === 'capacitor_studio'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>পদ্ধতি ২: Capacitor + Android Studio</span>
            </button>

            <button
              onClick={() => setSelectedMethod('pwa_instant')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedMethod === 'pwa_instant'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>পদ্ধতি ৩: ফোনে ইনস্ট্যান্ট PWA ইনস্টল</span>
            </button>
          </div>
        </div>

        {/* ================= METHOD 1: GITHUB ACTIONS CLOUD BUILD ================= */}
        {selectedMethod === 'github_actions' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                    ১
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    GitHub Actions ক্লাউড দিয়ে ১-ক্লিকে ফ্রি APK তৈরি (কোনো পিসি বা সফটওয়্যার ইন্সটল ছাড়া)
                  </h4>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  100% AUTOMATED
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                এই প্রজেক্টের কোড আপনার GitHub রিপোজিটরিতে রাখলে গিটহাবের সার্ভার স্বয়ংক্রিয়ভাবে ২ মিনিটের মধ্যে আসল <code className="text-cyan-400 font-mono">.apk</code> ফাইল বিল্ড করে ডাউনলোড লিংক দিয়ে দেবে।
              </p>

              {/* Step by step */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">A</span>
                  <div>
                    <strong className="text-slate-200 block">গিটহাব ওয়ার্কফ্লো ফাইল সংরক্ষণ:</strong>
                    <span className="text-slate-400">
                      আমরা ইতিমধ্যেই <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> ফাইলটি প্রজেক্টে যুক্ত করে দিয়েছি।
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">B</span>
                  <div>
                    <strong className="text-slate-200 block">GitHub-এ Push করুন বা Actions ট্যাবে যান:</strong>
                    <span className="text-slate-400">
                      আপনার রিপোজিটরির <strong>Actions</strong> ট্যাবে যান এবং <strong>Build Android APK</strong> ওয়ার্কফ্লো-তে <code className="text-emerald-400">Run workflow</code> বাটনে ক্লিক করুন।
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">C</span>
                  <div>
                    <strong className="text-slate-200 block">APK ডাউনলোড ও মোবাইলে ইনস্টল:</strong>
                    <span className="text-slate-400">
                      বিল্ড সম্পন্ন হলে Artifacts সেকশনে <code className="text-cyan-300 font-bold">ApexISP-Hotspot-Manager.apk</code> ফাইলটির ডাউনলোড লিংক দেখতে পাবেন। ফাইলে ক্লিক করলেই ফোনে ইনস্টল হয়ে যাবে!
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadTextFile('build-apk.yml', githubActionsCode)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>build-apk.yml ডাউনলোড করুন</span>
                </button>

                <button
                  onClick={() => copyToClipboard(githubActionsCode, 'github-yaml')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition active:scale-95 flex items-center gap-1.5"
                >
                  {copiedFile === 'github-yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'github-yaml' ? 'কপি হয়েছে' : 'YAML কোড কপি'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= METHOD 2: CAPACITOR + ANDROID STUDIO ================= */}
        {selectedMethod === 'capacitor_studio' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                    ২
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    Capacitor ও Android Studio দিয়ে প্রফেশনাল Native APK তৈরি (PC / Laptop দিয়ে)
                  </h4>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  NATIVE CAPACITOR
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার ল্যাপটপ বা পিসিতে টার্মিনালে নিচের ৫টি সহজ কমান্ড চালালেই অফিসিয়াল অ্যান্ড্রয়েড স্টুডিও প্রজেক্ট তৈরি হবে:
              </p>

              {/* Terminal Code Steps */}
              <div className="space-y-3 font-mono text-xs">
                {/* Step 1 */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                    <strong>ধাপ ১: Capacitor প্যাকেজ ইনস্টল</strong>
                    <button
                      onClick={() => copyToClipboard('npm install @capacitor/core @capacitor/cli @capacitor/android', 'step1')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedFile === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      কপি
                    </button>
                  </div>
                  <pre className="text-cyan-300 select-all overflow-x-auto">npm install @capacitor/core @capacitor/cli @capacitor/android</pre>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                    <strong>ধাপ ২: ওয়েব প্রজেক্টটি বিল্ড করুন</strong>
                    <button
                      onClick={() => copyToClipboard('npm run build', 'step2')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedFile === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      কপি
                    </button>
                  </div>
                  <pre className="text-cyan-300 select-all overflow-x-auto">npm run build</pre>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                    <strong>ধাপ ৩: অ্যান্ড্রয়েড প্ল্যাটফর্ম যোগ ও সিঙ্ক</strong>
                    <button
                      onClick={() => copyToClipboard('npx cap add android && npx cap sync', 'step3')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedFile === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      কপি
                    </button>
                  </div>
                  <pre className="text-cyan-300 select-all overflow-x-auto">npx cap add android && npx cap sync</pre>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                    <strong>ধাপ ৪: Android Studio-তে প্রজেক্টটি খুলুন</strong>
                    <button
                      onClick={() => copyToClipboard('npx cap open android', 'step4')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedFile === 'step4' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      কপি
                    </button>
                  </div>
                  <pre className="text-cyan-300 select-all overflow-x-auto">npx cap open android</pre>
                </div>

                {/* Step 5 */}
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 space-y-1 font-sans">
                  <strong className="text-emerald-300 text-xs block font-bold">
                    ধাপ ৫: APK তৈরি করুন (Build APK)
                  </strong>
                  <p className="text-[11px] text-slate-300">
                    Android Studio চালু হলে উপরের মেনুবার থেকে <strong>Build</strong> ➜ <strong>Build Bundle(s) / APK(s)</strong> ➜ <strong>Build APK(s)</strong>-এ ক্লিক করুন। তৈরি হওয়া <code className="text-emerald-400 font-mono">app-debug.apk</code> ফাইলে ক্লিক করে ফোনে সরাসরি ইনস্টল করে নিন।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= METHOD 3: INSTANT PWA INSTALL ================= */}
        {selectedMethod === 'pwa_instant' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                    ৩
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    কোনো বিল্ড বা কোডিং ছাড়া ফোন দিয়েই সরাসরি "PWA Web App" ইনস্টল
                  </h4>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  INSTANT / ZERO BUILD
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার অ্যান্ড্রয়েড বা আইফোনে গুগল ক্রোম (Google Chrome) ব্রাউজারের মাধ্যমে সরাসরি এই সফটওয়্যারটিকে একটি ফুল-স্ক্রিন হোমস্ক্রিন অ্যাপ হিসেবে ইনস্টল করে চালাতে পারেন:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-cyan-300 block">১. ক্রোমে লিংকটি খুলুন</strong>
                  <p className="text-slate-400 text-[11px]">
                    আপনার মোবাইলের Chrome ব্রাউজারে এই অ্যাপের লাইভ লিংকটি ওপেন করুন।
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-cyan-300 block">২. মেনু অপশনে ট্যাপ করুন</strong>
                  <p className="text-slate-400 text-[11px]">
                    ক্রোমের উপরে ডানপাশের তিনটি ডট (⋮) মেনুতে চাপ দিন।
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-emerald-400 block">৩. "Install app" নির্বাচন করুন</strong>
                  <p className="text-slate-400 text-[11px]">
                    <strong>"Add to Home screen"</strong> অথবা <strong>"Install app"</strong> বাটনে চাপলেই সরাসরি ফোনে অ্যাপ আইকন যুক্ত হবে!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DOWNLOADABLE NATIVE FILES SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              রেডিমেড নেটিভ সোর্স কোড ও কনফিগারেশন ফাইলসমূহ
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              অ্যান্ড্রয়েড নেটিভ হটস্পট ও ক্যাপটিভ পোর্টাল পারমিশন সংবলিত ফাইলগুলো এখান থেকে সরাসরি ডাউনলোড বা কপি করতে পারেন:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* File 1: capacitor.config.json */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <FileCode className="w-4 h-4" />
                <span>capacitor.config.json</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Capacitor অ্যাপ বিল্ড ও প্যাকেজ আইডি কনফিগারেশন।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => downloadTextFile('capacitor.config.json', capacitorConfigCode)}
                className="flex-1 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                ডাউনলোড
              </button>
              <button
                onClick={() => copyToClipboard(capacitorConfigCode, 'cap-cfg')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                {copiedFile === 'cap-cfg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* File 2: AndroidManifest.xml */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>AndroidManifest.xml</span>
              </div>
              <p className="text-[11px] text-slate-400">
                হার্ডওয়্যার ওয়াইফাই ও ব্যাকগ্রাউন্ড হটস্পট পারমিশন।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => downloadTextFile('AndroidManifest.xml', manifestCode)}
                className="flex-1 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                ডাউনলোড
              </button>
              <button
                onClick={() => copyToClipboard(manifestCode, 'manifest')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                {copiedFile === 'manifest' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* File 3: HotspotBroadcastService.kt */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
                <Cpu className="w-4 h-4" />
                <span>HotspotService.kt</span>
              </div>
              <p className="text-[11px] text-slate-400">
                WifiManager ফিজিক্যাল ওয়াইফাই ব্রডকাস্ট সার্ভিস।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => downloadTextFile('HotspotBroadcastService.kt', kotlinServiceCode)}
                className="flex-1 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                ডাউনলোড
              </button>
              <button
                onClick={() => copyToClipboard(kotlinServiceCode, 'kotlin')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                {copiedFile === 'kotlin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* File 4: build-apk.yml */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <FolderGit2 className="w-4 h-4" />
                <span>build-apk.yml</span>
              </div>
              <p className="text-[11px] text-slate-400">
                GitHub Actions অটোমেটেড ক্লাউড APK কম্পাইলার।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => downloadTextFile('build-apk.yml', githubActionsCode)}
                className="flex-1 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                ডাউনলোড
              </button>
              <button
                onClick={() => copyToClipboard(githubActionsCode, 'actions')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                {copiedFile === 'actions' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
