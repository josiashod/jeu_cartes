'use client';

import { useState } from 'react';

interface EmojiPickerProps {
    selectedEmoji: string;
    onSelect: (emoji: string) => void;
}

const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌'],
    objects: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '⚡', '💥', '🔥', '🌈', '☀️', '🌙', '⭐', '🎯', '🎲', '🎰', '🎪'],
};

export default function EmojiPicker({ selectedEmoji, onSelect }: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('smileys');

    return (
        <div className="bg-white border-4 border-gray-800 rounded-lg shadow-[0_6px_0_#2c3e50] p-4 max-w-lg">
            {/* Category tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {Object.keys(emojiCategories).map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category as keyof typeof emojiCategories)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border-2 ${activeCategory === category
                            ? 'bg-blue-500 text-white border-blue-700 shadow-[0_3px_0_#1e40af]'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {emojiCategories[activeCategory].map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        className={`text-3xl p-2 rounded-lg hover:bg-blue-100 transition-all transform hover:scale-110 border-2 ${selectedEmoji === emoji ? 'bg-blue-100 border-blue-500' : 'border-transparent'
                            }`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Selected emoji display */}
            {selectedEmoji && (
                <div className="mt-4 pt-4 border-t-2 border-gray-300 text-center">
                    <p className="text-sm font-bold text-gray-600 mb-2">Selected:</p>
                    <div className="text-6xl">{selectedEmoji}</div>
                </div>
            )}
        </div>
    );
}
