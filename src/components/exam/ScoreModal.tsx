import type { Question } from '../../types';
import { getWrongAnswers, removeWrongAnswer } from '../../services/storage';

interface ScoreResult {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  percentage: number;
  encouragement?: string;
  answeredCount?: number;
}

interface ScoreModalProps {
  scoreResult: ScoreResult;
  examMode: string;
  displayQuestions: Question[];
  answers: { [key: number]: number };
  onClose: () => void;
  onSubmit: () => void;
}

export default function ScoreModal({
  scoreResult,
  examMode,
  displayQuestions,
  answers,
  onClose,
  onSubmit,
}: ScoreModalProps) {
  const handleConfirm = () => {
    // 오답노트 모드일 때 정답 문제를 오답노트에서 제거
    if (examMode === 'wrong' && scoreResult) {
      console.log('📊 확인 버튼 클릭 - 정답 문제 제거 시작');

      const currentWrongAnswers = getWrongAnswers();
      let removedCount = 0;
      const beforeCount = currentWrongAnswers.length;

      displayQuestions.forEach(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer !== undefined && userAnswer !== null && userAnswer === q.answer;

        if (isCorrect) {
          const existsInWrongAnswers = currentWrongAnswers.some(wa => wa.questionId === q.id);
          if (existsInWrongAnswers) {
            removeWrongAnswer(q.id);
            removedCount++;
          }
        }
      });

      const afterWrongAnswers = getWrongAnswers();
      console.log(`📊 제거 전: ${beforeCount}개, 제거 후: ${afterWrongAnswers.length}개, 제거된 문제: ${removedCount}개`);
    }

    // 실전 모의고사 모드일 때는 결과 페이지로 이동
    if (examMode === 'timedRandom') {
      onClose();
      onSubmit();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="score-modal-title">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 id="score-modal-title" className="text-3xl font-bold text-gray-800 mb-6">📊 채점 결과</h2>

          {/* 오답노트 모드일 때 */}
          {examMode === 'wrong' && scoreResult.encouragement ? (
            <>
              <div className="mb-6 p-6 rounded-lg bg-blue-100 border-4 border-blue-500">
                <div className="text-2xl font-bold mb-3 text-blue-800">
                  {scoreResult.encouragement}
                </div>
                {scoreResult.answeredCount !== undefined && scoreResult.answeredCount > 0 && (
                  <div className="text-lg text-blue-700">
                    {scoreResult.answeredCount}문제 응시해서 {scoreResult.correct}문제 맞췄습니다
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {scoreResult.answeredCount !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-semibold">응시한 문제</span>
                    <span className="text-blue-900 font-bold">{scoreResult.answeredCount}문제</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-semibold">정답</span>
                  <span className="text-green-900 font-bold">{scoreResult.correct}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-semibold">오답</span>
                  <span className="text-red-900 font-bold">{scoreResult.wrong}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-semibold">정답률</span>
                  <span className="text-blue-900 font-bold">{scoreResult.percentage}%</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`mb-6 p-6 rounded-lg ${
                scoreResult.score >= 60
                  ? 'bg-green-100 border-4 border-green-500'
                  : 'bg-red-100 border-4 border-red-500'
              }`}>
                <div className="text-5xl font-bold mb-2">
                  {scoreResult.score >= 60 ? '✅' : '❌'} {scoreResult.score}점
                </div>
                <div className="text-lg text-gray-700">
                  {scoreResult.score >= 60 ? '합격!' : '불합격'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">총 문제 수</span>
                  <span className="text-gray-900 font-bold">{scoreResult.total}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-semibold">정답</span>
                  <span className="text-green-900 font-bold">{scoreResult.correct}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-semibold">오답</span>
                  <span className="text-red-900 font-bold">{scoreResult.wrong}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-semibold">미답변</span>
                  <span className="text-yellow-900 font-bold">{scoreResult.unanswered}문제</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-semibold">정답률</span>
                  <span className="text-blue-900 font-bold">{scoreResult.percentage}%</span>
                </div>
              </div>
            </>
          )}

          <p className="text-sm text-gray-600 mb-6">
            💡 시험은 계속 진행할 수 있습니다. 완료 후 제출 버튼을 눌러주세요.
          </p>

          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
