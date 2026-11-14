import {
  beatsPerMeasure,
  GUITAR_STANDARD_TUNING,
  pitchForStringAndFret,
} from "./musicTheory";
import { FretStackSong, Track } from "./songModel";

export function encodeSongToJSON(song: FretStackSong): string {
  return JSON.stringify(song, null, 2);
}

export function decodeSongFromJSON(jsonString: string): FretStackSong {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tracks)) {
    throw new Error("Invalid .fretstack.json format: missing tracks array.");
  }
  return parsed as FretStackSong;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function musicXMLType(beats: number): string {
  if (beats >= 4.0) return "whole";
  if (beats >= 2.0) return "half";
  if (beats >= 1.0) return "quarter";
  if (beats >= 0.5) return "eighth";
  if (beats >= 0.25) return "16th";
  return "32nd";
}

/**
 * Produces W3C MusicXML 4.0 tablature compatible with MuseScore, Guitar Pro, Sibelius, and Dorico.
 */
export function exportToMusicXML(song: FretStackSong): string {
  const divisions = 16;
  const encodingDate = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n`;
  xml += `<score-partwise version="4.0">\n`;
  xml += `  <work>\n    <work-title>${escapeXML(song.title)}</work-title>\n  </work>\n`;
  xml += `  <identification>\n`;
  xml += `    <creator type="composer">${escapeXML(song.composer)}</creator>\n`;
  xml += `    <creator type="artist">${escapeXML(song.artist)}</creator>\n`;
  xml += `    <encoding>\n`;
  xml += `      <software>FretTabRunner Open Engine</software>\n`;
  xml += `      <encoding-date>${encodingDate}</encoding-date>\n`;
  xml += `    </encoding>\n`;
  xml += `  </identification>\n`;
  xml += `  <part-list>\n`;

  const tracks: Track[] =
    song.tracks.length > 0
      ? song.tracks
      : [
          {
            id: "default-track",
            name: "Guitar",
            instrumentId: "guitar-6string",
            notes: [],
            isSolo: false,
            isMuted: false,
          },
        ];

  tracks.forEach((track, idx) => {
    const partId = `P${idx + 1}`;
    xml += `    <score-part id="${partId}">\n`;
    xml += `      <part-name>${escapeXML(track.name)}</part-name>\n`;
    xml += `      <score-instrument id="${partId}-I1">\n`;
    xml += `        <instrument-name>${escapeXML(track.name)}</instrument-name>\n`;
    xml += `      </score-instrument>\n`;
    xml += `      <midi-instrument id="${partId}-I1">\n`;
    xml += `        <midi-channel>${idx + 1}</midi-channel>\n`;
    xml += `        <midi-program>26</midi-program>\n`;
    xml += `      </midi-instrument>\n`;
    xml += `    </score-part>\n`;
  });

  xml += `  </part-list>\n`;

  const measureBeats = beatsPerMeasure(song.timeSignature);
  const totalMeasures = Math.max(1, song.totalMeasures);

  tracks.forEach((track, trackIdx) => {
    const partId = `P${trackIdx + 1}`;
    const tuning = track.customTuning ?? GUITAR_STANDARD_TUNING;
    xml += `  <part id="${partId}">\n`;

    for (let m = 1; m <= totalMeasures; m++) {
      const mStart = (m - 1) * measureBeats;
      const mEnd = m * measureBeats;
      xml += `    <measure number="${m}">\n`;

      if (m === 1) {
        xml += `      <attributes>\n`;
        xml += `        <divisions>${divisions}</divisions>\n`;
        xml += `        <key><fifths>0</fifths></key>\n`;
        xml += `        <time>\n`;
        xml += `          <beats>${song.timeSignature.numerator}</beats>\n`;
        xml += `          <beat-type>${song.timeSignature.denominator}</beat-type>\n`;
        xml += `        </time>\n`;
        xml += `        <clef><sign>TAB</sign><line>5</line></clef>\n`;
        xml += `        <staff-details>\n`;
        xml += `          <staff-lines>${tuning.pitches.length}</staff-lines>\n`;
        [...tuning.pitches].reverse().forEach((pitch, strIdx) => {
          const step = pitch.note.slice(0, 1);
          const alter = pitch.note.includes("#") ? 1 : 0;
          xml += `          <staff-tuning line="${strIdx + 1}">\n`;
          xml += `            <tuning-step>${step}</tuning-step>\n`;
          if (alter !== 0) xml += `            <tuning-alter>${alter}</tuning-alter>\n`;
          xml += `            <tuning-octave>${pitch.octave}</tuning-octave>\n`;
          xml += `          </staff-tuning>\n`;
        });
        xml += `        </staff-details>\n`;
        xml += `      </attributes>\n`;
        xml += `      <direction placement="above">\n`;
        xml += `        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.round(
          song.bpm
        )}</per-minute></metronome></direction-type>\n`;
        xml += `        <sound tempo="${Math.round(song.bpm)}"/>\n`;
        xml += `      </direction>\n`;
      }

      const measureNotes = track.notes
        .filter((n) => n.beat >= mStart && n.beat < mEnd)
        .sort((a, b) => a.beat - b.beat);

      if (measureNotes.length === 0) {
        const restDuration = Math.round(measureBeats * divisions);
        xml += `      <note><rest measure="yes"/><duration>${restDuration}</duration><voice>1</voice></note>\n`;
      } else {
        let curBeat = mStart;
        for (const note of measureNotes) {
          if (note.beat > curBeat + 0.001) {
            const restDur = Math.max(1, Math.round((note.beat - curBeat) * divisions));
            xml += `      <note><rest/><duration>${restDur}</duration><voice>1</voice></note>\n`;
            curBeat = note.beat;
          }
          const noteDur = Math.max(1, Math.round(note.durationBeats * divisions));
          const pitch =
            pitchForStringAndFret(tuning, note.stringNumber, note.fret) ?? {
              note: "E",
              octave: 4,
            };
          const step = pitch.note.slice(0, 1);
          const alter = pitch.note.includes("#") ? 1 : 0;
          xml += `      <note>\n`;
          xml += `        <pitch><step>${step}</step>`;
          if (alter !== 0) xml += `<alter>${alter}</alter>`;
          xml += `<octave>${pitch.octave}</octave></pitch>\n`;
          xml += `        <duration>${noteDur}</duration>\n`;
          xml += `        <voice>1</voice>\n`;
          xml += `        <type>${musicXMLType(note.durationBeats)}</type>\n`;
          xml += `        <notations><technical><string>${note.stringNumber}</string><fret>${note.fret}</fret>`;
          if (note.technique === "Hammer-on") {
            xml += `<hammer-on type="start" number="1">H</hammer-on>`;
          } else if (note.technique === "Pull-off") {
            xml += `<pull-off type="start" number="1">P</pull-off>`;
          } else if (note.technique === "Bend") {
            xml += `<bend><bend-alter>2</bend-alter></bend>`;
          }
          xml += `</technical></notations>\n`;
          xml += `      </note>\n`;
          curBeat = Math.max(curBeat, note.beat + note.durationBeats);
        }
        if (curBeat < mEnd - 0.001) {
          const remDur = Math.max(1, Math.round((mEnd - curBeat) * divisions));
          xml += `      <note><rest/><duration>${remDur}</duration><voice>1</voice></note>\n`;
        }
      }

      xml += `    </measure>\n`;
    }

    xml += `  </part>\n`;
  });

  xml += `</score-partwise>\n`;
  return xml;
}

/** Generates standard ASCII tablature text from a FretStackSong. */
export function exportToASCIITab(song: FretStackSong, trackIndex = 0): string {
  if (trackIndex >= song.tracks.length) return "No track found";
  const track = song.tracks[trackIndex];
  const tuning = track.customTuning ?? GUITAR_STANDARD_TUNING;
  const stringNames = tuning.pitches.map((p) => p.note);

  let output = "";
  output += "========================================================\n";
  output += `Title:  ${song.title}\n`;
  output += `Artist: ${song.artist}\n`;
  output += `Tempo:  ${Math.round(song.bpm)} BPM | Time: ${song.timeSignature.numerator}/${song.timeSignature.denominator}\n`;
  output += `Tuning: ${tuning.name}\n`;
  output += "========================================================\n\n";

  const measureBeats = beatsPerMeasure(song.timeSignature);
  const measuresPerLine = 4;
  const stepsPerMeasure = 16;

  for (
    let lineStart = 1;
    lineStart <= song.totalMeasures;
    lineStart += measuresPerLine
  ) {
    const lineEnd = Math.min(lineStart + measuresPerLine - 1, song.totalMeasures);
    output += `Bars ${lineStart} - ${lineEnd}:\n`;

    stringNames.forEach((noteName, strIdx) => {
      const stringNumber = strIdx + 1;
      const header = noteName.padEnd(2, " ") + "|";
      const totalChars = (lineEnd - lineStart + 1) * (stepsPerMeasure + 1);
      const lineChars = Array<string>(totalChars).fill("-");

      for (let m = lineStart; m <= lineEnd; m++) {
        const measureOffset = (m - lineStart) * (stepsPerMeasure + 1);
        lineChars[measureOffset] = "|";

        const mStartBeat = (m - 1) * measureBeats;
        const mEndBeat = m * measureBeats;
        const stringNotes = track.notes.filter(
          (n) =>
            n.stringNumber === stringNumber &&
            n.beat >= mStartBeat &&
            n.beat < mEndBeat
        );

        for (const note of stringNotes) {
          const norm = (note.beat - mStartBeat) / measureBeats;
          const stepIdx = Math.min(
            stepsPerMeasure - 1,
            Math.max(0, Math.floor(norm * stepsPerMeasure))
          );
          const targetIdx = measureOffset + 1 + stepIdx;
          const fretStr = String(note.fret);
          for (let c = 0; c < fretStr.length; c++) {
            const idx = targetIdx + c;
            if (idx < lineChars.length && lineChars[idx] !== "|") {
              lineChars[idx] = fretStr[c];
            }
          }
        }
      }

      output += `${header}${lineChars.join("")}|\n`;
    });

    output += "\n";
  }

  return output;
}
