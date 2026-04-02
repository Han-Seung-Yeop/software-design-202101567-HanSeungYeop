import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2, Calendar } from 'lucide-react';

function AttendanceFormModal({ attendance, studentId, students, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: studentId || attendance?.student_id || '',
    date: attendance?.date?.slice(0, 10) || '',
    status: attendance?.status || '출석',
    reason: attendance?.reason || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (attendance?.id) {
        await api.put(`/attendances/${attendance.id}`, form);
        toast.success('출결이 수정되었습니다.');
      } else {
        await api.post('/attendances', form);
        toast.success('출결이 등록되었습니다.');
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
    <Modal title={attendance ? '출결 수정' : '출결 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!studentId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">학생 선택</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}-{s.class_num})</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {['출석', '결석', '지각', '조퇴'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
          <input type="text" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="사유 (선택)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{loading ? '저장 중...' : '저장'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AttendanceList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { page, setPage, limit, reset } = usePagination(20);

  useEffect(() => {
    if (isTeacher) {
      api.get('/students', { params: { limit: 200 } })
        .then(res => {
          const data = res.data.data;
          setStudents(data?.students || data || []);
        }).catch(() => {});
    }
  }, [isTeacher]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (selectedStudentId) params.student_id = selectedStudentId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/attendances', { params });
      const data = res.data.data;
      setAttendances(data?.attendances || data || []);
      setTotal(data?.total || 0);

      const sid = selectedStudentId || user?.student_id;
      if (sid) {
        const sumRes = await api.get(`/attendances/summary/${sid}`);
        setSummary(sumRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || '출결 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, selectedStudentId, startDate, endDate, statusFilter]);

  const columns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    {
      key: 'status', label: '상태', render: (v) => {
        const colors = { '출석': 'bg-green-100 text-green-700', '결석': 'bg-red-100 text-red-700', '지각': 'bg-yellow-100 text-yellow-700', '조퇴': 'bg-orange-100 text-orange-700' };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>;
      }
    },
    { key: 'reason', label: '사유' },
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
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '출결 관리' : user?.role === 'parent' ? '자녀 출결' : '내 출결'}</h1>
        {isTeacher && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} />출결 등록
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '출석', key: 'present', color: 'bg-green-500' },
            { label: '결석', key: 'absent', color: 'bg-red-500' },
            { label: '지각', key: 'late', color: 'bg-yellow-500' },
            { label: '조퇴', key: 'early_leave', color: 'bg-orange-500' },
          ].map(item => (
            <div key={item.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}><Calendar size={18} className="text-white" /></div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-800">{summary[item.key] || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); reset(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">전체 상태</option>
            {['출석', '결석', '지각', '조퇴'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table columns={columns} data={attendances} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <AttendanceFormModal
          attendance={editItem}
          studentId={!isTeacher ? user?.student_id : undefined}
          students={students}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
