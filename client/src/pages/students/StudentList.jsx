import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';

export default function StudentList() {
  const { user } = useAuth();
  const teacherProfile = user?.role === 'teacher' ? user?.profile : null;

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeYear, setGradeYear] = useState(teacherProfile?.grade_year?.toString() || '');
  const [classNum, setClassNum] = useState(teacherProfile?.class_num?.toString() || '');
  const { page, setPage, limit, reset } = usePagination(20);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.name = search;
      if (gradeYear) params.grade_year = gradeYear;
      if (classNum) params.class_num = classNum;

      const res = await api.get('/students', { params });
      const data = res.data.data;
      setStudents(data?.students || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '학생 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, limit, gradeYear, classNum]);

  const handleSearch = () => {
    reset();
    fetchStudents();
  };

  const columns = [
    { key: '_index', label: '번호', render: (_, row, index) => index + 1 },
    { key: 'name', label: '이름', render: (_, row) => row.user_id?.name || '-' },
    { key: 'grade_year', label: '학년' },
    { key: 'class_num', label: '반' },
    { key: 'student_num', label: '번호' },
    {
      key: 'actions',
      label: '상세보기',
      render: (_, row) => (
        <Link
          to={`/students/${row._id}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          상세보기
        </Link>
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">학생 관리</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="학생 이름 검색..."
            />
          </div>

          <select
            value={gradeYear}
            onChange={(e) => { setGradeYear(e.target.value); reset(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체 학년</option>
            {[1, 2, 3].map(y => (
              <option key={y} value={y}>{y}학년</option>
            ))}
          </select>

          <select
            value={classNum}
            onChange={(e) => { setClassNum(e.target.value); reset(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체 반</option>
            {[1, 2, 3, 4, 5, 6].map(c => (
              <option key={c} value={c}>{c}반</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">총 {total}명</p>
        </div>
        <Table columns={columns} data={students} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
