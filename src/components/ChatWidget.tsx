import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Chat from '../chat/chat';
import type { IConfiguration } from '../typings';

interface ChatWidgetProps {
    userId: string;
    conf: IConfiguration;
}

export default function ChatWidget({ userId, conf }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Expose control to window for internal Chat close button
        window.botmanChatWidget = {
            open: () => setIsOpen(true),
            close: () => setIsOpen(false),
            toggle: () => setIsOpen(prev => !prev)
        };

        // Delay mounting chat slightly to prioritize LCP
        setTimeout(() => setIsLoaded(true), 1000);
    }, []);

    // Merge configuration with required layout overrides
    const widgetConf: IConfiguration = {
        ...conf,
        wrapperHeight: '100%', // Take full height of wrapper
        mobileHeight: '100%',
        desktopHeight: '100%'
    };

    if (!isLoaded) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            {/* Chat Window Container */}
            <div
                className={`
                    w-[95vw] md:w-[900px] h-[85vh] md:h-[800px] 
                    bg-white dark:bg-slate-900 
                    shadow-2xl rounded-2xl overflow-hidden 
                    transition-all duration-300 origin-bottom-right 
                    pointer-events-auto mb-4 border border-gray-200 dark:border-slate-800
                    ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 invisible'}
                `}
            >
                {/* Only render Chat content when it has been opened at least once or preloaded? 
                    Keeping it rendered allows state preservation (messages).
                */}
                <Chat userId={userId} conf={widgetConf} />
            </div>

            {/* Launcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto
                    w-14 h-14 rounded-full 
                    bg-gradient-to-r from-slate-900 to-blue-600 
                    hover:from-slate-800 hover:to-blue-500
                    text-white shadow-lg hover:shadow-xl hover:scale-105
                    flex items-center justify-center 
                    transition-all duration-300
                    focus:outline-none focus:ring-4 focus:ring-blue-500/30
                `}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                <div className={`transition-transform duration-300 relative w-6 h-6 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    {/* Chat Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`absolute inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>

                    {/* Close Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`absolute inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </div>
            </button>
        </div>
    );
}
