import EventEmitter from "events";
import { createClient, LiveConnectionState, LiveTranscriptionEvents } from "@deepgram/sdk";

const DEEPGRAM_API_KEY = `54dddd62a18582d9e22f1338bed3019094a1d562`;

class Transcriber extends EventEmitter {
  constructor() {
    super();
  }
  connection = null

  // sampleRate: number
  async startTranscriptionStream(sampleRate) {
    // example deepgram configuration
    // const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    try {
      const deepgram = createClient(DEEPGRAM_API_KEY);

      const connection = deepgram.listen.live({
        model: "nova-2",
        punctuate: true,
        language: "en-US",
        smart_format: true,
        interim_results: true,
        // diarize: false,
        // endpointing: 0,
        encoding: "linear16",
        sample_rate: sampleRate,
      });
      this.connection = connection;
      return connection
    } catch (error) {
      console.error(`Failed to start Transcription Stream`, error.message)
      throw new Error(`Failed to start Transcription Stream`)
    }
  }

  endTranscriptionStream() {
    try {
      this.connection.removeAllListeners();
      this.connection.finish();
    } catch (error) {
      console.error(`Error on end Transcription Stream`, error.message)
    }
  }

  // NOTE: deepgram must be ready before sending audio payload or it will close the connection
  send(payload) {
    if (this.connection && this.connection.getReadyState() !== LiveConnectionState.OPEN) {
      console.warn(`Connection is ${LiveConnectionState[this.connection.getReadyState()]}. Unable to Send Payload.`)
      return;
    }
    this.connection.send(payload)
  }

  // ... feel free to add more functions
}

export default Transcriber;
