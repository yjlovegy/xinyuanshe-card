<template>
  <section class="panel">
    <div class="panel-heading">
      <div><span class="eyebrow">COMMUNITY</span><h2>论坛区</h2></div>
      <div class="level-card"><span>论坛等级</span><strong>Lv.{{ data.账号._论坛等级 }}</strong><small>{{ data.账号.论坛经验 % 100 }} / 100 EXP</small></div>
    </div>

    <div class="forum-toolbar">
      <nav class="subnav flat"><button v-for="item in filters" :key="item" :class="{ active: filter === item }" type="button" @click="filter = item">{{ item }}</button></nav>
      <button v-if="isLatest" class="button primary" type="button" @click="showComposer = !showComposer"><i class="fa-solid fa-pen"></i> 发帖</button>
    </div>

    <form v-if="showComposer" class="composer" @submit.prevent="submitPost">
      <label>分区<select v-model="postForm.分区"><option>推荐</option><option>最新</option><option>同城</option></select></label>
      <label>标签<input v-model="postForm.标签" placeholder="经验｜上海｜闲聊" /></label>
      <label class="span-2">标题<input v-model="postForm.标题" maxlength="60" placeholder="想聊点什么？" /></label>
      <label class="span-2">正文<textarea v-model="postForm.正文" placeholder="友善交流，保护自己和他人的隐私。"></textarea></label>
      <div class="span-2 action-row"><button class="button primary" type="submit">发布帖子</button><button class="button ghost" type="button" @click="showComposer = false">取消</button></div>
    </form>

    <div class="forum-list">
      <article v-for="[id, post] in visiblePosts" :key="id" class="forum-card">
        <div class="forum-author"><span class="avatar-dot">{{ post.作者.slice(0, 1) }}</span><div><strong>{{ post.作者 }}</strong><small>Lv.{{ post.作者等级 }} · {{ post.发布时间 }}</small></div><em>{{ post.分区 }}</em></div>
        <button class="forum-content" type="button" @click="expanded = expanded === id ? '' : id"><h3>{{ post.标题 }}</h3><p>{{ post.正文 }}</p><span># {{ post.标签 }}</span></button>
        <div class="forum-actions">
          <button type="button" :class="{ active: post.已点赞 }" :disabled="!isLatest" @click="actions.toggleForumLike(id)"><i class="fa-solid fa-heart"></i>{{ post.点赞数 }}</button>
          <button type="button" :class="{ active: post.已收藏 }" :disabled="!isLatest" @click="actions.toggleForumFavorite(id)"><i class="fa-solid fa-bookmark"></i>{{ post.已收藏 ? '已收藏' : '收藏' }}</button>
          <button type="button" @click="expanded = expanded === id ? '' : id"><i class="fa-regular fa-comment"></i>{{ Object.keys(post.回复).length }} 回复</button>
        </div>
        <div v-if="expanded === id" class="forum-replies">
          <p v-for="[replyId, reply] in Object.entries(post.回复)" :key="replyId"><strong>{{ reply.作者 }}</strong><span>{{ reply.内容 }}</span><small>{{ reply.时间 }}</small></p>
          <p v-if="!Object.keys(post.回复).length" class="empty-state">还没有回复。</p>
          <div v-if="isLatest" class="inline-form"><input v-model="replyText" placeholder="写下回复……" @keyup.enter="sendReply(id)" /><button class="button ghost compact" type="button" @click="sendReply(id)">回复</button></div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ForumPostForm } from '../composables/useAppActions';
import { useAppActions } from '../composables/useAppActions';
import { useDataStore } from '../store';

const props = defineProps<{ isLatest: boolean; openPostId?: string }>();
const actions = useAppActions(toRef(props, 'isLatest'));
const { data } = useDataStore();
const filters = ['推荐', '最新', '同城', '收藏'] as const;
const filter = ref<(typeof filters)[number]>('推荐');
const expanded = ref('');
const replyText = ref('');
const showComposer = ref(false);
const postForm = reactive<ForumPostForm>({ 标题: '', 正文: '', 分区: '最新', 标签: '' });
const allPostEntries = computed(() => Object.entries(data.心愿社.论坛帖子));
const feedEntries = computed(() => {
  const entries = allPostEntries.value.filter(([, post]) => post.首页可见);
  if (!props.openPostId || entries.some(([id]) => id === props.openPostId)) return entries;
  const post = data.心愿社.论坛帖子[props.openPostId];
  if (post) entries.unshift([props.openPostId, post]);
  return entries;
});
const visiblePosts = computed(() => {
  const entries = filter.value === '收藏' ? allPostEntries.value : feedEntries.value;
  return entries.filter(([, post]) => filter.value === '收藏' ? post.已收藏 : filter.value === '推荐' ? true : post.分区 === filter.value);
});

watch(
  () => props.openPostId,
  id => {
    if (!id) return;
    if (!data.心愿社.论坛帖子[id]) return void toastr.warning('这条论坛记录已无法打开。');
    filter.value = '推荐';
    expanded.value = id;
  },
  { immediate: true },
);

function sendReply(id: string) { if (actions.replyForum(id, replyText.value)) replyText.value = ''; }
function submitPost() {
  if (actions.publishForumPost(postForm)) {
    postForm.标题 = ''; postForm.正文 = ''; postForm.标签 = ''; showComposer.value = false; filter.value = '最新';
    toastr.success('帖子已发布，获得 10 点论坛经验。');
  }
}
</script>
