#!/usr/bin/env node
import { execSync } from 'node:child_process';

const TARGET_REF = process.argv[2] || 'backup/previous-stable-deploy';

console.log('====================================================');
console.log(`↺ INITIATING AUTOMATED DEPLOYMENT & CODE ROLLBACK`);
console.log(`Target Rollback Ref: ${TARGET_REF}`);
console.log('====================================================\n');

try {
  console.log('[1/4] Checking target rollback ref...');
  const commitHash = execSync(`git rev-parse ${TARGET_REF}`, { encoding: 'utf-8' }).trim();
  console.log(`✓ Target ref verified at commit: ${commitHash}`);

  console.log('\n[2/4] Resetting local main branch to previous deployment...');
  execSync(`git reset --hard ${commitHash}`, { stdio: 'inherit' });

  console.log('\n[3/4] Force pushing rollback to remote repositories (rp_club & origin)...');
  execSync(`git push rp_club main --force`, { stdio: 'inherit' });
  execSync(`git push rp_club main:master --force`, { stdio: 'inherit' });
  execSync(`git push origin main --force`, { stdio: 'inherit' });

  console.log('\n[4/4] Rebuilding production assets for rolled-back state...');
  execSync(`npm run build`, { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log(`🎉 AUTOMATED ROLLBACK COMPLETE!`);
  console.log(`Vercel is now deploying the previous stable release (${commitHash.slice(0, 7)}).`);
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ Rollback failed:', error.message);
  process.exit(1);
}
