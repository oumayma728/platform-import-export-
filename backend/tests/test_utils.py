import pytest
from app.utils.country_utils import normalize_text
from app.utils.websocket_manager import ConnectionManager
import asyncio

def test_normalize_text():
    assert normalize_text("Éléphant") == "elephant"
    assert normalize_text("  CaNaDa  ") == "canada"
    assert normalize_text(None) == ""
    assert normalize_text("") == ""

@pytest.mark.asyncio
async def test_websocket_manager():
    manager = ConnectionManager()
    
    # Create a dummy websocket class to mock FastAPI's WebSocket
    class MockWebsocket:
        async def accept(self):
            pass
        async def send_json(self, data):
            pass
            
    ws = MockWebsocket()
    await manager.connect(ws, "room1")
    
    assert "room1" in manager.active_connections
    assert ws in manager.active_connections["room1"]
    
    await manager.broadcast_to_conversation({"msg": "hello"}, "room1")
    
    manager.disconnect(ws, "room1")
    assert "room1" not in manager.active_connections or ws not in manager.active_connections["room1"]
    
    # Disconnect from non-existent room should not crash
    manager.disconnect(ws, "room_unknown")
