#!/bin/bash
export PATH="/c/Program Files/Android/Android Studio/jbr/bin:$PATH:/c/Program Files/Go/bin:$HOME/go/bin"
export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/27.0.12077973"
export GOFLAGS="-overlay=$HOME/OneDrive/Desktop/Phoenix/android/pan-vpn/overlay.json"
cd $HOME/OneDrive/Desktop/Phoenix/android/pan-vpn
gomobile bind -v -target=android/arm64 -androidapi 26 -ldflags="-checklinkname=0" -o ../app/libs/panvpn.aar .
