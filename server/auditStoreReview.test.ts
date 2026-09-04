import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditStore } from './auditStore.js';

test('human issue review decisions persist in the audit session', () => {
  const store = new AuditStore();
  const session = store.getAudit('audit-enterprise-demo');
  assert.ok(session);
  const issue = session.issues[0];
  assert.ok(issue);

  const updated = store.updateIssueReview(session.project.id, issue.id, 'confirmed', 'Verified against the page response');
  assert.equal(updated?.reviewStatus, 'confirmed');
  assert.equal(updated?.reviewNote, 'Verified against the page response');
  assert.ok(updated?.reviewedAt);
  assert.equal(store.getAudit(session.project.id)?.issues[0].reviewStatus, 'confirmed');
});
