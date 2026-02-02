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
import { CartItem, Order, MenuItem, SelectedModifier, ReceiptSettings, DEFAULT_RECEIPT_SETTINGS, Customer, Promotion } from '@/lib/types';
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
import { isPromotionValid, calculatePromotionDiscount } from '@/lib/utils/promotion-helpers';
import { triggerNotification } from '@/lib/notifications/dispatcher';

// Dynamic Imports for Heavy Components
const ReceiptPreview = dynamic(() => import('@/components/ReceiptPreview'), { ssr: false });
const ShiftWizardModal = dynamic(() => import('@/components/cash-management/ShiftWizardModal'), { ssr: false });
const RegisterStatus = dynamic(() => import('@/components/cash-management/RegisterStatus'), { ssr: false });
const MoneyOutModal = dynamic(() => import('@/components/pos/MoneyOutModal'), { ssr: false });
const PinEntryModal = dynamic(() => import('@/components/pos/PinEntryModal'), { ssr: false });

// New Components
import ProductCard from '@/components/pos/ProductCard';
import CartSidebar from '@/components/pos/CartSidebar';

import { ArrowLeft, UtensilsCrossed, Sandwich, Coffee, History, Printer, Clock, ChefHat, CheckCircle, ShoppingBag, Plus, Minus, X, Sparkles, AlertTriangle, User, DollarSign, CreditCard, QrCode, Wallet, WifiOff, RefreshCw, MessageCircle, Check, Globe, ChevronRight, Banknote, Tag, Lock } from 'lucide-react';
import { WhatsAppService } from '@/lib/services/whatsapp';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  const { currentRegister, isInitialized: storeInitialized, promotions } = useStore();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerModalMode, setRegisterModalMode] = useState<'open' | 'close'>('open');
  const [moneyOutModalOpen, setMoneyOutModalOpen] = useState(false);

  // Enforce Open Register
  useEffect(() => {
    if (storeInitialized && !currentRegister) {
      setRegisterModalMode('open');
      setRegisterModalOpen(true);
    }
  }, [storeInitialized, currentRegister]);

  // Realtime subscriptions
  const handleMenuChange = useCallback(() => {
    console.log('[Realtime] Menu change detected, refreshing...');
    refreshMenu();
  }, [refreshMenu]);

  const handleInventoryChange = useCallback(() => {
    console.log('[Realtime] Inventory change detected, refreshing...');
    refreshInventory();
  }, [refreshInventory]);

  // Orders Logic
  const { orders, addOrder, updateOrderStatus, getTodayOrders, refreshOrders, isInitialized } = useOrders();

  useOrdersRealtime(useCallback(() => {
    console.log('[POS Realtime] Orders refreshed');
    refreshOrders();
  }, [refreshOrders]));
  useMenuRealtime(handleMenuChange);
  useInventoryRealtime(handleInventoryChange);
  useModifiersRealtime(handleMenuChange);

  // Get enabled payment methods
  const enabledPaymentMethods = useMemo(() => {
    return paymentMethods
      .filter(pm => pm.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [paymentMethods]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalType, setModalType] = useState<ModalType>(null);

  // PIN Security State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: 'void', index: number } | { type: 'discount' } | null>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+673');
  const [orderType, setOrderType] = useState<'takeaway' | 'gomamam'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Promotion State
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

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

  // Auto-lookup customer by phone number
  useEffect(() => {
    const cleanInput = customerPhone.replace(/\D/g, '');

    // Only search if we have a substantial number (e.g., country code + at least 4 digits)
    if (cleanInput.length < 5) return;

    // Normalize comparison
    const found = customers.find(c => {
      const cleanCustomerPhone = c.phone.replace(/\D/g, '');
      return cleanCustomerPhone === cleanInput || cleanCustomerPhone.endsWith(cleanInput);
    });

    if (found) {
      if (selectedCustomer?.id !== found.id) {
        setSelectedCustomer(found);
        setCustomerName(found.name);
        showToast(`Pelanggan dijumpai: ${found.name}`, 'success');

        // Optional: Play a small sound or feedback?
      }
    } else {
      // If previously selected but now phone changed to something else, clear logic
      if (selectedCustomer) {
        setSelectedCustomer(null);
        setCustomerName(''); // Clear name to allow new entry
      }
    }
  }, [customerPhone, customers, selectedCustomer, showToast]);

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
      setSelectedItemForModifiers(item);
      setTempSelectedModifiers([]);
      setModalType('modifiers');
    } else {
      addToCart(item, []);
    }
  };

  const addToCart = (item: MenuItem, selectedModifiers: SelectedModifier[]) => {
    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);
    const itemTotal = item.price + modifierTotal;

    const modifierKey = selectedModifiers.map(m => m.optionId).sort().join('-');

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
    setPinAction({ type: 'void', index });
    setShowPinModal(true);
  };

  const processVoid = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    showToast(t('pos.toast.itemVoided') || 'Item voided', 'info');
  };

  const handlePinSuccess = () => {
    if (!pinAction) return;

    if (pinAction.type === 'void') {
      processVoid(pinAction.index);
    } else if (pinAction.type === 'discount') {
      setShowDiscountInput(true);
    }

    setPinAction(null);
    setShowPinModal(false);
  };

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);

  // Promotion Logic
  const validPromotions = useMemo(() => {
    return promotions.filter(p => isPromotionValid(p, cartSubtotal).isValid);
  }, [promotions, cartSubtotal]);

  useEffect(() => {
    if (selectedPromotion) {
      const validity = isPromotionValid(selectedPromotion, cartSubtotal);
      if (!validity.isValid) {
        setSelectedPromotion(null);
        showToast(t('pos.toast.promotionInvalid', { reason: validity.reason || '' }), 'warning');
      }
    }
  }, [cartSubtotal, selectedPromotion, showToast, t]);

  const discountAmount = selectedPromotion
    ? calculatePromotionDiscount(selectedPromotion, cartSubtotal)
    : (cartSubtotal * discountPercent) / 100;

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
        return prev.filter(m => m.optionId !== option.id);
      }

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

  const handleAddWithModifiers = () => {
    if (!selectedItemForModifiers) return;

    if (!validateModifiers()) {
      alert(t('pos.alert.modifiersRequired'));
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

    setCheckoutStep(1);
    setModalType('checkout');
  };

  const handlePrintReceipt = useCallback(async (orderToPrint?: Order) => {
    const order = orderToPrint || lastOrder;
    if (!order) return;

    try {
      await thermalPrinter.print(order, receiptSettings);
    } catch (error) {
      console.error('Print error:', error);
      thermalPrinter.printWithBrowser(order, receiptSettings);
    }
  }, [lastOrder, receiptSettings]);

  const proceedToPayment = useCallback(async (retrying: boolean = false) => {
    const phoneDigits = customerPhone.replace(selectedCountry.dialCode, '').trim();

    if (!phoneDigits || phoneDigits.length < 3) {
      showToast(t('pos.toast.enterPhone'), 'error');
      return;
    }

    if (paymentMethod === 'cash') {
      if (!cashReceived || cashReceived < finalPayable) {
        showToast(t('pos.toast.insufficientCash'), 'error');
        return;
      }
    }

    if (!isOnline()) {
      setNetworkError(t('pos.toast.noInternet'));
      setModalType('network-error');
      return;
    }

    const transactionId = retrying && currentTransactionId
      ? currentTransactionId
      : generateTransactionId();

    if (isTransactionSubmitted(transactionId)) {
      showToast(t('pos.toast.duplicateOrder'), 'warning');
      return;
    }

    setCurrentTransactionId(transactionId);
    setIsProcessing(true);
    setNetworkError(null);

    try {
      const processOrder = async () => {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (!isOnline()) {
              reject(new Error('Network disconnected'));
            } else {
              resolve(true);
            }
          }, 1500);
        });
        return true;
      };

      await withRetry(processOrder, {
        maxRetries: 2,
        baseDelay: 1000,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          showToast(t('pos.toast.retrying', { attempt }), 'info');
        },
      });

      markTransactionSubmitted(transactionId);

      const newOrder = await addOrder({
        items: cart,
        total: cartTotal,
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
        staffName: currentStaff?.name,
        promotionId: selectedPromotion?.id,
        promoCode: selectedPromotion?.promoCode,
      });

      cart.forEach(item => {
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
            adjustStock(invItem.id, item.quantity, 'out', `${t('pos.inventory.sale')}: ${item.name}`);
          }
        });
      });

      setLastOrder(newOrder);

      // Trigger WhatsApp Notification
      if (newOrder.customerPhone) {
        triggerNotification('ORDER_CONFIRMED', {
          to: newOrder.customerPhone,
          data: {
            name: newOrder.customerName || 'Pelanggan',
            orderId: newOrder.orderNumber,
            prepTime: '15' // Default prep time
          }
        });
      }

      showToast(t('pos.toast.orderSuccess', { orderNumber: newOrder.orderNumber }), 'success');
      playSound(paymentMethod === 'cash' ? 'payment' : 'success');

      if (receiptSettings.autoPrint && newOrder) {
        handlePrintReceipt(newOrder);
      }

      if (receiptSettings.openCashDrawer && paymentMethod === 'cash' && thermalPrinter.isConnected()) {
        try {
          await thermalPrinter.openCashDrawer();
        } catch (error) {
          console.error('Failed to open cash drawer:', error);
        }
      }

      setCart([]);
      setModalType('receipt');
      setCustomerName('');
      setCustomerPhone('+673');
      setPaymentMethod('cash');
      setDiscountPercent(0);
      setSelectedPromotion(null);
      setCashReceived(0);
      setUsePoints(false);
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
  }, [
    customerPhone, selectedCountry, showToast, paymentMethod, cashReceived,
    finalPayable, currentTransactionId, cart, cartTotal, customerName,
    selectedCustomer, pointsToRedeem, redemptionAmount, orderType,
    currentStaff, inventory, addOrder, adjustStock, receiptSettings,
    handlePrintReceipt, playSound, selectedPromotion, t
  ]);

  const handleRetryPayment = useCallback(() => {
    setModalType('checkout');
    proceedToPayment(true);
  }, [proceedToPayment]);

  const handleCancelPayment = useCallback(() => {
    setCurrentTransactionId(null);
    setNetworkError(null);
    setRetryCount(0);
    setModalType(null);
  }, []);

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
        <PinEntryModal
          isOpen={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPinAction(null);
          }}
          onSuccess={handlePinSuccess}
          title={pinAction?.type === 'void' ? 'Void Authorization' : 'Manager Discount'}
          requiredRole="Manager"
        />
      </RouteGuard>
    );
  }

  // --- RENDERING MAIN SPLIT LAYOUT ---
  return (
    <RouteGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">

        {/* LEFT COLUMN: Main POS Area (70% width) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 h-[70px] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                title={t('common.back')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase">
                {t('pos.title')}
              </h1>

              {/* Status Pills */}
              <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </div>
                <RegisterStatus
                  onOpenClick={() => { setRegisterModalMode('open'); setRegisterModalOpen(true); }}
                  onCloseClick={() => { setRegisterModalMode('close'); setRegisterModalOpen(true); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Condensed Stats */}
              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1 mr-2">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5 group" onClick={() => setModalType('queue')}>
                  <ChefHat size={14} className="group-hover:scale-110 transition-transform" />
                  Queue: <span className="font-bold text-gray-900 dark:text-white ml-0.5">{pendingOrders.length}</span>
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1.5 group" onClick={() => setModalType('history')}>
                  <History size={14} className="group-hover:scale-110 transition-transform" />
                  Ready: <span className="font-bold text-gray-900 dark:text-white ml-0.5">{readyOrders.length}</span>
                </button>
              </div>

              <button
                className="btn btn-sm btn-outline gap-2"
                onClick={() => setMoneyOutModalOpen(true)}
                title={t('pos.moneyOut.title')}
              >
                <Banknote size={16} />
                <span className="hidden xl:inline">{t('pos.moneyOut.title')}</span>
              </button>
            </div>
          </header>

          {/* Sub-header: Categories & Search */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 p-4 flex items-center gap-4 overflow-x-auto shrink-0 z-10 no-scrollbar">
            <div className="flex items-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                                whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                                ${selectedCategory === category
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-gray-300'}
                            `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20" id="product-grid-container">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-20">
              {filteredMenu.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh] opacity-50 animate-in fade-in zoom-in duration-500">
                <ShoppingBag size={80} className="mb-6 text-gray-200 dark:text-gray-700" />
                <p className="text-xl font-bold text-gray-400">No items found</p>
                <p className="text-sm text-gray-400 mt-2">Try selecting a different category</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Persistent Cart Sidebar (Fixed Width) */}
        <div className="w-[420px] shrink-0 h-full relative z-30 shadow-2xl border-l border-gray-200 dark:border-white/5">
          <CartSidebar
            cart={cart}
            subtotal={cartSubtotal}
            discount={discountAmount}
            total={finalPayable}
            customer={selectedCustomer}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
            onClearCart={() => setCart([])}
            onSelectCustomer={() => setShowCustomerResults(true)}
          />

          {/* Customer Search Overlay (If open) */}
          {showCustomerResults && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
                <button onClick={() => setShowCustomerResults(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    autoFocus
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search Customer..."
                    className="w-full pl-10 peer p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl mb-1 text-left group transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{c.name}</h4>
                      <p className="text-gray-500 text-sm">{c.phone}</p>
                    </div>
                    {c.loyaltyPoints > 0 && (
                      <div className="ml-auto flex flex-col items-end">
                        <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                          <Sparkles size={10} /> {c.loyaltyPoints} pts
                        </span>
                      </div>
                    )}
                  </button>
                ))}
                {filteredCustomers.length === 0 && customerSearch && (
                  <div className="text-center p-8 text-gray-500">
                    No customers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- MODALS & OVERLAYS --- */}

        {/* Upsell Modal */}
        <Modal
          isOpen={modalType === 'upsell'}
          onClose={() => { setCheckoutStep(1); setModalType('checkout'); }}
          title="Complete Your Meal"
          subtitle="Would you like to add a drink?"
          maxWidth="600px"
        >
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {upsellSuggestions.slice(0, 3).map(item => (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-primary transition-all cursor-pointer" onClick={() => addToCart(item, [])}>
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Coffee size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold line-clamp-1">{item.name}</h4>
                    <p className="text-primary font-bold">BND {item.price.toFixed(2)}</p>
                  </div>
                  <button className="w-full py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary hover:text-white transition-colors">
                    Add to Order
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setCheckoutStep(1); setModalType('checkout'); }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
              >
                No Thanks, Proceed to Checkout
              </button>
            </div>
          </div>
        </Modal>

        {/* Modifiers Modal - ReStyled */}
        <Modal
          isOpen={modalType === 'modifiers'}
          onClose={() => { setModalType(null); setSelectedItemForModifiers(null); }}
          title={selectedItemForModifiers?.name || 'Customize Item'}
          maxWidth="500px"
        >
          {selectedItemForModifiers && (
            <div className="flex flex-col h-full bg-white dark:bg-gray-800">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Header Price */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                  <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">Base Price</span>
                  <span className="font-black text-2xl text-primary">BND {selectedItemForModifiers.price.toFixed(2)}</span>
                </div>

                {selectedItemForModifiers.modifierGroupIds.map(groupId => {
                  const group = modifierGroups.find(g => g.id === groupId);
                  if (!group) return null;
                  const selectedCount = tempSelectedModifiers.filter(m => m.groupId === groupId).length;
                  const isRequired = group.isRequired;
                  const isFulfilled = group.isRequired ? selectedCount >= group.minSelection : true;

                  return (
                    <div key={groupId} className="space-y-3">
                      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{group.name}</h4>
                          {isRequired && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isFulfilled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {isFulfilled ? 'Completed' : 'Required'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                          Select {group.minSelection} - {group.maxSelection}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {getOptionsForGroup(groupId).map(option => {
                          const isSelected = tempSelectedModifiers.some(m => m.optionId === option.id);
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleModifierOption(group, option)}
                              className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center group
                                                     ${isSelected
                                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary shadow-md'
                                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'}
                                                 `}
                            >
                              <span className="font-bold">{option.name}</span>
                              {option.extraPrice > 0 ? (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-100 dark:border-green-800">+${option.extraPrice.toFixed(2)}</span>
                              ) : (
                                <span className="text-xs font-bold text-gray-400">Free</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-white/5 z-20 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">
                <button
                  onClick={handleAddWithModifiers}
                  disabled={!validateModifiers()}
                  className="w-full py-4 text-lg font-bold rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center px-4">
                    <span>Add to Order</span>
                    <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                      BND {(selectedItemForModifiers.price + tempSelectedModifiers.reduce((s, m) => s + m.extraPrice, 0)).toFixed(2)}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
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
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: rgba(0,0,0,0.1);
                border-radius: 4px;
            }
        `}</style>

        {/* --- REUSING EXISTING MODALS FOR LOGIC CONTINUITY --- */}

        {/* Checkout Modal (Simplified but Functional) */}
        <Modal
          isOpen={modalType === 'checkout'}
          onClose={() => !isProcessing && setModalType(null)}
          title={t('pos.modal.checkout.title')}
          maxWidth="600px"
        >
          <div className="flex flex-col h-full">
            {/* Step Progress */}
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className={`flex-1 h-2 rounded-full transition-all ${checkoutStep >= 1 ? 'bg-primary' : 'bg-gray-100'}`}></div>
              <div className={`flex-1 h-2 rounded-full transition-all ${checkoutStep >= 2 ? 'bg-primary' : 'bg-gray-100'}`}></div>
            </div>

            {/* STEP 1: Customer Details */}
            {checkoutStep === 1 && (
              <div className="flex flex-col gap-6 p-6 animate-in slide-in-from-right duration-200">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Customer Phone (Required)</label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-4 bg-gray-100 rounded-xl font-bold text-gray-500 border border-gray-200">
                      {selectedCountry.dialCode}
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={customerPhone.replace(selectedCountry.dialCode, '')}
                        onChange={(e) => setCustomerPhone(`${selectedCountry.dialCode}${e.target.value}`)}
                        className={`w-full p-4 pr-12 bg-gray-50 rounded-xl border outline-none focus:ring-2 font-bold text-lg transition-all
                                    ${selectedCustomer
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20 text-green-700'
                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'}`}
                        placeholder="8881234"
                        autoFocus
                      />
                      {selectedCustomer && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in spin-in-90 duration-300">
                          <CheckCircle size={24} fill="currentColor" className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Customer Name (Required)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                    placeholder="Enter name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Order Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType('takeaway')}
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${orderType === 'takeaway' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Takeaway
                    </button>
                    <button
                      onClick={() => setOrderType('gomamam')}
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${orderType === 'gomamam' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                    >
                      GoMamam
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => {
                      if (!customerName.trim()) {
                        showToast('Sila masukkan nama pelanggan', 'error');
                        return;
                      }
                      if (customerPhone.length < 7) {
                        showToast('Sila masukkan nombor telefon yang sah', 'error');
                        return;
                      }
                      setCheckoutStep(2);
                    }}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                  >
                    Next: Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Payment */}
            {checkoutStep === 2 && (
              <div className="flex flex-col gap-6 p-6 animate-in slide-in-from-right duration-200">
                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {enabledPaymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
                                    ${paymentMethod === pm.id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-100 hover:border-gray-200 text-gray-500'}
                                `}
                      >
                        <span className="font-bold">{pm.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Input */}
                {/* Check if ID is 'cash' OR if the selected payment method name contains 'Cash' or 'Tunai' */}
                {(paymentMethod === 'cash' || enabledPaymentMethods.find(pm => pm.id === paymentMethod)?.name.toLowerCase().includes('cash') || enabledPaymentMethods.find(pm => pm.id === paymentMethod)?.name.toLowerCase().includes('tunai')) && (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-500">Total Due</span>
                      <span className="font-black text-2xl">BND {finalPayable.toFixed(2)}</span>
                    </div>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        value={cashReceived || ''}
                        onChange={e => setCashReceived(parseFloat(e.target.value))}
                        className="w-full pl-10 p-4 text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[10, 20, 50, 100].map(amt => (
                        <button key={amt} onClick={() => setCashReceived(amt)} className="flex-1 py-2 bg-white border rounded-lg font-bold shadow-sm">${amt}</button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="font-medium text-gray-500">Change</span>
                      <span className={`text-2xl font-black ${((cashReceived || 0) - finalPayable) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ${Math.max(0, (cashReceived || 0) - finalPayable).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-4">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="px-6 py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => proceedToPayment(false)}
                    disabled={isProcessing || (paymentMethod === 'cash' && (cashReceived || 0) < finalPayable)}
                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    {isProcessing ? 'Processing...' : `Confirm Payment - $${finalPayable.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal
          isOpen={modalType === 'receipt'}
          onClose={() => setModalType(null)}
          title="Transaction Success"
          maxWidth="450px"
        >
          <div className="text-center p-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Order Confirmed!</h2>
            <p className="text-gray-500 mb-8">Order #{lastOrder?.orderNumber}</p>

            <div className="flex flex-col gap-3">
              <button onClick={() => handlePrintReceipt(lastOrder!)} className="btn btn-outline gap-2 w-full justify-center py-3">
                <Printer size={18} /> Print Receipt
              </button>
              <button onClick={() => setModalType(null)} className="btn btn-primary gap-2 w-full justify-center py-3">
                Start New Order
              </button>
            </div>
          </div>
        </Modal>

        {/* Existing Queues/History Modals can use existing logic or be hidden if not needed immediately. 
            For now, keeping them accessible via state triggers in header. 
        */}

        {/* Network Error */}
        <Modal isOpen={modalType === 'network-error'} onClose={handleCancelPayment} title="Network Error">
          <div className="text-center p-4">
            <WifiOff size={40} className="mx-auto text-amber-500 mb-4" />
            <p className="mb-4">{networkError || 'Connection lost'}</p>
            <div className="flex gap-2">
              <button onClick={handleCancelPayment} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleRetryPayment} className="btn btn-primary flex-1">Retry</button>
            </div>
          </div>
        </Modal>

        {/* Shift Wizard & Money Out Modals */}
        <ShiftWizardModal isOpen={registerModalOpen} onClose={(success) => { if (success || currentRegister) setRegisterModalOpen(false); else router.push('/'); }} mode={registerModalMode} />
        <MoneyOutModal isOpen={moneyOutModalOpen} onClose={() => setMoneyOutModalOpen(false)} registerId={currentRegister?.id} />
        <PinEntryModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPinAction(null); }} onSuccess={handlePinSuccess} title={pinAction?.type === 'void' ? 'Void Authorization' : 'Manager Discount'} requiredRole="Manager" />

      </div>
    </RouteGuard>
  );
}
