import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WebcamCaptureProps {
  onCapture: (base64: string) => void;
  active: boolean;
  label?: string;
  autoCapture?: boolean;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, active, label, autoCapture = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (active && !stream) {
      navigator.mediaDevices.getUserMedia({ video: { width: 224, height: 224 } })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => setError("Camera access denied"));
    }
    
    return () => {
      // Cleanup only if component unmounts fully, usually we want to keep stream alive for smoothness
    };
  }, [active, stream]);

  const capture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 224, 224);
        const data = canvas.toDataURL('image/jpeg');
        onCapture(data);
      }
    }
  }, [onCapture]);

  useEffect(() => {
    let interval: any;
    if (active && autoCapture) {
      interval = setInterval(capture, 100); // High speed capture for holding button
    }
    return () => clearInterval(interval);
  }, [active, autoCapture, capture]);

  if (error) return <div className="text-red-500 text-sm p-2">{error}</div>;

  return (
    <div className="relative rounded-lg overflow-hidden bg-black aspect-square w-full max-w-[224px] mx-auto border-2 border-slate-700 shadow-lg">
       {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover transform scale-x-[-1]" 
      />
      {label && (
        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-1">
          {label}
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;