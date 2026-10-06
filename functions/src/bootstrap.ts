// Run only in a trusted environment with Application Default Credentials.
// Creates workspace membership for an EXISTING Firebase Authentication user.
// No password or private key is accepted as a command-line argument.
import { getAuth } from 'firebase-admin/auth';
import { db } from './db';
async function main() {
  const [uid, workspaceId] = process.argv.slice(2);
  if (!uid || !workspaceId || !/^[\w-]+$/.test(workspaceId))
    throw new Error('Usage: npm run bootstrap -- AUTH_UID WORKSPACE_ID');
  await getAuth().getUser(uid);
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const workspaceRef = db.doc(`workspaces/${workspaceId}`);
    const [user, workspace] = await Promise.all([tx.get(userRef), tx.get(workspaceRef)]);
    if (user.exists || workspace.exists)
      throw new Error('Existing user or workspace. Refusing to overwrite.');
    tx.create(workspaceRef, {
      ownerUid: uid,
      status: 'active',
      name: '내 작업공간',
      createdAt: new Date().toISOString(),
    });
    tx.create(userRef, { workspaceId, role: 'owner', status: 'active' });
    tx.create(db.doc(`workspaces/${workspaceId}/privateConfig/automation`), { enabled: false });
  });
  console.log('Workspace created. Live messaging is disabled until integration verification.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
