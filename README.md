<div align="center">
    <img width="600" alt="lycoris" src="https://user-images.githubusercontent.com/46414076/227781834-2eeaea6f-fae6-4607-8862-4ca74a4416b9.png">
</div>

<div align="center">

# Real-time Speech Recognition & AI Note-taking App

</div>

<div align="center">

[![license](https://img.shields.io/github/license/solaoi/lycoris)](https://github.com/solaoi/lycoris/blob/main/LICENSE)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/solaoi/lycoris)](https://github.com/solaoi/lycoris/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/solaoi?color=db61a2)](https://github.com/sponsors/solaoi)
[![PIXIV FANBOX](https://img.shields.io/badge/%E5%AF%84%E4%BB%98-PIXIV%20FANBOX-ff69b4)](https://solaoi.fanbox.cc/)
![MacOs](https://shields.io/badge/MacOS--9cf?logo=Apple&style=social)

</div>

**Lycoris** is a feature-rich, user-friendly app for macOS, designed to enhance your note-taking experience with real-time speech recognition, transcription, and translation capabilities. With offline and online modes, Lycoris balances flexibility with privacy.

> ⚠️ **Note**: Currently, Lycoris is optimized for Japanese users. While it aims to support transcription and translation in 19 languages in the future, the current version may have limited functionality in other languages.

<p align="center">
📌 <a href="https://solaoi.github.io/lycoris/" target="_blank" rel="noopener noreferrer">Introduction</a>
</p>

<div align="center">

![日本語](https://img.shields.io/badge/日本語-d9d9d9)
![English](https://img.shields.io/badge/English-d9d9d9)
![中文](https://img.shields.io/badge/中文-d9d9d9)
![한국어](https://img.shields.io/badge/한국어-d9d9d9)
![Français](https://img.shields.io/badge/Français-d9d9d9)
![Deutsch](https://img.shields.io/badge/Deutsch-d9d9d9)
![Русский](https://img.shields.io/badge/Русский-d9d9d9)
![Español](https://img.shields.io/badge/Español-d9d9d9)
![Português](https://img.shields.io/badge/Português-d9d9d9)
![Türkçe](https://img.shields.io/badge/Türkçe-d9d9d9)

</div>

<div align="center">

![Tiếng Việt](https://img.shields.io/badge/Tiếng_Việt-d9d9d9)
![Italiano](https://img.shields.io/badge/Italiano-d9d9d9)
![Nederlands](https://img.shields.io/badge/Nederlands-d9d9d9)
![Català](https://img.shields.io/badge/Català-d9d9d9)
![Українська](https://img.shields.io/badge/Українська-d9d9d9)
![Svenska](https://img.shields.io/badge/Svenska-d9d9d9)
![हिंदी(हिन्दी)](https://img.shields.io/badge/हिंदी(हिन्दी)-d9d9d9)
![Čeština](https://img.shields.io/badge/Čeština-d9d9d9)
![Polski](https://img.shields.io/badge/Polski-d9d9d9)

</div>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [✨ Key Features](#-key-features)
- [💻 System Requirements](#-system-requirements)
- [⚙️ Installation](#-installation)
- [🚀 Usage Guide](#-usage-guide)
- [🙌 Support & Contributions](#-support--contributions)
- [👥 Contributors](#-contributors)
- [📈 Star History](#-star-history)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## ✨ Key Features

![key-features](https://github.com/user-attachments/assets/5a118e9f-d84a-404b-9912-b11b02a901d9)

- 🎙️ **Real-time Speech Recognition**: 
   - **Offline Mode**:
      - **Vosk for Real-time Transcription**: Lycoris uses **Vosk** to quickly generate initial real-time transcriptions, which are then refined using **Whisper** for enhanced accuracy and detail.
      - **Whisper for Detailed Transcription**: The primary transcription model for offline mode, **Whisper** delivers high-quality, multi-language transcription. For Japanese-only use cases, **Kotoba-Whisper** is available as an alternative for optimized Japanese transcription.
   - **Online Mode**:
      - **OpenAI Whisper API**: For users seeking cloud-based transcription, Lycoris integrates with the **OpenAI Whisper API**, allowing for high-quality transcriptions with cloud resources.
      - **AmiVoice API**: Additionally, users can choose **amiVoice** for specialized Japanese transcription via API key.

- 🌐 **Advanced Translation**:
   - **Whisper + FuguMT**: Supports translation from **18 languages into Japanese**. Whisper transcribes any of the 18 languages into English, and **FuguMT** then translates the English transcription into Japanese, ensuring high accuracy.
   - **Kotoba-Whisper-Bilingual**: Specialized for direct bi-directional translation between Japanese and English.

- 📄 **Flexible Note-Taking with Markdown Support**: Notes support **Markdown formatting**, allowing for organized and visually enhanced note-taking.

- 💬 **Contextual Speech Suggestions**:
   - **Sentiment-Based Suggestions**: Generate contextual responses in Neutral, Positive, and Negative tones with just a click.
   - **Text-to-Speech Capabilities**: Use **Style-BERT-VITS2 JP-Extra** to convert suggested responses into natural-sounding speech.

- 🤖 **Real-Time ChatGPT Integration**:
   - Interact with transcriptions or summaries in real-time using ChatGPT for tasks like summarization and contextual insights. This feature helps streamline discussions or capture essential points without losing context.

- 📶 **Offline & Online Modes**: Fully functional offline with local models to ensure privacy; online mode available with API integration for cloud-based services like OpenAI Whisper API.

## 💻 System Requirements

- **Operating System**: macOS 13 Ventura or later.
- **Processor**: Compatible with Apple Silicon (M1, M2, M3) and Intel processors.
- **Memory**: Minimum 8GB RAM recommended for optimal performance.

## ⚙️ Installation

1. **Download**: Obtain the latest version of Lycoris from the [GitHub Releases page](https://github.com/solaoi/lycoris/releases).
   - **For Intel processors**: Download the `.dmg` file ending in `x64.dmg`.
   - **For Apple Silicon processors**: Download the `.dmg` file ending in `aarch64.dmg`.
   - *Note*: Only the version number in the file name changes with each release.
2. **Install**: After downloading the `.dmg` file, double-click it to open. You’ll see the Lycoris application and the Applications folder. Simply drag the Lycoris app into the Applications folder.
3. **Permissions**: On first launch, grant necessary permissions for microphone and screen recording as prompted.

## 🚀 Usage Guide

1. **Download Language Packs**:
   - Open the app and go to settings (⚙️).
   - Download language packs for speech recognition as needed.
   
2. **Configure API Key** (for online features):
   - In settings, enter your API keys for services like amiVoice or OpenAI Whisper API to enable extended transcription and AI features.

3. **Create a Note**:
   - Click "Add Note" next to the search bar.
   - Set the speaker’s language, transcription method, and audio source.
   - Click "Start Recording" to begin capturing notes in real time!
   - With OpenAI’s online feature, you can also receive **sentiment-based response suggestions** (Neutral, Positive, Negative) for discussions, and use **real-time ChatGPT integration** to summarize or discuss the transcribed content directly.

## 🙌 Support & Contributions

Lycoris is available for free on BOOTH to reach a wide audience. Download the appropriate version for your macOS processor:

- **For Apple Silicon users**: [Download on BOOTH](https://booth.pm/ja/items/4675430)
- **For Intel users**: [Download on BOOTH](https://solaoi.booth.pm/items/4669259)

If you’d like to support further development:

- **For Japanese users**: Contributions are welcome via [Fanbox](https://solaoi.fanbox.cc/) or by making a voluntary purchase on BOOTH.
- **For international users**: You can support Lycoris by becoming a sponsor on [GitHub Sponsors](https://github.com/sponsors/solaoi).

Whether you’re a developer interested in contributing or a user wanting to support this project, every contribution helps Lycoris grow and improve for all!

## 👥 Contributors

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

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=solaoi/lycoris&type=Date)](https://star-history.com/#solaoi/lycoris&Date)

Your support keeps Lycoris accessible and continually improving. Thank you for helping us make smarter, AI-powered note-taking a reality! 📒✨
