import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import SearchBar from '../../components/common/SearchBar';
import { ArrowLeft, Search } from 'lucide-react';

export default function CounselingSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.get('/counselings/search', { params: { q: query } });
      const data = res.data.data;
      setResults(data?.counselings || data || []);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/counselings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">상담 기록 검색</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-3">
          <div className="flex-1" onKeyDown={handleKeyDown}>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="상담 내용으로 검색..."
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <Search size={16} />
            )}
            검색
          </button>
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">검색 결과 {results.length}건</p>

          {results.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">검색 결과가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {results.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{item.student_name}</span>
                      {item.student_grade && (
                        <span className="text-xs text-gray-400">
                          {item.student_grade}학년 {item.student_class}반
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{item.counseling_date?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{item.main_content}</p>
                  {item.next_plan && (
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="font-medium">다음 계획: </span>{item.next_plan}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
