<template>
  <section class="panel character-panel">
    <div class="panel-heading">
      <div><span class="eyebrow">PERSONA</span><h2>人物状态</h2></div>
      <span class="soft-badge"><i class="fa-solid fa-shield-heart"></i> 图片仅保存在本地</span>
    </div>

    <div class="character-layout">
      <div class="portrait-column">
        <div class="portrait-frame">
          <img v-if="avatarSource" :src="avatarSource" alt="本地全身像" />
          <div v-else class="portrait-empty">
            <i class="fa-regular fa-image"></i><strong>完整全身像</strong><span>上传图片或导入网址</span>
          </div>
        </div>
        <div v-if="isLatest" class="portrait-actions">
          <button class="button secondary" type="button" @click="open()"><i class="fa-solid fa-upload"></i> 本地上传</button>
          <button class="button ghost" type="button" @click="showUrl = !showUrl"><i class="fa-solid fa-link"></i> 网址导入</button>
          <div v-if="showUrl" class="inline-form wide">
            <input v-model="urlInput" type="url" placeholder="https://example.com/image.png" />
            <button class="button primary compact" type="button" @click="saveUrl">保存</button>
          </div>
          <button v-if="avatarSource" class="text-button danger" type="button" @click="avatarSource = ''">移除图片</button>
        </div>
      </div>

      <div class="character-info">
        <div class="name-card">
          <span>当前角色</span><strong>{{ data.主角.姓名 }}</strong>
          <small>{{ data.世界.当前位置.城市 }}独居 · 21岁</small>
        </div>

        <section class="subsection">
          <h3><i class="fa-solid fa-shirt"></i> 六个衣物槽</h3>
          <div class="slot-grid">
            <article v-for="slot in clothingSlots" :key="slot" class="slot-card">
              <span>{{ slot }}</span><strong>{{ data.主角.穿着[slot].名称 }}</strong><small>{{ data.主角.穿着[slot].状态 }}</small>
            </article>
          </div>
        </section>

        <section class="subsection">
          <h3><i class="fa-solid fa-sparkles"></i> 身体状态</h3>
          <div class="body-grid">
            <article v-for="part in bodyParts" :key="part" class="body-card">
              <div><strong>{{ part }}</strong><span>{{ data.主角.私密状态[part].标签 }}</span></div>
              <p>{{ data.主角.私密状态[part].描述 }}</p>
            </article>
          </div>
        </section>
      </div>
    </div>

    <section class="subsection inventory-section">
      <div class="section-row"><h3><i class="fa-solid fa-door-open"></i> 衣柜</h3><span>{{ wardrobe.length }} 件</span></div>
      <div v-if="wardrobe.length" class="item-strip">
        <article v-for="[id, item] in wardrobe" :key="id" class="inventory-card">
          <i class="fa-solid fa-shirt"></i><div><strong>{{ item.名称 }}</strong><small>{{ item.部位 }} · {{ item.状态 }}</small></div>
          <button v-if="isLatest" class="button ghost compact" type="button" @click="actions.equipItem(id)">换上</button>
        </article>
      </div>
      <p v-else class="empty-state">衣柜里还没有衣物。</p>
    </section>

    <section class="subsection inventory-section">
      <div class="section-row"><h3><i class="fa-solid fa-box-open"></i> 道具库存</h3><span>{{ inventory.length }} 种</span></div>
      <div v-if="inventory.length" class="item-strip">
        <article v-for="[id, item] in inventory" :key="id" class="inventory-card">
          <i class="fa-solid fa-cube"></i><div><strong>{{ item.名称 }} ×{{ item.数量 }}</strong><small>{{ item.分类 }} · {{ item.描述 }}</small></div>
        </article>
      </div>
      <p v-else class="empty-state">库存目前为空。</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useAppActions } from '../composables/useAppActions';
import { useDataStore } from '../store';

const props = defineProps<{ isLatest: boolean }>();
const isLatestRef = toRef(props, 'isLatest');
const { data } = useDataStore();
const actions = useAppActions(isLatestRef);
const clothingSlots = ['上衣', '下装', '袜子', '鞋子', '内衣', '内裤'] as const;
const bodyParts = ['樱唇', '双乳', '小穴', '玉足'] as const;
const wardrobe = computed(() => Object.entries(data.心愿社.衣柜));
const inventory = computed(() => Object.entries(data.心愿社.道具库存));

const { data: avatarSource } = useIDBKeyval<string>('心愿社:full-body-avatar', '');
const { open, onChange } = useFileDialog({ accept: 'image/*', multiple: false });
const showUrl = ref(false);
const urlInput = ref('');

async function compressImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 1200 / image.naturalWidth, 1800 / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

onChange(async files => {
  const file = files?.[0];
  if (!file || !props.isLatest) return;
  avatarSource.value = await compressImage(file);
  toastr.success('全身像已保存在浏览器本地。');
});

function saveUrl() {
  if (!props.isLatest || !/^https?:\/\//i.test(urlInput.value.trim())) return toastr.warning('请输入有效的 http(s) 图片网址。');
  avatarSource.value = urlInput.value.trim();
  showUrl.value = false;
  toastr.success('图片网址已保存到本地设置。');
}
</script>
