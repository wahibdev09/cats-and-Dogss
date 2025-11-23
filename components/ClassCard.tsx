import React, { useState } from 'react';
import { ClassItem } from '../types';
import WebcamCapture from './WebcamCapture';
import { Trash2, Upload, Camera } from 'lucide-react';

interface ClassCardProps {
  classItem: ClassItem;
  color: string;
  onUpdate: (updated: ClassItem) => void;
  onDelete: (id: string) => void;
  isTraining: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, color, onUpdate, onDelete, isTraining }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = (base64: string) => {
    onUpdate({
      ...classItem,
      samples: [...classItem.samples, base64]
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleCapture(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const deleteSample = (index: number) => {
    const newSamples = [...classItem.samples];
    newSamples.splice(index, 1);
    onUpdate({ ...classItem, samples: newSamples });
  };

  return (
    <div className={`relative flex flex-col bg-slate-800 rounded-xl shadow-lg border-l-4 transition-all duration-200 ${isTraining ? 'opacity-50 pointer-events-none' : ''}`} style={{ borderColor: color }}>
      <div className="p-4 flex justify-between items-center border-b border-slate-700">
        <input 
          value={classItem.name} 
          onChange={(e) => onUpdate({ ...classItem, name: e.target.value })}
          className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b border-slate-500 w-full mr-4"
          placeholder="Class Name"
        />
        <button onClick={() => onDelete(classItem.id)} className="text-slate-500 hover:text-red-400">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex gap-2 items-center justify-center">
            <div className="flex-1">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Add Image Samples</p>
                <div className="flex gap-2">
                    <button 
                        onMouseDown={() => setIsCapturing(true)}
                        onMouseUp={() => setIsCapturing(false)}
                        onMouseLeave={() => setIsCapturing(false)}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors active:bg-emerald-600 active:text-white"
                    >
                        <Camera size={20} />
                        <span className="text-xs font-medium">Hold to Record</span>
                    </button>
                    <label className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                        <Upload size={20} />
                        <span className="text-xs font-medium">Upload</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        </div>

        {/* Hidden Webcam for Logic */}
        <div className="hidden">
           <WebcamCapture active={true} onCapture={handleCapture} autoCapture={isCapturing} />
        </div>

        <div className="flex-1 min-h-[100px] bg-slate-900/50 rounded-lg p-2 overflow-y-auto max-h-[200px]">
          <div className="flex flex-wrap gap-2">
            {classItem.samples.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs italic p-4">
                    No samples yet. Add some images to train the model.
                </div>
            )}
            {classItem.samples.map((sample, idx) => (
              <div key={idx} className="relative group w-12 h-12 rounded-md overflow-hidden border border-slate-600">
                <img src={sample} alt="sample" className="w-full h-full object-cover" />
                <button 
                    onClick={() => deleteSample(idx)}
                    className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex text-white"
                >
                    &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
            {classItem.samples.length} samples
        </div>
      </div>
    </div>
  );
};

export default ClassCard;