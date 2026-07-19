<template>
  <section class="panel">
    <div class="panel-heading">
      <div><span class="eyebrow">TASK BOARD</span><h2>任务发布区</h2></div>
      <span class="limit-chip">接取 {{ acceptedEntries.length }}/2 · 发布 {{ publishedEntries.length }}/1</span>
    </div>

    <nav class="subnav">
      <button v-for="item in views" :key="item.id" :class="{ active: view === item.id }" type="button" @click="view = item.id">
        {{ item.label }}<b v-if="item.count !== undefined">{{ item.count }}</b>
      </button>
    </nav>

    <template v-if="view === 'hall'">
      <div class="filter-row">
        <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input v-model="keyword" placeholder="搜索任务、标签或地点" /></div>
        <select v-model="modeFilter"><option value="全部">全部方式</option><option>线上</option><option>同城</option><option>异地</option><option>指定地点</option></select>
      </div>
      <div class="task-list">
        <article v-for="[id, task] in filteredTasks" :key="id" class="task-card" :class="{ selected: selectedTaskId === id }">
          <button class="card-main" type="button" @click="selectedTaskId = selectedTaskId === id ? '' : id">
            <div class="author-line"><span class="avatar-dot">{{ task.匿名 ? '匿' : task.发布者.slice(0, 1) }}</span><strong>{{ task.匿名 ? '匿名发布者' : task.发布者 }}</strong><em>Lv.{{ task.发布者等级 }}</em><small>{{ task.发布时间 }}</small></div>
            <h3>{{ task.标题 }}</h3><p>{{ task.正文 }}</p>
            <div class="tag-row"><span v-for="tag in task.标签.split('｜')" :key="tag">{{ tag }}</span></div>
            <div class="task-meta"><span><i class="fa-solid fa-location-dot"></i>{{ task.地点 }}</span><span><i class="fa-regular fa-clock"></i>{{ task.截止时间 }}</span><span>{{ task.已接人数 }}/{{ task.总名额 }} 人</span></div>
          </button>
          <div class="reward-block"><small>每人奖励</small><strong><i class="fa-solid fa-heart"></i>{{ task.奖励 }}</strong><span :class="['status-pill', task.状态 === '可接取' ? 'open' : 'closed']">{{ task.状态 }}</span></div>

          <div v-if="selectedTaskId === id" class="task-detail">
            <dl><div><dt>参与条件</dt><dd>{{ task.参与条件 }}</dd></div><div><dt>证明要求</dt><dd>{{ task.证明要求 }}</dd></div><div><dt>任务方式</dt><dd>{{ task.方式 }} · {{ task.地点 }}</dd></div></dl>
            <div class="reply-list">
              <p v-if="!Object.keys(task.回复).length" class="empty-state">还没有公开回复。</p>
              <p v-for="[replyId, reply] in Object.entries(task.回复)" :key="replyId"><strong>{{ reply.作者 }}</strong><span>{{ reply.内容 }}</span><small>{{ reply.时间 }}</small></p>
            </div>
            <div v-if="isLatest" class="detail-actions">
              <div class="inline-form"><input v-model="taskReply" placeholder="公开回复……" @keyup.enter="sendTaskReply(id)" /><button class="button ghost compact" type="button" @click="sendTaskReply(id)">回复</button></div>
              <button class="button primary" type="button" :disabled="task.状态 !== '可接取'" @click="actions.acceptTask(id)"><i class="fa-solid fa-hand"></i> 接取任务</button>
            </div>
          </div>
        </article>
      </div>
    </template>

    <template v-else-if="view === 'accepted'">
      <div v-if="acceptedEntries.length" class="stack-list">
        <article v-for="[id, task] in acceptedEntries" :key="id" class="manage-card">
          <div class="manage-head"><div><span class="status-pill open">{{ task.任务状态 }}</span><h3>{{ task.标题 }}</h3><p>发布者：{{ task.发布者 }} · {{ task.方式 }} / {{ task.地点 }}</p></div><strong class="reward"><i class="fa-solid fa-heart"></i>{{ task.奖励 }}</strong></div>
          <dl class="compact-dl"><div><dt>截止</dt><dd>{{ task.截止时间 }}</dd></div><div><dt>证明</dt><dd>{{ task.证明要求 }}</dd></div><div><dt>审核</dt><dd>{{ task.审核状态 }}</dd></div></dl>
          <div v-if="isLatest" class="action-row">
            <button class="button primary" type="button" @click="actions.executeTask(id)"><i class="fa-solid fa-play"></i> 执行任务</button>
            <button class="button ghost" type="button" @click="openAccepted = openAccepted === id ? '' : id"><i class="fa-regular fa-message"></i> 私聊与证明</button>
          </div>
          <div v-if="openAccepted === id" class="manage-detail">
            <div class="reply-list compact"><p v-for="[messageId, message] in Object.entries(task.私聊)" :key="messageId"><strong>{{ message.发送者 }}</strong><span>{{ message.内容 }}</span><small>{{ message.时间 }}</small></p><p v-if="!Object.keys(task.私聊).length" class="empty-state">暂无私聊记录。</p></div>
            <div v-if="isLatest" class="form-stack">
              <div class="inline-form"><input v-model="privateText" placeholder="给发布者发私聊……" /><button class="button ghost compact" type="button" @click="sendPrivate(id)">发送</button></div>
              <label>剧情证明摘要<textarea v-model="proofText" placeholder="只填写 AI 根据剧情记录的材料类型与摘要，不上传真实文件。"></textarea></label>
              <button class="button primary" type="button" :disabled="task.任务状态 !== '可提交'" @click="submitProof(id)">提交证明摘要</button>
            </div>
          </div>
        </article>
      </div>
      <p v-else class="empty-state large">还没有接取任务。大厅里最多可以同时接取 2 条。</p>
    </template>

    <template v-else-if="view === 'published'">
      <div v-if="publishedEntries.length" class="stack-list">
        <article v-for="[id, task] in publishedEntries" :key="id" class="manage-card">
          <div class="manage-head"><div><span class="status-pill open">{{ task.状态 }}</span><h3>{{ task.标题 }}</h3><p>{{ Object.keys(task.接取者).length }}/{{ task.总名额 }} 人 · 托管 {{ task.托管爱心 }} 爱心</p></div><strong class="reward"><i class="fa-solid fa-heart"></i>{{ task.奖励 }}/人</strong></div>
          <div v-if="Object.keys(task.接取者).length" class="candidate-list">
            <article v-for="[candidateId, candidate] in Object.entries(task.接取者)" :key="candidateId">
              <div><strong>{{ candidate.昵称 }}</strong><span>{{ candidate.状态 }}</span><p>{{ candidate.证明摘要 || '尚未提交证明摘要' }}</p></div>
              <div v-if="isLatest && candidate.状态 === '已提交'" class="action-row"><button class="button primary compact" @click="actions.reviewCandidate(id, candidateId, true)">通过</button><button class="button ghost compact" @click="actions.reviewCandidate(id, candidateId, false)">驳回</button></div>
            </article>
          </div>
          <p v-else class="empty-state">暂时没有人接取。</p>
          <button v-if="isLatest && !Object.keys(task.接取者).length" class="text-button danger" type="button" @click="actions.cancelPublished(id)">取消并退回托管爱心</button>
        </article>
      </div>
      <p v-else class="empty-state large">你还没有发布任务。每次最多发布 1 条。</p>
    </template>

    <form v-else class="publish-form" @submit.prevent="submitPublish">
      <div class="form-intro"><i class="fa-solid fa-shield-heart"></i><div><strong>结构化发布</strong><span>奖励会按“每人奖励 × 名额”立即进入托管。</span></div></div>
      <label class="span-2">任务标题<input v-model="publishForm.标题" maxlength="50" placeholder="一句话说明要做什么" /></label>
      <label class="span-2">任务正文<textarea v-model="publishForm.正文" placeholder="说明内容、边界和完成标准"></textarea></label>
      <label>标签<input v-model="publishForm.标签" placeholder="线上｜写真｜体验" /></label>
      <label>方式<select v-model="publishForm.方式"><option>线上</option><option>同城</option><option>异地</option><option>指定地点</option></select></label>
      <label>地点<input v-model="publishForm.地点" placeholder="不限 / 上海 / 具体地点" /></label>
      <label>截止时间<input v-model="publishForm.截止时间" placeholder="2026年07月25日 20:00" /></label>
      <label>每人奖励<input v-model.number="publishForm.奖励" type="number" min="1" /></label>
      <label>名额<select v-model.number="publishForm.总名额"><option :value="1">1</option><option :value="2">2</option><option :value="3">3</option><option :value="4">4</option></select></label>
      <label class="span-2">参与条件<input v-model="publishForm.参与条件" placeholder="仅限成年人；自愿参与；可随时退出" /></label>
      <label class="span-2">证明要求<textarea v-model="publishForm.证明要求" placeholder="只描述需要记录的材料类型与摘要"></textarea></label>
      <label class="check-label span-2"><input v-model="publishForm.匿名" type="checkbox" />在大厅匿名展示</label>
      <div class="escrow-preview span-2"><span>本次托管</span><strong><i class="fa-solid fa-heart"></i>{{ escrowPreview }}</strong><small>可用余额 {{ data.账号.爱心.可用 }}</small></div>
      <button class="button primary span-2" type="submit" :disabled="!isLatest">确认发布并托管</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { PublishTaskForm } from '../composables/useAppActions';
