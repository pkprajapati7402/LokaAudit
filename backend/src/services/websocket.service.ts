import { WebSocketServer } from 'ws';

let wsServer: WebSocketServer;

// WebSocket service implementation
export function setupWebSocket(wss: WebSocketServer): void {
  console.log('🔗 Setting up WebSocket server...');
  wsServer = wss;
  
  wss.on('connection', (ws) => {
    console.log('📡 New WebSocket connection established');
    
    ws.on('message', (message) => {
      console.log('📨 Received message:', message.toString());
      
      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        message: message.toString(),
        timestamp: new Date().toISOString()
      }));
    });
    
    ws.on('close', () => {
      console.log('📡 WebSocket connection closed');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to LokaAudit Backend WebSocket',
      timestamp: new Date().toISOString()
    }));
  });
  
  console.log('✅ WebSocket server setup complete');
}

export function broadcastMessage(message: any): void {
  if (!wsServer) return;
  
  const messageStr = JSON.stringify(message);
  
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
    }
  });
}

export function getConnectedClients(): number {
  return wsServer ? wsServer.clients.size : 0;
}
