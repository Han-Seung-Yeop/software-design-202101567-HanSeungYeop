import { useEffect, useState } from 'react';
import api from '../../api/axios';

function ChildSelector({ onSelect }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/chat/children')
      .then((res) => setChildren(res.data.data || []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-6">자녀 정보를 불러오는 중...</p>;
  }

  if (!children.length) {
    return <p className="text-sm text-gray-400 text-center py-6">연결된 자녀 정보가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
        👨‍👩‍👧
      </div>
      <p className="text-sm font-medium text-gray-700">어떤 자녀에 대해 알아볼까요?</p>
      <div className="flex flex-col gap-2 w-full">
        {children.map((child) => (
          <button
            key={child.studentId}
            onClick={() => onSelect(child)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-800 text-sm font-medium transition-colors text-left"
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChildSelector;
