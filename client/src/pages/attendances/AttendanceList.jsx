import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_META = {
  '출석': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  '결석': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  '지각': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  '조퇴': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function AttendanceFormModal({ attendance, studentId, teacherId, students, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: studentId || attendance?.student_id || '',
    teacher_id: teacherId || '',
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
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
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
      const params = viewMode === 'calendar'
        ? { limit: 1000, start_date: fmtDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)), end_date: fmtDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)) }
        : { page, limit };
      if (selectedStudentId) params.student_id = selectedStudentId;
      if (viewMode === 'list') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
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

  useEffect(() => { fetchData(); }, [page, selectedStudentId, startDate, endDate, statusFilter, viewMode, currentMonth]);

  const attendanceByDate = useMemo(() => {
    const map = {};
    attendances.forEach(a => {
      const key = a.date?.slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [attendances]);

  const calendarCells = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentMonth]);

  const monthLabel = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
  const shiftMonth = (delta) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const renderStudent = (_, row) => {
    const s = row.student_id;
    if (!s) return '-';
    return `${s.user_id?.name || '-'} (${s.grade_year}-${s.class_num}-${s.student_num})`;
  };

  const columns = [
    { key: 'date', label: '날짜', render: (v) => v?.slice(0, 10) },
    ...(isTeacher ? [{ key: 'student_id', label: '학생', render: renderStudent }] : []),
    {
      key: 'status', label: '상태', render: (v) => {
        const colors = { '출석': 'bg-green-100 text-green-700', '결석': 'bg-red-100 text-red-700', '지각': 'bg-yellow-100 text-yellow-700', '조퇴': 'bg-orange-100 text-orange-700' };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>;
      }
    },
    { key: 'reason', label: '사유' },
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
            { label: '출석', key: '출석', color: 'bg-green-500' },
            { label: '결석', key: '결석', color: 'bg-red-500' },
            { label: '지각', key: '지각', color: 'bg-yellow-500' },
            { label: '조퇴', key: '조퇴', color: 'bg-orange-500' },
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

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">보기 방식:</span>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            달력
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            목록
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => shiftMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-800">{monthLabel}</h2>
            <button onClick={() => shiftMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const singleStudentView = !isTeacher || !!selectedStudentId;
                return calendarCells.map((day, i) => {
                  if (day === null) return <div key={i} className="h-20" />;
                  const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateKey = fmtDate(cellDate);
                  const items = attendanceByDate[dateKey] || [];
                  const counts = items.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
                  const weekday = cellDate.getDay();
                  const isWeekend = weekday === 0 || weekday === 6;
                  const isFuture = cellDate > today;
                  const hasException = (counts['결석'] || 0) + (counts['지각'] || 0) + (counts['조퇴'] || 0) > 0;

                  if (singleStudentView && !isWeekend && !isFuture && !hasException && !counts['출석']) {
                    counts['출석'] = 1;
                  }

                  const cellBg = singleStudentView && !hasException && counts['출석'] && !isWeekend && !isFuture
                    ? 'bg-green-50'
                    : '';

                  return (
                    <div key={i} className={`h-20 border border-gray-100 rounded-md p-1 text-xs flex flex-col overflow-hidden ${cellBg}`}>
                      <div className={`${weekday === 0 ? 'text-red-500' : weekday === 6 ? 'text-blue-500' : 'text-gray-600'}`}>{day}</div>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {Object.entries(counts).map(([status, count]) => {
                          const meta = STATUS_META[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                          const showFull = items.length <= 2 && singleStudentView;
                          return (
                            <span key={status} className={`px-1 rounded ${meta.bg} ${meta.text} text-[10px]`}>
                              {showFull ? status : `${status.slice(0, 1)}${count > 1 ? count : ''}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
            {Object.entries(STATUS_META).map(([status, meta]) => (
              <div key={status} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Table columns={columns} data={attendances} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {showForm && (
        <AttendanceFormModal
          attendance={editItem}
          studentId={!isTeacher ? user?.student_id : undefined}
          teacherId={user?.profile?._id}
          students={students}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
