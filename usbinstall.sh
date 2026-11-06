#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$ROOT_DIR/.env.usbinstall.local"

fail() {
  printf 'エラー: %s\n' "$1" >&2
  exit 1
}

if [[ ! -f "$CONFIG_FILE" ]]; then
  fail '.env.usbinstall.local がありません。cp .env.usbinstall.example .env.usbinstall.local で作成し、ADB_PATH と ANDROID_SERIAL を設定してください。'
fi

# ローカルの信頼できる Bash 設定ファイルを読み込む。
source "$CONFIG_FILE"

[[ -n "${ADB_PATH:-}" ]] || fail '.env.usbinstall.local に ADB_PATH を設定してください。'
[[ -n "${ANDROID_SERIAL:-}" ]] || fail '.env.usbinstall.local に ANDROID_SERIAL を設定してください。'
[[ -f "$ADB_PATH" && -x "$ADB_PATH" ]] || fail "adb が見つからないか実行できません。ADB_PATH を確認してください: $ADB_PATH"
[[ -x "$ROOT_DIR/android/gradlew" ]] || fail 'android/gradlew がありません。Android のネイティブプロジェクトを生成し、実行権限を確認してください。'

cd "$ROOT_DIR/android"
./gradlew assembleRelease

APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
[[ -f "$APK_PATH" ]] || fail "release APK がありません: $APK_PATH"
"$ADB_PATH" -s "$ANDROID_SERIAL" install -r "$APK_PATH"
