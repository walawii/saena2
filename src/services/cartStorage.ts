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
      shippingFee: 0,
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
        variant,
        selectedColor: variant.colorName || 'Default',
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
      shippingFee: 0,
      total: 0,
      totalWeight: 0,
    };
    this.saveCart(empty);
    return empty;
  },

  recalculate(cart: Cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0);
    cart.totalWeight = cart.items.reduce((sum, item) => sum + ((item.product.weightInGrams || item.product.weight || 300) * item.quantity), 0);
    cart.total = Math.max(0, cart.subtotal - (cart.discount || 0) + (cart.shippingFee || 0));
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
    let list = this.getWishlist();
    const exists = list.some(p => p.id === product.id);
    if (exists) {
      list = list.filter(p => p.id !== product.id);
    } else {
      list.push(product);
    }
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('saena_wishlist_updated'));
    } catch (e) {
      console.error(e);
    }
    return !exists;
  },

  // --- AUTH / USER LOCAL STATE (PROFILE CACHE) ---
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  setCurrentUser(user: User | null) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
      window.dispatchEvent(new Event('saena_user_updated'));
    } catch (e) {
      console.error(e);
    }
  },

  saveCurrentUser(user: User | null) {
    this.setCurrentUser(user);
  },

  logoutUser() {
    this.setCurrentUser(null);
    localStorage.removeItem('saena_auth_token');
  },

  addOrUpdateUserAddress(address: Omit<ShippingAddress, 'id'> | ShippingAddress): ShippingAddress {
    return this.addAddress(address);
  },

  addAddress(address: Omit<ShippingAddress, 'id'> | ShippingAddress): ShippingAddress {
    const user = this.getCurrentUser();
    const newAddress: ShippingAddress = {
      ...address,
      id: (address as any).id || `addr-${Date.now()}`
    };

    if (user) {
      if (newAddress.isDefault) {
        user.addresses = user.addresses.map(a => ({ ...a, isDefault: false }));
      }
      const existingIdx = user.addresses.findIndex(a => a.id === newAddress.id);
      if (existingIdx > -1) {
        user.addresses[existingIdx] = newAddress;
      } else {
        user.addresses.push(newAddress);
      }
      this.setCurrentUser(user);
    }

    return newAddress;
  }
};
