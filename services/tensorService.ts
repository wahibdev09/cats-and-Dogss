import { ClassItem, ModelType, PredictionResult, TrainingMetrics } from '../types';

// We use the global window object for TF to avoid complex bundler setup issues with ESM/CJS interop in this environment
// In a real project, we would: import * as tf from '@tensorflow/tfjs';
declare global {
  interface Window {
    tf: any;
    mobilenet: any;
    knnClassifier: any;
  }
}

let classifier: any = null;
let mobilenetModel: any = null;

export const loadMobileNet = async () => {
  if (!window.mobilenet || !window.knnClassifier) {
    throw new Error("TensorFlow models not loaded via CDN");
  }
  if (!mobilenetModel) {
    console.log("Loading MobileNet...");
    mobilenetModel = await window.mobilenet.load();
    classifier = window.knnClassifier.create();
    console.log("MobileNet Loaded");
  }
};

const imageToTensor = (imgElement: HTMLImageElement) => {
  return window.tf.browser.fromPixels(imgElement);
};

export const trainCNN = async (
  classes: ClassItem[], 
  onProgress: (progress: number) => void
): Promise<TrainingMetrics> => {
  await loadMobileNet();
  
  if (classifier) {
    classifier.clearAllClasses();
  }

  let totalImages = classes.reduce((acc, c) => acc + c.samples.length, 0);
  let processed = 0;
  let correctPredictions = 0;
  const confusionMatrix: Record<string, Record<string, number>> = {};

  // Initialize confusion matrix
  classes.forEach(c1 => {
    confusionMatrix[c1.name] = {};
    classes.forEach(c2 => {
      confusionMatrix[c1.name][c2.name] = 0;
    });
  });

  // Train (Add Examples)
  for (const cls of classes) {
    for (const sample of cls.samples) {
      const img = new Image();
      img.src = sample;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const activation = mobilenetModel.infer(img, true);
      classifier.addExample(activation, cls.name);
      
      // Memory cleanup for the tensor
      activation.dispose();

      processed++;
      onProgress(Math.round((processed / totalImages) * 100));
      
      // Artificial delay for UX "training" feel
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Evaluate (Self-Validation for demo purposes as we have small data)
  // In a real app, we would split train/test
  for (const cls of classes) {
     for (const sample of cls.samples) {
        const img = new Image();
        img.src = sample;
        await new Promise((resolve) => { img.onload = resolve; });
        
        const activation = mobilenetModel.infer(img, true);
        const result = await classifier.predictClass(activation);
        
        if (result.label === cls.name) {
          correctPredictions++;
        }
        
        if (confusionMatrix[cls.name] && result.label) {
            confusionMatrix[cls.name][result.label] = (confusionMatrix[cls.name][result.label] || 0) + 1;
        }
        activation.dispose();
     }
  }

  // Flatten Confusion Matrix for D3/Recharts
  const flatMatrix: any[] = [];
  Object.keys(confusionMatrix).forEach(actual => {
    Object.keys(confusionMatrix[actual]).forEach(predicted => {
        flatMatrix.push({
            actual,
            predicted,
            count: confusionMatrix[actual][predicted]
        });
    });
  });

  return {
    accuracy: totalImages > 0 ? correctPredictions / totalImages : 0,
    totalSamples: totalImages,
    confusionMatrix: flatMatrix
  };
};

export const predictCNN = async (imageBase64: string): Promise<PredictionResult> => {
  if (!classifier || !mobilenetModel) {
     return { modelName: ModelType.CNN, className: "Not Trained", confidence: 0 };
  }

  const img = new Image();
  img.src = imageBase64;
  await new Promise((resolve) => { img.onload = resolve; });

  const activation = mobilenetModel.infer(img, true);
  const result = await classifier.predictClass(activation);
  activation.dispose(); // clean up tensor

  // Get confidences
  const confidences = result.confidences;
  const maxConfidence = confidences[result.label] || 0;

  return {
    modelName: ModelType.CNN,
    className: result.label,
    confidence: maxConfidence,
    reasoning: "Matched features from MobileNet embeddings."
  };
};

// Simple Histogram-based Classifier (Baselines)
export const predictSimple = async (imageBase64: string, classes: ClassItem[]): Promise<PredictionResult> => {
  // Calculate average brightness/color of the input
  const getAvgColor = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 50; // resize for speed
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if(!ctx) return {r:0, g:0, b:0};
    ctx.drawImage(img, 0, 0, 50, 50);
    const data = ctx.getImageData(0,0,50,50).data;
    let r=0, g=0, b=0;
    for(let i=0; i<data.length; i+=4) {
      r += data[i];
      g += data[i+1];
      b += data[i+2];
    }
    const count = data.length / 4;
    return { r: r/count, g: g/count, b: b/count };
  };

  const inputImg = new Image();
  inputImg.src = imageBase64;
  await new Promise(r => inputImg.onload = r);
  const inputColor = getAvgColor(inputImg);

  let bestClass = "Unknown";
  let minDistance = Infinity;

  // Compare against average of each class (Centroid)
  for (const cls of classes) {
    if (cls.samples.length === 0) continue;
    
    // Calculate class centroid (simplified: just take average of first 3 samples to save time)
    let cr=0, cg=0, cb=0;
    let count = 0;
    for (const s of cls.samples.slice(0, 5)) {
        const sImg = new Image();
        sImg.src = s;
        await new Promise(r => sImg.onload = r);
        const sc = getAvgColor(sImg);
        cr += sc.r; cg += sc.g; cb += sc.b;
        count++;
    }
    const centroid = { r: cr/count, g: cg/count, b: cb/count };
    
    // Euclidean distance
    const dist = Math.sqrt(
        Math.pow(inputColor.r - centroid.r, 2) + 
        Math.pow(inputColor.g - centroid.g, 2) + 
        Math.pow(inputColor.b - centroid.b, 2)
    );

    if (dist < minDistance) {
        minDistance = dist;
        bestClass = cls.name;
    }
  }

  // Normalize distance to a confidence roughly
  const confidence = Math.max(0, 1 - (minDistance / 255)); 

  return {
    modelName: ModelType.SIMPLE,
    className: bestClass,
    confidence: confidence,
    reasoning: "Based on average RGB color distance (Simple Heuristic)."
  };
};