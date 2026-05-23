const SUGGESTIONS_BY_ROLE = {
  teacher: [
    '이번 학기 우리 반 성적 분포 알려줘',
    '수학 성적이 낮은 학생 있어?',
    '철수 최근 3학기 성적 추세 보여줘',
  ],
  parent: [
    '이번 학기 성적 요약 알려줘',
    '과목별 성적 비교해줘',
    '성적이 오른 과목이 있어?',
  ],
  student: [
    '내 이번 학기 성적 알려줘',
    '어떤 과목이 제일 좋아?',
    '성적이 떨어진 과목이 있어?',
  ],
};

function WelcomeMessage({ role, userName, onSuggestionClick }) {
  const suggestions = SUGGESTIONS_BY_ROLE[role] || SUGGESTIONS_BY_ROLE.student;

  const greeting =
    role === 'teacher'
      ? `안녕하세요 ${userName} 선생님!`
      : role === 'parent'
      ? `안녕하세요 ${userName} 학부모님!`
      : `안녕하세요 ${userName}!`;

  const subtitle =
    role === 'teacher'
      ? '담당 학급 학생들의 성적 데이터를 물어보세요.'
      : role === 'parent'
      ? '자녀의 학습 현황을 편하게 질문해보세요.'
      : '나의 학습 현황을 확인해보세요.';

  return (
    <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
        🎓
      </div>
      <div>
        <p className="font-semibold text-gray-800 text-base">{greeting}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-2 w-full mt-2">
        <p className="text-xs text-gray-400 font-medium">이런 걸 물어볼 수 있어요</p>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s)}
            className="text-left text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WelcomeMessage;
