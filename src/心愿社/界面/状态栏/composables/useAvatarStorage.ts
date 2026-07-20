import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import type { Ref } from 'vue';

const sessionAvatarSource = ref('');
const avatarStorageUnavailable = ref(false);
let storedAvatarSource: Ref<string> | undefined;

export function useAvatarStorage() {
  if (!storedAvatarSource) {
    const storage = useIDBKeyval<string>('心愿社:full-body-avatar', '', {
      onError(error) {
        avatarStorageUnavailable.value = true;
        console.warn('[心愿社] 无法访问 IndexedDB，人物照片将在本次会话中临时保存。', error);
      },
    });
    storedAvatarSource = storage.data;
  }

  const avatarSource = computed({
    get: () => (avatarStorageUnavailable.value ? sessionAvatarSource.value : storedAvatarSource!.value),
    set: value => {
      sessionAvatarSource.value = value;
      if (!avatarStorageUnavailable.value) storedAvatarSource!.value = value;
    },
  });

  return { avatarSource, avatarStorageUnavailable };
}
