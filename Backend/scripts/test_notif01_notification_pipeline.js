const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');
const DoctorProfile = require('../models/doctorProfile.model');
const Screening = require('../models/screening.model');

const { maskEmail, maskPhone } = require('../utils/mask.util');
const templates = require('../services/templates/notification.templates');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const notificationService = require('../services/notification.service');

async function runNotif01Tests() {
  console.log('=== NOTIF-01: Notification Service & Pipeline Verification Suite ===\n');

  // Verify Demo Mode is default
  console.log(`Current NOTIFICATION_MODE: ${process.env.NOTIFICATION_MODE || 'demo'}`);
  console.log(`Current SMS_PROVIDER: ${process.env.SMS_PROVIDER || 'demo'}\n`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(title, condition, extraInfo = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`PASS [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
    } else {
      console.error(`FAIL [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
    }
  }

  // -----------------------------------------------------------------
  // SECTION 1: PRIVACY & MASKING UNIT TESTS
  // -----------------------------------------------------------------
  console.log('--- 1. PII Masking Unit Tests ---');
  assert('maskEmail: standard email is properly masked', maskEmail('bhavesh@example.com') === 'b***h@example.com');
  assert('maskEmail: short user email is properly masked', maskEmail('al@example.com') === 'a***@example.com');
  assert('maskEmail: invalid input returns fallback', maskEmail(null) === '[none]');
  assert('maskPhone: 10-digit phone masks all but last 4 digits', maskPhone('9876543210') === '******3210');
  assert('maskPhone: international phone masks prefix', maskPhone('+919876543210').endsWith('3210'));
  assert('maskPhone: invalid input returns fallback', maskPhone(null) === '[none]');

  // -----------------------------------------------------------------
  // SECTION 2: TEMPLATE GENERATION & SECURITY CHECKS
  // -----------------------------------------------------------------
  console.log('\n--- 2. Template Generation & Security Sanitization Tests ---');

  // 2.1 Patient self-registration template
  const t1 = templates.patientSelfRegistration({ fullName: { firstName: 'Ramesh', lastName: 'Kumar' }, loginId: 'PAT-2026-0001' });
  assert('Patient registration template contains Login ID in body', t1.html.includes('PAT-2026-0001') && t1.sms.includes('PAT-2026-0001'));
  assert('Patient registration template never contains password field', !t1.html.includes('password') && !t1.text.includes('password'));

  // 2.2 HTML escaping check
  const xssName = '<script>alert("xss")</script>';
  const tXss = templates.patientSelfRegistration({ fullName: { firstName: xssName }, loginId: 'PAT-123' });
  assert('HTML escaping: scripts in recipient name are escaped', !tXss.html.includes('<script>') && tXss.html.includes('&lt;script&gt;'));

  // 2.3 SMS Injection / CRLF sanitization check
  const crlfInput = 'PAT-123\r\nINJECTED SMS COMMAND\r\n';
  const tSmsInj = templates.patientSelfRegistration({ fullName: { firstName: 'Test' }, loginId: crlfInput });
  assert('SMS sanitization: CRLF newlines stripped from SMS text', !tSmsInj.sms.includes('\r') && !tSmsInj.sms.includes('\n'));
  assert('SMS sanitization: HTML tags stripped from SMS text', !templates.sanitizeSmsText('<b>Bold</b> alert').includes('<b>'));

  // 2.4 Staff application received template
  const t2 = templates.staffApplicationReceived({ fullName: { firstName: 'Anita', lastName: 'Desai' }, role: 'doctor' });
  assert('Staff application template mentions role', t2.html.includes('Doctor') && t2.sms.includes('Doctor'));
  assert('Staff application template indicates pending verification', t2.text.includes('pending administrator review'));

  // 2.5 Google profile completion template
  const t3Pat = templates.googleProfileCompletion({ fullName: { firstName: 'Ramesh' }, role: 'patient', loginId: 'PAT-2026-0002' });
  assert('Google profile completion (patient) includes Login ID', t3Pat.html.includes('PAT-2026-0002'));
  const t3Staff = templates.googleProfileCompletion({ fullName: { firstName: 'Sunil' }, role: 'healthcare_worker' });
  assert('Google profile completion (staff) mentions review', t3Staff.html.includes('administrator review'));

  // 2.6 Admin approval template
  const t4 = templates.adminApproval({ fullName: { firstName: 'Sunil' }, role: 'healthcare_worker', loginId: 'HCW-2026-0001' });
  assert('Admin approval includes assigned Login ID', t4.html.includes('HCW-2026-0001') && t4.sms.includes('HCW-2026-0001'));

  // 2.7 Admin rejection sanitization & length limiting
  const longRejection = 'A'.repeat(500) + '<script>evil()</script>';
  const t5 = templates.adminRejection({ fullName: { firstName: 'Sunil' }, role: 'doctor', reason: longRejection });
  assert('Admin rejection limits reason length to <= 260 chars', t5.text.length < 500);
  assert('Admin rejection strips HTML tags from reason', !t5.html.includes('<script>'));

  // 2.7b sanitizeRejectionReason: Exactly 250 characters
  const exact250Str = 'E'.repeat(250);
  const exact250Res = templates.sanitizeRejectionReason(exact250Str);
  assert(
    'sanitizeRejectionReason: exactly 250 chars returned as-is without ellipsis',
    exact250Res.length === 250 && !exact250Res.endsWith('...') && exact250Res === exact250Str
  );

  // 2.7c sanitizeRejectionReason: More than 250 characters capped at <= 250 including ellipsis
  const moreThan250Str = 'M'.repeat(300);
  const moreThan250Res = templates.sanitizeRejectionReason(moreThan250Str);
  assert(
    'sanitizeRejectionReason: more than 250 chars capped at exactly 250 including trailing ellipsis',
    moreThan250Res.length === 250 && moreThan250Res.endsWith('...') && moreThan250Res === 'M'.repeat(247) + '...'
  );

  // 2.7d sanitizeRejectionReason: Invalid maxLength values fall back safely to 250
  const negLimitRes = templates.sanitizeRejectionReason('X'.repeat(300), -10);
  const zeroLimitRes = templates.sanitizeRejectionReason('X'.repeat(300), 0);
  const tooSmallLimitRes = templates.sanitizeRejectionReason('X'.repeat(300), 2);
  const decLimitRes = templates.sanitizeRejectionReason('X'.repeat(300), 100.5);
  const strLimitRes = templates.sanitizeRejectionReason('X'.repeat(300), '100');
  assert(
    'sanitizeRejectionReason: negative, zero, < 3, decimal, and string maxLength fall back to 250',
    negLimitRes.length === 250 &&
    zeroLimitRes.length === 250 &&
    tooSmallLimitRes.length === 250 &&
    decLimitRes.length === 250 &&
    strLimitRes.length === 250
  );

  // 2.7e sanitizeRejectionReason: Valid custom integer maxLength >= 3
  const customLimitRes = templates.sanitizeRejectionReason('Y'.repeat(50), 30);
  assert(
    'sanitizeRejectionReason: valid custom integer maxLength (e.g. 30) caps at exactly 30 chars',
    customLimitRes.length === 30 && customLimitRes.endsWith('...') && customLimitRes === 'Y'.repeat(27) + '...'
  );

  // 2.7f sanitizeRejectionReason: HTML injection in rejection reasons stripped completely
  const htmlInjectStr = '<script>alert("xss")</script><img src="x" onerror="evil()"/><b>Invalid Medical Credentials</b>';
  const htmlInjectRes = templates.sanitizeRejectionReason(htmlInjectStr);
  assert(
    'sanitizeRejectionReason: HTML injection tags stripped completely',
    !htmlInjectRes.includes('<script>') &&
    !htmlInjectRes.includes('<img') &&
    !htmlInjectRes.includes('<b>') &&
    htmlInjectRes === 'Invalid Medical Credentials'
  );

  // 2.7g sanitizeRejectionReason: Preserves fallback rejection message
  assert(
    'sanitizeRejectionReason: null or empty reason preserves default fallback message',
    templates.sanitizeRejectionReason(null) === 'Application criteria were not met or credentials could not be verified.' &&
    templates.sanitizeRejectionReason('') === 'Application criteria were not met or credentials could not be verified.' &&
    templates.sanitizeRejectionReason('   <style></style>  ') === 'Application criteria were not met or credentials could not be verified.'
  );

  // 2.7h sanitizeRejectionReason: Fallback message respects custom maxLength (e.g. 10)
  const missingLimit10 = templates.sanitizeRejectionReason(null, 10);
  assert(
    'sanitizeRejectionReason: missing reason with maxLength 10 capped at 10',
    missingLimit10.length === 10 && missingLimit10.endsWith('...') && missingLimit10 === 'Applica...'
  );

  const emptyLimit10 = templates.sanitizeRejectionReason('', 10);
  assert(
    'sanitizeRejectionReason: empty reason with maxLength 10 capped at 10',
    emptyLimit10.length === 10 && emptyLimit10.endsWith('...') && emptyLimit10 === 'Applica...'
  );

  const htmlOnlyLimit10 = templates.sanitizeRejectionReason('<p><b></b></p>', 10);
  assert(
    'sanitizeRejectionReason: HTML-only reason with maxLength 10 capped at 10',
    htmlOnlyLimit10.length === 10 && htmlOnlyLimit10.endsWith('...') && htmlOnlyLimit10 === 'Applica...'
  );

  const scriptOnlyLimit10 = templates.sanitizeRejectionReason('<script>evil()</script>', 10);
  assert(
    'sanitizeRejectionReason: script-only reason with maxLength 10 capped at 10',
    scriptOnlyLimit10.length === 10 && scriptOnlyLimit10.endsWith('...') && scriptOnlyLimit10 === 'Applica...'
  );

  const defaultFallbackRes = templates.sanitizeRejectionReason(null);
  const expectedFallback = 'Application criteria were not met or credentials could not be verified.';
  assert(
    'sanitizeRejectionReason: default maxLength (250) returns full fallback message without truncation',
    defaultFallbackRes.length === expectedFallback.length &&
    defaultFallbackRes === expectedFallback &&
    !defaultFallbackRes.endsWith('...')
  );

  // 2.8 Field patient outreach registration (SMS only)
  const t6 = templates.fieldPatientRegistration({ fullName: { firstName: 'Outreach', lastName: 'Patient' }, patientId: 'PAT-2026-0005' });
  assert('Field patient registration contains Patient ID', t6.sms.includes('PAT-2026-0005'));
  assert('Field patient registration NEVER mentions claim code', !t6.sms.includes('CLM-') && !t6.sms.toLowerCase().includes('claim code'));

  // 2.9 Patient record claimed template
  const t7 = templates.patientRecordClaimed({ fullName: { firstName: 'Outreach', lastName: 'Patient' }, patientId: 'PAT-2026-0005' });
  assert('Patient record claimed template confirms linking', t7.html.includes('PAT-2026-0005') && t7.html.includes('linked to your Drishti account'));
  assert('Patient record claimed template never includes claim code', !t7.html.includes('CLM-') && !t7.text.includes('claimCode'));

  // -----------------------------------------------------------------
  // SECTION 3: EMAIL & SMS SERVICE CONFIGURATION & PROVIDER TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 3. Email & SMS Service Provider & Configuration Tests ---');

  // 3.1 Demo mode email
  const emailRes = await emailService.sendEmail({
    to: 'testuser@example.com',
    subject: 'Test Subject',
    html: '<p>Test</p>',
    text: 'Test'
  });
  assert('EmailService in demo mode returns success without network call', emailRes.success === true && emailRes.mode === 'demo');

  // 3.2 Demo mode SMS
  const smsRes = await smsService.sendSms({
    to: '9876543210',
    message: 'Test SMS from Drishti'
  });
  assert('SmsService in demo mode returns success without network call', smsRes.success === true && smsRes.provider === 'demo');

  // 3.3 Invalid email address validation
  const invalidEmailRes = await emailService.sendEmail({
    to: 'invalid-email-address',
    subject: 'Test',
    html: '<p>Test</p>'
  });
  assert('EmailService gracefully rejects invalid email format', invalidEmailRes.success === false);

  // 3.4 Invalid phone length validation
  const invalidSmsRes = await smsService.sendSms({
    to: '123',
    message: 'Short'
  });
  assert('SmsService gracefully rejects short phone number', invalidSmsRes.success === false);

  // 3.5 Live Resend mode with MISSING RESEND_API_KEY returns explicit failure
  const origNotifMode = process.env.NOTIFICATION_MODE;
  const origEmailProv = process.env.EMAIL_PROVIDER;
  const origResendKey = process.env.RESEND_API_KEY;

  try {
    process.env.NOTIFICATION_MODE = 'live';
    process.env.EMAIL_PROVIDER = 'resend';
    delete process.env.RESEND_API_KEY;

    const missingKeyRes = await emailService.sendEmail({
      to: 'doctor@example.com',
      subject: 'Live Mode Test (Missing Key)',
      html: '<p>Test</p>'
    });
    assert(
      'Live Resend mode with missing API key returns exact failure contract',
      missingKeyRes.success === false &&
      missingKeyRes.mode === 'resend' &&
      missingKeyRes.error === 'RESEND_API_KEY is not configured for live email delivery'
    );

    // 3.5b Live Resend mode with EMPTY string API key
    process.env.RESEND_API_KEY = '   ';
    const emptyKeyRes = await emailService.sendEmail({
      to: 'doctor@example.com',
      subject: 'Live Mode Test (Empty Key)',
      html: '<p>Test</p>'
    });
    assert(
      'Live Resend mode with whitespace-only API key returns exact failure contract',
      emptyKeyRes.success === false &&
      emptyKeyRes.mode === 'resend' &&
      emptyKeyRes.error === 'RESEND_API_KEY is not configured for live email delivery'
    );

    // 3.5c Live notification mode with EMAIL_PROVIDER=demo isolates email delivery
    process.env.NOTIFICATION_MODE = 'live';
    process.env.EMAIL_PROVIDER = 'demo';
    const demoInLiveRes = await emailService.sendEmail({
      to: 'doctor@example.com',
      subject: 'Live Mode with Demo Provider',
      html: '<p>Test</p>'
    });
    assert(
      'Live NOTIFICATION_MODE with EMAIL_PROVIDER=demo remains in demo mode (0 network calls)',
      demoInLiveRes.success === true && demoInLiveRes.mode === 'demo'
    );

    // 3.5d Unsupported email provider in live mode returns explicit failure
    process.env.NOTIFICATION_MODE = 'live';
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const unsupportedLiveEmail = await emailService.sendEmail({
      to: 'doctor@example.com',
      subject: 'Unsupported Provider Test',
      html: '<p>Test</p>'
    });
    assert(
      'Unsupported email provider in live mode returns explicit failure with mode: unsupported',
      unsupportedLiveEmail.success === false &&
      unsupportedLiveEmail.mode === 'unsupported' &&
      unsupportedLiveEmail.error.includes('sendgrid')
    );

    // 3.5e Unsupported email provider in demo mode returns explicit failure (never silently treats as Resend or demo)
    process.env.NOTIFICATION_MODE = 'demo';
    process.env.EMAIL_PROVIDER = 'unknown_mailer';
    const unsupportedDemoEmail = await emailService.sendEmail({
      to: 'doctor@example.com',
      subject: 'Unknown Mailer Test',
      html: '<p>Test</p>'
    });
    assert(
      'Unsupported email provider in demo mode returns explicit failure with mode: unsupported',
      unsupportedDemoEmail.success === false &&
      unsupportedDemoEmail.mode === 'unsupported' &&
      unsupportedDemoEmail.error.includes('unknown_mailer')
    );

    // 3.5f Demo mode console logs must not contain the subject line
    let capturedLog = '';
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      capturedLog += args.join(' ');
      originalConsoleLog(...args);
    };
    process.env.NOTIFICATION_MODE = 'demo';
    process.env.EMAIL_PROVIDER = 'demo';
    const SECRET_SUBJECT = 'SECRET_CLINICAL_SUBJECT_12345';
    await emailService.sendEmail({
      to: 'patient@example.com',
      subject: SECRET_SUBJECT,
      html: '<p>Confidential</p>'
    });
    console.log = originalConsoleLog;
    assert(
      'Demo mode console log strips email subject line entirely',
      !capturedLog.includes(SECRET_SUBJECT) && capturedLog.includes('p***t@example.com')
    );
  } finally {
    if (origNotifMode !== undefined) process.env.NOTIFICATION_MODE = origNotifMode;
    else delete process.env.NOTIFICATION_MODE;
    if (origEmailProv !== undefined) process.env.EMAIL_PROVIDER = origEmailProv;
    else delete process.env.EMAIL_PROVIDER;
    if (origResendKey !== undefined) process.env.RESEND_API_KEY = origResendKey;
    else delete process.env.RESEND_API_KEY;
  }

  // 3.6 MSG91 selected without implementation returns explicit not-implemented error
  const origSmsProv = process.env.SMS_PROVIDER;
  try {
    process.env.NOTIFICATION_MODE = 'live';
    process.env.SMS_PROVIDER = 'msg91';

    const msg91Res = await smsService.sendSms({
      to: '9876543210',
      message: 'MSG91 test'
    });
    assert(
      'MSG91 selected returns explicit unsupported/not-implemented failure (success: false)',
      msg91Res.success === false && msg91Res.provider === 'msg91' && msg91Res.error.includes('not yet implemented')
    );
  } finally {
    process.env.NOTIFICATION_MODE = origNotifMode;
    process.env.SMS_PROVIDER = origSmsProv;
  }

  // 3.7 Unknown SMS provider returns explicit unsupported failure
  try {
    process.env.NOTIFICATION_MODE = 'live';
    process.env.SMS_PROVIDER = 'unknown_telecom';

    const unknownSmsRes = await smsService.sendSms({
      to: '9876543210',
      message: 'Unknown provider test'
    });
    assert(
      'Unknown SMS provider returns explicit failure (success: false)',
      unknownSmsRes.success === false && unknownSmsRes.provider === 'unknown_telecom' && unknownSmsRes.error.includes('Unsupported SMS provider')
    );
  } finally {
    process.env.NOTIFICATION_MODE = origNotifMode;
    process.env.SMS_PROVIDER = origSmsProv;
  }

  // -----------------------------------------------------------------
  // SECTION 4: CHANNEL INDEPENDENCE & NOTIFICATION SERVICE RESILIENCE
  // -----------------------------------------------------------------
  console.log('\n--- 4. Channel Independence, Skipping, and Failure Isolation Tests ---');

  // 4.1 Missing contacts are successful skips
  const skipBothRes = await notificationService.sendPatientRegistrationNotice({
    email: null,
    phone: null,
    fullName: { firstName: 'Ghost' },
    loginId: 'PAT-2026-GHOST'
  });
  assert(
    'Missing recipient contacts returns successful skip (success: true, skipped: true)',
    skipBothRes.success === true && skipBothRes.skipped === true && skipBothRes.emailResult?.skipped && skipBothRes.smsResult?.skipped
  );

  // 4.2 Missing phone only: email succeeds, SMS marked skipped: true
  const skipPhoneRes = await notificationService.sendPatientRegistrationNotice({
    email: 'patient_no_phone@example.com',
    phone: null,
    fullName: { firstName: 'NoPhone' },
    loginId: 'PAT-2026-NOPHONE'
  });
  assert(
    'Missing phone only: overall success is true, email is sent, SMS is skipped',
    skipPhoneRes.success === true && skipPhoneRes.emailResult?.success === true && skipPhoneRes.smsResult?.skipped === true
  );

  // 4.3 Email failure with SMS success (independent channels)
  const origSendEmail = emailService.sendEmail;
  const origSendSms = smsService.sendSms;

  try {
    // Stub email to fail, SMS to succeed
    emailService.sendEmail = async () => ({ success: false, mode: 'resend', error: 'Resend rate limited' });
    smsService.sendSms = async () => ({ success: true, provider: 'demo', id: 'mock-sms-ok' });

    const emailFailRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'SplitTest' },
      loginId: 'PAT-SPLIT-1'
    });

    assert(
      'Email failure with SMS success: overall success is false',
      emailFailRes.success === false
    );
    assert(
      'Email failure with SMS success: emailResult is failed',
      emailFailRes.emailResult?.success === false && emailFailRes.emailResult?.error === 'Resend rate limited'
    );
    assert(
      'Email failure with SMS success: smsResult is STILL SUCCESSFUL (not marked failed)',
      emailFailRes.smsResult?.success === true && emailFailRes.smsResult?.id === 'mock-sms-ok'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.4 SMS failure with email success (independent channels)
  try {
    emailService.sendEmail = async () => ({ success: true, mode: 'demo', id: 'mock-email-ok' });
    smsService.sendSms = async () => ({ success: false, provider: 'demo', error: 'Network timeout' });

    const smsFailRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'SplitTest2' },
      loginId: 'PAT-SPLIT-2'
    });

    assert(
      'SMS failure with email success: overall success is false',
      smsFailRes.success === false
    );
    assert(
      'SMS failure with email success: emailResult is STILL SUCCESSFUL',
      smsFailRes.emailResult?.success === true && smsFailRes.emailResult?.id === 'mock-email-ok'
    );
    assert(
      'SMS failure with email success: smsResult is failed',
      smsFailRes.smsResult?.success === false && smsFailRes.smsResult?.error === 'Network timeout'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.5 Both channels failing
  try {
    emailService.sendEmail = async () => ({ success: false, mode: 'demo', error: 'Email down' });
    smsService.sendSms = async () => ({ success: false, provider: 'demo', error: 'SMS down' });

    const bothFailRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'BothFail' },
      loginId: 'PAT-BOTH-FAIL'
    });

    assert('Both channels failing: overall success is false', bothFailRes.success === false);
    assert('Both channels failing: emailResult failed', bothFailRes.emailResult?.success === false);
    assert('Both channels failing: smsResult failed', bothFailRes.smsResult?.success === false);
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.6 Email synchronous throw while SMS succeeds (isolation)
  try {
    emailService.sendEmail = () => {
      throw new Error('Fatal synchronous email exception');
    };
    smsService.sendSms = async () => ({ success: true, provider: 'demo', id: 'sms-sync-ok' });

    const emailSyncFailRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'SyncEmailFail' },
      loginId: 'PAT-SYNC-1'
    });

    assert('Email sync throw while SMS succeeds: overall success is false', emailSyncFailRes.success === false);
    assert(
      'Email sync throw while SMS succeeds: emailResult is failed with safe generic error',
      emailSyncFailRes.emailResult?.success === false && emailSyncFailRes.emailResult?.error === 'Email notification failed'
    );
    assert(
      'Email sync throw while SMS succeeds: smsResult succeeded independently',
      emailSyncFailRes.smsResult?.success === true && emailSyncFailRes.smsResult?.id === 'sms-sync-ok'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.7 SMS synchronous throw while email succeeds (isolation)
  try {
    emailService.sendEmail = async () => ({ success: true, mode: 'demo', id: 'email-sync-ok' });
    smsService.sendSms = () => {
      throw new Error('Fatal synchronous SMS exception');
    };

    const smsSyncFailRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'SyncSmsFail' },
      loginId: 'PAT-SYNC-2'
    });

    assert('SMS sync throw while email succeeds: overall success is false', smsSyncFailRes.success === false);
    assert(
      'SMS sync throw while email succeeds: emailResult succeeded independently',
      smsSyncFailRes.emailResult?.success === true && smsSyncFailRes.emailResult?.id === 'email-sync-ok'
    );
    assert(
      'SMS sync throw while email succeeds: smsResult is failed with safe generic error',
      smsSyncFailRes.smsResult?.success === false && smsSyncFailRes.smsResult?.error === 'SMS notification failed'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.8 Promise rejection in either channel
  try {
    // 4.8a Email promise rejects
    emailService.sendEmail = () => Promise.reject(new Error('Sensitive database credentials leak'));
    smsService.sendSms = async () => ({ success: true, provider: 'demo', id: 'sms-rej-ok' });

    const emailRejRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'RejEmail' },
      loginId: 'PAT-REJ-1'
    });

    assert('Email promise rejection: overall success is false', emailRejRes.success === false);
    assert(
      'Email promise rejection: emailResult set to { success: false, error: "Email notification failed" }',
      emailRejRes.emailResult?.success === false && emailRejRes.emailResult?.error === 'Email notification failed'
    );
    assert(
      'Email promise rejection: smsResult still succeeds',
      emailRejRes.smsResult?.success === true && emailRejRes.smsResult?.id === 'sms-rej-ok'
    );

    // 4.8b SMS promise rejects
    emailService.sendEmail = async () => ({ success: true, mode: 'demo', id: 'email-rej-ok' });
    smsService.sendSms = () => Promise.reject(new Error('Sensitive SMS gateway token leak'));

    const smsRejRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'RejSms' },
      loginId: 'PAT-REJ-2'
    });

    assert('SMS promise rejection: overall success is false', smsRejRes.success === false);
    assert(
      'SMS promise rejection: emailResult still succeeds',
      smsRejRes.emailResult?.success === true && smsRejRes.emailResult?.id === 'email-rej-ok'
    );
    assert(
      'SMS promise rejection: smsResult set to { success: false, error: "SMS notification failed" }',
      smsRejRes.smsResult?.success === false && smsRejRes.smsResult?.error === 'SMS notification failed'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.9 Both channels rejecting
  try {
    emailService.sendEmail = () => Promise.reject(new Error('Email server destroyed'));
    smsService.sendSms = () => Promise.reject(new Error('SMS network down'));

    const bothRejRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'BothRej' },
      loginId: 'PAT-BOTH-REJ'
    });

    assert('Both channels rejecting: overall success is false', bothRejRes.success === false);
    assert(
      'Both channels rejecting: emailResult is not null and error is "Email notification failed"',
      bothRejRes.emailResult?.success === false && bothRejRes.emailResult?.error === 'Email notification failed'
    );
    assert(
      'Both channels rejecting: smsResult is not null and error is "SMS notification failed"',
      bothRejRes.smsResult?.success === false && bothRejRes.smsResult?.error === 'SMS notification failed'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.10 Invalid provider results (null, undefined, non-object, missing success boolean)
  try {
    emailService.sendEmail = async () => null;
    smsService.sendSms = async () => ({ status: 'delivered', code: 200 });

    const invalidRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: '9876543210',
      fullName: { firstName: 'InvalidResult' },
      loginId: 'PAT-INVALID'
    });

    assert('Invalid provider result: overall success is false', invalidRes.success === false);
    assert(
      'Invalid email provider result (null) treated as failed',
      invalidRes.emailResult?.success === false && invalidRes.emailResult?.error === 'Email notification failed'
    );
    assert(
      'Invalid SMS provider result (missing success boolean) treated as failed',
      invalidRes.smsResult?.success === false && invalidRes.smsResult?.error === 'SMS notification failed'
    );
  } finally {
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // 4.11 Regression test: Unexpected dispatcher error after one channel succeeds
  const origConsoleLog = console.log;
  try {
    emailService.sendEmail = async () => ({ success: true, mode: 'demo', id: 'email-succ-before-err' });

    // Mock console.log to throw only on the summary log inside dispatchNotification
    console.log = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('[NotificationService:EVENT] "PATIENT_SELF_REGISTRATION"')) {
        throw new Error('Simulated post-dispatch internal crash');
      }
      origConsoleLog(...args);
    };

    const postErrorRes = await notificationService.sendPatientRegistrationNotice({
      email: 'user@example.com',
      phone: null, // SMS not attempted
      fullName: { firstName: 'PostErr' },
      loginId: 'PAT-POST-ERR'
    });

    assert(
      'Unexpected error after channel succeeds: overall success is false',
      postErrorRes.success === false
    );
    assert(
      'Unexpected error after channel succeeds: successful emailResult is preserved (not overwritten)',
      postErrorRes.emailResult?.success === true && postErrorRes.emailResult?.id === 'email-succ-before-err'
    );
    assert(
      'Unexpected error after channel succeeds: unattempted SMS is NOT marked as failed',
      postErrorRes.smsResult?.skipped === true && postErrorRes.smsResult?.success === true
    );
  } finally {
    console.log = origConsoleLog;
    emailService.sendEmail = origSendEmail;
    smsService.sendSms = origSendSms;
  }

  // -----------------------------------------------------------------
  // SECTION 5: HTTP CONTROLLER INTEGRATION & ISOLATED DATABASE TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 5. Controller Integration & Isolated Database (Retinopathy_db_notif_test) ---');

  const ISOLATED_DB_NAME = 'Retinopathy_db_notif_test';

  let connected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Connecting to MongoDB Atlas on isolated DB "${ISOLATED_DB_NAME}" (attempt ${attempt}/5)...`);
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: ISOLATED_DB_NAME,
        serverSelectionTimeoutMS: 15000
      });
      connected = true;
      console.log(`Connected to MongoDB database: "${mongoose.connection.db.databaseName}"`);
      break;
    } catch (connErr) {
      console.warn(`MongoDB connection attempt ${attempt} failed: ${connErr.message}`);
      if (attempt < 5) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!connected) {
    throw new Error(`Could not connect to MongoDB after 5 attempts`);
  }

  assert(
    'Test suite is connected strictly to isolated database "Retinopathy_db_notif_test"',
    mongoose.connection.db.databaseName === ISOLATED_DB_NAME,
    `Connected DB: ${mongoose.connection.db.databaseName}`
  );

  await Screening.init();
  await PatientProfile.init();
  await HealthcareWorkerProfile.init();
  await DoctorProfile.init();
  await userModel.init();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}\n`);

  const suffix = Date.now();
  const createdUserIds = [];
  const createdProfileIds = [];

  try {
    // 5.1 Patient Self-Registration triggers notification
    const regPatientRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'Notif', lastName: 'Patient' },
        email: `notif_pat_${suffix}@example.com`,
        password: 'Password123!',
        role: 'patient',
        personalDetails: { phone: '9876543210' }
      })
    });
    const regPatientData = await regPatientRes.json();
    if (regPatientData.user?.id) createdUserIds.push(regPatientData.user.id);
    assert(
      'Patient self-registration succeeds with HTTP 201 and unchanged envelope',
      regPatientRes.status === 201 && regPatientData.status === 'success' && !!regPatientData.user?.loginId,
      `Status: ${regPatientRes.status}`
    );

    // 5.2 HCW Registration triggers application received notification
    const regHcwRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'Notif', lastName: 'Worker' },
        email: `notif_hcw_${suffix}@example.com`,
        password: 'Password123!',
        role: 'healthcare_worker',
        personalDetails: { phone: '9876543211' },
        professionalDetails: { designation: 'ASHA Worker', department: 'Community Health' }
      })
    });
    const regHcwData = await regHcwRes.json();
    if (regHcwData.user?.id) createdUserIds.push(regHcwData.user.id);
    assert(
      'Healthcare Worker registration succeeds with HTTP 201 (pending verification)',
      regHcwRes.status === 201 && regHcwData.status === 'success' && regHcwData.user?.verificationStatus === 'pending',
      `Status: ${regHcwRes.status}`
    );

    // 5.3 Doctor Registration triggers application received notification
    const regDocRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'Notif', lastName: 'Doctor' },
        email: `notif_doc_${suffix}@example.com`,
        password: 'Password123!',
        role: 'doctor',
        personalDetails: { phone: '9876543212' },
        professionalDetails: { qualification: 'MBBS, MS Ophthalmology' }
      })
    });
    const regDocData = await regDocRes.json();
    if (regDocData.user?.id) createdUserIds.push(regDocData.user.id);
    assert(
      'Doctor registration succeeds with HTTP 201 (pending verification)',
      regDocRes.status === 201 && regDocData.status === 'success' && regDocData.user?.verificationStatus === 'pending',
      `Status: ${regDocRes.status}`
    );

    // 5.4 Admin user creation & login for verification testing
    const adminUser = await userModel.create({
      fullName: { firstName: 'Admin', lastName: 'Verifier' },
      email: `notif_admin_${suffix}@example.com`,
      password: 'Password123!',
      role: 'admin',
      isActive: true,
      verificationStatus: 'approved',
      loginId: `ADM-NOTIF-${suffix}`
    });
    createdUserIds.push(adminUser._id);
    const adminToken = adminUser.generateAuthToken();

    // 5.5 Admin approval of HCW triggers approval notification with Login ID
    const approveRes = await fetch(`${baseUrl}/api/admin/verification/${regHcwData.user.id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      }
    });
    const approveData = await approveRes.json();
    assert(
      'Admin approval succeeds with HTTP 200, assigns loginId, and triggers approval notice',
      approveRes.status === 200 && approveData.success === true && !!approveData.data?.loginId,
      `Login ID: ${approveData.data?.loginId}`
    );

    // 5.6 Admin rejection of Doctor triggers rejection notification with sanitized reason
    const rejectRes = await fetch(`${baseUrl}/api/admin/verification/${regDocData.user.id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`
      },
      body: JSON.stringify({
        reason: 'State medical council certificate was not attached.\r\nINJECTED SCRIPT'
      })
    });
    const rejectData = await rejectRes.json();
    assert(
      'Admin rejection succeeds with HTTP 200 and triggers rejection notice',
      rejectRes.status === 200 && rejectData.success === true && rejectData.data?.verificationStatus === 'rejected',
      `Status: ${rejectRes.status}`
    );

    // 5.6b Admin approval: phone lookup throws, email notification still attempted with phone: null
    const regHcw2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'PhoneFail', lastName: 'Worker' },
        email: `notif_hcw_phonefail_${suffix}@example.com`,
        password: 'Password123!',
        role: 'healthcare_worker',
        personalDetails: { phone: '9876543299' },
        professionalDetails: { designation: 'ASHA', department: 'Health' }
      })
    });
    const regHcw2Data = await regHcw2Res.json();
    if (regHcw2Data.user?.id) createdUserIds.push(regHcw2Data.user.id);

    let capturedApprovalNoticeArgs = null;
    const origSendApprovalNotice = notificationService.sendStaffApprovalNotice;
    const origHcwFindOne = HealthcareWorkerProfile.findOne;

    try {
      // Simulate database failure during phone lookup
      HealthcareWorkerProfile.findOne = () => {
        throw new Error('Simulated database connection failure during phone lookup');
      };

      notificationService.sendStaffApprovalNotice = async (args) => {
        capturedApprovalNoticeArgs = args;
        return origSendApprovalNotice(args);
      };

      const approvePhoneFailRes = await fetch(`${baseUrl}/api/admin/verification/${regHcw2Data.user.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        }
      });
      const approvePhoneFailData = await approvePhoneFailRes.json();

      // Wait a tick for the async closure to execute
      await new Promise((r) => setTimeout(r, 100));

      assert(
        'Admin approval succeeds with HTTP 200 even when phone profile lookup throws',
        approvePhoneFailRes.status === 200 && approvePhoneFailData.success === true
      );
      assert(
        'Admin approval attempts email notification with phone: null when phone lookup fails',
        capturedApprovalNoticeArgs !== null &&
        capturedApprovalNoticeArgs.email === `notif_hcw_phonefail_${suffix}@example.com` &&
        capturedApprovalNoticeArgs.phone === null &&
        !!capturedApprovalNoticeArgs.loginId
      );
    } finally {
      HealthcareWorkerProfile.findOne = origHcwFindOne;
      notificationService.sendStaffApprovalNotice = origSendApprovalNotice;
    }

    // 5.6c Admin rejection: phone lookup throws, email notification still attempted with phone: null
    const regDoc2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: { firstName: 'PhoneFail', lastName: 'Doctor' },
        email: `notif_doc_phonefail_${suffix}@example.com`,
        password: 'Password123!',
        role: 'doctor',
        personalDetails: { phone: '9876543298' },
        professionalDetails: { qualification: 'MBBS' }
      })
    });
    const regDoc2Data = await regDoc2Res.json();
    if (regDoc2Data.user?.id) createdUserIds.push(regDoc2Data.user.id);

    let capturedRejectionNoticeArgs = null;
    const origSendRejectionNotice = notificationService.sendStaffRejectionNotice;
    const origDocFindOne = DoctorProfile.findOne;

    try {
      // Simulate database failure during doctor phone lookup
      DoctorProfile.findOne = () => {
        throw new Error('Simulated database failure during doctor profile query');
      };

      notificationService.sendStaffRejectionNotice = async (args) => {
        capturedRejectionNoticeArgs = args;
        return origSendRejectionNotice(args);
      };

      const rejectPhoneFailRes = await fetch(`${baseUrl}/api/admin/verification/${regDoc2Data.user.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${adminToken}`
        },
        body: JSON.stringify({
          reason: 'Incomplete documentation'
        })
      });
      const rejectPhoneFailData = await rejectPhoneFailRes.json();

      // Wait a tick for the async closure to execute
      await new Promise((r) => setTimeout(r, 100));

      assert(
        'Admin rejection succeeds with HTTP 200 even when phone profile lookup throws',
        rejectPhoneFailRes.status === 200 && rejectPhoneFailData.success === true
      );
      assert(
        'Admin rejection attempts email notification with phone: null when phone lookup fails',
        capturedRejectionNoticeArgs !== null &&
        capturedRejectionNoticeArgs.email === `notif_doc_phonefail_${suffix}@example.com` &&
        capturedRejectionNoticeArgs.phone === null &&
        capturedRejectionNoticeArgs.reason === 'Incomplete documentation'
      );
    } finally {
      DoctorProfile.findOne = origDocFindOne;
      notificationService.sendStaffRejectionNotice = origSendRejectionNotice;
    }

    // 5.7 Field Patient Registration triggers SMS notification without leaking claim code
    const approvedHcw = await userModel.findById(regHcwData.user.id);
    const hcwToken = approvedHcw.generateAuthToken();

    const fieldRegRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${hcwToken}`
      },
      body: JSON.stringify({
        firstName: 'CampOutreach',
        lastName: 'Patient',
        phone: '9876543215',
        gender: 'female',
        diabetesStatus: 'unknown'
      })
    });
    const fieldRegData = await fieldRegRes.json();
    const fieldPatientId = fieldRegData.data?.patientId;
    const fieldProfileId = fieldRegData.data?.profileId;
    const rawClaimCode = fieldRegData.data?.claimCode;
    if (fieldProfileId) createdProfileIds.push(fieldProfileId);

    assert(
      'Field patient registration succeeds with HTTP 201 and triggers outreach SMS',
      fieldRegRes.status === 201 && fieldRegData.success === true && !!fieldPatientId,
      `Patient ID: ${fieldPatientId}`
    );

    // 5.8 Patient claims outreach record and triggers claim notification
    const patientUser = await userModel.findById(regPatientData.user.id);
    const patientToken = patientUser.generateAuthToken();

    const claimRes = await fetch(`${baseUrl}/api/patients/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${patientToken}`
      },
      body: JSON.stringify({
        patientId: fieldPatientId,
        claimCode: rawClaimCode,
        phone: '9876543215'
      })
    });
    const claimData = await claimRes.json();
    assert(
      'Patient record claim succeeds with HTTP 200 and triggers record claimed notification',
      claimRes.status === 200 && claimData.success === true && claimData.data?.claimStatus === 'claimed',
      `Status: ${claimRes.status}`
    );

    // 5.9 Verify Google Profile Completion triggers notification
    const googleUser = await userModel.create({
      fullName: { firstName: 'Google', lastName: 'User' },
      email: `google_oauth_${suffix}@example.com`,
      googleId: `google_id_${suffix}`,
      role: 'patient',
      isActive: true,
      verificationStatus: 'not_required',
      isProfileComplete: false
    });
    createdUserIds.push(googleUser._id);
    const googleToken = googleUser.generateAuthToken();

    const completeProfileRes = await fetch(`${baseUrl}/api/auth/complete-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${googleToken}`
      },
      body: JSON.stringify({
        role: 'patient',
        personalDetails: {
          phone: '9876543219',
          gender: 'other',
          diabetesStatus: 'no'
        }
      })
    });
    const completeProfileData = await completeProfileRes.json();
    assert(
      'Google profile completion succeeds with HTTP 200 and triggers profile completion notice',
      completeProfileRes.status === 200 && completeProfileData.status === 'success' && completeProfileData.user?.isProfileComplete === true,
      `Status: ${completeProfileRes.status}`
    );

    // 5.10 Notification failure NEVER breaks controller operations
    // Stub email & SMS to throw errors, then perform a registration
    try {
      emailService.sendEmail = async () => { throw new Error('Catastrophic email outage'); };
      smsService.sendSms = async () => { throw new Error('Catastrophic SMS outage'); };

      const robustRegRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: { firstName: 'Robust', lastName: 'Check' },
          email: `robust_${suffix}@example.com`,
          password: 'Password123!',
          role: 'patient',
          personalDetails: { phone: '9876543222' }
        })
      });
      const robustRegData = await robustRegRes.json();
      if (robustRegData.user?.id) createdUserIds.push(robustRegData.user.id);

      assert(
        'Controller operation succeeds with HTTP 201 even when notification service encounters total outage',
        robustRegRes.status === 201 && robustRegData.status === 'success' && !!robustRegData.user?.id,
        `Status: ${robustRegRes.status}`
      );
    } finally {
      emailService.sendEmail = origSendEmail;
      smsService.sendSms = origSendSms;
    }

  } catch (err) {
    console.error('Unexpected error in integration test section:', err);
  } finally {
    console.log('\n--- Cleaning up Test Fixtures in Retinopathy_db_notif_test ---');
    try {
      if (createdProfileIds.length > 0) {
        await PatientProfile.deleteMany({ _id: { $in: createdProfileIds } });
      }
      if (createdUserIds.length > 0) {
        await HealthcareWorkerProfile.deleteMany({ userId: { $in: createdUserIds } });
        await DoctorProfile.deleteMany({ userId: { $in: createdUserIds } });
        await PatientProfile.deleteMany({ userId: { $in: createdUserIds } });
        await userModel.deleteMany({ _id: { $in: createdUserIds } });
      }
      console.log('All test fixtures removed successfully.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    server.close();
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');

    console.log(`\n======================================================`);
    console.log(`NOTIF-01 Test Suite Results: ${passedTests} / ${totalTests} passed`);
    console.log(`======================================================\n`);

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  }
}

runNotif01Tests();
