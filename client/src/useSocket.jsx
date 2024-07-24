import { useEffect, useRef } from "react";
import io from "socket.io-client";

const serverURL = "http://localhost:8080";

// const subscriptions = ["final", "partial", "transcriber-ready", "error"];
// const emmits = ["connection","configure-stream","incoming-audio","stop-stream", "disconnect"];

const socket = io(serverURL, {
  transports: ['websocket'],
  autoConnect: false,
})

// feel free to pass in any props
const useSocket = () => {
  // ... free to add any state or variables
  const canTranscribe = useRef(false);

  useEffect(() => {

    // TODO: Check this event not been triggered
    socket.on('transcriber-ready', () => {
      canTranscribe.current = true
      console.log('Transcriber Is Ready :>> ');
    })
    socket.on('error', (error) => {
      console.log('error :>> ', error);
      canTranscribe.current = false
    })

    
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  const initialize = () => {
    socket.removeAllListeners()
    socket.connect()
  };

  const disconnect = () => {
    canTranscribe.current = false
    socket.emit("stop-stream")
    socket.removeAllListeners()
    socket.disconnect()
  };

  const configureStream = (sampleRate) => {
    socket.emit("configure-stream", { sampleRate });
  }

  const transcriptAudio = (audioData) => {
    if (!canTranscribe.current) {
      initialize()
    }

    socket.emit("incoming-audio", audioData)
  };

  // ... free to add more functions
  return {
    configureStream,
    initialize,
    disconnect,
    transcriptAudio,
    socket
  };
};

export default useSocket;
