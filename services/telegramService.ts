
import { base64ToBlob } from '../utils/fileUtils';

export const sendPhoto = async (token: string, chatId: string, imageBase64: string, caption: string): Promise<void> => {
  const apiUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  const mimeType = imageBase64.substring(imageBase64.indexOf(":") + 1, imageBase64.indexOf(";"));
  const photoBlob = base64ToBlob(imageBase64, mimeType);

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', photoBlob, 'generated-image.png');
  formData.append('caption', caption);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.description || 'Telegram API request failed');
  }
};
