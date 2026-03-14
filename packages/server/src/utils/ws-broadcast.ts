/**
 * WebSocket Broadcast Manager
 *
 * Manages connected WebSocket clients and broadcasts events.
 * Events: task_created, task_updated, task_status_changed, task_deleted,
 *         agent_updated, agent_toggled, alert, activity
 */

import { WebSocket } from 'ws';

export interface WSEvent {
  event: string;
  data: any;
  timestamp: string;
}

class WSBroadcast {
  private clients: Set<WebSocket> = new Set();

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
    ws.on('error', () => this.clients.delete(ws));

    // Send welcome
    this.sendTo(ws, {
      event: 'connected',
      data: { clientCount: this.clients.size },
      timestamp: new Date().toISOString(),
    });
  }

  broadcast(event: string, data: any = {}) {
    const message: WSEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }

  private sendTo(ws: WebSocket, msg: WSEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

// Singleton
export const wsBroadcast = new WSBroadcast();
