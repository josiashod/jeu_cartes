interface AdSpaceProps {
    variant?: 'banner' | 'sidebar' | 'square';
    className?: string;
}

export default function AdSpace({ variant = 'banner', className = '' }: AdSpaceProps) {
    const variants = {
        banner: 'w-full h-24',
        sidebar: 'w-64 h-96',
        square: 'w-64 h-64',
    };

    return (
        <div
            className={`${variants[variant]} ${className} bg-white border-4 border-dashed border-gray-400 rounded-lg flex items-center justify-center`}
        >
            <div className="text-center text-gray-500">
                <p className="text-sm font-bold">📢 Ad Space</p>
                <p className="text-xs text-gray-400">{variant}</p>
            </div>
        </div>
    );
}
