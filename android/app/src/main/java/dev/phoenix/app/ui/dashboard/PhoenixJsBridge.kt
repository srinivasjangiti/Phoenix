package dev.phoenix.app.ui.dashboard

import android.webkit.JavascriptInterface

/**
 * JavaScript interface exposed as window.Phoenix (and fallback window.Phoenix) in the WebView.
 * Top-level class required — anonymous/local objects don't reliably expose
 * @JavascriptInterface methods via reflection on all Android versions.
 *
 * Methods called from JS run on a background thread; onOpenCamera posts to main thread.
 */
class PhoenixJsBridge(
    private val onOpenCamera: () -> Unit
) {
    @JavascriptInterface
    fun openCamera() {
        // @JavascriptInterface methods run on a background thread — caller must post to main
        onOpenCamera()
    }
}

typealias PANJsBridge = PhoenixJsBridge
