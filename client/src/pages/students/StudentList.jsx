import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import StudentCreateForm from '../../components/students/StudentCreateForm';
import { usePagination } from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus, CheckCircle, Clock } from 'lucide-react';

export default function StudentList() {
  const { user } = useAuth();
  const teacherProfile = user?.role === 'teacher' ? user?.profile : null;
  const isTeacher = user?.role === 'teacher';

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeYear, setGradeYear] = useState(teacherProfile?.grade_year?.toString() || '');
  const [classNum, setClassNum] = useState(teacherProfile?.class_num?.toString() || '');
  const [showCreate, setShowCreate] = useState(false);
  const { page, setPage, limit, reset } = usePagination(20);

  // 학생/학부모는 학생 관리 페이지에 직접 접근 불가
  if (user && user.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

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
      setTotal(res.data.pagination?.total ?? data?.total ?? 0);
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

  const handleCreated = () => {
    setShowCreate(false);
    reset();
    fetchStudents();
  };

  const columns = [
    { key: '_index', label: '번호', render: (_, row, index) => (page - 1) * limit + index + 1 },
    {
      key: 'name',
      label: '이름',
      render: (_, row) => row.name || row.user_id?.name || '-',
    },
    { key: 'email', label: '이메일', render: (_, row) => row.email || row.user_id?.email || '-' },
    { key: 'grade_year', label: '학년' },
    { key: 'class_num', label: '반' },
    { key: 'student_num', label: '번호' },
    {
      key: 'status',
      label: '상태',
      render: (_, row) =>
        row.user_id ? (
          <span className="text-xs px-2 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 inline-flex items-center gap-1">
            <CheckCircle size={12} /> 활성화
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200 inline-flex items-center gap-1">
            <Clock size={12} /> 사전 등록
          </span>
        ),
    },
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">학생 관리</h1>
        {isTeacher && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus size={16} />
            학생 추가
          </button>
        )}
      </div>

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

      {showCreate && (
        <Modal title="학생 사전 등록" onClose={() => setShowCreate(false)}>
          <StudentCreateForm
            onSuccess={handleCreated}
            onCancel={() => setShowCreate(false)}
            defaultGradeYear={gradeYear}
            defaultClassNum={classNum}
          />
        </Modal>
      )}
    </div>
  );
}
