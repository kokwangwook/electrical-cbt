import { useState, useEffect, useCallback } from 'react';

interface UseExamTimerProps {
  initialStartTime: number;
  initialRemainingTime: number;
  examMode: string;
  questionsCount: number;
  answersCount: number;
  onTimeUp: () => void;
}

interface UseExamTimerReturn {
  remainingTime: number;
  startTime: number;
  isTimeReset: boolean;
  formatTime: (seconds: number) => string;
  resetTime: () => void;
  setStartTime: (time: number) => void;
  setRemainingTime: (time: number) => void;
}

export function useExamTimer({
  initialStartTime,
  initialRemainingTime,
  examMode,
  questionsCount,
  answersCount,
  onTimeUp,
}: UseExamTimerProps): UseExamTimerReturn {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [remainingTime, setRemainingTime] = useState(initialRemainingTime);
  const [isTimeReset, setIsTimeReset] = useState(false);
  const duration = 60 * 60; // 60분

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const resetTime = useCallback(() => {
    const newStartTime = Date.now();
    setStartTime(newStartTime);
    setRemainingTime(duration);
    setIsTimeReset(true);
    console.log('⏰ 시간 초기화: 60분으로 리셋됨');
  }, [duration]);

  // 타이머 (untimedRandom 모드는 시간 제한 없음)
  useEffect(() => {
    if (questionsCount === 0) return;
    // untimedRandom 모드는 타이머 작동하지 않음
    if (examMode === 'untimedRandom') {
      return;
    }

    const timer = setInterval(() => {
      // 시간 초기화를 한 경우: 원래 시험 시간(60분) 기준으로 계산
      if (isTimeReset) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setRemainingTime(remaining);

        // 시간이 모두 소진되면 자동 제출
        if (remaining === 0) {
          clearInterval(timer);
          alert('시험 시간이 종료되었습니다. 자동으로 제출됩니다.');
          onTimeUp();
        }
      } else {
        // 시간 초기화를 하지 않은 경우: 풀지 못한 문제당 1분씩 시간 부여
        const unansweredCount = questionsCount - answersCount;

        // 답변 기록이 없으면 60분부터 시작
        if (answersCount === 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          setRemainingTime(remaining);

          // 시간이 모두 소진되면 자동 제출
          if (remaining === 0) {
            clearInterval(timer);
            alert('시험 시간이 종료되었습니다. 자동으로 제출됩니다.');
            onTimeUp();
          }
        } else {
          // 답변 기록이 있으면 풀지 못한 문제당 1분씩 시간 부여
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const totalTime = unansweredCount * 60;
          const remaining = Math.max(0, totalTime - elapsed);
          setRemainingTime(remaining);

          // 시간이 모두 소진되면 자동 제출
          if (remaining === 0) {
            clearInterval(timer);
            alert('시험 시간이 종료되었습니다. 자동으로 제출됩니다.');
            onTimeUp();
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [questionsCount, answersCount, startTime, duration, isTimeReset, examMode, onTimeUp]);

  return {
    remainingTime,
    startTime,
    isTimeReset,
    formatTime,
    resetTime,
    setStartTime,
    setRemainingTime,
  };
}
