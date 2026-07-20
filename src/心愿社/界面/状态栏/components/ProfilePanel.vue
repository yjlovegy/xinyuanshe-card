<template>
  <section class="panel">
    <div class="panel-heading">
      <div><span class="eyebrow">MY ACCOUNT</span><h2>我的心愿社</h2></div>
      <button v-if="isLatest && unread" class="button ghost compact" type="button" @click="actions.markAllRead()">全部已读</button>
    </div>

    <div class="account-hero">
      <div class="large-avatar">
        <img v-if="avatarSource" :src="avatarSource" alt="人物头像" />
        <span v-else>{{ userName.slice(0, 1) }}</span>
      </div>
      <div><strong>{{ userName }}</strong><p>IP地址：{{ data.世界.当前位置.城市 }} · 论坛等级：Lv.{{ data.账号._论坛等级 }}</p></div>
      <div class="wallet"><span>可用 <b>{{ data.账号.爱心.可用 }}</b></span><span>托管 <b>{{ data.账号.爱心.托管 }}</b></span></div>
    </div>

    <div class="profile-stats">
      <article><span>接取任务</span><strong>{{ Object.keys(data.心愿社.我接取的).length }} / 2</strong></article>
      <article><span>发布任务</span><strong>{{ Object.keys(data.心愿社.我发布的).length }} / 1</strong></article>
      <article><span>衣柜</span><strong>{{ Object.keys(data.心愿社.衣柜).length }}</strong></article>
      <article><span>库存</span><strong>{{ Object.keys(data.心愿社.道具库存).length }}</strong></article>
    </div>

    <section class="subsection">
      <div class="section-row"><h3><i class="fa-regular fa-bell"></i> 通知</h3><span>{{ unread }} 条未读</span></div>
      <div class="notice-list">
        <article
          v-for="[id, notice] in notices" :key="id" :class="{ unread: !notice.已读, linked: canOpenNotice(notice) }"
          :role="canOpenNotice(notice) ? 'button' : undefined" :tabindex="canOpenNotice(notice) ? 0 : undefined"
          @click="openNotice(id, notice)" @keyup.enter="openNotice(id, notice)"
        >
          <i :class="['fa-solid', noticeIcon(notice.类型)]"></i><div><div><strong>{{ notice.标题 }}</strong><small>{{ notice.时间 }}</small></div><p>{{ notice.内容 }}</p></div>
          <i v-if="canOpenNotice(notice)" class="fa-solid fa-chevron-right notice-link-icon"></i>
        </article>
      </div>
    </section>

    <section class="subsection">
      <div class="section-row"><h3><i class="fa-solid fa-list-ul"></i> 待处理操作日志</h3><span>供下一次回复读取</span></div>
      <div v-if="logs.length" class="log-list"><p v-for="[id, item] in logs" :key="id"><small>{{ item.时间 }}</small><span>{{ item.操作 }}</span></p></div>
      <p v-else class="empty-state">本楼层还没有新的平台内操作。</p>
    </section>

  </section>
</template>

<script setup lang="ts">
import { useAppActions } from '../composables/useAppActions';
import { useAvatarStorage } from '../composables/useAvatarStorage';
import { resolveUserName } from '../composables/useUserName';
import { useDataStore } from '../store';

const props = defineProps<{ isLatest: boolean }>();
type ThreadTarget = { 板块: '任务' | '论坛'; 帖子ID: string };
const emit = defineEmits<{ openNotice: [target: ThreadTarget] }>();
const { data } = useDataStore();
type Notice = (typeof data.心愿社.通知)[string];
const actions = useAppActions(toRef(props, 'isLatest'));
const userName = computed(() => resolveUserName(data.主角.姓名));
const { avatarSource } = useAvatarStorage();
const notices = computed(() => Object.entries(data.心愿社.通知).reverse());
const logs = computed(() => Object.entries(data.心愿社._待处理操作日志).reverse());
const unread = computed(() => Object.values(data.心愿社.通知).filter(item => !item.已读).length);
const noticeIcon = (type: string) => ({ 任务: 'fa-list-check', 论坛: 'fa-comments', 商城: 'fa-bag-shopping', 系统: 'fa-gear' })[type] ?? 'fa-bell';
const canOpenNotice = (notice: Notice) => ['任务', '论坛'].includes(notice.跳转目标.板块) && notice.跳转目标.帖子ID !== '无';
function openNotice(id: string, notice: Notice) {
  if (!canOpenNotice(notice)) return;
  actions.markNoticeRead(id);
  emit('openNotice', notice.跳转目标 as ThreadTarget);
}
</script>
