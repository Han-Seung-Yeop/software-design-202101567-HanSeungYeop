const findStudent = require('./findStudent');
const getStudentTermGradeSummary = require('./getStudentTermGradeSummary');
const getStudentSubjectScores = require('./getStudentSubjectScores');
const getClassGradeDistribution = require('./getClassGradeDistribution');

const TOOLS = [
  findStudent,
  getStudentTermGradeSummary,
  getStudentSubjectScores,
  getClassGradeDistribution,
];

// Groq(OpenAI 호환) tool 형식: { type: 'function', function: { name, description, parameters } }
const groqToolDefinitions = TOOLS.map((t) => ({
  type: 'function',
  function: {
    name: t.definition.name,
    description: t.definition.description,
    parameters: t.definition.parameters,
  },
}));

// Tool 이름 → execute 함수 맵
const toolExecutors = Object.fromEntries(TOOLS.map((t) => [t.definition.name, t.execute]));

module.exports = { groqToolDefinitions, toolExecutors };
