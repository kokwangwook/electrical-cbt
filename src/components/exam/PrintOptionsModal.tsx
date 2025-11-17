interface PrintOptionsModalProps {
  printOption: 'questionsOnly' | 'withAnswers' | 'withExplanations';
  onOptionChange: (option: 'questionsOnly' | 'withAnswers' | 'withExplanations') => void;
  onPrint: () => void;
  onClose: () => void;
}

export default function PrintOptionsModal({
  printOption,
  onOptionChange,
  onPrint,
  onClose,
}: PrintOptionsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 non-printable" role="dialog" aria-modal="true" aria-labelledby="print-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 id="print-modal-title" className="text-2xl font-bold text-gray-800 mb-4">🖨️ 인쇄 옵션 선택</h2>
        <p className="text-sm text-gray-600 mb-6">인쇄할 내용을 선택하세요</p>

        <div className="space-y-3 mb-6">
          {/* 문제만 인쇄 */}
          <button
            onClick={() => onOptionChange('questionsOnly')}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              printOption === 'questionsOnly'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  printOption === 'questionsOnly'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {printOption === 'questionsOnly' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-bold text-gray-800">📝 문제만 인쇄</div>
                <div className="text-sm text-gray-600">문제와 선택지만 인쇄 (정답 표시 없음)</div>
              </div>
            </div>
          </button>

          {/* 정답 표시 인쇄 */}
          <button
            onClick={() => onOptionChange('withAnswers')}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              printOption === 'withAnswers'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  printOption === 'withAnswers'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {printOption === 'withAnswers' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-bold text-gray-800">✅ 정답 표시 인쇄</div>
                <div className="text-sm text-gray-600">문제 + 정답 표시 (파란색 ✓ 표시)</div>
              </div>
            </div>
          </button>

          {/* 정답 + 해설 인쇄 */}
          <button
            onClick={() => onOptionChange('withExplanations')}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              printOption === 'withExplanations'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  printOption === 'withExplanations'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {printOption === 'withExplanations' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-bold text-gray-800">📚 정답 + 해설 인쇄</div>
                <div className="text-sm text-gray-600">문제 + 정답 + 해설 전체</div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={onPrint}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            인쇄하기
          </button>
        </div>
      </div>
    </div>
  );
}
