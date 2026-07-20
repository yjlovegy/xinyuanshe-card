const 身体状态Schema = z.object({
  标签: z.string().prefault('正常'),
  描述: z.string().prefault('没有需要特别记录的变化。'),
});

const 男性互动人物Schema = z.object({
  性别: z.literal('男'),
  姓名: z.string(),
  年龄: z.coerce.number().transform(value => Math.round(_.clamp(value, 18, 120))),
  身高: z.string(),
  穿着: z
    .object({
      上衣: z.string().prefault('未穿'),
      下装: z.string().prefault('未穿'),
      鞋子: z.string().prefault('未穿'),
      内裤: z.string().prefault('未穿'),
    })
    .prefault({}),
  身体状态: z.object({ 肉棒: 身体状态Schema.prefault({}) }).prefault({}),
  内心想法: z.string(),
});

const 女性互动人物Schema = z.object({
  性别: z.literal('女'),
  姓名: z.string(),
  年龄: z.coerce.number().transform(value => Math.round(_.clamp(value, 18, 120))),
  身高: z.string(),
  罩杯: z.string(),
  穿着: z
    .object({
      上衣: z.string().prefault('未穿'),
      下装: z.string().prefault('未穿'),
      袜子: z.string().prefault('未穿'),
      鞋子: z.string().prefault('未穿'),
      内衣: z.string().prefault('未穿'),
      内裤: z.string().prefault('未穿'),
    })
    .prefault({}),
  身体状态: z
    .object({
      樱唇: 身体状态Schema.prefault({}),
      双乳: 身体状态Schema.prefault({}),
      小穴: 身体状态Schema.prefault({}),
      玉足: 身体状态Schema.prefault({}),
      肛门: 身体状态Schema.prefault({}),
      子宫: 身体状态Schema.prefault({}),
    })
    .prefault({}),
  内心想法: z.string(),
});

