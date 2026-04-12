import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2, Share2 } from 'lucide-react';

function FeedbackFormModal({ feedback, students, teacherId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: feedback?.student_id || '',
    category: feedback?.category || '',
    content: feedback?.content || '',
    shared_with_student: feedback?.shared_with_student || false,
    shared_with_parent: feedback?.shared_with_parent || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (feedback?._id) {
        await api.put(`/feedbacks/${feedback._id}`, form);
        toast.success('피드백이 수정되었습니다.');
      } else {
        await api.post('/feedbacks', { ...form, teacher_id: teacherId });
        toast.success('피드백이 등록되었습니다.');
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
    <Modal title={feedback ? '피드백 수정' : '피드백 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
          <select value={form.student_id} onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">학생 선택</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}-{s.class_num})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
          <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">분류 선택</option>
            <option value="성적">성적</option>
            <option value="행동">행동</option>
            <option value="출결">출결</option>
            <option value="태도">태도</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.shared_with_student} onChange={(e) => setForm(p => ({ ...p, shared_with_student: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            학생에게 공유
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.shared_with_parent} onChange={(e) => setForm(p => ({ ...p, shared_with_parent: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            학부모에게 공유
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

export default function FeedbackList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get('/feedbacks', { params });
      const data = res.data.data;
      setFeedbacks(data?.feedbacks || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '피드백을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, categoryFilter, startDate, endDate]);

  const handleToggleShare = async (id, field, currentValue) => {
    try {
      await api.patch(`/feedbacks/${id}/share`, { [field]: !currentValue });
      toast.success('공유 설정이 변경되었습니다.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  const SharedBadge = ({ value, label }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {value ? `${label} 공유` : `${label} 미공유`}
    </span>
  );

  const columns = [
    { key: 'created_at', label: '작성일', render: (v) => v?.slice(0, 10) },
    { key: 'category', label: '분류' },
    { key: 'content', label: '내용', render: (v) => <span className="truncate max-w-xs block">{v}</span> },
    {
      key: 'shared_with_student', label: '학생공유',
      render: (v, row) => isTeacher ? (
        <button onClick={() => handleToggleShare(row._id, 'shared_with_student', v)} className="focus:outline-none">
          <SharedBadge value={v} label="학생" />
        </button>
      ) : <SharedBadge value={v} label="학생" />
    },
    {
      key: 'shared_with_parent', label: '학부모공유',
      render: (v, row) => isTeacher ? (
        <button onClick={() => handleToggleShare(row._id, 'shared_with_parent', v)} className="focus:outline-none">
          <SharedBadge value={v} label="학부모" />
        </button>
      ) : <SharedBadge value={v} label="학부모" />
    },
    ...(isTeacher ? [{
      key: 'edit', label: '수정',
      render: (_, row) => <button onClick={() => { setEditItem(row); setShowForm(true); }} className="text-gray-400 hover:text-indigo-600"><Edit2 size={15} /></button>
    }] : []),
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '피드백 관리' : user?.role === 'parent' ? '자녀 피드백' : '내 피드백'}</h1>
        {isTeacher && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />피드백 등록
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); reset(); }} placeholder="분류 필터" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={feedbacks} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <FeedbackFormModal
          feedback={editItem}
          students={students}
          teacherId={user?.profile?._id}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
