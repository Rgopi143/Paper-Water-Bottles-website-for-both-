import { X, Send, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase, Chat, Message, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ChatWithProfiles = Chat & {
  buyer: Profile;
  seller: Profile;
};

type MessageWithSender = Message & {
  sender: Profile;
};

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<ChatWithProfiles[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithProfiles | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadChats();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      subscribeToMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:profiles!chats_buyer_id_fkey(*),
          seller:profiles!chats_seller_id_fkey(*)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setChats(data as unknown as ChatWithProfiles[]);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as unknown as MessageWithSender[]);

      await markMessagesAsRead(chatId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('chat_id', chatId)
        .not('sender_id', 'eq', user.id);

      if (unreadMessages) {
        for (const msg of unreadMessages) {
          const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
          if (!readBy.includes(user.id)) {
            await supabase
              .from('messages')
              .update({ read_by: [...readBy, user.id] })
              .eq('id', msg.id);
          }
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = (chatId: string) => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          loadMessages(chatId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        text: newMessage.trim(),
        attachments: [],
        read_by: [user.id],
      });

      if (error) throw error;

      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherUser = (chat: ChatWithProfiles) => {
    return profile?.role === 'buyer' ? chat.seller : chat.buyer;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[80vh] flex overflow-hidden">
        <aside className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-600">No conversations yet</div>
            ) : (
              chats.map((chat) => {
                const otherUser = getOtherUser(chat);
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-semibold">
                        {otherUser.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{otherUser.full_name}</div>
                        <div className="text-sm text-gray-600 capitalize">{otherUser.role}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <header className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="font-semibold text-gray-900">
                  {getOtherUser(selectedChat).full_name}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {getOtherUser(selectedChat).role}
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-gray-600">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-600">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-green-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="break-words">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </main>

              <footer className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              Select a conversation to start messaging
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
