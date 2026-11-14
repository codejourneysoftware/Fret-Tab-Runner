import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

export async function saveTextFileDialog(
  defaultFilename: string,
  contents: string,
  filters: Array<{ name: string; extensions: string[] }>
): Promise<boolean> {
  if (isTauriRuntime()) {
    try {
      const path = await save({
        defaultPath: defaultFilename,
        filters,
      });
      if (!path) return false;
      await invoke("write_text_file", { path, contents });
      return true;
    } catch {
      // Fallback to browser download
    }
  }

  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export async function openTextFileDialog(
  filters: Array<{ name: string; extensions: string[] }>
): Promise<{ name: string; contents: string } | null> {
  if (isTauriRuntime()) {
    try {
      const selected = await open({
        multiple: false,
        filters,
      });
      if (!selected || typeof selected !== "string") return null;
      const contents = await invoke<string>("read_text_file", { path: selected });
      const parts = selected.split(/[\\/]/);
      return { name: parts[parts.length - 1] ?? selected, contents };
    } catch {
      // Fallback to browser file input
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = filters.flatMap((f) => f.extensions.map((e) => `.${e}`)).join(",");
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ name: file.name, contents: String(reader.result ?? "") });
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

export async function openAudioFileDialog(): Promise<{
  displayName: string;
  playbackUrl: string;
} | null> {
  const audioFilters = [
    { name: "Audio Files", extensions: ["mp3", "wav", "m4a", "ogg", "flac", "aac"] },
  ];

  if (isTauriRuntime()) {
    try {
      const selected = await open({
        multiple: false,
        filters: audioFilters,
      });
      if (!selected || typeof selected !== "string") return null;
      const base64 = await invoke<string>("read_binary_base64", { path: selected });
      const ext = selected.split(".").pop()?.toLowerCase() ?? "mp3";
      const mimeMap: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/mp4",
        ogg: "audio/ogg",
        flac: "audio/flac",
        aac: "audio/aac",
      };
      const mime = mimeMap[ext] ?? "audio/mpeg";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const playbackUrl = URL.createObjectURL(blob);
      return { displayName: selected, playbackUrl };
    } catch {
      // Fallback to browser input
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const playbackUrl = URL.createObjectURL(file);
      resolve({ displayName: file.name, playbackUrl });
    };
    input.click();
  });
}

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      await invoke("open_external_url", { url });
      return;
    } catch {
      // Fallback
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
