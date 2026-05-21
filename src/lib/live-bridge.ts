/**
 * Local WebSocket Bridge helper to connect to the server-side proxy
 */
export function connectToLiveBridge(options: {
  model: string;
  config: any;
  callbacks: {
    onopen?: () => void;
    onmessage?: (message: any) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  };
  apiKey: string;
}) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/live-ws?apiKey=${encodeURIComponent(options.apiKey)}`;
  
  const ws = new WebSocket(wsUrl);
  
  const session = {
    sendRealtimeInput: (input: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'realtime_input', input }));
      }
    },
    sendToolResponse: (payload: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'tool_response', payload }));
      }
    },
    close: () => {
      ws.close();
    }
  };

  ws.onopen = () => {
    // Send the config setup payload as the very first packet
    ws.send(JSON.stringify({
      type: 'setup',
      model: options.model,
      config: options.config
    }));
    
    if (options.callbacks?.onopen) {
      options.callbacks.onopen();
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'error') {
        if (options.callbacks?.onerror) {
          options.callbacks.onerror(new Error(msg.error));
        }
      } else if (options.callbacks?.onmessage) {
        options.callbacks.onmessage(msg);
      }
    } catch (err) {
      console.error("Error parsing websocket message from bridge:", err);
    }
  };

  ws.onclose = () => {
    if (options.callbacks?.onclose) {
      options.callbacks.onclose();
    }
  };

  ws.onerror = (err) => {
    if (options.callbacks?.onerror) {
      options.callbacks.onerror(err);
    }
  };

  return Promise.resolve(session);
}
