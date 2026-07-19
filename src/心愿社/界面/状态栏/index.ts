import { WAIT_FOREVER, waitUntil } from 'async-wait-until';
import App from './App.vue';
import { Schema } from '../../schema';
import './global.css';

const messageOption = { type: 'message', message_id: getCurrentMessageId() } as const;

function renderBootState(slow = false) {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;

  root.innerHTML = `
    <main class="wish-app boot-shell" aria-live="polite" aria-busy="true">
      <div class="boot-brand">
        <span class="boot-mark" aria-hidden="true">♥</span>
        <div>
          <strong>心愿社</strong>
          <small>正在读取初始状态</small>
        </div>
      </div>
      <div class="boot-progress" aria-hidden="true"><span></span></div>
      <p>${
        slow
          ? '初始变量仍在载入；如长时间没有完成，请点击聊天框上方的“重新读取初始变量”。'
          : '正在同步本楼层的任务、论坛、商城与人物状态…'
      }</p>
    </main>
  `;
}

$(async () => {
  renderBootState();
  const slowHintTimer = window.setTimeout(() => renderBootState(true), 6000);

  await waitGlobalInitialized('Mvu');
  await waitUntil(
    () => {
      try {
        return Schema.safeParse(Mvu.getMvuData(messageOption).stat_data).success;
      } catch {
        return false;
      }
    },
    { timeout: WAIT_FOREVER, intervalBetweenAttempts: 150 },
  );

  window.clearTimeout(slowHintTimer);
  createApp(App).use(createPinia()).mount('#app');
});
