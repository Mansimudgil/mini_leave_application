/**
 * End-to-End Automated Verification Test Suite
 * Mini Leave Request Application
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('   Running Mini Leave Request Application Test Suite    ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Health Check
    console.log('[1] Testing Health Check:');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'API health status is OK');

    // Test 2: Employees List & Balances
    console.log('\n[2] Testing Employee Seeding & Initial Quotas:');
    const empRes = await fetch(`${BASE_URL}/employees`);
    const empData = await empRes.json();
    assert(empRes.status === 200 && empData.count >= 4, `Loaded ${empData.count} seed employees`);
    const sarah = empData.data.find(e => e.employeeId === 'EMP001');
    assert(sarah !== undefined, 'Found employee Sarah Connor (EMP001)');

    // Test 3: Weekend Handling & Working Days Calculation
    console.log('\n[3] Testing Weekend Calculation (Fri Oct 9 to Mon Oct 12, 2026):');
    const previewRes = await fetch(`${BASE_URL}/leaves/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP001',
        leaveType: 'Casual',
        startDate: '2026-10-09', // Friday
        endDate: '2026-10-12'    // Monday
      })
    });
    const previewData = await previewRes.json();
    assert(previewData.data.totalDays === 4, 'Total calendar days is 4');
    assert(previewData.data.workingDays === 2, 'Deductible working days is exactly 2 (Friday & Monday)');
    assert(previewData.data.weekendDays === 2, 'Weekend days skipped is exactly 2 (Saturday & Sunday)');

    // Test 4: Edge Case - Weekend Only Date Range
    console.log('\n[4] Testing Edge Case: Weekend-Only Range (Sat Oct 10 to Sun Oct 11, 2026):');
    const weekendOnlyRes = await fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP001',
        leaveType: 'Casual',
        startDate: '2026-10-10',
        endDate: '2026-10-11',
        reason: 'Weekend off'
      })
    });
    const weekendOnlyData = await weekendOnlyRes.json();
    assert(weekendOnlyRes.status === 400, 'Blocked 0-working-day weekend request with HTTP 400');
    assert(weekendOnlyData.message.includes('weekend'), `Correct error message returned: "${weekendOnlyData.message}"`);

    // Test 5: Valid Leave Application
    console.log('\n[5] Testing Leave Application (Tue Oct 13 to Thu Oct 15, 2026):');
    const applyRes = await fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP001',
        leaveType: 'Casual',
        startDate: '2026-10-13',
        endDate: '2026-10-15',
        reason: 'Family event'
      })
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201 && applyData.data.status === 'Pending', 'Leave request created with status Pending');
    assert(applyData.data.workingDays === 3, 'Calculated 3 working days');
    const newRequestId = applyData.data._id;

    // Test 6: Edge Case - Overlapping Leave Request
    console.log('\n[6] Testing Edge Case: Overlapping Request (Wed Oct 14 to Fri Oct 16, 2026):');
    const overlapRes = await fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP001',
        leaveType: 'Sick',
        startDate: '2026-10-14',
        endDate: '2026-10-16',
        reason: 'Overlapping application'
      })
    });
    const overlapData = await overlapRes.json();
    assert(overlapRes.status === 400 && overlapData.code === 'OVERLAPPING_REQUEST', 'Caught overlapping request with code OVERLAPPING_REQUEST');

    // Test 7: Edge Case - Insufficient Balance
    console.log('\n[7] Testing Edge Case: Insufficient Balance:');
    // Jim Halpert has casual balance 4
    const exceedRes = await fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP003',
        leaveType: 'Casual',
        startDate: '2026-11-02',
        endDate: '2026-11-20', // 15 working days
        reason: 'Month vacation'
      })
    });
    const exceedData = await exceedRes.json();
    assert(exceedRes.status === 400 && exceedData.code === 'INSUFFICIENT_BALANCE', 'Caught insufficient balance request with code INSUFFICIENT_BALANCE');

    // Test 8: Manager Approval & Balance Deduction
    console.log('\n[8] Testing Manager Approval & Correct Balance Deduction:');
    // Get Sarah's balance before approval
    const sarahBeforeRes = await fetch(`${BASE_URL}/employees/EMP001`);
    const sarahBefore = await sarahBeforeRes.json();
    const balanceBefore = sarahBefore.data.leaveBalances.casual;

    const approveRes = await fetch(`${BASE_URL}/leaves/${newRequestId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        managerComments: 'Approved. Have a great time!',
        managerId: 'EMP002'
      })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Manager approval succeeded');
    assert(approveData.data.leaveRequest.status === 'Approved', 'Status updated to Approved');

    // Verify balance was deducted by workingDays (3)
    const sarahAfterRes = await fetch(`${BASE_URL}/employees/EMP001`);
    const sarahAfter = await sarahAfterRes.json();
    const balanceAfter = sarahAfter.data.leaveBalances.casual;
    assert(balanceAfter === balanceBefore - 3, `Leave balance deducted correctly: ${balanceBefore} -> ${balanceAfter}`);

    // Test 9: Prevent Double Action on Reviewed Request
    console.log('\n[9] Testing Idempotency & Modification Lock:');
    const doubleApproveRes = await fetch(`${BASE_URL}/leaves/${newRequestId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    });
    assert(doubleApproveRes.status === 400, 'Prevented re-modifying an already approved request');

  } catch (err) {
    console.error('Unexpected test execution error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
