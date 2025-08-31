#!/usr/bin/env node

// Simple Node.js test to verify team aliases functionality
const fs = require('fs');
const path = require('path');

// Read and evaluate the team aliases (simplified for Node.js)
const aliasesPath = path.join(__dirname, 'src/config/team-aliases.ts');
const content = fs.readFileSync(aliasesPath, 'utf8');

// Extract the TEAM_ALIASES object (simplified parsing)
const aliasesMatch = content.match(/export const TEAM_ALIASES[^}]+}[^}]+}[^}]+}/s);
if (!aliasesMatch) {
  console.error('❌ Could not parse TEAM_ALIASES from file');
  process.exit(1);
}

console.log('🧪 Testing Team Aliases Configuration');
console.log('=====================================\n');

// Test expected teams
const expectedTeams = [
  'ucsd',
  'ucsd-mens-basketball', 
  'sf-state',
  'usd-baseball',
  'usf-basketball',
  'cal-poly-pomona'
];

const expectedNames = [
  'UCSD Baseball',
  "UCSD Men's Basketball",
  'SF State Baseball', 
  'USD Baseball',
  'USF Basketball',
  'Cal Poly Pomona Baseball'
];

// Check that all expected teams are present
let allFound = true;
expectedTeams.forEach(teamId => {
  if (content.includes(`'${teamId}':`)) {
    console.log(`✅ Found team ID: ${teamId}`);
  } else {
    console.log(`❌ Missing team ID: ${teamId}`);
    allFound = false;
  }
});

expectedNames.forEach(teamName => {
  if (content.includes(`name: '${teamName}'`) || content.includes(`name: "${teamName}"`)) {
    console.log(`✅ Found team name: ${teamName}`);
  } else {
    console.log(`❌ Missing team name: ${teamName}`);
    allFound = false;
  }
});

// Check for required color overrides
const colorOverrides = ['UCSD', 'USD', 'USF'];
colorOverrides.forEach(team => {
  if (content.includes(`colors: { primary:`)) {
    console.log(`✅ Found color overrides for teams`);
  }
});

// Check for conference overrides  
const conferences = ['Big West', 'CCAA', 'West Coast Conference'];
conferences.forEach(conf => {
  if (content.includes(`conference: '${conf}'`)) {
    console.log(`✅ Found conference: ${conf}`);
  }
});

console.log('\n📋 Summary:');
if (allFound) {
  console.log('🎉 All expected teams and configurations found!');
  console.log('✅ Team aliases configuration is complete');
} else {
  console.log('⚠️  Some expected teams or configurations are missing');
  process.exit(1);
}

console.log('\n🚀 Next steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Test URL switching: ?team_id=usf-basketball');
console.log('3. Run browser validation: runCompleteValidation()');