import { useAppActions } from '../composables/useAppActions';
import { useDataStore } from '../store';

const props = defineProps<{ isLatest: boolean }>();
const isLatestRef = toRef(props, 'isLatest');
const { data } = useDataStore();
const actions = useAppActions(isLatestRef);
const view = ref('hall');
const keyword = ref('');
const modeFilter = ref('全部');
const selectedTaskId = ref('');
const openAccepted = ref('');
const taskReply = ref('');
const privateText = ref('');
const proofText = ref('');
const hallEntries = computed(() => Object.entries(data.心愿社.任务大厅));
const acceptedEntries = computed(() => Object.entries(data.心愿社.我接取的));
const publishedEntries = computed(() => Object.entries(data.心愿社.我发布的));
const views = computed(() => [
  { id: 'hall', label: '任务大厅', count: hallEntries.value.length }, { id: 'accepted', label: '我接取的', count: acceptedEntries.value.length },
  { id: 'published', label: '我发布的', count: publishedEntries.value.length }, { id: 'publish', label: '发布任务' },
]);
const filteredTasks = computed(() => hallEntries.value.filter(([, task]) => {
  const query = keyword.value.trim().toLowerCase();
  const matchesText = !query || `${task.标题}${task.正文}${task.标签}${task.地点}`.toLowerCase().includes(query);
  return matchesText && (modeFilter.value === '全部' || task.方式 === modeFilter.value);
}));

const publishForm = reactive<PublishTaskForm>({ 标题: '', 正文: '', 标签: '', 方式: '线上', 地点: '不限', 截止时间: '2026年07月25日 20:00', 奖励: 100, 总名额: 1, 参与条件: '仅限成年人；自愿参与；可随时退出。', 证明要求: '', 匿名: false });
const escrowPreview = computed(() => Math.max(0, Number(publishForm.奖励) || 0) * Math.max(1, Number(publishForm.总名额) || 1));

function sendTaskReply(id: string) { if (actions.replyTask(id, taskReply.value)) taskReply.value = ''; }
function sendPrivate(id: string) { if (actions.sendPrivate(id, privateText.value)) privateText.value = ''; }
function submitProof(id: string) { actions.submitProof(id, proofText.value); }
function submitPublish() { if (actions.publishTask(publishForm)) view.value = 'published'; }
</script>
