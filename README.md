# LINE TTS Bot

LINEJS + VOICEVOX を利用した
LINEグループ通話読み上げBot。

## Architecture

LINE
 ↓
LINEJS
 ↓
Message Manager
 ↓
TTS Queue
 ↓
VOICEVOX
 ↓
Audio Converter
 ↓
Opus
 ↓
LINE Group Call

## Requirements

- Windows 10 / 11
- Node.js 24 LTS
- npm
- TypeScript
- VOICEVOX ENGINE
- FFmpeg
