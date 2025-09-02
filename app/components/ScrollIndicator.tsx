'use client';

interface ScrollIndicatorProps {
  targetId: string;
  className?: string;
}

export default function ScrollIndicator({ targetId, className = '' }: ScrollIndicatorProps) {
  const handleScroll = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScroll();
    }
  };

  return (
    <div 
      className={`cursor-pointer hover:scale-110 transition-transform duration-300 ${className}`}
      role="button" 
      tabIndex={0}
      aria-label="Scroll down to explore features"
      onKeyDown={handleKeyDown}
      onClick={handleScroll}
    >
      <div className="flex flex-col items-center">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full mb-2 relative">
          <div className="w-1 h-3 bg-white/60 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-bounce"></div>
        </div>
        <div className="text-white/60 text-sm">Explore</div>
      </div>
    </div>
  );
}