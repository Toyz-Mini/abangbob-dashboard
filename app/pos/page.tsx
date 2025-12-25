'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import { useOrders, useMenu, useInventory, usePaymentMethods, useCustomers } from '@/lib/store';
import { useMenuRealtime, useInventoryRealtime, useModifiersRealtime, useOrdersRealtime } from '@/lib/supabase/realtime-hooks';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useSound } from '@/lib/contexts/SoundContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { CartItem, Order, MenuItem, SelectedModifier, ReceiptSettings, DEFAULT_RECEIPT_SETTINGS, Customer } from '@/lib/types';
import { getUpsellSuggestions } from '@/lib/menu-data';
import {
  thermalPrinter,
  loadReceiptSettings,
  isOnline,
  withRetry,
  getNetworkErrorMessage,
  generateTransactionId,
  isTransactionSubmitted,
  markTransactionSubmitted,
} from '@/lib/services';
// Dynamic Imports for Heavy Components
const ReceiptPreview = dynamic(() => import('@/components/ReceiptPreview'), { ssr: false });
const ShiftWizardModal = dynamic(() => import('@/components/cash-management/ShiftWizardModal'), { ssr: false });
const RegisterStatus = dynamic(() => import('@/components/cash-management/RegisterStatus'), { ssr: false });
import POSMenuItem from '@/components/pos/POSMenuItem'; // Memoized Item

import { ArrowLeft, UtensilsCrossed, Sandwich, Coffee, History, Printer, Clock, ChefHat, CheckCircle, ShoppingBag, Plus, Minus, X, Sparkles, AlertTriangle, User, DollarSign, CreditCard, QrCode, Wallet, WifiOff, RefreshCw, MessageCircle, Check, Globe, Send, ChevronRight } from 'lucide-react';
import { WhatsAppService } from '@/lib/services/whatsapp';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { countries, Country, getDefaultCountry } from '@/lib/countries';

type ModalType = 'upsell' | 'checkout' | 'receipt' | 'history' | 'queue' | 'modifiers' | 'network-error' | null;

