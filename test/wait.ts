import { TemporaryContainers } from '~/background/tmp';

export async function waitForTempContainers(
  background: TemporaryContainers,
  count: number,
  { timeout = 2000, poll = 25 }: { timeout?: number; poll?: number } = {}
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const current = Object.keys(background.storage.local.tempContainers).length;
    if (current >= count) return;
    await new Promise(r => setTimeout(r, poll));
  }
  throw new Error(`Timed out waiting for ${count} temp containers (have ${Object.keys(background.storage.local.tempContainers).length})`);
}

export async function waitForContainer(
  background: TemporaryContainers,
  cookieStoreId: string,
  { timeout = 2000, poll = 25 }: { timeout?: number; poll?: number } = {}
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (background.storage.local.tempContainers[cookieStoreId]) return;
    await new Promise(r => setTimeout(r, poll));
  }
  throw new Error(`Timed out waiting for container ${cookieStoreId}`);
}
