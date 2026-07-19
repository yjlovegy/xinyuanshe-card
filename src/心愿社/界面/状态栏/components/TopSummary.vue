<template>
  <header class="top-summary">
    <div class="brand-block">
      <div class="brand-mark"><i class="fa-solid fa-heart"></i></div>
      <div><strong>心愿社</strong><span>WISH CLUB</span></div>
    </div>
    <div class="summary-grid">
      <div><i class="fa-regular fa-clock"></i><span>{{ data.世界.当前时间 }}</span></div>
      <div><i class="fa-solid fa-location-dot"></i><span>{{ location }}</span></div>
      <div><i class="fa-solid fa-heart"></i><span>{{ data.账号.爱心.可用 }}</span><small>托管 {{ data.账号.爱心.托管 }}</small></div>
      <div><i class="fa-solid fa-seedling"></i><span>Lv.{{ data.账号._论坛等级 }}</span><small>{{ data.账号.论坛经验 }} EXP</small></div>
    </div>
    <div class="top-actions">
      <button class="icon-button" type="button" title="通知" @click="$emit('navigate', 'profile')">
        <i class="fa-regular fa-bell"></i><b v-if="unread">{{ unread }}</b>
      </button>
      <button class="tracking" type="button" @click="$emit('navigate', 'tasks')">
        <small>当前任务</small><span>{{ trackingTitle }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

defineProps<{ isLatest: boolean }>();
defineEmits<{ navigate: [tab: string] }>();

const { data } = useDataStore();
const location = computed(() => `${data.世界.当前位置.城市} · ${data.世界.当前位置.场所}`);
const unread = computed(() => Object.values(data.心愿社.通知).filter(item => !item.已读).length);
const trackingTitle = computed(() => {
  const id = data.心愿社.当前追踪任务ID;
  return id === '无' ? '暂未追踪' : data.心愿社.我接取的[id]?.标题 ?? '暂未追踪';
});
</script>
