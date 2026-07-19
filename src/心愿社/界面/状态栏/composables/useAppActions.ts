import type { Ref } from 'vue';
import type { CatalogProduct } from '../products';
import { useDataStore } from '../store';

export type PublishTaskForm = {
  标题: string;
  正文: string;
  标签: string;
  方式: '线上' | '同城' | '异地' | '指定地点';
  地点: string;
  截止时间: string;
  奖励: number;
  总名额: number;
  参与条件: string;
  证明要求: string;
  匿名: boolean;
};

export type ForumPostForm = { 标题: string; 正文: string; 分区: '推荐' | '最新' | '同城'; 标签: string };

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export function useAppActions(isLatest: Ref<boolean>) {
  const store = useDataStore();
  const state = store.data as any;

  function requireLatest() {
    if (isLatest.value) return true;
    toastr.info('这是历史楼层，只能查看当时状态。');
    return false;
  }

  function now() {
    return state.世界.当前时间;
  }

  function notify(type: '任务' | '论坛' | '商城' | '系统', title: string, content: string) {
    const id = makeId('notice');
    state.心愿社.通知[id] = { 类型: type, 标题: title, 内容: content, 时间: now(), 已读: false };
  }

  function log(operation: string) {
    const id = makeId('op');
    state.心愿社._待处理操作日志[id] = { 时间: now(), 操作: operation };
  }

  function acceptTask(taskId: string) {
    if (!requireLatest()) return;
    const task = state.心愿社.任务大厅[taskId];
    if (!task || task.状态 !== '可接取') return toastr.warning('该任务目前不可接取。');
    if (task.发布者 === state.主角.姓名) return toastr.warning('不能接取自己发布的任务。');
    if (state.心愿社.我接取的[taskId]) return toastr.info('你已经接取过这个任务。');
    const activeAccepted = Object.values(state.心愿社.我接取的).filter((item: any) => !['已完成', '失败', '已放弃'].includes(item.任务状态));
    if (activeAccepted.length >= 2) return toastr.warning('最多同时接取 2 条未结束任务。');
    if (task.已接人数 >= task.总名额) return toastr.warning('任务名额已满。');

    state.心愿社.我接取的[taskId] = {
      发布者: task.发布者,
      标题: task.标题,
      正文: task.正文,
      标签: task.标签,
      方式: task.方式,
      地点: task.地点,
      截止时间: task.截止时间,
      奖励: task.奖励,
      参与条件: task.参与条件,
      证明要求: task.证明要求,
      任务状态: '已接取',
      证明摘要: '',
      审核状态: '未提交',
      奖励已结算: false,
      私聊: {},
    };
    task.已接人数 += 1;
    if (task.已接人数 >= task.总名额) task.状态 = '已满';
    if (state.心愿社.当前追踪任务ID === '无') state.心愿社.当前追踪任务ID = taskId;
    log(`接取任务“${task.标题}”，奖励 ${task.奖励} 爱心。`);
    notify('任务', '接取成功', `“${task.标题}”已加入我的任务。`);
    toastr.success('任务已接取。');
    return;
  }

  function publishTask(form: PublishTaskForm) {
    if (!requireLatest()) return false;
    const activePublished = Object.values(state.心愿社.我发布的).filter((item: any) => !['已完成', '已取消'].includes(item.状态));
    if (activePublished.length >= 1) return void toastr.warning('最多同时发布 1 条未结束任务。');
    const reward = Math.max(1, Math.round(Number(form.奖励)));
    const slots = Math.min(4, Math.max(1, Math.round(Number(form.总名额))));
    const escrow = reward * slots;
    if (!form.标题.trim() || !form.正文.trim() || !form.证明要求.trim()) return void toastr.warning('请补全标题、正文和证明要求。');
    if (state.账号.爱心.可用 < escrow) return void toastr.warning(`可用爱心不足，需要 ${escrow}。`);

    const id = makeId('task');
    const task = {
      标题: form.标题.trim(), 正文: form.正文.trim(), 标签: form.标签.trim() || '自定义任务',
      方式: form.方式, 地点: form.地点.trim() || '不限', 发布时间: now(), 截止时间: form.截止时间.trim(),
      奖励: reward, 总名额: slots, 参与条件: form.参与条件.trim() || '仅限成年人，自愿参与。',
      证明要求: form.证明要求.trim(), 匿名: form.匿名,
    };
    state.账号.爱心.可用 -= escrow;
    state.账号.爱心.托管 += escrow;
    state.心愿社.我发布的[id] = { ...task, 状态: '招募中', 托管爱心: escrow, 接取者: {} };
    state.心愿社.任务大厅[id] = {
      发布者: state.主角.姓名, 发布者等级: state.账号._论坛等级, ...task, 已接人数: 0, 状态: '可接取', 回复: {},
    };
    log(`发布任务“${task.标题}”，${escrow} 爱心进入托管。`);
    notify('任务', '任务已发布', `已托管 ${escrow} 爱心，等待接取。`);
    toastr.success('任务已发布，奖励已进入托管。');
    return true;
  }

  function cancelPublished(taskId: string) {
    if (!requireLatest()) return;
    const task = state.心愿社.我发布的[taskId];
    if (!task) return;
    if (Object.keys(task.接取者).length > 0) return toastr.warning('已有接取者，请先与接取者协商处理。');
    state.账号.爱心.托管 -= task.托管爱心;
    state.账号.爱心.可用 += task.托管爱心;
    if (state.心愿社.任务大厅[taskId]) state.心愿社.任务大厅[taskId].状态 = '已取消';
    delete state.心愿社.我发布的[taskId];
    log(`取消无人接取的任务“${task.标题}”，退回 ${task.托管爱心} 爱心。`);
    toastr.success('任务已取消，托管爱心已退回。');
    return;
  }

  function replyTask(taskId: string, content: string) {
    if (!requireLatest() || !content.trim()) return false;
    const task = state.心愿社.任务大厅[taskId];
    if (!task) return false;
    task.回复[makeId('reply')] = { 作者: state.主角.姓名, 内容: content.trim(), 时间: now() };
    log(`在任务“${task.标题}”下公开回复：${content.trim()}`);
    return true;
  }

  function sendPrivate(taskId: string, content: string) {
    if (!requireLatest() || !content.trim()) return false;
    const task = state.心愿社.我接取的[taskId];
    if (!task) return false;
    task.私聊[makeId('dm')] = { 发送者: state.主角.姓名, 内容: content.trim(), 时间: now() };
    log(`向任务“${task.标题}”的发布者发送私聊：${content.trim()}`);
    return true;
  }

  function submitProof(taskId: string, summary: string) {
    if (!requireLatest() || !summary.trim()) return;
    const task = state.心愿社.我接取的[taskId];
    if (!task || task.任务状态 !== '可提交') return toastr.warning('需要先完成任务，才可以提交证明摘要。');
    task.证明摘要 = summary.trim();
    task.审核状态 = '审核中';
    task.任务状态 = '审核中';
    log(`为任务“${task.标题}”提交证明摘要：${summary.trim()}`);
    notify('任务', '证明已提交', '平台只保存填写的材料类型与摘要，不保存真实文件。');
    toastr.success('证明摘要已提交。');
    return;
  }

  function reviewCandidate(taskId: string, candidateId: string, approved: boolean) {
    if (!requireLatest()) return;
    const task = state.心愿社.我发布的[taskId];
    const candidate = task?.接取者[candidateId];
    if (!task || !candidate || candidate.状态 !== '已提交') return toastr.warning('当前没有可审核的证明。');
    candidate.状态 = approved ? '已通过' : '已驳回';
    if (approved) {
      task.托管爱心 = Math.max(0, task.托管爱心 - task.奖励);
      state.账号.爱心.托管 = Math.max(0, state.账号.爱心.托管 - task.奖励);
      log(`审核通过“${candidate.昵称}”提交的任务证明，支付 ${task.奖励} 爱心。`);
    } else {
      log(`驳回“${candidate.昵称}”提交的任务证明，等待重新提交。`);
    }
    const candidates = Object.values(task.接取者) as any[];
    if (candidates.length && candidates.every(item => ['已通过', '已退出'].includes(item.状态))) {
      task.状态 = '已完成';
      if (state.心愿社.任务大厅[taskId]) state.心愿社.任务大厅[taskId].状态 = '已结束';
    }
    toastr.success(approved ? '已通过证明并完成结算。' : '已驳回证明。');
    return;
  }

  async function narrative(command: string) {
    if (!requireLatest()) return;
    await nextTick();
    await createChatMessages([{ role: 'user', message: command }]);
    await triggerSlash('/trigger');
  }

  function executeTask(taskId: string) {
    const task = state.心愿社.我接取的[taskId];
    if (task) return narrative(`[心愿社行动] 我准备执行任务“${task.标题}”（任务ID：${taskId}）。请结合当前时间、地点、穿着、任务要求和已发生的事件继续叙事，并据实更新任务进度与人物状态。`);
    return;
  }

  function toggleForumLike(postId: string) {
    if (!requireLatest()) return;
    const post = state.心愿社.论坛帖子[postId];
    if (!post) return;
    post.已点赞 = !post.已点赞;
    post.点赞数 = Math.max(0, post.点赞数 + (post.已点赞 ? 1 : -1));
    log(`${post.已点赞 ? '点赞' : '取消点赞'}论坛帖子“${post.标题}”。`);
  }

  function toggleForumFavorite(postId: string) {
    if (!requireLatest()) return;
    const post = state.心愿社.论坛帖子[postId];
    if (!post) return;
    post.已收藏 = !post.已收藏;
    log(`${post.已收藏 ? '收藏' : '取消收藏'}论坛帖子“${post.标题}”。`);
  }

  function gainForumExp(amount: number) {
    state.账号.论坛经验 += amount;
    state.账号._论坛等级 = Math.floor(state.账号.论坛经验 / 100) + 1;
  }

  function publishForumPost(form: ForumPostForm) {
    if (!requireLatest()) return false;
    if (!form.标题.trim() || !form.正文.trim()) return void toastr.warning('请填写标题和正文。');
    const id = makeId('post');
    state.心愿社.论坛帖子[id] = {
      作者: state.主角.姓名, 作者等级: state.账号._论坛等级, 标题: form.标题.trim(), 正文: form.正文.trim(),
      分区: form.分区, 标签: form.标签.trim() || '随聊', 发布时间: now(), 点赞数: 0, 已点赞: false, 已收藏: false, 是否我的: true, 回复: {},
    };
    gainForumExp(10);
    log(`发布论坛帖子“${form.标题.trim()}”，获得 10 点论坛经验。`);
    return true;
  }

  function replyForum(postId: string, content: string) {
    if (!requireLatest() || !content.trim()) return false;
    const post = state.心愿社.论坛帖子[postId];
    if (!post) return false;
    post.回复[makeId('forum_reply')] = { 作者: state.主角.姓名, 内容: content.trim(), 时间: now() };
    gainForumExp(2);
    log(`回复论坛帖子“${post.标题}”：${content.trim()}`);
    return true;
  }

  function checkout(items: Array<{ product: CatalogProduct; quantity: number }>) {
    if (!requireLatest()) return false;
    const total = items.reduce((sum, item) => sum + item.product.价格 * item.quantity, 0);
    if (!items.length) return void toastr.info('购物车还是空的。');
    if (state.账号.爱心.可用 < total) return void toastr.warning(`可用爱心不足，还差 ${total - state.账号.爱心.可用}。`);
    state.账号.爱心.可用 -= total;
    for (const item of items) {
      const id = makeId('order');
      state.心愿社.订单[id] = {
        商品ID: item.product.id, 商品名: item.product.名称, 分类: item.product.分类, 衣物部位: item.product.衣物部位,
        数量: item.quantity, 总价: item.product.价格 * item.quantity, 状态: '待发货', 下单时间: now(), 物流说明: '商家正在准备商品。',
      };
    }
    log(`商城下单 ${items.length} 种商品，共支付 ${total} 爱心。`);
    notify('商城', '下单成功', `已支付 ${total} 爱心，可在“物流”查看状态。`);
    toastr.success('下单成功。');
    return true;
  }

  function receiveOrder(orderId: string) {
    if (!requireLatest()) return;
    const order = state.心愿社.订单[orderId];
    if (!order || order.状态 !== '派送中') return toastr.warning('商品尚未送达。');
    order.状态 = '已签收';
    order.物流说明 = '已由本人确认签收。';
    if (order.分类 === '服装' && order.衣物部位 !== '非服装') {
      state.心愿社.衣柜[`${order.商品ID}_${orderId}`] = { 名称: order.商品名, 部位: order.衣物部位, 状态: '完好' };
    } else {
      const key = order.商品ID;
      if (state.心愿社.道具库存[key]) state.心愿社.道具库存[key].数量 += order.数量;
      else state.心愿社.道具库存[key] = { 名称: order.商品名, 分类: order.分类, 描述: '从心愿社商城购入。', 数量: order.数量 };
    }
    log(`确认签收“${order.商品名}”，商品已进入${order.分类 === '服装' ? '衣柜' : '库存'}。`);
    toastr.success('已确认签收。');
    return;
  }

  function equipItem(itemId: string) {
    const item = state.心愿社.衣柜[itemId];
    if (item) return narrative(`[心愿社行动] 我从衣柜取出“${item.名称}”，准备换到${item.部位}槽位。请描写实际换装过程，并在行动完成后据实更新六个衣物槽；不要仅因点击按钮就跳过实际过程。`);
    return;
  }

  function markAllRead() {
    if (!requireLatest()) return;
    Object.values(state.心愿社.通知).forEach((notice: any) => (notice.已读 = true));
  }

  return {
    acceptTask, publishTask, cancelPublished, replyTask, sendPrivate, submitProof, reviewCandidate, executeTask,
    toggleForumLike, toggleForumFavorite, publishForumPost, replyForum,
    checkout, receiveOrder, equipItem, markAllRead, narrative, log, notify,
  };
}
