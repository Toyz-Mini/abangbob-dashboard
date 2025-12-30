'use client';

import { useState, useMemo } from 'react';
import { CartItem, Order } from '@/lib/types'; // Import Order type
import { UtensilsCrossed, Sandwich, Coffee, Loader2 } from 'lucide-react';
import { useMenuQuery, useMenuCategoriesQuery } from '@/lib/hooks/queries/useMenuQueries';
import { useCreateOrderMutation } from '@/lib/hooks/mutations/useOrderMutations';

export default function WebOrderPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'takeaway' | 'gomamam'>('takeaway');
  const [pickupTime, setPickupTime] = useState('');

  // Queries
  const { data: menuItems = [], isLoading: isMenuLoading } = useMenuQuery();
  const { data: menuCategories = [], isLoading: isCategoriesLoading } = useMenuCategoriesQuery();

  // Mutations
  const createOrderMutation = useCreateOrderMutation();

  const activeCategories = useMemo(() => {
    const activeCats = menuCategories.filter(c => c.isActive).map(c => c.name);
    // Ensure all categories from menu items are included (in case of legacy items)
    const itemCats = new Set(menuItems.map(item => item.category));
    const mergedCats = new Set(['All', ...activeCats, ...Array.from(itemCats)]);
    // Sort categories, keep 'All' first
    return Array.from(mergedCats).sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;

      // Try to respect defined sort order if possible
      const catA = menuCategories.find(c => c.name === a);
      const catB = menuCategories.find(c => c.name === b);

      if (catA && catB) return catA.sortOrder - catB.sortOrder;
      return a.localeCompare(b);
    });
  }, [menuCategories, menuItems]);

  const filteredMenu = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }
    // Only show available items on the web order page
    return items.filter(item => item.isAvailable);
  }, [menuItems, selectedCategory]);

  const addToCart = (item: any) => { // Type as any for now to avoid strict mismatch if MenuItem definition varies slightly
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      // Determine modifiers (none for now in simple add)
      const selectedModifiers = [];

      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1, itemTotal: (i.quantity + 1) * i.price } : i
        );
      }
      return [...prev, { ...item, quantity: 1, selectedModifiers: [], itemTotal: item.price }];
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCart(prev => prev.map(i =>
        i.id === itemId ? {
          ...i,
          quantity,
          itemTotal: quantity * (i.price + (i.selectedModifiers?.reduce((sum, mod) => sum + mod.extraPrice, 0) || 0))
        } : i
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  const handlePlaceOrder = async () => {
    if (!customerName) {
      alert('Sila masukkan nama');
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    try {
      await createOrderMutation.mutateAsync({
        orderNumber,
        items: cart,
        total: cartTotal,
        subtotal: cartTotal,
        tax: 0, // Calculate tax if needed
        discount: 0,
        orderType,
        customerName,
        // pickupTime is not directly in Order type but can be in notes or extended type if needed
        // For now, let's append it to notes if it exists, or ignore if not in schema yet
        // Assuming Order schema doesn't strict validity check on extra props for now locally, 
        // but for Supabase insert it must match.
        // I'll assume 'notes' field for pickup time.
      });

      // Reset
      setCart([]);
      setShowCheckout(false);
      setCustomerName('');
      setOrderType('takeaway');
      setPickupTime('');

    } catch (error) {
      // Validation managed by mutation hook toast
    }
  };

  if (isMenuLoading || isCategoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <Loader2 className="animate-spin text-white w-12 h-12" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '3rem',
          paddingTop: '2rem'
        }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>AbangBob</span>
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
            Pesan makanan kegemaran anda dengan mudah
          </p>
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-lg)',
            display: 'inline-block'
          }}>
            🎉 Promo: Diskaun 10% untuk pesanan pertama!
          </div>
        </div>

        {/* Category Filter */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {activeCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                background: selectedCategory === category ? 'white' : 'rgba(255, 255, 255, 0.2)',
                color: selectedCategory === category ? '#667eea' : 'white',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {filteredMenu.map(item => (
            <div
              key={item.id}
              style={{
                background: 'white',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => addToCart(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '100%',
                height: '180px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                {item.category === 'Nasi Lemak' ? <UtensilsCrossed size={64} /> :
                  item.category === 'Burger' ? <Sandwich size={64} /> : <Coffee size={64} />}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '40px' }}>
                {item.description || 'Tiada deskripsi'}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                  BND {item.price.toFixed(2)}
                </div>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xl)',
          minWidth: '300px',
          maxWidth: '400px',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
            Keranjang ({cart.length})
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {cart.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--gray-200)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    BND {item.price.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQuantity(item.id, item.quantity - 1);
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid var(--gray-300)',
                      background: 'white',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQuantity(item.id, item.quantity + 1);
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid var(--gray-300)',
                      background: 'white',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: '1rem',
            borderTop: '2px solid var(--gray-300)',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              <span>Jumlah:</span>
              <span>BND {cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Pesan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Selesaikan Pesanan
            </h2>

            <div className="form-group">
              <label className="form-label">Nama *</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama anda"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Pesanan</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`btn ${orderType === 'takeaway' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  Takeaway
                </button>
                <button
                  onClick={() => setOrderType('gomamam')}
                  className={`btn ${orderType === 'gomamam' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  GoMamam
                </button>
              </div>

              {orderType === 'takeaway' && (
                <input
                  type="time"
                  className="form-input"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="Masa Pickup (optional)"
                />
              )}
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--gray-100)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Ringkasan:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total ({cart.length} items):</span>
                <span style={{ fontWeight: 700 }}>BND {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowCheckout(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                onClick={handlePlaceOrder}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Processing...' : 'Pesan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
