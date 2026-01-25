import { Emotion } from '@/types';

interface EmotionBadgeProps {
  emotion: Emotion;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const emotionConfig: Record<Emotion, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  excited: { emoji: '🤩', label: 'Excited', color: 'bg-pink-100 text-pink-600 border-pink-200' },
  tired: { emoji: '😴', label: 'Tired', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  stressed: { emoji: '😰', label: 'Stressed', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  sad: { emoji: '😢', label: 'Sad', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  guilty: { emoji: '😅', label: 'Guilty', color: 'bg-purple-100 text-purple-600 border-purple-200' },
};

export default function EmotionBadge({ emotion, size = 'md', showLabel = true }: EmotionBadgeProps) {
  const config = emotionConfig[emotion];
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5 rounded-full',
    md: 'text-base px-4 py-2 rounded-2xl',
    lg: 'text-lg px-5 py-2.5 rounded-2xl',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 border-2 font-medium ${config.color} ${sizeClasses[size]}`}>
      <span className="text-lg">{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
