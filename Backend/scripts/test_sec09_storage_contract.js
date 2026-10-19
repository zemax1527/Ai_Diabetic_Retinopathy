const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const http = require('http')
const mongoose = require('mongoose')
const app = require('../app')
const userModel = require('../models/user.model')
const PatientProfile = require('../models/patientProfile.model')
const Screening = require('../models/screening.model')
const {
  validateImageUrl,
  validateScreeningImages,
  matchesCustomAllowedHost,
  isValidDnsHostname,
  isApprovedCloudinaryHost,
  isApprovedAzureBlobHost
} = require('../utils/storage.validator')

async function runSec09Tests() {
  console.log('=== SEC-09: Storage Contract & Image URL Sanitization Tests ===\n')

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  await Screening.init()
  console.log('Screening model indexes verified\n')

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`
  console.log(`Test server running on port ${port}\n`)

  const suffix = Date.now()
  const createdUserIds = []
  const createdProfileIds = []
  const createdScreeningIds = []

  let passedTests = 0
  let totalTests = 0

  function assert(title, condition, extraInfo = '') {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`PASS [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`)
    } else {
      console.error(`FAIL [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`)
    }
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: CLOUDINARY & AZURE HOSTNAME POLICY TESTS
    // -------------------------------------------------------------
    console.log('--- 1. Cloudinary & Azure Hostname Policy Tests ---')

    assert('Cloudinary policy: res.cloudinary.com is ACCEPTED', isApprovedCloudinaryHost('res.cloudinary.com'))
    assert('Cloudinary policy: res-1.cloudinary.com is ACCEPTED', isApprovedCloudinaryHost('res-1.cloudinary.com'))
    assert('Cloudinary policy: res-5.cloudinary.com is ACCEPTED', isApprovedCloudinaryHost('res-5.cloudinary.com'))
    assert('Cloudinary policy: arbitrary attacker.cloudinary.com is REJECTED', !isApprovedCloudinaryHost('attacker.cloudinary.com'))
    assert('Cloudinary policy: evil-res.cloudinary.com is REJECTED', !isApprovedCloudinaryHost('evil-res.cloudinary.com'))
    assert('Cloudinary policy: res-6.cloudinary.com is REJECTED', !isApprovedCloudinaryHost('res-6.cloudinary.com'))
    assert(
      'Cloudinary policy: suffix spoofing res.cloudinary.com.attacker.example is REJECTED',
      !isApprovedCloudinaryHost('res.cloudinary.com.attacker.example')
    )

    assert('Azure Blob policy: valid 3-24 char account is ACCEPTED', isApprovedAzureBlobHost('drishtistorage.blob.core.windows.net'))
    assert('Azure Blob policy: 2-char account name is REJECTED (< 3 chars)', !isApprovedAzureBlobHost('ab.blob.core.windows.net'))
    assert(
      'Azure Blob policy: suffix spoofing drishtistorage.blob.core.windows.net.phishing.io is REJECTED',
      !isApprovedAzureBlobHost('drishtistorage.blob.core.windows.net.phishing.io')
    )

    // -------------------------------------------------------------
    // SECTION 2: RFC DNS & WILDCARD ALLOWED HOST BOUNDARY TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. RFC DNS & Wildcard Host Boundary Tests ---')

    // DNS Label validation
    assert('isValidDnsHostname: valid domain example.com is TRUE', isValidDnsHostname('example.com'))
    assert('isValidDnsHostname: valid subdomain sub.example.com is TRUE', isValidDnsHostname('sub.example.com'))
    assert('isValidDnsHostname: single-label host "localhost" is FALSE (requires domain + TLD)', !isValidDnsHostname('localhost'))
    assert('isValidDnsHostname: label starting with hyphen "-sub.example.com" is FALSE', !isValidDnsHostname('-sub.example.com'))
    assert('isValidDnsHostname: label ending with hyphen "sub-.example.com" is FALSE', !isValidDnsHostname('sub-.example.com'))
    assert('isValidDnsHostname: empty label / consecutive dots "sub..example.com" is FALSE', !isValidDnsHostname('sub..example.com'))
    assert('isValidDnsHostname: underscore in DNS hostname "sub_domain.example.com" is FALSE', !isValidDnsHostname('sub_domain.example.com'))
    assert('isValidDnsHostname: numeric TLD "example.123" is FALSE', !isValidDnsHostname('example.123'))

    // Wildcard matching rules
    assert('matchesCustomAllowedHost: sub.example.com with *.example.com is ACCEPTED', matchesCustomAllowedHost('sub.example.com', '*.example.com'))
    assert('matchesCustomAllowedHost: deep.sub.example.com with *.example.com is ACCEPTED', matchesCustomAllowedHost('deep.sub.example.com', '*.example.com'))
    assert('matchesCustomAllowedHost: root example.com with *.example.com is REJECTED', !matchesCustomAllowedHost('example.com', '*.example.com'))
    assert('matchesCustomAllowedHost: example.com.attacker.net with *.example.com is REJECTED', !matchesCustomAllowedHost('example.com.attacker.net', '*.example.com'))
    assert('matchesCustomAllowedHost: notexample.com with *.example.com is REJECTED', !matchesCustomAllowedHost('notexample.com', '*.example.com'))
    assert('matchesCustomAllowedHost: malformed pattern "*" is safely REJECTED', !matchesCustomAllowedHost('sub.example.com', '*'))
    assert('matchesCustomAllowedHost: malformed pattern "*." is safely REJECTED', !matchesCustomAllowedHost('sub.example.com', '*.'))
    assert('matchesCustomAllowedHost: malformed pattern "*.com" (single label TLD) is safely REJECTED', !matchesCustomAllowedHost('sub.com', '*.com'))
    assert('matchesCustomAllowedHost: malformed pattern "*example.com" is safely REJECTED', !matchesCustomAllowedHost('example.com', '*example.com'))
    assert('matchesCustomAllowedHost: malformed pattern "*.example.*.com" is safely REJECTED', !matchesCustomAllowedHost('sub.example.com', '*.example.*.com'))
    assert('matchesCustomAllowedHost: exact host cdn.hospital.org matches cdn.hospital.org', matchesCustomAllowedHost('cdn.hospital.org', 'cdn.hospital.org'))
    assert('matchesCustomAllowedHost: exact host cdn.hospital.org rejects sub.cdn.hospital.org', !matchesCustomAllowedHost('sub.cdn.hospital.org', 'cdn.hospital.org'))

    // Isolated test for ALLOWED_IMAGE_HOSTS environment variable
    const savedAllowedHosts = process.env.ALLOWED_IMAGE_HOSTS
    const savedNodeEnv = process.env.NODE_ENV
    try {
      process.env.ALLOWED_IMAGE_HOSTS = '*.trusted-pacs.org, cdn.hospital.org'
      const customSubRes = validateImageUrl('https://scans.trusted-pacs.org/images/fundus.jpg')
      assert(
        'validateImageUrl accepts subdomain matching *.trusted-pacs.org with provider external_secure',
        customSubRes.valid && customSubRes.provider === 'external_secure'
      )

      const customRootRes = validateImageUrl('https://trusted-pacs.org/images/fundus.jpg')
      assert(
        'validateImageUrl rejects root domain trusted-pacs.org when pattern is *.trusted-pacs.org',
        !customRootRes.valid
      )

      const customExactRes = validateImageUrl('https://cdn.hospital.org/images/fundus.jpg')
      assert(
        'validateImageUrl accepts exact matching domain cdn.hospital.org',
        customExactRes.valid && customExactRes.provider === 'external_secure'
      )
    } finally {
      process.env.ALLOWED_IMAGE_HOSTS = savedAllowedHosts
    }

    // -------------------------------------------------------------
    // SECTION 3: PROTOCOL & ENVIRONMENT ISOLATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 3. Protocol & Environment Policy Tests ---')

    try {
      process.env.NODE_ENV = 'production'
      assert('Production environment unconditionally rejects HTTP loopback URL', !validateImageUrl('http://localhost:5000/image.jpg').valid)
      assert('Production environment rejects HTTP Cloudinary URL', !validateImageUrl('http://res.cloudinary.com/image.jpg').valid)
      assert('Production environment rejects .test domain even with HTTPS', !validateImageUrl('https://cloudinary.test/image.jpg').valid)
      assert('Production environment rejects local.test domain', !validateImageUrl('http://local.test/image.jpg').valid)
      assert('Production environment accepts valid HTTPS Cloudinary URL', validateImageUrl('https://res.cloudinary.com/drishti/image/upload/v1234/fundus.jpg').valid)
    } finally {
      process.env.NODE_ENV = savedNodeEnv
    }

    // Dangerous Schemes Rejection
    assert('Validator rejects javascript: protocol', !validateImageUrl('javascript:alert(1)').valid)
    assert('Validator rejects file: protocol', !validateImageUrl('file:///etc/passwd').valid)
    assert('Validator rejects data: protocol', !validateImageUrl('data:image/png;base64,iVBORw0KGgo=').valid)
    assert('Validator rejects ftp: protocol', !validateImageUrl('ftp://storage.example.com/image.jpg').valid)
    assert('Validator rejects blob: protocol', !validateImageUrl('blob:https://example.com/uuid').valid)
    assert('Validator rejects embedded credentials in URL', !validateImageUrl('https://user:password@res.cloudinary.com/image.jpg').valid)

    // Whitespace-only Optional Image URLs
    const wsUrlRes = validateImageUrl('   ', { allowEmpty: true })
    assert('Validator normalizes whitespace-only optional image URL to empty string', wsUrlRes.valid && wsUrlRes.url === '')
    assert('Validator rejects whitespace-only image URL when allowEmpty=false', !validateImageUrl('   ', { allowEmpty: false }).valid)

    // -------------------------------------------------------------
    // SECTION 4: ALIAS CONFLICT & PRECEDENCE TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Alias Conflict & Precedence Unit Tests ---')

    // Empty canonical + valid alias -> extracts valid alias
    const emptyCanonicalRes = validateScreeningImages({
      originalUrl: '',
      original_url: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg'
    })
    assert(
      'validateScreeningImages: empty canonical with valid alias resolves to valid alias',
      emptyCanonicalRes.valid &&
      emptyCanonicalRes.sanitizedImages.originalUrl === 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg'
    )

    // Valid canonical + invalid alias -> MUST NOT silently ignore invalid alias!
    const validCanonicalBadAliasRes = validateScreeningImages({
      originalUrl: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg',
      original: 'javascript:alert(1)'
    })
    assert(
      'validateScreeningImages: explicitly supplied invalid alias is NOT silently ignored (fails validation)',
      !validCanonicalBadAliasRes.valid
    )

    // Empty canonical + invalid alias -> FAILS validation
    const emptyCanonicalBadAliasRes = validateScreeningImages({
      originalUrl: '   ',
      original: 'https://unapproved-storage.evil.com/payload.jpg'
    })
    assert(
      'validateScreeningImages: empty canonical with invalid alias fails validation',
      !emptyCanonicalBadAliasRes.valid
    )

    // Multiple valid aliases -> highest-precedence canonical wins deterministically
    const multipleValidAliasesRes = validateScreeningImages({
      originalUrl: 'https://res.cloudinary.com/drishti/image/upload/v1234/canonical.jpg',
      original_url: 'https://res.cloudinary.com/drishti/image/upload/v1234/alias.jpg'
    })
    assert(
      'validateScreeningImages: multiple valid aliases resolve deterministically to highest-precedence canonical',
      multipleValidAliasesRes.valid &&
      multipleValidAliasesRes.sanitizedImages.originalUrl === 'https://res.cloudinary.com/drishti/image/upload/v1234/canonical.jpg'
    )

    // Array of candidates: if any entry is invalid, validation FAILS
    const arrayWithBadEntryRes = validateScreeningImages({
      originalUrl: [
        'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg',
        'file:///etc/passwd'
      ]
    })
    assert(
      'validateScreeningImages: candidate array containing invalid URL fails validation',
      !arrayWithBadEntryRes.valid
    )

    // -------------------------------------------------------------
    // SECTION 5: SCREENING API INTEGRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 5. Screening API Integration Tests ---')

    // Setup Actors
    const hcwUser = await userModel.create({
      fullName: { firstName: 'Worker', lastName: 'SEC09' },
      email: `hcw_sec09_${suffix}@test.com`,
      password: 'Password@123',
      role: 'healthcare_worker',
      verificationStatus: 'approved',
      isActive: true,
      loginId: `HCW-2026-${String(suffix).slice(-4)}`
    })
    createdUserIds.push(hcwUser._id)
    const hcwToken = hcwUser.generateAuthToken()

    const patientUser = await userModel.create({
      fullName: { firstName: 'Patient', lastName: 'SEC09' },
      email: `pat_sec09_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 1).slice(-4)}`
    })
    createdUserIds.push(patientUser._id)
    const patientToken = patientUser.generateAuthToken()

    const patientProfile = await PatientProfile.create({
      userId: patientUser._id,
      patientId: patientUser.loginId,
      fullName: { firstName: 'Patient', lastName: 'SEC09' },
      phone: '9876540001',
      claimStatus: 'claimed',
      registrationType: 'self'
    })
    createdProfileIds.push(patientProfile._id)

    // Test 1: Valid Cloudinary Screening Sync
    const cldSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-CLD-${suffix}`,
          images: {
            original: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg',
            heatmap: 'https://res.cloudinary.com/drishti/image/upload/v1234/heatmap.jpg'
          },
          classification: { grade: 0, label: 'No DR', confidence: '98%' }
        }
      })
    })
    const cldSyncJson = await cldSyncRes.json()
    assert('Valid Cloudinary screening sync succeeds with HTTP 201', cldSyncRes.status === 201 && cldSyncJson.success === true)
    if (cldSyncJson.data?._id) createdScreeningIds.push(cldSyncJson.data._id)

    const storedCldDoc = await Screening.findById(cldSyncJson.data?._id)
    assert('Stored screening sets images.storageProvider to "cloudinary"', storedCldDoc?.images?.storageProvider === 'cloudinary')
    assert(
      'Stored screening records individual provider mapping for images',
      storedCldDoc?.images?.providers?.originalUrl === 'cloudinary' &&
      storedCldDoc?.images?.providers?.heatmapUrl === 'cloudinary'
    )

    // Test 2: Valid Azure Blob Screening Sync
    const azSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-AZ-${suffix}`,
          images: {
            original: 'https://drishtistorage.blob.core.windows.net/screenings/original.jpg',
            heatmap: 'https://drishtistorage.blob.core.windows.net/screenings/heatmap.jpg',
            gradcam: 'https://drishtistorage.blob.core.windows.net/screenings/gradcam.jpg'
          },
          classification: { grade: 1, label: 'Mild NPDR', confidence: '92%' }
        }
      })
    })
    const azSyncJson = await azSyncRes.json()
    assert('Valid Azure Blob screening sync succeeds with HTTP 201', azSyncRes.status === 201 && azSyncJson.success === true)
    if (azSyncJson.data?._id) createdScreeningIds.push(azSyncJson.data._id)

    const storedAzDoc = await Screening.findById(azSyncJson.data?._id)
    assert('Stored screening sets images.storageProvider to "azure_blob"', storedAzDoc?.images?.storageProvider === 'azure_blob')

    // Test 3: Multiple Image URLs with Mixed Providers
    const mixedSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-MIXED-${suffix}`,
          images: {
            original: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg',
            heatmap: 'https://drishtistorage.blob.core.windows.net/screenings/heatmap.jpg'
          },
          classification: { grade: 2, label: 'Moderate DR', confidence: '87%' }
        }
      })
    })
    const mixedSyncJson = await mixedSyncRes.json()
    assert('Mixed provider screening sync succeeds with HTTP 201', mixedSyncRes.status === 201 && mixedSyncJson.success === true)
    if (mixedSyncJson.data?._id) createdScreeningIds.push(mixedSyncJson.data._id)

    const storedMixedDoc = await Screening.findById(mixedSyncJson.data?._id)
    assert('Mixed image set is classified as storageProvider: "mixed"', storedMixedDoc?.images?.storageProvider === 'mixed')
    assert(
      'Mixed image set preserves accurate per-image provider mapping',
      storedMixedDoc?.images?.providers?.originalUrl === 'cloudinary' &&
      storedMixedDoc?.images?.providers?.heatmapUrl === 'azure_blob'
    )

    // Test 4: Rejection of Conflicting Malicious Alias in Request Payload
    const badAliasSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-BAD-ALIAS-${suffix}`,
          images: {
            original: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg'
          },
          fundusImage: 'javascript:alert(1)', // malicious alias supplied at root
          classification: { grade: 0, label: 'No DR', confidence: '99%' }
        }
      })
    })
    assert(
      'Screening sync with valid image but malicious alias in payload is rejected with HTTP 400',
      badAliasSyncRes.status === 400
    )

    // Test 5: Rejection of Dangerous Schemes in API Sync
    const jsSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-MAL-JS-${suffix}`,
          images: { original: 'javascript:alert(document.cookie)' }
        }
      })
    })
    assert('Screening sync with javascript: URL is rejected with HTTP 400', jsSyncRes.status === 400)

    const fileSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-MAL-FILE-${suffix}`,
          images: { original: 'file:///etc/passwd' }
        }
      })
    })
    assert('Screening sync with file: URL is rejected with HTTP 400', fileSyncRes.status === 400)

    const spoofSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-SPOOF-${suffix}`,
          images: { original: 'https://res.cloudinary.com.attacker.example/payload.jpg' }
        }
      })
    })
    assert('Screening sync with spoofed hostname is rejected with HTTP 400', spoofSyncRes.status === 400)

    // Test 6: Missing / Blank / Whitespace Image Fields Normalize Safely
    const wsImgSyncRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-WSIMG-${suffix}`,
          images: { original: '   ', heatmap: '   ' },
          classification: { grade: 0, label: 'No DR', confidence: '99%' }
        }
      })
    })
    const wsImgJson = await wsImgSyncRes.json()
    assert('Screening sync with whitespace-only images succeeds with HTTP 201', wsImgSyncRes.status === 201 && wsImgJson.success === true)
    if (wsImgJson.data?._id) createdScreeningIds.push(wsImgJson.data._id)

    const storedWsDoc = await Screening.findById(wsImgJson.data?._id)
    assert(
      'Whitespace-only images are saved as empty strings with storageProvider "unknown"',
      storedWsDoc?.images?.storageProvider === 'unknown' && storedWsDoc?.images?.originalUrl === ''
    )

    // -------------------------------------------------------------
    // SECTION 6: SCREENING REFERENCE NORMALIZATION & SEC-08 IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- 6. Screening Reference Normalization & SEC-08 Idempotency Tests ---')

    // Test 7: Duplicate Reference Idempotency
    const dupRefRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: `SCR-CLD-${suffix}`, // Same ID as Test 1
          images: { original: 'https://res.cloudinary.com/drishti/image/upload/v1234/original.jpg' }
        }
      })
    })
    const dupRefJson = await dupRefRes.json()
    assert(
      'Duplicate sync submission for same patient returns existing screening with isDuplicate: true (HTTP 200)',
      dupRefRes.status === 200 && dupRefJson.isDuplicate === true && dupRefJson.data?._id === cldSyncJson.data._id
    )

    // Test 8: Whitespace-only screeningReferenceId falls back to generated reference
    const wsRefRes1 = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: '   ',
          classification: { grade: 0, label: 'No DR', confidence: '99%' }
        }
      })
    })
    const wsRefJson1 = await wsRefRes1.json()
    assert('Screening sync with whitespace-only reference succeeds with HTTP 201', wsRefRes1.status === 201 && wsRefJson1.success === true)
    if (wsRefJson1.data?._id) createdScreeningIds.push(wsRefJson1.data._id)

    const storedWsRefDoc1 = await Screening.findById(wsRefJson1.data?._id)
    assert(
      'Whitespace-only reference normalizes to non-empty generated SCR- fallback',
      typeof storedWsRefDoc1?.screeningReferenceId === 'string' &&
      storedWsRefDoc1.screeningReferenceId.startsWith('SCR-') &&
      storedWsRefDoc1.screeningReferenceId.trim() !== ''
    )

    // Test 9: Second whitespace-only reference for same patient does NOT collide under SEC-08 index
    const wsRefRes2 = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hcwToken}`
      },
      body: JSON.stringify({
        patientId: patientProfile._id.toString(),
        screeningData: {
          id: '   ',
          classification: { grade: 0, label: 'No DR', confidence: '99%' }
        }
      })
    })
    const wsRefJson2 = await wsRefRes2.json()
    assert(
      'Second whitespace-only reference does not collide with first under SEC-08 index (HTTP 201)',
      wsRefRes2.status === 201 && wsRefJson2.success === true
    )
    if (wsRefJson2.data?._id) createdScreeningIds.push(wsRefJson2.data._id)

    const storedWsRefDoc2 = await Screening.findById(wsRefJson2.data?._id)
    assert(
      'Each whitespace-only submission receives a distinct generated reference',
      storedWsRefDoc1?.screeningReferenceId !== storedWsRefDoc2?.screeningReferenceId
    )

    // Test 10: Preservation of SEC-08 Partial Unique Index with Index-Key Verification
    let dbDuplicateThrown = false
    let dbDuplicateKeyMatched = false
    try {
      await Screening.create({
        patientId: patientProfile._id,
        userId: patientUser._id,
        screeningType: 'self',
        screeningReferenceId: `SCR-CLD-${suffix}`,
        status: 'completed'
      })
    } catch (dbErr) {
      dbDuplicateThrown = dbErr.code === 11000
      dbDuplicateKeyMatched = Boolean(
        (dbErr.keyPattern && dbErr.keyPattern.patientId === 1 && dbErr.keyPattern.screeningReferenceId === 1) ||
        (dbErr.message && dbErr.message.includes('patientId_1_screeningReferenceId_1'))
      )
    }
    assert('Direct database insertion of duplicate reference throws MongoServerError E11000', dbDuplicateThrown === true)
    assert('MongoServerError specifically matches the patientId + screeningReferenceId compound unique index', dbDuplicateKeyMatched === true)

    // Test 11: RBAC Protections Intact
    const unauthRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screeningData: { id: `SCR-UNAUTH-${suffix}` } })
    })
    assert('Unauthenticated screening sync request is rejected with HTTP 401', unauthRes.status === 401)

    // Patient cannot submit for another patient
    const otherPatientUser = await userModel.create({
      fullName: { firstName: 'Other', lastName: 'Patient' },
      email: `otherpat_${suffix}@test.com`,
      password: 'Password@123',
      role: 'patient',
      verificationStatus: 'not_required',
      isActive: true,
      loginId: `PAT-2026-${String(suffix + 2).slice(-4)}`
    })
    createdUserIds.push(otherPatientUser._id)

    const otherPatientProfile = await PatientProfile.create({
      userId: otherPatientUser._id,
      patientId: otherPatientUser.loginId,
      fullName: { firstName: 'Other', lastName: 'Patient' },
      phone: '9876540002',
      claimStatus: 'claimed',
      registrationType: 'self'
    })
    createdProfileIds.push(otherPatientProfile._id)

    const spoofRbacRes = await fetch(`${baseUrl}/api/screenings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        patientId: otherPatientProfile._id.toString(), // Patient 1 tries to submit for Patient 2
        screeningData: { id: `SCR-SPOOF-RBAC-${suffix}` }
      })
    })
    assert('Patient attempting to submit screening for another patient is rejected with HTTP 403', spoofRbacRes.status === 403)

    console.log(`\n=============================================================`)
    console.log(`Results: ${passedTests}/${totalTests} tests PASSED`)
    console.log(`=============================================================\n`)
  } catch (err) {
    console.error('Unexpected error during SEC-09 tests:', err)
  } finally {
    console.log('Cleaning up test fixtures...')
    try {
      if (createdScreeningIds.length > 0) {
        await Screening.deleteMany({ _id: { $in: createdScreeningIds } })
      }
      if (createdProfileIds.length > 0) {
        await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } })
      }
      if (createdUserIds.length > 0) {
        await userModel.deleteMany({ _id: { $in: createdUserIds } })
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message)
    }
    await mongoose.disconnect()
    server.close()
    console.log('Test suite finished.')
  }
}

runSec09Tests()
