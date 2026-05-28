import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import RadarChart from '../../components/charts/RadarChart';
import GradeForm from './GradeForm';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Edit2 } from 'lucide-react';

const SUBJECTS = ['국어', '영어', '수학', '사회', '과학', '한국사'];

export default function GradeList() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [grades, setGrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examType, setExamType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGrade, setEditGrade] = useState(null);
  const [viewMode, setViewMode] = useState('pivot');
  const { page, setPage, limit, reset } = usePagination(20);

  useEffect(() => {
    if (isTeacher) {
      const params = { limit: 200 };
      if (user?.profile?.grade_year) params.grade_year = user.profile.grade_year;
      if (user?.profile?.class_num) params.class_num = user.profile.class_num;
      api.get('/students', { params })
        .then(res => {
          const data = res.data.data;
          setStudents(data?.students || data || []);
        })
        .catch(() => {});
    }
  }, [isTeacher]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const isBulkView = !selectedStudentId && (viewMode === 'pivot' || viewMode === 'grouped');
      const params = isBulkView ? { page: 1, limit: 500 } : { page, limit };
      if (selectedStudentId) params.student_id = selectedStudentId;
      if (year) params.year = year;
      if (semester) params.semester = semester;
      if (subjectName) params.subject_name = subjectName;
      if (examType) params.exam_type = examType;

      const res = await api.get('/grades', { params });
      const data = res.data.data;
      const EXAM_ORDER = { '중간': 0, '기말': 1 };
      const raw = data?.grades || data || [];
      raw.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.semester !== b.semester) return a.semester - b.semester;
        if (a.exam_type !== b.exam_type) return (EXAM_ORDER[a.exam_type] ?? 0) - (EXAM_ORDER[b.exam_type] ?? 0);
        return (a.subject_name || '').localeCompare(b.subject_name || '', 'ko');
      });
      setGrades(raw);
      setTotal(data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || '성적 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [page, selectedStudentId, year, semester, subjectName, examType, viewMode]);

  const renderStudent = (_, row) => {
    const s = row.student_id;
    if (!s) return '-';
    return `${s.name || '-'} (${s.grade_year}-${s.class_num}-${s.student_num})`;
  };

  const columns = [
    ...(isTeacher ? [{ key: 'student_id', label: '학생', render: renderStudent }] : []),
    { key: 'subject_name', label: '과목명' },
    { key: 'year', label: '학년도' },
    { key: 'semester', label: '학기', render: (v) => v ? `${v}학기` : '-' },
    { key: 'exam_type', label: '시험', render: (v) => v ? `${v}고사` : '-' },
    { key: 'score', label: '점수' },
    { key: 'grade_level', label: '등급' },
    { key: 'input_date', label: '입력일', render: (v) => v?.slice(0, 10) },
    ...(isTeacher ? [{
      key: 'edit',
      label: '수정',
      render: (_, row) => (
        <button
          onClick={() => { setEditGrade(row); setShowForm(true); }}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 size={15} />
        </button>
      ),
    }] : []),
  ];

  const showRadar = !isTeacher || !!selectedStudentId;
  const radarData = showRadar
    ? Object.values(
        grades.reduce((acc, g) => {
          if (!acc[g.subject_name]) acc[g.subject_name] = { subject_name: g.subject_name, scores: [] };
          acc[g.subject_name].scores.push(g.score);
          return acc;
        }, {})
      ).map(({ subject_name, scores }) => ({
        subject_name,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
    : [];
  const totalPages = Math.ceil(total / limit);

  const pivotRows = useMemo(() => {
    const byStudent = new Map();
    grades.forEach(g => {
      const s = g.student_id;
      if (!s?._id) return;
      if (!byStudent.has(s._id)) {
        byStudent.set(s._id, { student: s, subjects: {} });
      }
      const entry = byStudent.get(s._id);
      if (!entry.subjects[g.subject_name]) entry.subjects[g.subject_name] = [];
      entry.subjects[g.subject_name].push(g.score);
    });
    return Array.from(byStudent.values()).sort((a, b) => {
      const sa = a.student, sb = b.student;
      if (sa.grade_year !== sb.grade_year) return sa.grade_year - sb.grade_year;
      if (sa.class_num !== sb.class_num) return sa.class_num - sb.class_num;
      return sa.student_num - sb.student_num;
    }).map(e => {
      const row = { student: e.student };
      let sum = 0, count = 0;
      SUBJECTS.forEach(sub => {
        const arr = e.subjects[sub];
        if (arr?.length) {
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
          row[sub] = Math.round(avg * 10) / 10;
          sum += avg;
          count++;
        } else {
          row[sub] = null;
        }
      });
      row.overall = count ? Math.round((sum / count) * 10) / 10 : null;
      return row;
    });
  }, [grades]);

  const groupedSections = useMemo(() => {
    const byStudent = new Map();
    grades.forEach(g => {
      const s = g.student_id;
      if (!s?._id) return;
      if (!byStudent.has(s._id)) {
        byStudent.set(s._id, { student: s, rows: [] });
      }
      byStudent.get(s._id).rows.push(g);
    });
    return Array.from(byStudent.values()).sort((a, b) => {
      const sa = a.student, sb = b.student;
      if (sa.grade_year !== sb.grade_year) return sa.grade_year - sb.grade_year;
      if (sa.class_num !== sb.class_num) return sa.class_num - sb.class_num;
      return sa.student_num - sb.student_num;
    });
  }, [grades]);

  const groupedColumns = [
    { key: 'subject_name', label: '과목명' },
    { key: 'year', label: '학년도' },
    { key: 'semester', label: '학기', render: (v) => v ? `${v}학기` : '-' },
    { key: 'exam_type', label: '시험', render: (v) => v ? `${v}고사` : '-' },
    { key: 'score', label: '점수' },
    { key: 'average', label: '평균' },
    { key: 'grade_level', label: '등급' },
    { key: 'input_date', label: '입력일', render: (v) => v?.slice(0, 10) },
    ...(isTeacher ? [{
      key: 'edit', label: '수정',
      render: (_, row) => (
        <button
          onClick={() => { setEditGrade(row); setShowForm(true); }}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Edit2 size={15} />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isTeacher ? '성적 관리' : user?.role === 'parent' ? '자녀 성적' : '내 성적'}</h1>
        {isTeacher && (
          <button
            onClick={() => { setEditGrade(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            성적 입력
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          {isTeacher && (
            <select
              value={selectedStudentId}
              onChange={(e) => { setSelectedStudentId(e.target.value); reset(); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체 학생</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.grade_year}-{s.class_num}-{s.student_num})</option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(e.target.value); reset(); }}
            placeholder="학년도"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
          />
          <select
            value={semester}
            onChange={(e) => { setSemester(e.target.value); reset(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체 학기</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => { setSubjectName(e.target.value); reset(); }}
            placeholder="과목명"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={examType}
            onChange={(e) => { setExamType(e.target.value); reset(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체 시험</option>
            <option value="중간">중간고사</option>
            <option value="기말">기말고사</option>
          </select>
        </div>
      </div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">성적 분포</h2>
            <span className="text-xs text-gray-400">
              {!semester && !examType
                ? '전체 학기·시험의 과목별 평균'
                : `${semester ? `${semester}학기` : '전체 학기'} ${examType ? `${examType}고사` : '전체 시험'} 과목별 평균`}
            </span>
          </div>
          <RadarChart data={radarData} />
        </div>
      )}

      {/* View mode toggle (teacher only) */}
      {isTeacher && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">보기 방식:</span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode('pivot')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'pivot' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              과목별 요약
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              학생별 그룹
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isTeacher ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Table columns={columns} data={grades} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : viewMode === 'pivot' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : pivotRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">표시할 성적이 없습니다.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2 font-medium">학생</th>
                  {SUBJECTS.map(sub => (
                    <th key={sub} className="px-3 py-2 font-medium text-center">{sub}</th>
                  ))}
                  <th className="px-3 py-2 font-medium text-center">평균</th>
                </tr>
              </thead>
              <tbody>
                {pivotRows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">
                      {r.student.name || '-'} <span className="text-xs text-gray-400">({r.student.grade_year}-{r.student.class_num}-{r.student.student_num})</span>
                    </td>
                    {SUBJECTS.map(sub => (
                      <td key={sub} className="px-3 py-2 text-center text-gray-700">{r[sub] ?? '-'}</td>
                    ))}
                    <td className="px-3 py-2 text-center font-semibold text-indigo-600">{r.overall ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-gray-400 mt-3">동일 과목에 여러 기록이 있으면 평균으로 집계됩니다. 학년도·학기 필터로 범위를 좁힐 수 있어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : groupedSections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-400 text-center py-8">표시할 성적이 없습니다.</p>
            </div>
          ) : (
            groupedSections.map(sec => (
              <div key={sec.student._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  {sec.student.name || '-'} <span className="text-xs text-gray-400 font-normal">({sec.student.grade_year}-{sec.student.class_num}-{sec.student.student_num})</span>
                </h3>
                <Table columns={groupedColumns} data={sec.rows} />
              </div>
            ))
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {showForm && (
        <GradeForm
          grade={editGrade}
          studentId={!isTeacher ? user?.student_id : undefined}
          teacherId={user?.profile?._id}
          onClose={() => { setShowForm(false); setEditGrade(null); }}
          onSuccess={fetchGrades}
        />
      )}
    </div>
  );
}
