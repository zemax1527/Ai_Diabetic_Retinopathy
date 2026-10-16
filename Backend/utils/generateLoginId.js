const userModel = require('../models/user.model');
const Sequence = require('../models/sequence.model');

const prefixMap = {
  patient: 'PAT',
  healthcare_worker: 'HCW',
  doctor: 'DOC'
};

/**
 * Concurrency-safe, atomic sequence generator for role-specific Login IDs.
 * Format: PREFIX-YYYY-#### (e.g., PAT-2026-0001, DOC-2026-0001, HCW-2026-0001)
 */
async function generateLoginId(role) {
  const prefix = prefixMap[role];

  if (!prefix) {
    throw new Error(`No login ID prefix defined for role: ${role}`);
  }

  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;

  // 1. Atomically increment if the Sequence counter already exists
  let record = await Sequence.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );

  // 2. If the Sequence counter does not exist yet, initialize it safely
  if (!record) {
    // Scan existing users to determine true maximum integer sequence (avoiding string sort limitations)
    const existingUsers = await userModel
      .find({
        role,
        loginId: new RegExp(`^${prefix}-${year}-\\d+`)
      })
      .select('loginId')
      .lean();

    let currentMax = 0;
    for (const u of existingUsers) {
      if (u.loginId) {
        const parts = u.loginId.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > currentMax) {
            currentMax = num;
          }
        }
      }
    }

    try {
      record = await Sequence.create({
        key,
        role,
        year,
        seq: currentMax + 1
      });
    } catch (err) {
      // In case of a simultaneous creation race, gracefully fall back to atomic increment
      if (err.code === 11000) {
        record = await Sequence.findOneAndUpdate(
          { key },
          { $inc: { seq: 1 } },
          { returnDocument: 'after' }
        );
      } else {
        throw err;
      }
    }
  }

  const sequenceNumber = record.seq;
  const paddedSequence = String(sequenceNumber).padStart(4, '0');

  return `${prefix}-${year}-${paddedSequence}`;
}

module.exports = generateLoginId;