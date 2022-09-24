#!/bin/sh

# dependencies for portAudio
brew install portaudio pkg-config
# dependencies for vosk
VOSK_VERSION=0.3.42
curl -LO https://github.com/alphacep/vosk-api/releases/download/v$VOSK_VERSION/vosk-osx-$VOSK_VERSION.zip
unzip ./vosk-osx-$VOSK_VERSION.zip
sudo cp vosk-osx-$VOSK_VERSION/* /usr/local/lib
