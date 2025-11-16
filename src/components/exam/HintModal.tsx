import type { Question } from '../../types';
import LatexRenderer from '../LatexRenderer';

interface HintModalProps {
  question: Question;
  onClose: () => void;
}

export default function HintModal({ question, onClose }: HintModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-yellow-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            💡 힌트
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">문제</h3>
            <LatexRenderer
              text={question.question || ''}
              className="text-gray-700 leading-relaxed"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">문제 풀이</h3>
            <LatexRenderer
              text={question.explanation || ''}
              className="text-gray-700 leading-relaxed"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
