// Final validation script for team logos and data display
// This validates that the Schedule tab displays correct data and appropriate logos

console.log('=== AiLumni-Hub Team Logo Validation Script ===');

// Expected team data from API
const EXPECTED_TEAMS = {
  'UCSD Baseball': {
    logoUrl: 'https://ucsdtritons.com/images/logos/site/site.png',
    isUCSD: true
  },
  'UCSD Men\'s Basketball': {
    logoUrl: 'https://ucsdtritons.com/images/logos/site/site.png',
    isUCSD: true
  },
  'UCSD Men\'s Golf': {
    logoUrl: 'https://ucsdtritons.com/images/logos/site/site.png',
    isUCSD: true
  },
  'USD Baseball': {
    logoUrl: 'https://usdtoreros.com/images/logos/site/site.png',
    isUCSD: false
  },
  'SF State Baseball': {
    logoUrl: 'https://sfstategators.com/images/logos/site/site.png',
    isUCSD: false
  },
  'USF Basketball': {
    logoUrl: 'https://usfdons.com/images/logos/site/site.png',
    isUCSD: false
  }
};

// Function to validate a single team's logo display
async function validateTeamLogo(teamName) {
  console.log(`\n🔍 Validating team: ${teamName}`);
  
  const expected = EXPECTED_TEAMS[teamName];
  if (!expected) {
    console.warn(`⚠️  No expected data for team: ${teamName}`);
    return false;
  }
  
  // Switch to the team
  if (window.dashboardSwitchTeam) {
    await window.dashboardSwitchTeam(teamName);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for data to load
  } else {
    console.error('❌ Dashboard switch function not available');
    return false;
  }
  
  // Check logo elements
  const logoElements = document.querySelectorAll('img[alt="Team Logo"], .team-logo');
  let hasCorrectLogo = false;
  
  logoElements.forEach((img, index) => {
    const isTritonLogo = img.src.includes('ucsdtritons.com');
    const isExpectedLogo = img.src === expected.logoUrl;
    
    console.log(`  Logo ${index + 1}: ${img.src}`);
    console.log(`    Expected UCSD: ${expected.isUCSD}, Is Triton: ${isTritonLogo}`);
    console.log(`    Expected URL: ${expected.logoUrl}`);
    console.log(`    Matches Expected: ${isExpectedLogo}`);
    
    if (expected.isUCSD && isTritonLogo) {
      hasCorrectLogo = true;
    } else if (!expected.isUCSD && !isTritonLogo) {
      hasCorrectLogo = true;
    }
  });
  
  const result = hasCorrectLogo ? '✅' : '❌';
  console.log(`  ${result} Logo validation: ${hasCorrectLogo ? 'PASS' : 'FAIL'}`);
  
  return hasCorrectLogo;
}

// Function to run complete validation
async function runCompleteValidation() {
  console.log('\n🚀 Starting complete team logo validation...');
  
  const teams = Object.keys(EXPECTED_TEAMS);
  const results = {};
  
  for (const team of teams) {
    results[team] = await validateTeamLogo(team);
  }
  
  console.log('\n📊 Final Results:');
  console.log('==================');
  
  let passCount = 0;
  let totalCount = 0;
  
  for (const [team, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const isUCSD = EXPECTED_TEAMS[team].isUCSD ? '(UCSD Team)' : '(Non-UCSD Team)';
    console.log(`${status} ${team} ${isUCSD}`);
    if (passed) passCount++;
    totalCount++;
  }
  
  console.log(`\n🎯 Overall Score: ${passCount}/${totalCount} teams passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! Triton logo only appears for UCSD teams.');
  } else {
    console.log('⚠️  Some tests failed. Review the logo logic.');
  }
  
  return results;
}

// Function to quickly check current state
function quickCheck() {
  const currentTeam = window.getCurrentTeam ? window.getCurrentTeam() : 'Unknown';
  const isUCSDTeam = currentTeam.includes('UCSD');
  
  console.log('\n🔍 Quick Check:');
  console.log(`Current team: ${currentTeam}`);
  console.log(`Is UCSD team: ${isUCSDTeam}`);
  
  const logoElements = document.querySelectorAll('img[alt="Team Logo"], .team-logo');
  logoElements.forEach((img, index) => {
    const isTritonLogo = img.src.includes('ucsdtritons.com');
    const status = (isUCSDTeam && isTritonLogo) || (!isUCSDTeam && !isTritonLogo) ? '✅' : '❌';
    console.log(`  ${status} Logo ${index + 1}: ${img.src}`);
  });
}

// Make functions available globally
window.validateTeamLogo = validateTeamLogo;
window.runCompleteValidation = runCompleteValidation;
window.quickCheck = quickCheck;
window.EXPECTED_TEAMS = EXPECTED_TEAMS;

console.log('\n📋 Available Commands:');
console.log('• quickCheck() - Check current team logo');
console.log('• validateTeamLogo("UCSD Baseball") - Test specific team');
console.log('• runCompleteValidation() - Test all teams');
console.log('\n🏃‍♂️ Quick Start: Run runCompleteValidation() to test everything!');
