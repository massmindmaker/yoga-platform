// Utility functions for Telegram chat handling

/**
 * Extract chat ID from various Telegram chat formats
 * Supports:
 * - Public group links: https://t.me/groupname → @groupname
 * - Private group links: https://t.me/+xxxxx → need to use bot API to resolve
 * - Channel links: https://t.me/c/1234567890 → -1001234567890
 * - Direct IDs: -1001234567890, @groupname, groupname
 */
export function extractChatId(input: string): string | null {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Already a numeric ID (with or without -100 prefix)
  if (/^-?\d+$/.test(trimmed)) {
    return trimmed;
  }
  
  // @username format
  if (trimmed.startsWith('@')) {
    return trimmed;
  }
  
  // Public link: https://t.me/username or https://telegram.me/username
  const publicMatch = trimmed.match(/https?:\/\/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)$/);
  if (publicMatch) {
    return '@' + publicMatch[1];
  }
  
  // Private link: https://t.me/+xxxxx (invite link)
  // Cannot resolve directly, need bot to be member
  const privateMatch = trimmed.match(/https?:\/\/(?:t\.me|telegram\.me)\/\+([a-zA-Z0-9_-]+)$/);
  if (privateMatch) {
    // Return as-is, will need special handling
    return trimmed;
  }
  
  // Channel link: https://t.me/c/1234567890
  const channelMatch = trimmed.match(/https?:\/\/(?:t\.me|telegram\.me)\/c\/(\d+)$/);
  if (channelMatch) {
    return '-100' + channelMatch[1];
  }
  
  // Just the username without @
  if (/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(trimmed)) {
    return '@' + trimmed;
  }
  
  return trimmed;
}

/**
 * Check if chat ID is a private invite link
 */
export function isPrivateInviteLink(input: string): boolean {
  return input.includes('/+') || input.startsWith('+');
}

/**
 * Format chat ID for Telegram Bot API
 */
export function formatChatIdForApi(input: string): string {
  const extracted = extractChatId(input);
  if (!extracted) return input;
  
  // Remove @ prefix for API calls if it's a public group
  if (extracted.startsWith('@')) {
    return extracted;
  }
  
  return extracted;
}

/**
 * Try to resolve chat ID using bot API
 * This works if bot is already a member of the chat
 */
export async function resolveChatId(
  botToken: string,
  input: string
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  console.log('[RESOLVE_CHAT] Input:', input);
  
  const chatId = formatChatIdForApi(input);
  console.log('[RESOLVE_CHAT] Formatted chatId:', chatId);
  
  try {
    // Try to get chat info
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );
    
    const data = await response.json();
    console.log('[RESOLVE_CHAT] Telegram API response:', data);
    
    if (data.ok) {
      // Return the actual chat ID from response
      return { 
        success: true, 
        chatId: data.result.id.toString() 
      };
    }
    
    // Handle specific Telegram errors
    if (data.description?.includes('chat not found')) {
      return {
        success: false,
        error: 'Чат не найден. Убедитесь, что бот @Yom23_bot добавлен в группу и является администратором. Затем обновите страницу.',
      };
    }
    
    if (data.description?.includes('bot is not a member')) {
      return {
        success: false,
        error: 'Бот не является участником чата. Добавьте бота @Yom23_bot в группу, сделайте администратором и обновите страницу.',
      };
    }
    
    if (data.description?.includes('not enough rights')) {
      return {
        success: false,
        error: 'У бота недостаточно прав. Сделайте бота администратором группы и обновите страницу.',
      };
    }
    
    return {
      success: false,
      error: data.description || 'Не удалось получить доступ к чату',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Ошибка сети при подключении к чату',
    };
  }
}
