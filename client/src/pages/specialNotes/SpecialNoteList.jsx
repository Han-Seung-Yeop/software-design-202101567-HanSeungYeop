import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2 } from 'lucide-react';

function SpecialNoteFormModal({ note, students, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: note?.student_id || '',
    year: note?.year || new Date().getFullYear(),
    semester: note?.semester || 1,
    category: note?.category || '',
    content: note?.content || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, year: Number(form.year), semester: Number(form.semester) };
      if (note?.id) {
        await api.put(`/special-notes/${note.id}`, payload);
        toast.success('특기사항이 수정되었습니다.');
      } else {
        await api.post('/special-notes', payload);
        toast.success('특기사항이 등록되었습니다.');
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
    <Modal title={note ? '특기사항 수정' : '특기사항 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
          <select value={form.student_id} onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">학생 선택</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}-{s.class_num})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학년도</label>
            <input type="number" value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} required min="2000" max="2099" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학기</label>
            <select value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
          <input type="text" value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} required placeholder="예: 수상, 봉사, 동아리" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{loading ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function SpecialNoteList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
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
      if (yearFilter) params.year = yearFilter;
      if (semesterFilter) params.semester = semesterFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/special-notes', { params });
      const data = res.data.data;
      setNotes(data?.specialNotes || data?.special_notes || data || []);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '특기사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, yearFilter, semesterFilter, categoryFilter]);

  const renderStudent = (_, row) => {
    const s = row.student_id;
    if (!s) return '-';
    return `${s.user_id?.name || '-'} (${s.grade_year}-${s.class_num}-${s.student_num})`;
  };

  const columns = [
    ...(isTeacher ? [{ key: 'student_id', label: '학생', render: renderStudent }] : []),
    { key: 'year', label: '학년도' },
    { key: 'semester', label: '학기', render: (v) => `${v}학기` },
    { key: 'category', label: '분류' },
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
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '특기사항' : user?.role === 'parent' ? '자녀 특기사항' : '내 특기사항'}</h1>
        {isTeacher && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />특기사항 등록
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input type="number" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); reset(); }} placeholder="학년도" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24" />
          <select value={semesterFilter} onChange={(e) => { setSemesterFilter(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">전체 학기</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
          <input type="text" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); reset(); }} placeholder="분류 필터" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={notes} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <SpecialNoteFormModal
          note={editItem}
          students={students}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
