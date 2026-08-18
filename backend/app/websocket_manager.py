"""
websocket_manager.py — Gestionnaire de connexions WebSocket
Maintient un registre des connexions actives par conversation.
"""
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Gère les connexions WebSocket actives par conversation."""

    def __init__(self):
        # { conversation_id: [WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id] = [
                ws for ws in self.active_connections[conversation_id] if ws != websocket
            ]
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

    async def broadcast(self, message: dict, conversation_id: str, exclude: WebSocket = None):
        """Envoie un message JSON à tous les participants de la conversation."""
        if conversation_id not in self.active_connections:
            return
        dead = []
        for ws in self.active_connections[conversation_id]:
            if ws == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, conversation_id)


# Instance globale partagée
ws_manager = ConnectionManager()
