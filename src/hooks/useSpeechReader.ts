import { useCallback, useEffect, useState } from "react";
import {
  speakClipboardText,
  speakSamplePreviewText,
  stopActiveSpeech,
  subscribeToSpeechStatus,
} from "../services/speechService";
import { SAMPLE_VOICE_PREVIEW_TEXT } from "../types/settings";

export interface UseSpeechReaderResult {
  isSpeaking: boolean;
  previewText: string;
  readClipboardNow: () => Promise<void>;
  playSamplePreview: () => Promise<void>;
  stopSpeakingNow: () => Promise<void>;
}

export function useSpeechReader(): UseSpeechReaderResult {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [previewText, setPreviewText] = useState<string>("");

  useEffect(() => {
    let cleanupListener: (() => void) | undefined;

    async function attachSpeechListener(): Promise<void> {
      try {
        cleanupListener = await subscribeToSpeechStatus((payload) => {
          setIsSpeaking(payload.isSpeaking);
          if (payload.previewText !== undefined) {
            setPreviewText(payload.previewText);
          }
        });
      } catch (error) {
        console.warn("Unable to attach Tauri speech status listener:", error);
      }
    }

    void attachSpeechListener();

    return () => {
      if (cleanupListener) {
        cleanupListener();
      }
    };
  }, []);

  const readClipboardNow = useCallback(async () => {
    try {
      await speakClipboardText();
    } catch (error) {
      console.error("Failed to speak clipboard text:", error);
    }
  }, []);

  const playSamplePreview = useCallback(async () => {
    try {
      await speakSamplePreviewText(SAMPLE_VOICE_PREVIEW_TEXT);
    } catch (error) {
      console.error("Failed to play sample voice preview:", error);
    }
  }, []);

  const stopSpeakingNow = useCallback(async () => {
    try {
      await stopActiveSpeech();
      setIsSpeaking(false);
    } catch (error) {
      console.error("Failed to stop active speech:", error);
    }
  }, []);

  return {
    isSpeaking,
    previewText,
    readClipboardNow,
    playSamplePreview,
    stopSpeakingNow,
  };
}
