import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { toast } from '../components/common/Toast';
import { Users, BookOpen, MessageCircle, Calendar, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '-'}</p>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ studentCount: 0 });
  const [recentGrades, setRecentGrades] = useState([]);
  const [recentCounselings, setRecentCounselings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentParams = { limit: 1 };
        if (user?.profile?.grade_year) studentParams.grade_year = user.profile.grade_year;
        if (user?.profile?.class_num) studentParams.class_num = user.profile.class_num;

        const [studentsRes, gradesRes, counselingsRes] = await Promise.all([
          api.get('/students', { params: studentParams }),
          api.get('/grades', { params: { limit: 5, sort: 'created_at', order: 'desc' } }),
          api.get('/counselings', { params: { limit: 5, sort: 'counseling_date', order: 'desc' } }),
        ]);
        setStats({ studentCount: studentsRes.data.pagination?.total || 0 });
        setRecentGrades(gradesRes.data.data?.grades || gradesRes.data.data || []);
        setRecentCounselings(counselingsRes.data.data?.counselings || counselingsRes.data.data || []);
      } catch (err) {
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="담당 학생 수" value={stats.studentCount} color="bg-indigo-500" />
        <StatCard icon={BookOpen} label="최근 성적 입력" value={recentGrades.length} color="bg-green-500" />
        <StatCard icon={MessageCircle} label="최근 상담 기록" value={recentCounselings.length} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">최근 성적</h2>
            <Link to="/grades" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : recentGrades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">성적 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recentGrades.map((g, i) => {
                const studentName = g.student_id?.user_id?.name || '학생';
                const classInfo = g.student_id?.grade_year
                  ? ` (${g.student_id.grade_year}-${g.student_id.class_num}-${g.student_id.student_num})`
                  : '';
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-700">{studentName}</span>
                      <span className="text-xs text-gray-400 ml-1">{classInfo}</span>
                      <span className="text-xs text-gray-500 ml-2">· {g.subject_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 ml-2 shrink-0">{g.score}점</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Counselings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">최근 상담</h2>
            <Link to="/counselings" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : recentCounselings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">상담 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recentCounselings.map((c, i) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{c.student_name || '학생'}</span>
                    <span className="text-xs text-gray-400">{c.counseling_date?.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.main_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, feedbacksRes] = await Promise.all([
          api.get('/grades', { params: { limit: 5 } }),
          api.get('/feedbacks', { params: { limit: 3 } }),
        ]);
        setGrades(gradesRes.data.data?.grades || gradesRes.data.data || []);
        setFeedbacks(feedbacksRes.data.data?.feedbacks || feedbacksRes.data.data || []);

        if (user?.student_id) {
          const attRes = await api.get(`/attendances/summary/${user.student_id}`);
          setAttendance(attRes.data.data);
        }
      } catch (err) {
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">내 학습 현황</h1>

      {attendance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="출석" value={attendance.present || 0} color="bg-green-500" />
          <StatCard icon={Calendar} label="결석" value={attendance.absent || 0} color="bg-red-500" />
          <StatCard icon={Calendar} label="지각" value={attendance.late || 0} color="bg-yellow-500" />
          <StatCard icon={Calendar} label="조퇴" value={attendance.early_leave || 0} color="bg-orange-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">최근 성적</h2>
            <Link to="/grades" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">성적 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {grades.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{g.subject_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-600">{g.score}점</span>
                    {g.grade_level && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{g.grade_level}등급</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">최근 피드백</h2>
            <Link to="/feedbacks" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">피드백이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((f, i) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f.category}</span>
                    <span className="text-xs text-gray-400">{f.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{f.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {};
        if (user?.student_ids?.length > 0) {
          params.student_id = user.student_ids[0];
        }
        const [gradesRes, feedbacksRes] = await Promise.all([
          api.get('/grades', { params: { ...params, limit: 5 } }),
          api.get('/feedbacks', { params: { ...params, limit: 3 } }),
        ]);
        setGrades(gradesRes.data.data?.grades || gradesRes.data.data || []);
        setFeedbacks(feedbacksRes.data.data?.feedbacks || feedbacksRes.data.data || []);
      } catch (err) {
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">자녀 학습 현황</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">자녀 최근 성적</h2>
            <Link to="/grades" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">성적 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {grades.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{g.subject_name}</span>
                  <span className="text-sm font-semibold text-indigo-600">{g.score}점</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">자녀 최근 피드백</h2>
            <Link to="/feedbacks" className="text-sm text-indigo-600 hover:text-indigo-800">전체보기</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">피드백이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((f, i) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f.category}</span>
                    <span className="text-xs text-gray-400">{f.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{f.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'parent') return <ParentDashboard />;

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
}
