import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EmbedPlayer({ videoUrl }: { videoUrl: string; onEnded?: () => void }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  return (
    <div className="relative h-full w-full bg-black">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        title="Quay lại" aria-label="Quay lại"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <iframe
        src={videoUrl}
        className="h-full w-full"
        style={{ aspectRatio: '16/9' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
