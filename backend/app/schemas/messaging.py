from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.models import StatutConversation

class DocumentMessageBase(BaseModel):
    file_url: str
    file_name: str
    file_type: str

class DocumentMessageCreate(DocumentMessageBase):
    pass

class DocumentMessageOut(DocumentMessageBase):
    id: str
    message_id: str

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    contenu: str

class MessageCreate(MessageBase):
    pass

class MessageOut(MessageBase):
    id: str
    conversation_id: str
    sender_id: str
    date_envoi: datetime
    documents: List[DocumentMessageOut] = []

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    listing_id: str

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdateStatus(BaseModel):
    statut: StatutConversation

class ConversationOut(ConversationBase):
    id: str
    initiator_company_id: str
    statut: StatutConversation
    date_creation: datetime
    date_maj: Optional[datetime]
    

    class Config:
        from_attributes = True
