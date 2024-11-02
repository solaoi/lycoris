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

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [対応環境](#%E5%AF%BE%E5%BF%9C%E7%92%B0%E5%A2%83)
- [インストール](#%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
- [データ保存場所](#%E3%83%87%E3%83%BC%E3%82%BF%E4%BF%9D%E5%AD%98%E5%A0%B4%E6%89%80)
- [ユースケース](#%E3%83%A6%E3%83%BC%E3%82%B9%E3%82%B1%E3%83%BC%E3%82%B9)
  - [Zoomで議事録をとる](#zoom%E3%81%A7%E8%AD%B0%E4%BA%8B%E9%8C%B2%E3%82%92%E3%81%A8%E3%82%8B)
- [開発用設定](#%E9%96%8B%E7%99%BA%E7%94%A8%E8%A8%AD%E5%AE%9A)
  - [必要なモデルのダウンロード](#%E5%BF%85%E8%A6%81%E3%81%AA%E3%83%A2%E3%83%87%E3%83%AB%E3%81%AE%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89)
  - [voskのライブラリ更新](#vosk%E3%81%AE%E3%83%A9%E3%82%A4%E3%83%96%E3%83%A9%E3%83%AA%E6%9B%B4%E6%96%B0)
  - [開発者モードで起動](#%E9%96%8B%E7%99%BA%E8%80%85%E3%83%A2%E3%83%BC%E3%83%89%E3%81%A7%E8%B5%B7%E5%8B%95)
  - [開発者向けインストール](#%E9%96%8B%E7%99%BA%E8%80%85%E5%90%91%E3%81%91%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
- [Contributors](#contributors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 対応環境

- macOS 13 Ventura以降

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

## Contributors

<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/solaoi">
            <img src="https://avatars.githubusercontent.com/u/46414076?v=4" width="100;" alt="solaoi"/>
            <br />
            <sub><b>Solaoi</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/mohemohe">
            <img src="https://avatars.githubusercontent.com/u/5028163?v=4" width="100;" alt="mohemohe"/>
            <br />
            <sub><b>Mohemohe</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: contributors -end -->
