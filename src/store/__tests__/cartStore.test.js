import useCartStore from '../cartStore';

const INITIAL_STATE = {
  items: [],
  outletId: 1,
  customerId: null,
  customerName: null,
  notes: '',
};

beforeEach(() => {
  useCartStore.setState(INITIAL_STATE);
});

describe('cartStore – addItem', () => {
  const product = { id: 1, name: 'Coffee', price: '15000', image: null };

  it('adds a new product as a CartItem with quantity 1', () => {
    useCartStore.getState().addItem(product);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      product_id: 1,
      name: 'Coffee',
      price: 15000,
      quantity: 1,
      discount_amount: 0,
      image: null,
    });
  });

  it('increments quantity when adding the same product twice', () => {
    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('adds two different products as separate items', () => {
    const product2 = { id: 2, name: 'Tea', price: '8000', image: 'img.png' };
    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product2);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });

  it('handles a price string that is not a number by defaulting to 0', () => {
    useCartStore.getState().addItem({ id: 3, name: 'Item', price: 'free', image: null });
    expect(useCartStore.getState().items[0].price).toBe(0);
  });

  it('preserves image when present', () => {
    const p = { id: 4, name: 'Juice', price: '10000', image: 'juice.png' };
    useCartStore.getState().addItem(p);
    expect(useCartStore.getState().items[0].image).toBe('juice.png');
  });
});

describe('cartStore – removeItem', () => {
  it('removes a product by product_id', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().removeItem(1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('only removes the targeted product', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().addItem({ id: 2, name: 'B', price: '2000', image: null });
    useCartStore.getState().removeItem(1);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].product_id).toBe(2);
  });

  it('does nothing when the product_id is not in the cart', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().removeItem(99);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

describe('cartStore – updateQuantity', () => {
  it('updates the quantity of an existing item', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().updateQuantity(1, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('removes the item when quantity is set to 0', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().updateQuantity(1, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('removes the item when quantity is negative', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().updateQuantity(1, -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore – updateDiscount', () => {
  it('sets a positive discount amount', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '10000', image: null });
    useCartStore.getState().updateDiscount(1, 2000);
    expect(useCartStore.getState().items[0].discount_amount).toBe(2000);
  });

  it('clamps negative discounts to 0', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '10000', image: null });
    useCartStore.getState().updateDiscount(1, -500);
    expect(useCartStore.getState().items[0].discount_amount).toBe(0);
  });
});

describe('cartStore – setCustomer', () => {
  it('sets customerId and customerName', () => {
    useCartStore.getState().setCustomer(7, 'John Doe');
    const state = useCartStore.getState();
    expect(state.customerId).toBe(7);
    expect(state.customerName).toBe('John Doe');
  });
});

describe('cartStore – setOutlet', () => {
  it('sets outletId', () => {
    useCartStore.getState().setOutlet(3);
    expect(useCartStore.getState().outletId).toBe(3);
  });
});

describe('cartStore – setNotes', () => {
  it('sets notes', () => {
    useCartStore.getState().setNotes('No sugar please');
    expect(useCartStore.getState().notes).toBe('No sugar please');
  });
});

describe('cartStore – clearCart', () => {
  it('resets items, customerId, customerName, and notes', () => {
    useCartStore.getState().addItem({ id: 1, name: 'A', price: '1000', image: null });
    useCartStore.getState().setCustomer(5, 'Jane');
    useCartStore.getState().setNotes('Extra hot');
    useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.customerId).toBeNull();
    expect(state.customerName).toBeNull();
    expect(state.notes).toBe('');
  });

  it('does not reset outletId', () => {
    useCartStore.getState().setOutlet(5);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().outletId).toBe(5);
  });
});
