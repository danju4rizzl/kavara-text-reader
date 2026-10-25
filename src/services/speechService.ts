import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface SpeechStatusPayload {
  isSpeaking: boolean;
  previewText?: string;
}

const SPEECH_STATUS_EVENT = "speech-status-changed";

export async function triggerSelectionSpeech(): Promise<void> {
  await invoke("trigger_speak");
}

export async function speakClipboardText(): Promise<void> {
  await invoke("speak_clipboard");
}

export async function speakSamplePreviewText(text: string): Promise<void> {
  await invoke("speak_sample_text", { text });
}

export async function stopActiveSpeech(): Promise<void> {
  await invoke("stop_speaking");
}

export async function subscribeToSpeechStatus(
  onStatusChange: (payload: SpeechStatusPayload) => void
): Promise<UnlistenFn> {
  return await listen<SpeechStatusPayload>(SPEECH_STATUS_EVENT, (event) => {
    onStatusChange(event.payload);
  });
}
