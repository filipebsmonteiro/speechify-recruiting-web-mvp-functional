import { LiveTranscriptionEvents } from "@deepgram/sdk";
import Transcriber from "./transcriber.js";

/**
 * Events to subscribe to:
 * - connection: Triggered when a client connects to the server.
 * - configure-stream: Requires an object with a 'sampleRate' property.
 * - incoming-audio: Requires audio data as the parameter.
 * - stop-stream: Triggered when the client requests to stop the transcription stream.
 * - disconnect: Triggered when a client disconnects from the server.
 *
 *
 * Events to emit:
 * - transcriber-ready: Emitted when the transcriber is ready.
 * - final: Emits the final transcription result (string).
 * - partial: Emits the partial transcription result (string).
 * - error: Emitted when an error occurs.
 */

const initializeWebSocket = (io) => {
  io.on("connection", (socket) => {
    // ... add needed event handlers and logic
    console.log(`connection made (${socket.id})`); 
    const transcriber = new Transcriber()
    // let connection = new Transcriber()
    let sampleRate = null;

    const startTranscriptionStream = async (config) => {
      if (transcriber.connection) {
        return
      }

      if (typeof config !== 'object' || !config.sampleRate) {
        console.warn(`No Config Provided`)
      }
      sampleRate = config?.sampleRate ? config.sampleRate : sampleRate

      if (!sampleRate) {
        throw new Error(`Invalid Configuration`)
      }

      await transcriber.startTranscriptionStream(sampleRate)
    }

    const addListeners = () => {
      const connection = transcriber.connection
      
      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Transcription Connection closed.");
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        if (data.channel.alternatives.length) {
          const { transcript } = data.channel.alternatives[0];
          if (data.speech_final) {
            socket.emit('final', transcript)
          } else {
            socket.emit('partial', transcript)
          }
        }
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Transcription Connection Open.");
        // console.log('socket :>> ', socket.emit('transcriber-ready'));
        socket.emit("transcriber-ready");
      })

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.log("Transcription Error.");
        socket.emit('error', error.message)
      });
    }

    socket.on('configure-stream', async (config) => {
      try {
        await startTranscriptionStream(config)
        addListeners()
      } catch (error) {
        console.warn('Error on Configure Stream')
        console.warn(error.message)
        socket.emit(`error`, `Error on Configure Stream`)
      }
    })

    socket.on("incoming-audio", async (audioPm16) => {
      try {
        if (!ArrayBuffer.isView(audioPm16) && !(audioPm16 instanceof Buffer)) {
          throw new Error(`Invalid audio Data`)
        }
  
        if (!transcriber.connection) {
          await startTranscriptionStream()
          transcriber.send(audioPm16)
          return
        }
  
        transcriber.send(audioPm16)
      } catch (error) {
        console.warn(`Error sending audio data: `, error.message)
        socket.emit("error", "Failed to Process audio data")
      }
    })

    socket.on('stop-stream', () => {
      transcriber.endTranscriptionStream();
    })

    socket.on('disconnect', () => {
      console.log(`Socket (${socket.id}) disconnected`); 
      transcriber.endTranscriptionStream();
    })

    
    // socket.emit('final', data)
    // socket.emit('partial', data)
  });

  return io;
};

export default initializeWebSocket;
