# FretTabRunner

> **Cross-platform interactive side-scrolling tablature & fretboard runner engine built with Tauri + React + TypeScript + Vite.**

## Features

- **Side-Scrolling Tab Highway**: 60/120fps HTML5 Canvas note highway with color-coded strings, fret badges (`0–24`), sustain ribbon trails, technique annotations (`h`, `p`, `/`, `\`, `b`, `~`, `P.M.`, `(x)`), lyric/chord cues, and neon laser strike zone.
- **Synchronized 24-Fret Rosewood Fretboard**: Real-time note illumination, mother-of-pearl inlay dots, click-to-audition & click-to-insert notes, and persistent tab symbols legend.
- **Karplus-Strong Physical String Synthesis**: Zero-dependency Web Audio API polyphonic plucked string synthesizer with string-dependent damping, DC-block highpass, and brilliance EQ, plus accented metronome clicks.
- **Audio Backing Track Sync**: Bundled royalty-free MP3 backing tracks (*Neon Horizon Riff*, *Delta Sunset Blues*, *Acoustic Raindrops*), local MP3/WAV/M4A file loading, BPM/speed scaling, and ±1000ms offset calibration.
- **Modular Instrument Hub**: 6-String Guitar (`E-A-D-G-B-e`) and 4-String Bass (`E-A-D-G`) engines, plus Album & Library Manager with 10 cover presets and JSON backup/restore.
- **Open Interchange Formats**: Import/Export `.json` / `.fretstack` song files, W3C MusicXML 4.0 (`.musicxml`), and ASCII Tablature (`.tab.txt`).

## Development & Desktop Build

```bash
npm install
npm run dev           # Run Vite frontend in browser
npm run build         # Build production web bundle + Windows Desktop Executable (.exe) & refresh Desktop shortcut
npm start             # Launch the compiled Windows Desktop Executable
```

### Desktop Executable & Shortcut

Every time you run `npm run build`:
- It bundles the web application (`dist/`).
- Compiles the native single-file Windows desktop executable (`release/FretTabRunner.exe`).
- Automatically creates/refreshes your Windows Desktop shortcut (`FretTabRunner.lnk`) with the custom acoustic guitar icon.
- You can double-click the shortcut on your Desktop or run `npm start` anytime to open the application!

## Legal & Copyright Disclaimer

FretTabRunner is an open-source, local interactive tablature learning, practice, and composition tool.

- **Local Creative Tool:** FretTabRunner does not host, publish, or distribute any proprietary sheet music, song tabs, or copyrighted music compositions.
- **User Responsibility:** Users are solely responsible for ensuring that any tablature, chord arrangements, or media files they author, import, or export comply with applicable copyright laws and intellectual property rights in their jurisdiction.
- **Third-Party Media Streams:** Any external media (such as YouTube streams) is delivered directly via official third-party embedded player APIs subject to the respective platform's terms of service. FretTabRunner does not download, rip, cache, or distribute third-party audio or video files.

## License

MIT License. See [LICENSE](./LICENSE).