export const Schema = z.object({
  世界: z.object({
    当前时间: z.string().prefault('2026年07月20日 09:00'),
    当前位置: z
      .object({
        国家或地区: z.string().prefault('中国'),
        城市: z.string().prefault('上海'),
        场所: z.string().prefault('独居公寓'),
      })
      .prefault({}),
  }),

  主角: z.object({
    姓名: z.string().prefault('玩家'),
    内心想法: z.string().prefault('我先看看心愿社里有什么。'),
    穿着: z.record(
      z.enum(['上衣', '下装', '袜子', '鞋子', '内衣', '内裤']),
      z.object({
        衣物ID: z.string().prefault('无'),
        名称: z.string().prefault('未穿'),
        状态: z.string().prefault('正常'),
      }),
    ),
    私密状态: z
      .object({
        樱唇: 身体状态Schema.prefault({}),
        双乳: 身体状态Schema.prefault({}),
        小穴: 身体状态Schema.prefault({}),
        玉足: 身体状态Schema.prefault({}),
        肛门: 身体状态Schema.prefault({}),
        子宫: 身体状态Schema.prefault({}),
      })
      .prefault({}),
  }),

  账号: z.object({
    爱心: z.object({
      可用: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
      托管: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
    }),
    论坛经验: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
    _论坛等级: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, Number.MAX_SAFE_INTEGER))),
  }),

  心愿社: z.object({
    当前追踪任务ID: z.string().prefault('无'),
    任务大厅: z
      .record(
        z.string().describe('任务ID'),
        z.object({
          发布者: z.string(),
          发布者等级: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, Number.MAX_SAFE_INTEGER))),
          标题: z.string(),
          正文: z.string(),
          标签: z.string(),
          方式: z.enum(['线上', '同城', '异地', '指定地点']),
          地点: z.string(),
          发布时间: z.string(),
          截止时间: z.string(),
          奖励: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          总名额: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, 4))),
          已接人数: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, 4))),
          参与条件: z.string(),
          证明要求: z.string(),
          匿名: z.boolean(),
          状态: z.enum(['可接取', '已满', '已结束', '已取消']),
          首页可见: z.boolean().prefault(true),
          我已参与: z.boolean().prefault(false),
          回复: z
            .record(
              z.string().describe('回复ID'),
              z.object({ 作者: z.string(), 内容: z.string(), 时间: z.string() }),
            )
            .transform(data => _.fromPairs(_.takeRight(_.entries(data), 8))),
        }),
      )
      .transform(data => {
        const entries = _.entries(data);
        return _.fromPairs([
          ..._.takeRight(entries.filter(([, item]) => !item.我已参与), 20),
          ...entries.filter(([, item]) => item.我已参与),
        ]);
      }),
    我接取的: z
      .record(
        z.string().describe('任务ID'),
        z.object({
          发布者: z.string(),
          标题: z.string(),
          正文: z.string(),
          标签: z.string(),
          方式: z.enum(['线上', '同城', '异地', '指定地点']),
          地点: z.string(),
          截止时间: z.string(),
          奖励: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          参与条件: z.string(),
          证明要求: z.string(),
          任务状态: z.enum(['已接取', '进行中', '可提交', '审核中', '已完成', '失败', '已放弃']),
          证明摘要: z.string(),
          审核状态: z.enum(['未提交', '审核中', '已通过', '已驳回']),
          奖励已结算: z.boolean(),
          互动人物: z
            .record(
              z.string().describe('人物ID'),
              z.discriminatedUnion('性别', [男性互动人物Schema, 女性互动人物Schema]),
            )
            .prefault({}),
          私聊: z
            .record(
              z.string().describe('消息ID'),
              z.object({ 发送者: z.string(), 内容: z.string(), 时间: z.string() }),
            )
            .transform(data => _.fromPairs(_.takeRight(_.entries(data), 12))),
        }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 2))),
    我发布的: z
      .record(
        z.string().describe('任务ID'),
        z.object({
          标题: z.string(),
          正文: z.string(),
          标签: z.string(),
          方式: z.enum(['线上', '同城', '异地', '指定地点']),
          地点: z.string(),
          发布时间: z.string(),
          截止时间: z.string(),
          奖励: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          总名额: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, 4))),
          参与条件: z.string(),
          证明要求: z.string(),
          匿名: z.boolean(),
          状态: z.enum(['招募中', '进行中', '审核中', '已完成', '已取消']),
          托管爱心: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          接取者: z
            .record(
              z.string().describe('接取者ID'),
              z.object({
                昵称: z.string(),
                状态: z.enum(['已接取', '进行中', '已提交', '已通过', '已驳回', '已退出']),
                证明摘要: z.string(),
              }),
            )
            .transform(data => _.fromPairs(_.takeRight(_.entries(data), 4))),
        }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 1))),
    论坛帖子: z
      .record(
        z.string().describe('帖子ID'),
        z.object({
          作者: z.string(),
          作者等级: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, Number.MAX_SAFE_INTEGER))),
          标题: z.string(),
          正文: z.string(),
          分区: z.enum(['推荐', '最新', '同城']),
          标签: z.string(),
          发布时间: z.string(),
          点赞数: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          已点赞: z.boolean(),
          已收藏: z.boolean(),
          是否我的: z.boolean(),
          首页可见: z.boolean().prefault(true),
          我已参与: z.boolean().prefault(false),
          回复: z
            .record(
              z.string().describe('回复ID'),
              z.object({ 作者: z.string(), 内容: z.string(), 时间: z.string() }),
            )
            .transform(data => _.fromPairs(_.takeRight(_.entries(data), 8))),
        }),
      )
      .transform(data => {
        const entries = _.entries(data);
        return _.fromPairs([
          ..._.takeRight(entries.filter(([, item]) => !item.我已参与 && !item.是否我的 && !item.已收藏), 20),
          ...entries.filter(([, item]) => item.我已参与 || item.是否我的 || item.已收藏),
        ]);
      }),
    动态新品: z
      .record(
        z.string().describe('商品ID'),
        z.object({
          名称: z.string(),
          分类: z.enum(['服装', '成人用品', '拍摄用品', '任务道具']),
          描述: z.string(),
          价格: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          衣物部位: z.enum(['上衣', '下装', '袜子', '鞋子', '内衣', '内裤', '非服装']),
          图标: z.string(),
        }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 6))),
    订单: z
      .record(
        z.string().describe('订单ID'),
        z.object({
          商品ID: z.string(),
          商品名: z.string(),
          分类: z.enum(['服装', '成人用品', '拍摄用品', '任务道具']),
          衣物部位: z.enum(['上衣', '下装', '袜子', '鞋子', '内衣', '内裤', '非服装']),
          数量: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, 99))),
          总价: z.coerce.number().transform(value => Math.round(_.clamp(value, 0, Number.MAX_SAFE_INTEGER))),
          状态: z.enum(['待发货', '运输中', '派送中', '已签收', '已取消']),
          下单时间: z.string(),
          物流说明: z.string(),
        }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 12))),
    衣柜: z
      .record(
        z.string().describe('衣物ID'),
        z.object({ 名称: z.string(), 部位: z.enum(['上衣', '下装', '袜子', '鞋子', '内衣', '内裤']), 状态: z.string() }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 50))),
    道具库存: z
      .record(
        z.string().describe('道具ID'),
        z.object({ 名称: z.string(), 分类: z.enum(['成人用品', '拍摄用品', '任务道具']), 描述: z.string(), 数量: z.coerce.number().transform(value => Math.round(_.clamp(value, 1, 99))) }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 50))),
    通知: z
      .record(
        z.string().describe('通知ID'),
        z.object({
          类型: z.enum(['任务', '论坛', '商城', '系统']),
          标题: z.string(),
          内容: z.string(),
          时间: z.string(),
          已读: z.boolean(),
          跳转目标: z
            .object({ 板块: z.enum(['任务', '论坛', '无']).prefault('无'), 帖子ID: z.string().prefault('无') })
            .prefault({}),
        }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 20))),
    _待处理操作日志: z
      .record(
        z.string().describe('日志ID'),
        z.object({ 时间: z.string(), 操作: z.string() }),
      )
      .transform(data => _.fromPairs(_.takeRight(_.entries(data), 20))),
  }),
});
