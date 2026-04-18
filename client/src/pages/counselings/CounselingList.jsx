import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

function CounselingFormModal({ counseling, students, teacherId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: counseling?.student_id?._id || counseling?.student_id || '',
    counseling_date: counseling?.counseling_date?.slice(0, 10) || '',
    main_content: counseling?.main_content || '',
    next_plan: counseling?.next_plan || '',
    is_shared: counseling?.is_shared || false,
    shared_with_parent: counseling?.shared_with_parent || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (counseling?._id) {
        await api.put(`/counselings/${counseling._id}`, form);
        toast.success('상담 기록이 수정되었습니다.');
      } else {
        await api.post('/counselings', { ...form, teacher_id: teacherId });
        toast.success('상담 기록이 등록되었습니다.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={counseling ? '상담 기록 수정' : '상담 기록 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
          <select value={form.student_id} onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">학생 선택</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}-{s.class_num})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상담일</label>
          <input type="date" value={form.counseling_date} onChange={(e) => setForm(p => ({ ...p, counseling_date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주요내용</label>
          <textarea value={form.main_content} onChange={(e) => setForm(p => ({ ...p, main_content: e.target.value }))} required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">다음 계획</label>
          <textarea value={form.next_plan} onChange={(e) => setForm(p => ({ ...p, next_plan: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.is_shared} onChange={(e) => setForm(p => ({ ...p, is_shared: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            교사 공유
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.shared_with_parent} onChange={(e) => setForm(p => ({ ...p, shared_with_parent: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            학부모 공유
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{loading ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CounselingList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [counselings, setCounselings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSharedFilter, setIsSharedFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { page, setPage, limit, reset } = usePagination(20);

  useEffect(() => {
    if (isTeacher) {
      api.get('/students', { params: { limit: 200 } })
        .then(res => { const d = res.data.data; setStudents(d?.students || d || []); }).catch(() => {});
    }
  }, [isTeacher]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (selectedStudentId) params.student_id = selectedStudentId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (isSharedFilter !== '') params.is_shared = isSharedFilter;
      const res = await api.get('/counselings', { params });
      const data = res.data.data;
      setCounselings(data?.counselings || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '상담 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, selectedStudentId, startDate, endDate, isSharedFilter]);

  const handleToggleShare = async (id, field, currentValue) => {
    try {
      const endpoint = field === 'shared_with_parent' ? 'share-parent' : 'share';
      await api.patch(`/counselings/${id}/${endpoint}`, { [field]: !currentValue });
      toast.success('공유 설정이 변경되었습니다.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  const ShareBadge = ({ value, label, onClick }) => (
    <button onClick={onClick} className="focus:outline-none">
      <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {value ? `${label} 공유` : `${label} 미공유`}
      </span>
    </button>
  );

  const myTeacherId = user?.profile?._id;
  const isOwner = (row) => isTeacher && myTeacherId && row.teacher_id?._id === myTeacherId;

  const columns = [
    { key: 'counseling_date', label: '상담일', render: (v) => v?.slice(0, 10) },
    {
      key: 'student_id', label: '학생', render: (_, row) => {
        const s = row.student_id;
        if (!s) return '-';
        return `${s.user_id?.name || '-'} (${s.grade_year}-${s.class_num}-${s.student_num})`;
      }
    },
    { key: 'main_content', label: '주요내용', render: (v) => <span className="truncate max-w-xs block">{v}</span> },
    { key: 'teacher_id', label: '상담교사', render: (_, row) => row.teacher_id?.user_id?.name || '-' },
    {
      key: 'is_shared', label: '교사공유',
      render: (v, row) => isOwner(row) ? (
        <ShareBadge value={v} label="교사" onClick={() => handleToggleShare(row._id, 'is_shared', v)} />
      ) : <span className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v ? '공유' : '미공유'}</span>
    },
    {
      key: 'shared_with_parent', label: '학부모공유',
      render: (v, row) => isOwner(row) ? (
        <ShareBadge value={v} label="학부모" onClick={() => handleToggleShare(row._id, 'shared_with_parent', v)} />
      ) : <span className={`text-xs px-2 py-0.5 rounded-full ${v ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{v ? '공유' : '미공유'}</span>
    },
    ...(isTeacher ? [{
      key: 'edit', label: '수정',
      render: (_, row) => isOwner(row)
        ? <button onClick={() => { setEditItem(row); setShowForm(true); }} className="text-gray-400 hover:text-indigo-600"><Edit2 size={15} /></button>
        : <span className="text-gray-300">-</span>
    }] : []),
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '상담 관리' : user?.role === 'parent' ? '자녀 상담' : '상담'}</h1>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <>
              <Link to="/counselings/search" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Search size={16} />검색
              </Link>
              <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={16} />상담 등록
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          {isTeacher && (
            <select value={selectedStudentId} onChange={(e) => { setSelectedStudentId(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">전체 학생</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.user_id?.name}</option>)}
            </select>
          )}
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={isSharedFilter} onChange={(e) => { setIsSharedFilter(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">전체 공유상태</option>
            <option value="true">공유</option>
            <option value="false">미공유</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={counselings} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <CounselingFormModal
          counseling={editItem}
          students={students}
          teacherId={user?.profile?._id}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
