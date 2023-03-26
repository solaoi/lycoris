# Lycoris

[![license](https://img.shields.io/github/license/solaoi/lycoris)](https://github.com/solaoi/lycoris/blob/main/LICENSE)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/solaoi/lycoris)](https://github.com/solaoi/lycoris/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/solaoi?color=db61a2)](https://github.com/sponsors/solaoi)

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

#### 仮想オーディオデバイスと、仮想ミキサーのインストール

1. [BlackHole](https://existential.audio/blackhole/)のインストール   
メール登録が必要ですが、無料で利用できます。

2. [LadioCast](https://apps.apple.com/jp/app/ladiocast/id411213048)のインストール

#### 設定

1. LadioCastで、下記画像のように設定   
外部マイク及び外部ヘッドフォンは、イヤホンを利用している場合の設定です。   
利用していない場合は、MacBook Pro（お使いのPCの種類）のマイク及びMacBook Proのスピーカーを指定ください。   
<img width="625" alt="スクリーンショット 2022-09-18 0 24 28" src="https://user-images.githubusercontent.com/46414076/190865290-9593f28b-5c83-4b5f-b605-ff95b598bbb7.png">

2. Zoomで、下記画像のように入出力をBlackHoleへと変更   
<img width="801" alt="スクリーンショット 2022-09-18 0 15 38" src="https://user-images.githubusercontent.com/46414076/190865345-82dcbdb0-b800-4b79-9f89-8567075913b6.png">

3. 本アプリ『Lycoris』のマイクを、BlackHoleへと変更

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
curl -LO https://huggingface.co/datasets/ggerganov/whisper.cpp/resolve/main/ggml-large.bin
mv ggml-large.bin ./src-tauri/resources
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

### Self Hosted Runnerの利用

GitHub ActionsのRunnerにApple Siliconが追加されるまで   
Self Hosted Runnerを利用する。

```
# Self Hosted Runnerの初期設定
 mkdir actions-runner && cd actions-runner
curl -o actions-runner-osx-arm64-2.302.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.302.1/actions-runner-osx-arm64-2.302.1.tar.gz
tar xzf ./actions-runner-osx-arm64-2.302.1.tar.gz
./config.sh --url https://github.com/solaoi/lycoris --token XXXXXXXXXXXXXXXXXXXX
# Self Hosted Runnerの実行
./run.sh
```

### 開発者モードで起動

```
yarn tauri dev
```

### 開発者向けインストール

```
yarn tauri build
```
