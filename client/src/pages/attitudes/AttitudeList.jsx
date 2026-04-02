import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2 } from 'lucide-react';

function AttitudeFormModal({ attitude, students, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: attitude?.student_id || '',
    date: attitude?.date?.slice(0, 10) || '',
    subject_name: attitude?.subject_name || '',
    content: attitude?.content || '',
    rating: attitude?.rating || '보통',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (attitude?.id) {
        await api.put(`/attitudes/${attitude.id}`, form);
        toast.success('태도 기록이 수정되었습니다.');
      } else {
        await api.post('/attitudes', form);
        toast.success('태도 기록이 등록되었습니다.');
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
    <Modal title={attitude ? '태도 기록 수정' : '태도 기록 등록'} onClose={onClose}>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
          <input type="text" value={form.subject_name} onChange={(e) => setForm(p => ({ ...p, subject_name: e.target.value }))} required placeholder="과목명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가</label>
          <select value={form.rating} onChange={(e) => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {['매우우수', '우수', '보통', '미흡', '매우미흡'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{loading ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AttitudeList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [attitudes, setAttitudes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
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
      if (subjectFilter) params.subject_name = subjectFilter;
      if (ratingFilter) params.rating = ratingFilter;
      const res = await api.get('/attitudes', { params });
      const data = res.data.data;
      setAttitudes(data?.attitudes || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '태도 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, startDate, endDate, subjectFilter, ratingFilter]);

  const ratingColors = { '매우우수': 'bg-emerald-100 text-emerald-700', '우수': 'bg-green-100 text-green-700', '보통': 'bg-yellow-100 text-yellow-700', '미흡': 'bg-orange-100 text-orange-700', '매우미흡': 'bg-red-100 text-red-700' };

  const columns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    { key: 'subject_name', label: '과목' },
    { key: 'content', label: '내용' },
    { key: 'rating', label: '평가', render: (v) => <span className={`text-xs px-2 py-0.5 rounded-full ${ratingColors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span> },
    { key: 'teacher_name', label: '기록교사' },
    ...(isTeacher ? [{
      key: 'edit', label: '수정',
      render: (_, row) => <button onClick={() => { setEditItem(row); setShowForm(true); }} className="text-gray-400 hover:text-indigo-600"><Edit2 size={15} /></button>
    }] : []),
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '태도 관리' : user?.role === 'parent' ? '자녀 태도' : '내 태도'}</h1>
        {isTeacher && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />태도 등록
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); reset(); }} placeholder="과목 필터" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">전체 평가</option>
            {['매우우수', '우수', '보통', '미흡', '매우미흡'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={attitudes} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <AttitudeFormModal
          attitude={editItem}
          students={students}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
