// Este arquivo roda em uma thread separada para não travar sua UI
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const float32Buffer = input[0];
      // Envia os dados de áudio para a thread principal
      this.port.postMessage(float32Buffer);
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
