<template>
  <main class="wish-app" :class="{ 'is-readonly': !isLatest }">
    <TopSummary :is-latest="isLatest" @navigate="selectTab" />

    <nav class="main-nav" aria-label="心愿社板块">
      <button v-for="item in tabs" :key="item.id" :class="{ active: activeTab === item.id }" type="button" @click="selectTab(item.id)">
        <i :class="['fa-solid', item.icon]"></i><span>{{ item.label }}</span>
      </button>
    </nav>

    <section v-if="!isLatest" class="history-summary panel">
      <div class="panel-heading"><div><span class="eyebrow">SNAPSHOT</span><h2>当前状态</h2></div></div>
      <div class="snapshot-grid">
        <article><i class="fa-solid fa-list-check"></i><span>已接任务</span><strong>{{ acceptedCount }} / 2</strong></article>
        <article><i class="fa-solid fa-bullhorn"></i><span>已发任务</span><strong>{{ publishedCount }} / 1</strong></article>
        <article><i class="fa-solid fa-bag-shopping"></i><span>订单</span><strong>{{ orderCount }}</strong></article>
        <article><i class="fa-regular fa-bell"></i><span>未读通知</span><strong>{{ unreadCount }}</strong></article>
      </div>
      <CharacterPanel v-if="activeTab === 'character'" :is-latest="false" />
      <div v-else class="snapshot-note">切换到“人物”可查看这一楼层记录的穿着、身体状态、衣柜和库存。</div>
    </section>

    <template v-else>
      <TaskPanel v-if="activeTab === 'tasks'" :is-latest="isLatest" :open-task-id="navigationTarget?.板块 === '任务' ? navigationTarget.帖子ID : ''" />
      <ForumPanel v-else-if="activeTab === 'forum'" :is-latest="isLatest" :open-post-id="navigationTarget?.板块 === '论坛' ? navigationTarget.帖子ID : ''" />
      <ShopPanel v-else-if="activeTab === 'shop'" :is-latest="isLatest" />
      <CharacterPanel v-else-if="activeTab === 'character'" :is-latest="isLatest" />
      <ProfilePanel v-else :is-latest="isLatest" @open-notice="openNotice" />
    </template>

    <footer><span>心愿社仅面向成年人 · 自愿、知情、可撤回</span><span>当前楼层 #{{ mountedFloorId }}</span></footer>
  </main>
</template>

<script setup lang="ts">
import CharacterPanel from './components/CharacterPanel.vue';
import ForumPanel from './components/ForumPanel.vue';
import ProfilePanel from './components/ProfilePanel.vue';
import ShopPanel from './components/ShopPanel.vue';
import TaskPanel from './components/TaskPanel.vue';
import TopSummary from './components/TopSummary.vue';
import { useAppActions } from './composables/useAppActions';
import { mountedFloorId, useDataStore } from './store';

const { data } = useDataStore();
const isLatest = ref(mountedFloorId === getLastMessageId());
useIntervalFn(() => (isLatest.value = mountedFloorId === getLastMessageId()), 1200);
const actions = useAppActions(isLatest);
const activeTab = useLocalStorage('心愿社:active-tab', 'tasks');
type ThreadTarget = { 板块: '任务' | '论坛'; 帖子ID: string };
const navigationTarget = ref<ThreadTarget | null>(null);
const tabs = [
  { id: 'tasks', label: '任务', icon: 'fa-list-check' },
  { id: 'forum', label: '论坛', icon: 'fa-comments' },
  { id: 'shop', label: '商城', icon: 'fa-bag-shopping' },
  { id: 'character', label: '人物', icon: 'fa-user' },
  { id: 'profile', label: '我的', icon: 'fa-circle-user' },
];

const acceptedCount = computed(() => Object.keys(data.心愿社.我接取的).length);
const publishedCount = computed(() => Object.keys(data.心愿社.我发布的).length);
const orderCount = computed(() => Object.keys(data.心愿社.订单).length);
const unreadCount = computed(() => Object.values(data.心愿社.通知).filter(item => !item.已读).length);

function selectTab(tab: string) {
  navigationTarget.value = null;
  activeTab.value = tab;
}

function openNotice(target: ThreadTarget) {
  navigationTarget.value = { ...target };
  activeTab.value = target.板块 === '任务' ? 'tasks' : 'forum';
}

watchEffect(() => {
  if (!isLatest.value) return;
  for (const [id, task] of Object.entries(data.心愿社.我接取的)) {
    if (task.审核状态 === '已通过' && !task.奖励已结算) {
      task.奖励已结算 = true;
      task.任务状态 = '已完成';
      data.账号.爱心.可用 += task.奖励;
      if (data.心愿社.当前追踪任务ID === id) data.心愿社.当前追踪任务ID = '无';
      actions.log(`任务“${task.标题}”审核通过，结算 ${task.奖励} 爱心。`);
      actions.notify('任务', '奖励已到账', `“${task.标题}”结算 ${task.奖励} 爱心。`);
    }
  }
});
</script>
