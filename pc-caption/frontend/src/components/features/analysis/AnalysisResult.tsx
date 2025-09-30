'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, AlertCircle, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { GoogleSheetsIntegration } from '@/components/features/sheets/GoogleSheetsIntegration';
import type { AnalysisResponse } from '@/types/api';

interface AnalysisResultProps {
  result: AnalysisResponse;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(new Set());

  if (!result.success || !result.data) {
    return (
      <div className="mt-8 p-6 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
            <p className="text-red-700 mt-1">{result.error || 'An unknown error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const downloadReport = () => {
    if (!result.data?.report) return;

    const blob = new Blob([result.data.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { screenshotAnalyses, analyses, businessInference, report } = result.data;
  const displayAnalyses = screenshotAnalyses || analyses || [];

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
        </div>
        {report && (
          <Button onClick={downloadReport} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        )}
      </div>

      {businessInference && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Business Activity Inference</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800">Overall Activity</h4>
              <p className="text-gray-700 mt-1">{businessInference.overallActivity}</p>
            </div>

            <div>
              <h4 className="font-medium text-blue-800">Activity Type</h4>
              <p className="text-gray-700 mt-1">{businessInference.activityType}</p>
            </div>

            {businessInference.keyFindings.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800">Key Findings</h4>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {businessInference.keyFindings.map((finding, i) => (
                    <li key={i} className="text-gray-700">{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {businessInference.toolsUsed.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800">Tools Used</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {businessInference.toolsUsed.map((tool, i) => (
                      <li key={i} className="text-gray-700 text-sm">{tool}</li>
                    ))}
                  </ul>
                </div>
              )}

              {businessInference.dataProcessed.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800">Data Processed</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {businessInference.dataProcessed.map((data, i) => (
                      <li key={i} className="text-gray-700 text-sm">{data}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {displayAnalyses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Screenshot Analyses</h3>

          {displayAnalyses.map((analysis, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{analysis.screenshot}</span>
                </div>
                {expandedSections.has(index) ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {expandedSections.has(index) && (
                <div className="p-4 bg-white">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis.analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {report && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Report</h3>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Google Sheets Integration */}
      <GoogleSheetsIntegration 
        analysisResult={report || displayAnalyses.map(a => a.analysis).join('\n\n')}
        fileName={displayAnalyses[0]?.screenshot || 'analysis'}
      />
    </div>
  );
};