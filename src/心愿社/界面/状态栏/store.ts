import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const mountedFloorId = getCurrentMessageId();

export const useDataStore = defineMvuDataStore(
  Schema,
  { type: 'message', message_id: mountedFloorId },
  data => {
    const clearMarker = '心愿社:cleared-operation-log-floor';
    if (mountedFloorId === getLastMessageId() && sessionStorage.getItem(clearMarker) !== String(mountedFloorId)) {
      data.value.心愿社._待处理操作日志 = {};
      sessionStorage.setItem(clearMarker, String(mountedFloorId));
    }
  },
);
