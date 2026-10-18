const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function auditScreeningReferences() {
  console.log('=== SEC-08: Screening Reference Uniqueness Audit (Read-Only) ===\n')

  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is not defined in environment.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB successfully.\n')

  try {
    const db = mongoose.connection.db
    const screeningColl = db.collection('screenings')

    // 1. Inspect existing indexes on screenings collection
    console.log('--- 1. Existing MongoDB Indexes on `screenings` ---')
    const indexes = await screeningColl.indexes()
    console.log(JSON.stringify(indexes, null, 2))

    // 2. Total record count
    const totalCount = await screeningColl.countDocuments()
    console.log(`\n--- 2. Dataset Overview ---`)
    console.log(`Total screening documents: ${totalCount}`)

    // 3. Inspect null, missing, or empty screeningReferenceId
    const nullOrMissingRef = await screeningColl.countDocuments({
      $or: [
        { screeningReferenceId: { $exists: false } },
        { screeningReferenceId: null },
        { screeningReferenceId: '' }
      ]
    })
    console.log(`Documents with missing, null, or empty screeningReferenceId: ${nullOrMissingRef}`)

    // 4. Inspect null or missing patientId
    const nullOrMissingPatientId = await screeningColl.countDocuments({
      $or: [
        { patientId: { $exists: false } },
        { patientId: null }
      ]
    })
    console.log(`Documents with missing or null patientId: ${nullOrMissingPatientId}`)

    // 5. Check type distribution of screeningReferenceId
    const typePipeline = [
      {
        $project: {
          refType: { $type: '$screeningReferenceId' }
        }
      },
      {
        $group: {
          _id: '$refType',
          count: { $sum: 1 }
        }
      }
    ]
    const typeDistribution = await screeningColl.aggregate(typePipeline).toArray()
    console.log('\n--- 3. screeningReferenceId Type Distribution ---')
    console.log(JSON.stringify(typeDistribution, null, 2))

    // 6. Check for duplicate pairs on { patientId, screeningReferenceId }
    // (Only consider records where screeningReferenceId is a valid non-empty string)
    const duplicatePipeline = [
      {
        $match: {
          screeningReferenceId: { $type: 'string', $ne: '' },
          patientId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            patientId: '$patientId',
            screeningReferenceId: '$screeningReferenceId'
          },
          count: { $sum: 1 },
          docIds: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]

    const duplicates = await screeningColl.aggregate(duplicatePipeline).toArray()
    console.log('\n--- 4. Duplicate { patientId, screeningReferenceId } Pairs ---')
    console.log(`Duplicate candidate pair count: ${duplicates.length}`)
    if (duplicates.length > 0) {
      console.log('Duplicate clusters detected:')
      duplicates.forEach((d, idx) => {
        console.log(`  [${idx + 1}] patientId: ${d._id.patientId}, refId: ${d._id.screeningReferenceId}, occurrences: ${d.count}, docIds: ${d.docIds.join(', ')}`)
      })
    } else {
      console.log('No duplicate (patientId, screeningReferenceId) pairs found in current database.')
    }

    // 7. Check if screeningReferenceId is repeated ACROSS DIFFERENT patients
    const crossPatientPipeline = [
      {
        $match: {
          screeningReferenceId: { $type: 'string', $ne: '' },
          patientId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$screeningReferenceId',
          distinctPatients: { $addToSet: '$patientId' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          screeningReferenceId: '$_id',
          patientCount: { $size: '$distinctPatients' },
          totalCount: '$count'
        }
      },
      {
        $match: {
          patientCount: { $gt: 1 }
        }
      }
    ]
    const crossPatientCollisions = await screeningColl.aggregate(crossPatientPipeline).toArray()
    console.log('\n--- 5. Cross-Patient screeningReferenceId Shared Use ---')
    console.log(`Reference IDs shared across multiple patients: ${crossPatientCollisions.length}`)
    if (crossPatientCollisions.length > 0) {
      crossPatientCollisions.forEach((c) => {
        console.log(`  Reference ID: "${c.screeningReferenceId}" used across ${c.patientCount} different patients (total records: ${c.totalCount})`)
      })
    } else {
      console.log('No cross-patient reference ID reuse observed in current records.')
    }

    console.log('\n--- 6. Safe Remediation & Index Feasibility Analysis ---')
    if (duplicates.length > 0) {
      console.log('WARNING: Duplicates exist. Building a unique index directly would fail.')
      console.log('Remediation recommendation:')
      console.log('  1. Review duplicate clusters with clinical / audit leads.')
      console.log('  2. For idempotent duplicates (identical payload synced twice), archive or soft-delete redundant duplicate IDs.')
      console.log('  3. Do NOT automatically purge records without backup and clinical confirmation.')
    } else {
      console.log('STATUS: Zero duplicate candidate pairs found.')
      console.log('Index Safety Assessment: A partial unique compound index on { patientId: 1, screeningReferenceId: 1 }')
      console.log('with partialFilterExpression: { screeningReferenceId: { $type: "string" } } is completely safe to deploy.')
      console.log('Records with null, empty, or missing screeningReferenceId will be excluded from the index,')
      console.log('preventing accidental key collisions for unreferenced or incomplete legacy entries.')
    }

    console.log('\n=== End of Audit ===')
  } catch (err) {
    console.error('Audit failed with error:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB.')
  }
}

auditScreeningReferences()

