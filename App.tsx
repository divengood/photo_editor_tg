
import React, { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateImage, editImage } from './services/geminiService';
import { sendPhoto } from './services/telegramService';
import { fileToBase64 } from './utils/fileUtils';
import Button from './components/Button';
import Input from './components/Input';
import Spinner from './components/Spinner';
import { ImagePreview } from './components/ImagePreview';
import { AlertTriangle, Bot, CheckCircle, ChevronDown, ChevronUp, HelpCircle, Image as ImageIcon, Send, Settings, UploadCloud, X } from './components/Icon';

type Status = {
  type: 'success' | 'error';
  message: string;
} | null;

const ApiKeyWarning = () => (
  <div className="flex items-start gap-3 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-sm">
    <AlertTriangle className="w-6 h-6 mt-0.5 flex-shrink-0" />
    <div>
      <h3 className="font-semibold mb-1">Action Required: Google AI API Key is Missing</h3>
      <p className="text-red-400">
        The application cannot generate images because the Google AI API key has not been configured. The person who deployed this application needs to set the <code>VITE_API_KEY</code> environment variable in the deployment service settings (e.g., Netlify, Vercel).
      </p>
    </div>
  </div>
);

export default function App() {
  const [botToken, setBotToken] = useLocalStorage('telegramBotToken', '');
  const [chatId, setChatId] = useLocalStorage('telegramChatId', '');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; name: string; mimeType: string; } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    // Proactively check if the API key is missing. It must be prefixed with VITE_ to be exposed to the client.
    if (!process.env.VITE_API_KEY) {
      setIsApiKeyMissing(true);
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setUploadedImage({ base64, name: file.name, mimeType });
        setGeneratedImage(null);
      } catch (error) {
        setStatus({ type: 'error', message: 'Failed to read the image file.' });
        console.error(error);
      }
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setStatus({ type: 'error', message: 'Please enter a prompt.' });
      return;
    }
    setIsLoading(true);
    setStatus(null);
    setGeneratedImage(null);
    try {
      const result = uploadedImage
        ? await editImage(prompt, uploadedImage.base64, uploadedImage.mimeType)
        : await generateImage(prompt);
      setGeneratedImage(result);
    } catch (error) {
      console.error('Gemini API error:', error);
      setStatus({ type: 'error', message: `An error occurred while generating the image: ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  }, [prompt, uploadedImage]);
  
  const handleSend = useCallback(async () => {
    if (!generatedImage) {
      setStatus({ type: 'error', message: 'No image to send.' });
      return;
    }
    if (!botToken || !chatId) {
      setStatus({ type: 'error', message: 'Telegram Bot Token and Chat ID are required.' });
      setShowConfig(true);
      return;
    }
    setIsLoading(true);
    setStatus(null);
    try {
      await sendPhoto(botToken, chatId, generatedImage, prompt);
      setStatus({ type: 'success', message: 'Image sent to Telegram successfully!' });
    } catch (error) {
      console.error('Telegram API error:', error);
      setStatus({ type: 'error', message: `Failed to send image to Telegram: ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  }, [generatedImage, botToken, chatId, prompt]);

  const isConfigValid = botToken && chatId;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Bot className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold tracking-tight text-white">Telegram AI Image Bot</h1>
          </div>
          <p className="text-gray-400">Generate images with AI and send them directly to your Telegram chat.</p>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-sm border border-gray-700 p-6 space-y-6">
          
          {isApiKeyMissing && <ApiKeyWarning />}

          {/* --- CONFIG SECTION --- */}
          <div className="border border-gray-700 rounded-lg">
            <button
              className="w-full flex justify-between items-center p-4 text-left"
              onClick={() => setShowConfig(!showConfig)}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-5 h-5 ${isConfigValid ? 'text-green-400' : 'text-yellow-400'}`} />
                <h2 className="font-semibold text-lg">Configuration</h2>
                {!isConfigValid && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">Incomplete</span>}
              </div>
              {showConfig ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {showConfig && (
              <div className="p-4 border-t border-gray-700 space-y-4">
                <div className="flex items-start gap-3 bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-md text-sm">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>Your credentials are saved in your browser's local storage. Avoid using this on a shared computer.</p>
                </div>
                <div>
                  <label htmlFor="botToken" className="block text-sm font-medium text-gray-300 mb-1">Telegram Bot Token</label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="Enter your bot token"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="chatId" className="block text-sm font-medium text-gray-300 mb-1">Chat ID</label>
                  <Input
                    id="chatId"
                    type="text"
                    placeholder="Enter your chat or channel ID"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                  />
                </div>
                <div className="text-right">
                  <button onClick={() => setShowHelp(!showHelp)} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    How to get these?
                  </button>
                </div>
                {showHelp && (
                  <div className="text-xs text-gray-400 space-y-2 p-3 bg-gray-900/50 rounded-md">
                    <p>1. <strong>Bot Token:</strong> Talk to <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">@BotFather</a> on Telegram and follow the instructions to create a new bot. It will give you a token.</p>
                    {/* Fix: Use a template literal to construct the URL dynamically and avoid JSX parsing errors. */}
                    <p>2. <strong>Chat ID:</strong> Add your bot to the desired chat. Send a message in the chat. Then, visit <code>{`https://api.telegram.org/bot${botToken || '<YOUR_TOKEN>'}/getUpdates`}</code>. Look for the `"chat":{'{'}"id":...{'}'}` value in the JSON response.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* --- PROMPT & UPLOAD SECTION --- */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full bg-gray-900/70 border border-gray-700 rounded-lg p-4 pr-12 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                rows={3}
                placeholder="Describe the image you want to create or edit..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ImageIcon className="absolute top-4 right-4 w-6 h-6 text-gray-500"/>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label htmlFor="file-upload" className="w-full sm:w-auto cursor-pointer flex-grow text-center px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-400 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <UploadCloud className="w-5 h-5 text-gray-400"/>
                  <span className="text-sm font-medium text-gray-300">{uploadedImage ? 'Change image' : 'Upload to edit (optional)'}</span>
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
              </label>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt || isApiKeyMissing}
                title={isApiKeyMissing ? "Cannot generate: Google AI API Key is not configured." : ""}
                className="w-full sm:w-auto"
              >
                {isLoading && !generatedImage ? <Spinner /> : <><Bot className="w-5 h-5"/><span>Generate</span></>}
              </Button>
            </div>

            {uploadedImage && (
              <div className="relative w-fit bg-gray-900/50 p-2 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Image to edit:</p>
                <img src={uploadedImage.base64} alt="Upload preview" className="w-20 h-20 object-cover rounded-md" />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 hover:bg-red-500"
                >
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>
            )}
          </div>

          {/* --- STATUS & RESULT SECTION --- */}
          {status && (
            <div className={`flex items-center gap-3 p-3 rounded-md text-sm ${
              status.type === 'success'
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-red-900/50 text-red-300 border border-red-700'
            }`}>
              {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{status.message}</span>
              <button onClick={() => setStatus(null)} className="ml-auto"><X className="w-5 h-5" /></button>
            </div>
          )}

          {isLoading && !generatedImage && (
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-400">Generating your image... this may take a moment.</p>
            </div>
          )}

          {generatedImage && (
            <div className="space-y-4">
              <ImagePreview src={generatedImage} alt="Generated by AI" />
              <Button onClick={handleSend} disabled={isLoading} className="w-full">
                {isLoading ? <Spinner /> : <><Send className="w-5 h-5" /><span>Send to Telegram</span></>}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
