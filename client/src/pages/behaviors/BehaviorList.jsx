import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2 } from 'lucide-react';

function BehaviorFormModal({ behavior, students, teacherId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: behavior?.student_id || '',
    date: behavior?.date?.slice(0, 10) || '',
    category: behavior?.category || '긍정적',
    content: behavior?.content || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (behavior?.id) {
        await api.put(`/behaviors/${behavior.id}`, form);
        toast.success('행동 기록이 수정되었습니다.');
      } else {
        await api.post('/behaviors', { ...form, teacher_id: teacherId });
        toast.success('행동 기록이 등록되었습니다.');
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
    <Modal title={behavior ? '행동 기록 수정' : '행동 기록 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
          <select value={form.student_id} onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">학생 선택</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}-{s.class_num})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
          <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="긍정적">긍정적</option>
            <option value="개선필요">개선필요</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{loading ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function BehaviorList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [behaviors, setBehaviors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/behaviors', { params });
      const data = res.data.data;
      setBehaviors(data?.behaviors || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '행동 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, startDate, endDate, categoryFilter]);

  const renderStudent = (_, row) => {
    const s = row.student_id;
    if (!s) return '-';
    return `${s.user_id?.name || '-'} (${s.grade_year}-${s.class_num}-${s.student_num})`;
  };

  const columns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    ...(isTeacher ? [{ key: 'student_id', label: '학생', render: renderStudent }] : []),
    {
      key: 'category', label: '분류', render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v === '긍정적' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</span>
      )
    },
    { key: 'content', label: '내용' },
    { key: 'teacher_id', label: '기록교사', render: (v) => v?.user_id?.name || '-' },
    ...(isTeacher ? [{
      key: 'edit', label: '수정',
      render: (_, row) => <button onClick={() => { setEditItem(row); setShowForm(true); }} className="text-gray-400 hover:text-indigo-600"><Edit2 size={15} /></button>
    }] : []),
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '행동 관리' : user?.role === 'parent' ? '자녀 행동' : '내 행동'}</h1>
        {isTeacher && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />행동 등록
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">전체 분류</option>
            <option value="긍정적">긍정적</option>
            <option value="개선필요">개선필요</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={behaviors} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <BehaviorFormModal
          behavior={editItem}
          students={students}
          teacherId={user?.profile?._id}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
