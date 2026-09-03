package com.apexisp.hotspot

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
            .setContentText("Broadcasting Wi-Fi Signal & Captive Portal Daemon...")
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
                        Log.d(TAG, "Native Hotspot Started successfully! SSID: ${currentConfig?.SSID}")
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
}
