# Lycoris

[![license](https://img.shields.io/github/license/solaoi/lycoris)](https://github.com/solaoi/lycoris/blob/main/LICENSE)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/solaoi/lycoris)](https://github.com/solaoi/lycoris/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/solaoi?color=db61a2)](https://github.com/sponsors/solaoi)
[![PIXIV FANBOX](https://img.shields.io/badge/%E5%AF%84%E4%BB%98-PIXIV%20FANBOX-ff69b4)](https://solaoi.fanbox.cc/)
![MacOs](https://shields.io/badge/MacOS--9cf?logo=Apple&style=social)

外部データ通信無しで、リアルタイム音声認識で文字起こしを行う音声ノートアプリケーションです。

<div align="center">
  <a href="https://github.com/solaoi/lycoris">
    <img width="600" alt="lycoris" src="https://user-images.githubusercontent.com/46414076/227781834-2eeaea6f-fae6-4607-8862-4ca74a4416b9.png">
  </a>
</div>

## 対応環境

- MacOS

## インストール

[Releases](https://github.com/solaoi/lycoris/releases)から最新のものをインストールしてください。

## データ保存場所

> $HOME/Library/Application\ Support/blog.aota.Lycoris

## ユースケース

### Zoomで議事録をとる

## 開発用設定

### 必要なモデルのダウンロード

```
# vosk
VOSK_MODEL_VERSION=0.22
curl -LO https://alphacephei.com/vosk/models/vosk-model-ja-$VOSK_MODEL_VERSION.zip
mkdir ./src-tauri/resources
mv vosk-model-ja-$VOSK_MODEL_VERSION.zip ./src-tauri/resources
unzip ./src-tauri/resources/vosk-model-ja-$VOSK_MODEL_VERSION.zip -d ./src-tauri/resources
rm ./src-tauri/resources/vosk-model-ja-$VOSK_MODEL_VERSION.zip

# whisper
curl -LO https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v1.bin
mv ggml-large-v1.bin ./src-tauri/resources/ggml-large.bin
```

### voskのライブラリ更新

```
VOSK_VERSION=0.3.42
curl -LO https://github.com/alphacep/vosk-api/releases/download/v$VOSK_VERSION/vosk-osx-$VOSK_VERSION.zip
mv vosk-osx-$VOSK_VERSION.zip ./src-tauri/lib
unzip ./src-tauri/lib/vosk-osx-$VOSK_VERSION.zip -d ./src-tauri/lib
rm ./src-tauri/lib/vosk-osx-$VOSK_VERSION.zip
// ライブラリ自身のPathを確認
otool -D ./src-tauri/lib/libvosk.dylib
// ライブラリ自身のPathを変更
install_name_tool -id @rpath/libvosk.dylib ./src-tauri/lib/libvosk.dylib
// 署名を確認
codesign -dvvv ./src-tauri/lib/libvosk.dylib
// 公証用に署名を追加
codesign -fs 'キーチェーンアクセスの該当鍵（Developer ID Application: ...）' ./src-tauri/lib/libvosk.dylib
```

### 開発者モードで起動

```
yarn tauri dev
```

### 開発者向けインストール

```
yarn tauri build
```
