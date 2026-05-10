const ParentInvitation = require('../models/ParentInvitation');

// 헷갈리는 0/O, 1/I, L 제외한 영문 대문자 + 숫자
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const generateCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
};

/**
 * 학생용: 학부모 연결 코드 발급. 24시간 유효, 1회용.
 * 같은 학생의 미사용 코드가 있으면 만료시키고 새로 발급.
 */
const issueInvitationForStudent = async (studentId) => {
  // 기존 미사용 코드 무효화
  await ParentInvitation.updateMany(
    { student_id: studentId, used_at: null, expires_at: { $gt: new Date() } },
    { $set: { expires_at: new Date() } }
  );

  // 충돌 방지를 위해 새 코드 발급 시 unique 보장
  let invitation = null;
  for (let attempt = 0; attempt < 5 && !invitation; attempt++) {
    const code = generateCode(6);
    try {
      invitation = await ParentInvitation.create({
        code,
        student_id: studentId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      // 코드 충돌 → 재시도
    }
  }

  if (!invitation) {
    throw new Error('코드 생성 실패');
  }

  return invitation;
};

/**
 * 학부모용: 코드 검증 + 사용 처리.
 * 성공 시 invitation을 반환 (used_at은 호출자가 트랜잭션으로 채워야 함).
 */
const validateInvitation = async (code) => {
  const invitation = await ParentInvitation.findOne({
    code: String(code).toUpperCase().trim(),
  });
  if (!invitation) return { ok: false, reason: 'NOT_FOUND' };
  if (invitation.used_at) return { ok: false, reason: 'ALREADY_USED' };
  if (invitation.expires_at < new Date()) return { ok: false, reason: 'EXPIRED' };
  return { ok: true, invitation };
};

module.exports = { generateCode, issueInvitationForStudent, validateInvitation };
