const WebSocket = require('ws');

async function createWebSocketServer(port = 8080) {
    let wss;
    let currentPort = port;
    
    while (currentPort < port + 10) {
        try {
            wss = new WebSocket.Server({ port: currentPort });
            console.log(`WebSocket server is running on port ${currentPort}`);
            break;
        } catch (error) {
            if (error.code === 'EADDRINUSE') {
                console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
                currentPort++;
            } else {
                throw error;
            }
        }
    }
    
    if (!wss) {
        throw new Error('Could not find an available port');
    }
    
    wss.on('connection', (ws) => {
        console.log('Client connected');
        
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
    
    return wss;
}

module.exports = createWebSocketServer; 