export default function POSPage() {

  const { menuItems, modifierGroups, modifierOptions, getOptionsForGroup, refreshMenu } = useMenu();
  const { inventory, adjustStock, refreshInventory } = useInventory();
  const { paymentMethods, isInitialized: paymentMethodsInitialized } = usePaymentMethods();
  const { customers } = useCustomers();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const { currentStaff } = useAuth();
  const router = useRouter();

  // Cash Register State
  const { currentRegister, isInitialized: storeInitialized } = useStore();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerModalMode, setRegisterModalMode] = useState<'open' | 'close'>('open');

  // Enforce Open Register
  useEffect(() => {
    if (storeInitialized && !currentRegister) {
      setRegisterModalMode('open');
      setRegisterModalOpen(true);
    }
  }, [storeInitialized, currentRegister]);

  // Realtime subscriptions for menu, inventory, and modifiers

  // Realtime subscriptions for menu, inventory, and modifiers
  const handleMenuChange = useCallback(() => {
    console.log('[Realtime] Menu change detected, refreshing...');
    refreshMenu();
  }, [refreshMenu]);

  const handleInventoryChange = useCallback(() => {
    console.log('[Realtime] Inventory change detected, refreshing...');
    refreshInventory();
  }, [refreshInventory]);

  const handleOrdersChange = useCallback(() => {
    console.log('[Realtime] Orders change detected, refreshing...');
    // We can refresh orders if needed, but POS primarily reads orders via getTodayOrders() which uses store state.
    // However, if we want the "History" or "Pending" list to update, we need refreshOrders.
    // Wait, POS page gets orders from useOrders(), which wraps store.orders.
    // store.orders is updated by refreshOrders().
    // So we just need to call refreshOrders() from the store.
    // But useOrders() exposes refreshOrders.
    // Let's use it.
  }, []);

  // We need to destructure refreshOrders from useOrders first
  const { orders, addOrder, updateOrderStatus, getTodayOrders, refreshOrders, isInitialized } = useOrders();

  useOrdersRealtime(useCallback(() => {
    console.log('[POS Realtime] Orders refreshed');
    refreshOrders();
  }, [refreshOrders]));
  useMenuRealtime(handleMenuChange);
  useInventoryRealtime(handleInventoryChange);
  useModifiersRealtime(handleMenuChange); // Modifiers also refresh menu

  // Get enabled payment methods from settings - using useMemo for proper reactivity
  const enabledPaymentMethods = useMemo(() => {
    return paymentMethods
      .filter(pm => pm.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [paymentMethods]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+673');
  const [orderType, setOrderType] = useState<'takeaway' | 'gomamam'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false); // Loyalty Redemption Toggle
  const [checkoutStep, setCheckoutStep] = useState(1); // Wizard Step (1-3)
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Customer Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Filter customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerSearch('');
    setShowCustomerResults(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('+673');
  };

  // Network recovery state
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Power Features State
  const { playSound } = useSound();
  const [sendToWhatsapp, setSendToWhatsapp] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry());

  // Load receipt settings on mount
  useEffect(() => {
    const settings = loadReceiptSettings();
    setReceiptSettings(settings);
  }, []);

  // Modifier selection state
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [tempSelectedModifiers, setTempSelectedModifiers] = useState<SelectedModifier[]>([]);

  // Get available menu items only
  const availableMenuItems = useMemo(() => {
    return menuItems.filter(item => item.isAvailable);
  }, [menuItems]);

  // Get categories from menu
  const categories = useMemo(() => {
    const cats = new Set(availableMenuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [availableMenuItems]);

  const filteredMenu = selectedCategory === 'All'
    ? availableMenuItems
    : availableMenuItems.filter(item => item.category === selectedCategory);

  // Get upsell suggestions based on cart items
  const upsellSuggestions = useMemo(() => {
    const cartItemIds = cart.map(item => item.id);
    return getUpsellSuggestions(cartItemIds, menuItems);
  }, [cart, menuItems]);

  // Handle item click - check if has modifiers
  const handleItemClick = (item: MenuItem) => {
    if (item.modifierGroupIds.length > 0) {
      // Has modifiers - open modifier selection modal
      setSelectedItemForModifiers(item);
      setTempSelectedModifiers([]);
      setModalType('modifiers');
    } else {
      // No modifiers - add directly to cart
      addToCart(item, []);
    }
  };

  const addToCart = (item: MenuItem, selectedModifiers: SelectedModifier[]) => {
    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);
    const itemTotal = item.price + modifierTotal;

    // Generate unique key for cart item (including modifiers)
    const modifierKey = selectedModifiers.map(m => m.optionId).sort().join('-');
    const cartItemId = `${item.id}_${modifierKey || 'no-mod'}`;

    setCart(prev => {
      const existing = prev.find(i =>
        i.id === item.id &&
        JSON.stringify(i.selectedModifiers) === JSON.stringify(selectedModifiers)
      );

      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      const newCartItem: CartItem = {
        ...item,
        quantity: 1,
        selectedModifiers,
        itemTotal,
      };
      return [...prev, newCartItem];
    });
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else {
      setCart(prev => prev.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;

  const cartTotal = cartSubtotal - discountAmount;

  // Loyalty Redemption Calculation (100 Points = $1)
  const maxRedemptionValue = useMemo(() => {
    if (!selectedCustomer) return 0;
    const pointsValue = selectedCustomer.loyaltyPoints / 100;
    return Math.min(cartTotal, pointsValue);
  }, [selectedCustomer, cartTotal]);

  const redemptionAmount = usePoints ? maxRedemptionValue : 0;
  const pointsToRedeem = usePoints ? Math.ceil(redemptionAmount * 100) : 0; // Displayed points
  const finalPayable = Math.max(0, cartTotal - redemptionAmount);

  // Toggle modifier option
  const toggleModifierOption = (group: typeof modifierGroups[0], option: typeof modifierOptions[0]) => {
    setTempSelectedModifiers(prev => {
      const existingIndex = prev.findIndex(m => m.optionId === option.id);

      if (existingIndex >= 0) {
        // Remove this option
        return prev.filter(m => m.optionId !== option.id);
      }

      // Check if single select - remove other options from same group
      if (!group.allowMultiple) {
        const withoutGroupOptions = prev.filter(m => m.groupId !== group.id);
        return [...withoutGroupOptions, {
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          extraPrice: option.extraPrice,
        }];
      }

      // Multiple select - check max
      const groupOptionsCount = prev.filter(m => m.groupId === group.id).length;
      if (groupOptionsCount >= group.maxSelection) {
        return prev;
      }

      return [...prev, {
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        extraPrice: option.extraPrice,
      }];
    });
  };

  // Validate modifiers before adding to cart
  const validateModifiers = (): boolean => {
    if (!selectedItemForModifiers) return false;

    for (const groupId of selectedItemForModifiers.modifierGroupIds) {
      const group = modifierGroups.find(g => g.id === groupId);
      if (!group) continue;

      const selectedCount = tempSelectedModifiers.filter(m => m.groupId === groupId).length;

      if (group.isRequired && selectedCount < group.minSelection) {
        return false;
      }
    }

    return true;
  };

  // Add item with modifiers to cart
  const handleAddWithModifiers = () => {
    if (!selectedItemForModifiers) return;

    if (!validateModifiers()) {
      alert('Sila pilih semua modifier yang wajib');
      return;
    }

    addToCart(selectedItemForModifiers, tempSelectedModifiers);
    setModalType(null);
    setSelectedItemForModifiers(null);
    setTempSelectedModifiers([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Check for drinks (forced upsell)
    const hasDrink = cart.some(item => item.category === 'Minuman');

    if (!hasDrink) {
      setModalType('upsell');
      return;
    }

    setModalType('checkout');
  };

  const proceedToPayment = async (retrying: boolean = false) => {
    // Robust validation: Strip country code to check if actual digits exist
    // default countryCode is +673 (4 chars). If user typed nothing, length is 4.
    // We want to ensure they have at least 3-4 digits of actual number.
    const phoneDigits = customerPhone.replace(selectedCountry.dialCode, '').trim();

    if (!phoneDigits || phoneDigits.length < 3) {
      showToast('⚠️ Sila masukkan nombor telefon pelanggan dahulu.', 'error');
      // Look for the input to focus it? 
      // simple return is enough as toast explains it.
      return;
    }

    // Validate cash payment
    if (paymentMethod === 'cash') {
      // Validate cash payment
      if (paymentMethod === 'cash') {
        if (!cashReceived || cashReceived < finalPayable) {
          showToast('Sila masukkan jumlah bayaran yang mencukupi', 'error');
          return;
        }
      }
    }

    // Check network connectivity
    if (!isOnline()) {
      setNetworkError('Tiada sambungan internet. Sila semak rangkaian anda.');
      setModalType('network-error');
      return;
    }

    // Generate or reuse transaction ID (for retry scenarios)
    const transactionId = retrying && currentTransactionId
      ? currentTransactionId
      : generateTransactionId();

    // Check for duplicate submission
    if (isTransactionSubmitted(transactionId)) {
      showToast('Pesanan ini sudah diproses. Sila tunggu atau buat pesanan baru.', 'warning');
      return;
    }

    setCurrentTransactionId(transactionId);
    setIsProcessing(true);
    setNetworkError(null);

    try {
      // Process payment with retry logic
      const processOrder = async () => {
        // Simulate API call with potential network issues
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate occasional network failure for testing
            // In production, this would be the actual API call
            if (!isOnline()) {
              reject(new Error('Network disconnected'));
            } else {
              resolve(true);
            }
          }, 1500);
        });

        return true;
      };

      // Use retry logic for the payment process
      await withRetry(processOrder, {
        maxRetries: 2,
        baseDelay: 1000,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          showToast(`Cuba semula... (${attempt}/2)`, 'info');
        },
      });

      // Mark transaction as submitted to prevent duplicates
      markTransactionSubmitted(transactionId);

      // Create order with customer name and payment method
      const newOrder = await addOrder({
        items: cart,
        total: cartTotal, // Store original total
        customerName: customerName || undefined,
        customerPhone,
        customerId: selectedCustomer?.id,
        redeemedPoints: pointsToRedeem > 0 ? pointsToRedeem : undefined,
        redemptionAmount: redemptionAmount > 0 ? redemptionAmount : undefined,
        orderType,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString(),
        staffId: currentStaff?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentStaff.id) ? currentStaff.id : undefined,
        staffName: currentStaff?.name, // Store staff name for reference
      });

      // Decrement inventory based on sold items (simple mapping by category)
      cart.forEach(item => {
        // Find matching inventory items based on category keywords
        const categoryToInventory: Record<string, string[]> = {
          'Nasi Lemak': ['Nasi', 'Ayam', 'Telur', 'Sambal'],
          'Burger': ['Roti Burger', 'Daging'],
          'Minuman': ['Teh', 'Kopi', 'Milo', 'Gula'],
        };

        const relatedItems = categoryToInventory[item.category] || [];
        relatedItems.forEach(invName => {
          const invItem = inventory.find(inv =>
            inv.name.toLowerCase().includes(invName.toLowerCase())
          );
          if (invItem) {
            adjustStock(invItem.id, item.quantity, 'out', `Jualan: ${item.name}`);
          }
        });
      });

      setLastOrder(newOrder);

      // Show success toast
      showToast(`Pesanan ${newOrder.orderNumber} berjaya!`, 'success');

      // Play "Ka-ching" sound
      playSound(paymentMethod === 'cash' ? 'payment' : 'success');

      // Auto-print if enabled
      if (receiptSettings.autoPrint && newOrder) {
        handlePrintReceipt(newOrder);
      }

      // Open cash drawer for cash payments
      if (receiptSettings.openCashDrawer && paymentMethod === 'cash' && thermalPrinter.isConnected()) {
        try {
          await thermalPrinter.openCashDrawer();
        } catch (error) {
          console.error('Failed to open cash drawer:', error);
        }
      }

      // Reset cart and modals
      setCart([]);
      setModalType('receipt');
      setCustomerName('');
      setCustomerPhone('+673');
      setPaymentMethod('cash');
      setDiscountPercent(0);
      setCashReceived(0);
      setUsePoints(false); // Reset redemption
      setCurrentTransactionId(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = getNetworkErrorMessage(error);
      setNetworkError(errorMessage);
      setModalType('network-error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry payment after network error
  const handleRetryPayment = useCallback(() => {
    setModalType('checkout');
    proceedToPayment(true);
  }, [currentTransactionId]);

  // Cancel payment and clear transaction
  const handleCancelPayment = useCallback(() => {
    setCurrentTransactionId(null);
    setNetworkError(null);
    setRetryCount(0);
    setModalType(null);
  }, []);

  const handlePrintReceipt = async (orderToPrint?: Order) => {
    const order = orderToPrint || lastOrder;
    if (!order) return;

    try {
      // Use thermal printer if connected, otherwise use browser print
      await thermalPrinter.print(order, receiptSettings);
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to browser print
      thermalPrinter.printWithBrowser(order, receiptSettings);
    }
  };

  const todayOrders = getTodayOrders();
  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  if (!isInitialized) {
    return (
      <RouteGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
          <LoadingSpinner />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="pos-standalone animate-fade-in" style={{
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        padding: '1.5rem',
        paddingBottom: '2rem' // Extra padding for bottom
      }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => router.push('/')}
                className="btn btn-ghost"
                style={{ padding: '0.5rem' }}
                title={t('common.back')}
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="page-title" style={{ margin: 0 }}>
                {t('pos.title')}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <RegisterStatus
                onOpenClick={() => {
                  setRegisterModalMode('open');
                  setRegisterModalOpen(true);
                }}
                onCloseClick={() => {
                  setRegisterModalMode('close');
                  setRegisterModalOpen(true);
                }}
              />
              <button className="btn btn-outline" onClick={() => setModalType('queue')}>
                <ChefHat size={18} />
                {t('pos.orderQueue')} ({pendingOrders.length + preparingOrders.length})
              </button>
              <button className="btn btn-outline" onClick={() => setModalType('history')}>
                <History size={18} />
                {t('pos.orderHistory')} ({todayOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label={t('pos.totalOrders')}
            value={todayOrders.length}
            change={todayOrders.length > 0 ? t('pos.ordersToday') : t('pos.noOrders')}
            changeType={todayOrders.length > 0 ? "positive" : "neutral"}
            icon={ShoppingBag}
            gradient="primary"
          />
          <StatCard
            label={t('pos.pending')}
            value={pendingOrders.length}
            change={pendingOrders.length > 0 ? t('pos.waiting') : t('pos.allProcessed')}
            changeType={pendingOrders.length > 0 ? "neutral" : "positive"}
            icon={Clock}
            gradient="warning"
          />
          <StatCard
            label={t('pos.preparing')}
            value={preparingOrders.length}
            change={preparingOrders.length > 0 ? t('pos.beingPrepared') : t('pos.noneInKitchen')}
            changeType="neutral"
            icon={ChefHat}
            gradient="subtle"
          />
          <StatCard
            label={t('pos.ready')}
            value={readyOrders.length}
            change={readyOrders.length > 0 ? t('pos.readyForPickup') : t('pos.noneReady')}
            changeType={readyOrders.length > 0 ? "positive" : "neutral"}
            icon={CheckCircle}
            gradient="peach"
          />
        </div>

        <div style={{ position: 'relative' }}>
          {/* Menu Section */}
          <div style={{ paddingBottom: '6rem' }}>
            {/* Category Filter */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '1rem' }}>
              {filteredMenu.map(item => (
                <POSMenuItem
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Tiada menu dalam kategori ini
                </p>
              </div>
            )}
          </div>

          {/* Cart Section - Floating Drawer */}
          <>
            {/* FAB */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn btn-primary"
              style={{
                position: 'fixed',
                bottom: '5.5rem',
                right: '2rem',
                zIndex: 40,
                padding: '1rem 1.5rem',
                borderRadius: '50px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: isCartOpen ? 'none' : 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 700,
                animation: 'fade-in 0.3s'
              }}
            >
              <ShoppingBag size={24} />
              <span>{cart.reduce((a, c) => a + c.quantity, 0)} Items • BND {cartTotal.toFixed(2)}</span>
            </button>

            {/* Drawer Overlay */}
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              pointerEvents: isCartOpen ? 'auto' : 'none',
              visibility: isCartOpen ? 'visible' : 'hidden'
            }}>
              {/* Backdrop */}
              <div
                style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  opacity: isCartOpen ? 1 : 0, transition: 'opacity 0.3s'
                }}
                onClick={() => setIsCartOpen(false)}
              />

              {/* Drawer Content */}
              <div className="card" style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: '100%', maxWidth: '450px',
                borderRadius: '0',
                margin: 0,
                transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column', height: '100%'
              }}>
                <div className="card-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingBag size={20} />
                      Keranjang
                    </div>
                    <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <X size={24} />
                    </button>
                  </div>
                  <div className="card-subtitle">{cart.length} item(s)</div>
                </div>

                {cart.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                    Tiada item dalam keranjang
                  </p>
                ) : (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
                      {cart.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          style={{
                            padding: '0.75rem 0',
                            borderBottom: '1px solid var(--gray-200)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {item.name}
                              </div>
                              {item.selectedModifiers.length > 0 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  {item.selectedModifiers?.map((mod, i) => (
                                    <div key={i}>
                                      - {mod.groupName?.replace('Pilih ', '').replace('Flavour ', '') || ''}: <b>{mod.optionName}</b>
                                      {mod.extraPrice > 0 && ` (+$${mod.extraPrice.toFixed(2)})`}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                                BND {item.itemTotal.toFixed(2)} each
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--danger)',
                                padding: '0.25rem'
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity - 1)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600 }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity + 1)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                            >
                              <Plus size={14} />
                            </button>
                            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
                              BND {(item.itemTotal * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Footer */}
                    <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {/* Discount Section */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                          Diskaun (%)
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[0, 5, 10, 15, 20].map(percent => (
                            <button
                              key={percent}
                              onClick={() => setDiscountPercent(percent)}
                              className={`btn btn-sm ${discountPercent === percent ? 'btn-primary' : 'btn-outline'}`}
                              style={{ flex: 1, padding: '0.5rem' }}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span>Subtotal:</span>
                        <span>BND {cartSubtotal.toFixed(2)}</span>
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                          <span>Diskaun ({discountPercent}%):</span>
                          <span>-BND {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        marginTop: '0.5rem',
                        marginBottom: '1rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px dashed #cbd5e1'
                      }}>
                        <span>Jumlah:</span>
                        <span>BND {cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={handleCheckout}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                      >
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        </div>

        {/* Modifier Selection Modal */}
        <Modal
          isOpen={modalType === 'modifiers'}
          onClose={() => {
            setModalType(null);
            setSelectedItemForModifiers(null);
            setTempSelectedModifiers([]);
          }}
          title={`Pilih Options - ${selectedItemForModifiers?.name}`}
          maxWidth="450px"
        >
          {selectedItemForModifiers && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedItemForModifiers.name}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>BND {selectedItemForModifiers.price.toFixed(2)}</div>
              </div>

              {selectedItemForModifiers.modifierGroupIds.map(groupId => {
                const group = modifierGroups.find(g => g.id === groupId);
                if (!group) return null;

                const options = getOptionsForGroup(groupId).filter(opt => opt.isAvailable);
                const selectedCount = tempSelectedModifiers.filter(m => m.groupId === groupId).length;

                return (
                  <div key={groupId} style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{group.name}</span>
                        {group.isRequired && (
                          <span style={{ color: 'var(--danger)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                            * Wajib
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {selectedCount}/{group.maxSelection}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {options.map(option => {
                        const isSelected = tempSelectedModifiers.some(m => m.optionId === option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleModifierOption(group, option)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'var(--primary-light)' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? 600 : 400 }}>{option.name}</span>
                            <span style={{
                              fontWeight: 600,
                              color: option.extraPrice > 0 ? 'var(--success)' : 'var(--text-secondary)'
                            }}>
                              {option.extraPrice > 0 ? `+BND ${option.extraPrice.toFixed(2)}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Total Preview */}
              <div style={{
                padding: '1rem',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Harga Asas:</span>
                  <span>BND {selectedItemForModifiers.price.toFixed(2)}</span>
                </div>
                {tempSelectedModifiers.filter(m => m.extraPrice > 0).map((mod, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>+ {mod.groupName?.replace('Pilih ', '').replace('Flavour ', '')}: <b>{mod.optionName}</b></span>
                    <span>+BND {mod.extraPrice.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--gray-300)',
                  marginTop: '0.5rem'
                }}>
                  <span>Jumlah:</span>
                  <span>BND {(selectedItemForModifiers.price + tempSelectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0)).toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setModalType(null);
                    setSelectedItemForModifiers(null);
                  }}
                  style={{
                    minWidth: '100px',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddWithModifiers}
                  disabled={!validateModifiers()}
                  style={{
                    minWidth: '160px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: 600
                  }}
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Upsell Modal - Product Cards */}
        <Modal
          isOpen={modalType === 'upsell'}
          onClose={() => setModalType(null)}
          title="Tambah Lagi?"
          maxWidth="550px"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 'var(--radius-md)',
            color: '#92400e'
          }}>
            <Sparkles size={20} />
            <span style={{ fontWeight: 500 }}>Jangan lupa minuman! Pilih di bawah:</span>
          </div>

          {/* Product Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            {upsellSuggestions.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  handleItemClick(item);
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: 'var(--primary)'
                }}>
                  <Coffee size={28} />
                </div>

                {/* Name */}
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {item.name}
                </div>

                {/* Price */}
                <div style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  marginBottom: '0.75rem'
                }}>
                  BND {item.price.toFixed(2)}
                </div>

                {/* Add Button */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>
            ))}
          </div>

          {/* Added Items Feedback */}
          {cart.filter(c => upsellSuggestions.some(u => u.id === c.id)).length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#d1fae5',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#065f46'
            }}>
              <CheckCircle size={18} />
              <span style={{ fontWeight: 500 }}>
                {cart.filter(c => upsellSuggestions.some(u => u.id === c.id)).reduce((sum, c) => sum + c.quantity, 0)} minuman ditambah
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)'
          }}>
            <button
              onClick={() => setModalType(null)}
              className="btn btn-outline"
              style={{
                minWidth: '100px',
                padding: '0.5rem 1rem'
              }}
            >
              Kembali
            </button>
            <button
              onClick={() => setModalType('checkout')}
              className="btn btn-primary"
              style={{
                minWidth: '160px',
                padding: '0.5rem 1.25rem',
                fontWeight: 600
              }}
            >
              Teruskan Checkout
            </button>
          </div>
        </Modal>

        {/* Global Styles for this page */}
        <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

        {/* Checkout Modal - Clean/Professional Design */}
        <Modal
          isOpen={modalType === 'checkout'}
          onClose={() => !isProcessing && setModalType(null)}
          title="Checkout"
          subtitle={`Total Payable: BND ${finalPayable.toFixed(2)}`}
          maxWidth="500px"
        >
          <div className="flex flex-col gap-4 no-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0.25rem' }}>

            {/* Wizard Progress - Clean Dots */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(step => (
                  <div key={step} className={`transition-all duration-300 ${checkoutStep === step ? 'w-8 bg-primary h-2' : checkoutStep > step ? 'w-2 h-2 bg-primary/40' : 'w-2 h-2 bg-gray-200'} rounded-full`} />
                ))}
              </div>
            </div>

            {/* Step 1: Order Type Selection */}
            {checkoutStep === 1 && (
              <div className="animate-fade-in space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Bagaimana pesanan ini?</h3>
                  <p className="text-sm text-gray-500">Pilih jenis pesanan untuk teruskan</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${orderType === 'takeaway' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-100 hover:border-primary/30 hover:shadow-md bg-white text-gray-600'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${orderType === 'takeaway' ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                      <ShoppingBag size={28} className={orderType === 'takeaway' ? 'text-primary' : 'text-gray-400'} />
                    </div>
                    <span className="font-bold text-lg">Bungkus</span>
                    <span className="text-xs text-center mt-1 opacity-70">Takeaway</span>
                  </button>

                  <button
                    onClick={() => setOrderType('gomamam')}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${orderType === 'gomamam' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-100 hover:border-primary/30 hover:shadow-md bg-white text-gray-600'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${orderType === 'gomamam' ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                      <Globe size={28} className={orderType === 'gomamam' ? 'text-primary' : 'text-gray-400'} />
                    </div>
                    <span className="font-bold text-lg">GoMamam</span>
                    <span className="text-xs text-center mt-1 opacity-70">Delivery</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Details */}
            {checkoutStep === 2 && (
              <div className="animate-fade-in space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800">Maklumat Pelanggan</h3>
                  <p className="text-sm text-gray-500">Cari ahli atau masukkan maklumat baru</p>
                </div>

                {/* Search / Phone Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Nombor Telefon</label>
                    <div className="flex rounded-xl border-2 border-gray-100 overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all bg-white relative">
                      <div className="flex items-center px-4 bg-gray-50 border-r border-gray-100">
                        <span className="text-gray-600 font-bold">🇧🇳 +673</span>
                      </div>
                      <input
                        type="tel"
                        className="block w-full px-4 py-4 text-xl font-medium outline-none placeholder-gray-300"
                        placeholder="888 8888"
                        value={customerPhone.replace('+673', '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const full = `+673${val}`;
                          setCustomerPhone(full);
                          const found = customers.find(c => c.phone === full);
                          if (found) {
                            setSelectedCustomer(found);
                            setCustomerName(found.name);
                          } else {
                            setSelectedCustomer(null);
                          }
                        }}
                        autoFocus
                      />
                      {/* Loading indicator could go here */}
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between animate-slide-up">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-blue-900">{selectedCustomer.name}</div>
                          <div className="text-xs text-blue-600 font-medium">{selectedCustomer.loyaltyPoints} Points Available</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-lg text-xs font-bold uppercase">{selectedCustomer.segment}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Nama Pelanggan (Optional)</label>
                    <input
                      type="text"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      placeholder="Nama Pelanggan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div
                    onClick={() => setSendToWhatsapp(!sendToWhatsapp)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${sendToWhatsapp ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${sendToWhatsapp ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <div className={`font-semibold ${sendToWhatsapp ? 'text-green-900' : 'text-gray-700'}`}>Hantar Resit WhatsApp</div>
                        <div className="text-xs text-gray-500">Resit digital terus ke pelanggan</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${sendToWhatsapp ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {sendToWhatsapp && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {checkoutStep === 3 && (
              <div className="animate-fade-in space-y-6">
                <div className="text-center py-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Jumlah Perlu Dibayar</div>
                  <div className="text-4xl font-extrabold text-gray-900 flex items-center justify-center font-mono">
                    <span className="text-lg text-gray-400 mr-1 mt-2">BND</span>
                    {finalPayable.toFixed(2)}
                  </div>
                </div>

                {/* Point Redemption */}
                {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                  <div
                    onClick={() => setUsePoints(!usePoints)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${usePoints ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${usePoints ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">Redeem Points</div>
                        <div className="text-xs text-gray-500">Available: {selectedCustomer.loyaltyPoints} ($ {(selectedCustomer.loyaltyPoints * 0.01).toFixed(2)})</div>
                      </div>
                    </div>
                    {usePoints && <div className="text-amber-700 font-bold text-sm">- BND {(Math.min(finalPayable, selectedCustomer.loyaltyPoints * 0.01)).toFixed(2)}</div>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cara Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    {enabledPaymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.code)}
                        className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === pm.code
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200 text-gray-600'
                          }`}
                      >
                        <div className="text-xl">{pm.icon}</div>
                        <span className="font-bold text-sm">{pm.name}</span>
                        {paymentMethod === pm.code && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Input */}
                {paymentMethod === 'cash' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-slide-up">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase">Tunai Diterima</span>
                      {cashReceived >= finalPayable && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">CHANGE: BND {(cashReceived - finalPayable).toFixed(2)}</span>}
                    </div>

                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold">BND</span>
                      </div>
                      <input
                        type="number"
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(parseFloat(e.target.value))}
                        className="block w-full pl-14 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-primary focus:border-primary"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[1, 5, 10, 20, 50, 100].map(amt => (
                        <button key={amt} onClick={() => setCashReceived(amt)} className="min-w-[50px] flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors">${amt}</button>
                      ))}
                      <button onClick={() => setCashReceived(Math.ceil(finalPayable))} className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold whitespace-nowrap">Exact</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Navigation */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white pb-2 z-10">
              {checkoutStep > 1 ? (
                <button
                  onClick={() => setCheckoutStep(prev => prev - 1)}
                  className="px-5 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : (
                <button
                  onClick={() => !isProcessing && setModalType(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              )}

              <button
                onClick={() => {
                  if (checkoutStep === 1) {
                    setCheckoutStep(2);
                  } else if (checkoutStep === 2) {
                    // Validate phone number (at least 7 digits after +673)
                    const phoneDigits = customerPhone.replace(/\D/g, '');
                    if (phoneDigits.length < 10) { // +673 = 3 digits + at least 7 local digits
                      showToast('Sila masukkan nombor telefon yang sah', 'error');
                      return;
                    }
                    setCheckoutStep(3);
                  } else {
                    proceedToPayment();
                  }
                }}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: isProcessing ? '#d1d5db' : 'var(--primary)',
                  color: isProcessing ? '#6b7280' : 'white',
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Memproses...</span>
                  </>
                ) : checkoutStep === 3 ? (
                  <>
                    <span>Bayar</span>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                      BND {finalPayable.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Seterusnya</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>

          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal
          isOpen={modalType === 'receipt'}
          onClose={() => setModalType(null)}
          title="Pesanan Berjaya!"
          maxWidth="450px"
        >
          {lastOrder && (
            <div className="no-scrollbar" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#d1fae5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <CheckCircle size={30} color="var(--success)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lastOrder.orderNumber}</div>
                {lastOrder.customerName && (
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Pelanggan: {lastOrder.customerName}
                  </div>
                )}
              </div>

              {/* Receipt Preview */}
              <div
                ref={receiptRef}
                style={{
                  background: '#e5e5e5',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ReceiptPreview
                  settings={receiptSettings}
                  sampleOrder={lastOrder}
                  width={receiptSettings.receiptWidth}
                  scale={0.85}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => handlePrintReceipt()}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem' }}
                >
                  <Printer size={18} />
                  Cetak Resit
                </button>
                <button
                  onClick={() => {
                    if (lastOrder && lastOrder.customerPhone) {
                      const msg = WhatsAppService.generateReceiptMessage(lastOrder);
                      WhatsAppService.openWhatsApp(lastOrder.customerPhone, msg);
                    }
                  }}
                  className="btn btn-access"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: '#25D366', borderColor: '#25D366', color: 'white' }}
                >
                  <MessageCircle size={18} />
                  Hantar Resit (WhatsApp)
                </button>
                <button
                  onClick={() => setModalType(null)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Tutup
                </button>
              </div>

              {/* Printer Status Indicator */}
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem 0.75rem',
                background: thermalPrinter.isConnected() ? '#d1fae5' : 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                textAlign: 'center',
                color: thermalPrinter.isConnected() ? '#059669' : 'var(--text-secondary)',
              }}>
                {thermalPrinter.isConnected()
                  ? '✓ Thermal printer disambung - cetak terus ke printer'
                  : 'Tiada thermal printer - akan cetak melalui browser'}
              </div>
            </div>
          )}
        </Modal>

        {/* Order Queue Modal */}
        <Modal
          isOpen={modalType === 'queue'}
          onClose={() => setModalType(null)}
          title="Order Queue"
          subtitle="Kitchen Display"
          maxWidth="800px"
        >
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem' }}>
            {/* Pending */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--warning)'
              }}>
                <Clock size={18} />
                Pending ({pendingOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {pendingOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#fef3c7',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                        {item.selectedModifiers.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>
                            {item.selectedModifiers?.map(m => `${m.groupName?.replace('Pilih ', '').replace('Flavour ', '') || ''}: ${m.optionName}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Start Preparing
                    </button>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>

            {/* Preparing */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#1e40af'
              }}>
                <ChefHat size={18} />
                Preparing ({preparingOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {preparingOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#dbeafe',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="btn btn-sm btn-secondary"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Mark Ready
                    </button>
                  </div>
                ))}
                {preparingOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>

            {/* Ready */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--success)'
              }}>
                <CheckCircle size={18} />
                Ready ({readyOrders.length})
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {readyOrders.map(order => (
                  <div key={order.id} style={{
                    background: '#d1fae5',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem' }}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="btn btn-sm btn-outline"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Complete
                    </button>
                  </div>
                ))}
                {readyOrders.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Tiada pesanan</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setModalType(null)} style={{ width: '100%' }}>
              Tutup
            </button>
          </div>
        </Modal>

        {/* Order History Modal */}
        <Modal
          isOpen={modalType === 'history'}
          onClose={() => setModalType(null)}
          title="Sejarah Pesanan Hari Ini"
          subtitle={`${todayOrders.length} pesanan`}
          maxWidth="700px"
        >
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {todayOrders.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Pesanan</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Jenis</th>
                    <th>Status</th>
                    <th>Masa</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 600 }}>BND {order.total.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {order.orderType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${order.status === 'completed' ? 'badge-success' :
                          order.status === 'ready' ? 'badge-success' :
                            order.status === 'preparing' ? 'badge-info' : 'badge-warning'
                          }`} style={{ fontSize: '0.7rem' }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                          title="Cetak Semula Resit"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Tiada pesanan hari ini
              </p>
            )}
          </div>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Jumlah Jualan Hari Ini:</strong>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginLeft: '0.5rem' }}>
                BND {todayOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </span>
            </div>
            <button className="btn btn-outline" onClick={() => setModalType(null)}>
              Tutup
            </button>
          </div>
        </Modal>

        {/* Network Error Modal */}
        <Modal
          isOpen={modalType === 'network-error'}
          onClose={handleCancelPayment}
          title="Ralat Rangkaian"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '70px',
              height: '70px',
              background: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <WifiOff size={35} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--warning)' }}>
              Masalah Sambungan
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {networkError || 'Ralat rangkaian berlaku semasa memproses pembayaran.'}
            </p>

            {retryCount > 0 && (
              <div style={{
                background: 'var(--gray-100)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                <AlertTriangle size={16} color="var(--warning)" style={{ marginRight: '0.5rem' }} />
                Percubaan semula: {retryCount}/2
              </div>
            )}

            <div style={{
              background: '#fef3c7',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              textAlign: 'left',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              <strong>Apa yang boleh anda lakukan:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                <li>Semak sambungan internet anda</li>
                <li>Cuba semula dalam beberapa saat</li>
                <li>Jika masalah berterusan, hubungi sokongan</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCancelPayment}
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              onClick={handleRetryPayment}
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Cuba Semula...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Cuba Semula
                </>
              )}
            </button>
          </div>
        </Modal>
      </div>
      {/* Shift Wizard Modal */}
      <ShiftWizardModal
        isOpen={registerModalOpen}
        onClose={(success) => {
          // If explicitly successful, or if register is set, do not redirect
          if (success || currentRegister) {
            setRegisterModalOpen(false);
          } else {
            // Only redirect if NOT successful AND no register
            router.push('/');
          }
        }}
        mode={registerModalMode}
      />
    </RouteGuard>
  );
}
