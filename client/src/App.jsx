import { useEffect, useRef, useState } from "react";
import useAudioRecorder from "./useAudioRecorder";
import useSocket from "./useSocket";

// IMPORTANT: To ensure proper functionality and microphone access, please follow these steps:
// 1. Access the site using 'localhost' instead of the local IP address.
// 2. When prompted, grant microphone permissions to the site to enable audio recording.
// Failure to do so may result in issues with audio capture and transcription.
// NOTE: Don't use createPortal()

function App() {
  const { initialize, disconnect, transcriptAudio, socket } = useSocket();
  const partial = useRef("");
  const transcription = useRef("");
  const [copied, setCopied] = useState(false);

  const handlePartial = (text) => {
    if (text) {
      const index = transcription.current.lastIndexOf(text)
      transcription.current = transcription.current.substring(0, index) + text
    }
    partial.current = text
  }
  const handleFinal = (text) => {
    const index = transcription.current.lastIndexOf(partial.current)
    if (index !== -1) {
      transcription.current = transcription.current.substring(0, index) + text
    }
    partial.current = ""
  }

  useEffect(() => {
    // Note: must connect to server on page load but don't start transcriber
    initialize();

    socket.on('partial', handlePartial)
    socket.on('final', handleFinal)

    return () => {
      disconnect();

      socket.off('partial')
      socket.off('final')
    }
  // }, [initialize, disconnect, socket]);
  }, [socket]);

  const { startRecording, stopRecording, isRecording } = useAudioRecorder({
    dataCb: (pcm16Audio) => {
      socket.off('partial')
      socket.off('final')

      transcriptAudio(pcm16Audio)

      socket.on('partial', handlePartial)
      socket.on('final', handleFinal)
    },
  });

  const onStartRecordingPress = async () => {
    const sampleRate = await startRecording();
    socket.emit("configure-stream", { sampleRate })
  };

  const onStopRecordingPress = async () => {
    stopRecording()
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcription.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  };
  
  const handleClear = async () => {
    // await navigator.clipboard.writeText(transcription.current)
    setCopied(false)
    transcription.current = ""
  };

  // ... add more functions
  return (
    <div>
      <h1>Speechify Voice Notes</h1>
      <p>Record or type something in the textbox.</p>

      <textarea
        id="transcription-display"
        data-testid="transcription-display"
        cols="50"
        rows="10"
        value={transcription.current}
        onChange={(e) => transcription.current = e.target.value}
      />
      <br/>
      <button
        id="record-button"
        data-testid="record-button"
        onClick={isRecording ? onStopRecordingPress : onStartRecordingPress}
      >
        {isRecording ? `Stop` : `Start`} Recording
      </button>
      <button
        id="copy-button"
        data-testid="copy-button"
        onClick={handleCopy}
      >{ copied ? `Copied` : `Copy` }</button>
      <button
        id="reset-button"
        data-testid="reset-button"
        onClick={handleClear}
      >Clear</button>
    </div>
  );
}

export default App;
