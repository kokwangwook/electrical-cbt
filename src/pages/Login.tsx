import { useState, useEffect } from 'react';
import { getMemberByCredentials, setCurrentUser, getCurrentExamSession, clearCurrentExamSession, saveCurrentExamSession, getMembers, initializeData, addLoginHistory } from '../services/storage';
import { saveLoginHistory } from '../services/supabaseService';

interface LoginProps {
  onLoginSuccess: () => void;
  onResumeExam?: () => void;
  onGoToRegister?: () => void;
}

export default function Login({ onLoginSuccess, onResumeExam, onGoToRegister }: LoginProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 페이지 로드 시 초기화 (누락된 회원 자동 추가)
  useEffect(() => {
    initializeData();
  }, []);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    // 입력값 검증
    if (!name.trim()) {
      setError('이름을 입력하세요.');
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError('전화번호를 입력하세요.');
      setLoading(false);
      return;
    }

    // 사용자 찾기 (이름, 전화번호, 이메일로)
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    
    console.log('🔍 로그인 시도:', { name: trimmedName, phone: trimmedPhone, email: trimmedEmail });
    
    const member = getMemberByCredentials(trimmedName, trimmedPhone, trimmedEmail);
    
    if (!member) {
      // 등록된 회원 목록 확인
      const allMembers = getMembers();
      console.log('📋 등록된 회원 목록:', allMembers.map(m => `${m.name} (${m.phone})`));
      
      let errorMessage = '';
      if (allMembers.length === 0) {
        errorMessage = '등록된 회원이 없습니다. 회원가입을 먼저 해주세요.';
      } else {
        errorMessage = `등록되지 않은 사용자입니다.\n\n입력한 이름: "${trimmedName}"\n입력한 전화번호: "${trimmedPhone}"${trimmedEmail ? `\n입력한 이메일: "${trimmedEmail}"` : ''}\n\n등록된 회원 목록:\n${allMembers.map((m, i) => `${i + 1}. ${m.name} (${m.phone})`).join('\n')}\n\n※ 이름과 전화번호가 정확히 일치해야 합니다.`;
      }
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    console.log('✅ 로그인 성공:', member.name, '(ID:', member.id + ')');

    // 로그인 성공
    setCurrentUser(member.id);

    // 로그인 기록 저장 (실패해도 로그인은 진행)
    const historySuccess = addLoginHistory(member.id, member.name);
    if (!historySuccess) {
      console.warn('⚠️ 로컬 로그인 기록 저장 실패');
    }

    // Supabase에 로그인 기록 저장 (비동기, 실패해도 무시)
    saveLoginHistory(member.id, member.name).then(success => {
      if (success) {
        console.log('✅ Supabase 로그인 기록 저장 성공');
      } else {
        console.warn('⚠️ Supabase 로그인 기록 저장 실패');
      }
    }).catch(err => {
      console.warn('⚠️ Supabase 로그인 기록 저장 오류:', err);
    });

    // 이전 시험 기록이 있는지 확인 (현재 사용자의 세션만 확인)
    const currentSession = getCurrentExamSession();
    
    // 다른 사용자의 세션이면 삭제
    if (currentSession && currentSession.userId !== undefined && currentSession.userId !== member.id) {
      console.log('⚠️ 다른 사용자의 세션 감지, 삭제합니다.');
      clearCurrentExamSession();
      setLoading(false);
      onLoginSuccess();
      return;
    }

    // 현재 사용자의 세션이 있는지 확인
    if (currentSession && currentSession.questions && currentSession.questions.length > 0) {
      // 세션에 userId가 없으면 현재 사용자로 설정 (기존 세션 호환성)
      if (currentSession.userId === undefined) {
        // 기존 세션에 userId 추가
        const updatedSession = { ...currentSession, userId: member.id };
        saveCurrentExamSession(updatedSession);
      }

      // 현재 사용자의 세션이면 팝업으로 선택하도록
      const confirmed = window.confirm(
        `⚠️ ${member.name}님, 이전에 풀던 시험이 있습니다!\n\n` +
        `진행 상황: ${Object.keys(currentSession.answers || {}).length}/${currentSession.questions.length} 문제 풀이 완료\n\n` +
        `✅ 확인: 이전 시험 이어서 풀기\n` +
        `❌ 취소: 새로운 시험 시작하기`
      );

      if (confirmed) {
        // 이전 시험 이어서 풀기
        setLoading(false);
        if (onResumeExam) {
          onResumeExam();
        } else {
          // 폴백: 홈으로 이동
          onLoginSuccess();
        }
        return;
      } else {
        // 취소하면 세션 삭제하고 새로운 시험 시작
        clearCurrentExamSession();
      }
    }

    setLoading(false);
    onLoginSuccess();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚡ 전기기능사 CBT</h1>
          <p className="text-gray-600">로그인</p>
        </div>

        {/* 로그인 폼 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="홍길동"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일 주소 (선택)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg mb-4`}
        >
          {loading ? '로그인 중...' : '🔑 로그인'}
        </button>

        {/* 회원가입 버튼 */}
        {onGoToRegister && (
          <div className="mt-4">
            <button
              onClick={onGoToRegister}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              📝 회원가입
            </button>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>회원가입 후 로그인하시면 학습 기록이 저장됩니다</strong>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            이름과 전화번호는 필수이며, 이메일은 선택사항입니다.
          </p>
        </div>

        {/* 관리자 페이지 링크 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => (window.location.href = '/admin')}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors duration-200"
          >
            🔧 관리자 페이지
          </button>
        </div>
      </div>
    </div>
  );
}
