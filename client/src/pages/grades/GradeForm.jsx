import { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';

export default function GradeForm({ grade, studentId, teacherId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    student_id: studentId || grade?.student_id || '',
    subject_name: grade?.subject_name || '',
    year: grade?.year || new Date().getFullYear(),
    semester: grade?.semester || 1,
    score: grade?.score || '',
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      api.get('/students', { params: { limit: 100 } })
        .then(res => {
          const data = res.data.data;
          setStudents(data?.students || data || []);
        })
        .catch(() => {});
    }
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        semester: Number(form.semester),
        score: Number(form.score),
      };
      if (grade?._id) {
        await api.put(`/grades/${grade._id}`, payload);
        toast.success('성적이 수정되었습니다.');
      } else {
        await api.post('/grades', { ...payload, teacher_id: teacherId });
        toast.success('성적이 입력되었습니다.');
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
    <Modal title={grade ? '성적 수정' : '성적 입력'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!studentId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
            <select
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">학생 선택</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.user_id?.name} ({s.grade_year}학년 {s.class_num}반 {s.student_num}번)</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">과목명</label>
          <select
            name="subject_name"
            value={form.subject_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">과목 선택</option>
            {['국어', '영어', '수학', '사회', '과학', '한국사'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학년도</label>
            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              required
              min="2000"
              max="2099"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학기</label>
            <select
              name="semester"
              value={form.semester}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">점수 (0-100)</label>
          <input
            type="number"
            name="score"
            value={form.score}
            onChange={handleChange}
            required
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
