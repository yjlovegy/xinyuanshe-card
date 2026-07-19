<template>
  <section class="panel">
    <div class="panel-heading">
      <div><span class="eyebrow">WISH MALL</span><h2>心愿商城</h2></div>
      <div class="balance-card"><span>可用爱心</span><strong><i class="fa-solid fa-heart"></i>{{ data.账号.爱心.可用 }}</strong></div>
    </div>

    <nav class="subnav">
      <button v-for="item in views" :key="item.id" :class="{ active: view === item.id }" type="button" @click="view = item.id">{{ item.label }}<b v-if="item.count">{{ item.count }}</b></button>
    </nav>

    <template v-if="view === 'mall'">
      <div class="category-row"><button v-for="item in categories" :key="item" :class="{ active: category === item }" type="button" @click="category = item">{{ item }}</button></div>
      <div class="product-grid">
        <article v-for="product in visibleProducts" :key="product.id" class="product-card">
          <div class="product-visual"><i :class="['fa-solid', iconClass(product.图标)]"></i><span v-if="product.id.startsWith('new_')">NEW</span></div>
          <div class="product-copy"><small>{{ product.分类 }}</small><h3>{{ product.名称 }}</h3><p>{{ product.描述 }}</p></div>
          <div class="product-buy"><strong><i class="fa-solid fa-heart"></i>{{ product.价格 }}</strong><button v-if="isLatest" class="button primary compact" type="button" @click="addToCart(product.id)"><i class="fa-solid fa-cart-plus"></i> 加入</button></div>
        </article>
      </div>
    </template>

    <template v-else-if="view === 'cart'">
      <div v-if="cartItems.length" class="cart-list">
        <article v-for="item in cartItems" :key="item.product.id">
          <div class="cart-icon"><i :class="['fa-solid', iconClass(item.product.图标)]"></i></div><div><strong>{{ item.product.名称 }}</strong><small>{{ item.product.价格 }} 爱心 / 件</small></div>
          <div class="quantity"><button @click="changeQuantity(item.product.id, -1)">−</button><span>{{ item.quantity }}</span><button @click="changeQuantity(item.product.id, 1)">＋</button></div>
          <strong>{{ item.product.价格 * item.quantity }}</strong>
        </article>
        <div class="checkout-bar"><div><span>合计</span><strong><i class="fa-solid fa-heart"></i>{{ cartTotal }}</strong></div><button class="button primary" type="button" @click="checkout">结算下单</button></div>
      </div>
      <p v-else class="empty-state large">购物车还是空的。</p>
    </template>

    <template v-else>
      <div v-if="orders.length" class="stack-list">
        <article v-for="[id, order] in orders" :key="id" class="order-card">
          <div class="order-icon"><i class="fa-solid fa-box"></i></div><div class="order-copy"><div><strong>{{ order.商品名 }} ×{{ order.数量 }}</strong><span class="status-pill open">{{ order.状态 }}</span></div><p>{{ order.物流说明 }}</p><small>{{ order.下单时间 }} · {{ order.总价 }} 爱心</small></div>
          <button v-if="isLatest && order.状态 === '派送中'" class="button primary compact" type="button" @click="actions.receiveOrder(id)">确认签收</button>
        </article>
      </div>
      <p v-else class="empty-state large">还没有订单。</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { baseProducts, type CatalogProduct } from '../products';
import { useAppActions } from '../composables/useAppActions';
import { useDataStore } from '../store';

const props = defineProps<{ isLatest: boolean }>();
const actions = useAppActions(toRef(props, 'isLatest'));
const { data } = useDataStore();
const view = ref('mall');
const category = ref('全部');
const cart = useLocalStorage<Record<string, number>>('心愿社:cart', {});
const dynamicProducts = computed<CatalogProduct[]>(() => Object.entries(data.心愿社.动态新品).map(([id, item]) => ({ id, ...item, 图标: item.图标.startsWith('fa-') ? item.图标 : `fa-${item.图标}` })));
const allProducts = computed(() => [...dynamicProducts.value, ...baseProducts]);
const categories = ['全部', '服装', '成人用品', '拍摄用品', '任务道具'];
const visibleProducts = computed(() => allProducts.value.filter(item => category.value === '全部' || item.分类 === category.value));
const orders = computed(() => Object.entries(data.心愿社.订单).reverse());
const cartItems = computed(() => Object.entries(cart.value).map(([id, quantity]) => ({ product: allProducts.value.find(item => item.id === id), quantity })).filter((item): item is { product: CatalogProduct; quantity: number } => !!item.product && item.quantity > 0));
const cartTotal = computed(() => cartItems.value.reduce((sum, item) => sum + item.product.价格 * item.quantity, 0));
const cartCount = computed(() => Object.values(cart.value).reduce((sum, quantity) => sum + quantity, 0));
const views = computed(() => [{ id: 'mall', label: '逛商城' }, { id: 'cart', label: '购物车', count: cartCount.value }, { id: 'orders', label: '物流', count: orders.value.length }]);

function iconClass(icon: string) { return icon.startsWith('fa-') ? icon : `fa-${icon}`; }
function addToCart(id: string) { cart.value[id] = (cart.value[id] ?? 0) + 1; toastr.success('已加入购物车。'); }
function changeQuantity(id: string, amount: number) { const next = (cart.value[id] ?? 0) + amount; if (next <= 0) delete cart.value[id]; else cart.value[id] = Math.min(99, next); }
function checkout() { if (actions.checkout(cartItems.value)) { cart.value = {}; view.value = 'orders'; } }
</script>
