import { Cart, CartItem, Product, ProductVariant, User, ShippingAddress } from '../types';

const CART_KEY = 'saena_cart_v1';
const WISHLIST_KEY = 'saena_wishlist_v1';
const USER_KEY = 'saena_current_user_v1';

export const cartStorage = {
  getCart(): Cart {
    try {
      const data = localStorage.getItem(CART_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse cart:', e);
    }
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      totalWeight: 0,
    };
  },

  saveCart(cart: Cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('saena_cart_updated'));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  },

  addItem(product: Product, variant: ProductVariant, quantity: number = 1): Cart {
    const cart = this.getCart();
    const unitPrice = product.discountPrice || product.price;

    const existingIndex = cart.items.findIndex(
      item => item.productId === product.id && item.variantId === variant.id
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].totalPrice = cart.items[existingIndex].quantity * cart.items[existingIndex].price;
    } else {
      const newItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        variantId: variant.id,
        product,
        selectedColor: variant.colorName,
        selectedSize: variant.size,
        quantity,
        price: unitPrice,
        totalPrice: unitPrice * quantity,
      };
      cart.items.push(newItem);
    }

    this.recalculate(cart);
    this.saveCart(cart);
    return cart;
  },

  updateQuantity(itemId: string, delta: number): Cart {
    const cart = this.getCart();
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        cart.items = cart.items.filter(i => i.id !== itemId);
      } else {
        item.quantity = newQty;
        item.totalPrice = item.quantity * item.price;
      }
      this.recalculate(cart);
      this.saveCart(cart);
    }
    return cart;
  },

  removeItem(itemId: string): Cart {
    const cart = this.getCart();
    cart.items = cart.items.filter(i => i.id !== itemId);
    this.recalculate(cart);
    this.saveCart(cart);
    return cart;
  },

  clearCart(): Cart {
    const empty: Cart = {
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      totalWeight: 0,
    };
    this.saveCart(empty);
    return empty;
  },

  recalculate(cart: Cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.totalWeight = cart.items.reduce((sum, item) => sum + ((item.product.weight || 300) * item.quantity), 0);
    cart.total = Math.max(0, cart.subtotal - (cart.discount || 0));
  },

  // --- WISHLIST ---
  getWishlist(): Product[] {
    try {
      const data = localStorage.getItem(WISHLIST_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  isInWishlist(productId: string): boolean {
    const list = this.getWishlist();
    return list.some(p => p.id === productId);
  },

  toggleWishlist(product: Product): boolean {
    const list = this.getWishlist();
    const index = list.findIndex(p => p.id === product.id);
    let isAdded = false;

    if (index > -1) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.push(product);
      isAdded = true;
    }

    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('saena_wishlist_updated'));
    } catch (e) {
      console.error(e);
    }

    return isAdded;
  },

  // --- CURRENT USER SESSION ---
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  saveCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('saena_auth_token');
    }
    window.dispatchEvent(new Event('saena_auth_updated'));
  },

  addOrUpdateUserAddress(address: ShippingAddress): ShippingAddress[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    const newAddr = {
      ...address,
      id: address.id || `addr-${Date.now()}`
    };

    if (newAddr.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => { a.isDefault = false; });
      newAddr.isDefault = true;
    }

    const existingIdx = user.addresses.findIndex(a => a.id === newAddr.id);
    if (existingIdx > -1) {
      user.addresses[existingIdx] = newAddr;
    } else {
      user.addresses.push(newAddr);
    }

    this.saveCurrentUser(user);
    return user.addresses;
  }
};
