import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { TrainingMetrics } from '../types';

interface MetricsProps {
  metrics: TrainingMetrics | null;
}

const Metrics: React.FC<MetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="mt-6 bg-slate-800 p-6 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
        Model Evaluation
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Accuracy Card */}
        <div className="bg-slate-900 p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-slate-400 text-sm uppercase tracking-wider">Overall Accuracy</span>
            <div className="text-4xl font-black text-emerald-400 mt-2">
                {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <span className="text-slate-500 text-xs mt-1">Based on self-validation check</span>
        </div>

        {/* Confusion Matrix Visualization using Bar Chart for simplicity in this format */}
        <div className="h-48 w-full">
            <p className="text-xs text-slate-400 mb-2 text-center">Confusion Distribution (Actual vs Predicted)</p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.confusionMatrix}>
                    <XAxis dataKey="actual" tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}}
                        itemStyle={{color: '#e2e8f0'}}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="count" fill="#6366f1">
                        {metrics.confusionMatrix.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.actual === entry.predicted ? '#22c55e' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Metrics;